import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin-utils";
import { cache, getCacheKey } from "@/lib/cache";
import { FiiSector } from "@prisma/client";

// GET - List all recommended portfolio entries with pagination
export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId || !(await isAdmin(userId))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 50)));
    const search = searchParams.get("search")?.trim() || "";
    const sector = searchParams.get("sector") as FiiSector | null;
    const isActive = searchParams.get("isActive");

    // Build where clause
    const whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { fiiCode: { contains: search, mode: 'insensitive' as const } },
        { fiiName: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    if (sector && Object.values(FiiSector).includes(sector)) {
      whereClause.sector = sector;
    }

    if (isActive !== null) {
      whereClause.isActive = isActive === "true";
    }

    // Create cache key
    const cacheKey = getCacheKey('admin:recommended-portfolio', page, pageSize, search, sector || '', isActive || '');

    // Try cache for non-search queries
    if (!search) {
      const cached = cache.get(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    // Get data
    const [total, portfolios, totalPercentageResult] = await Promise.all([
      db.recommendedPortfolio.count({ where: whereClause }),
      db.recommendedPortfolio.findMany({
        where: whereClause,
        orderBy: [
          { isActive: "desc" },
          { percentage: "desc" },
          { fiiCode: "asc" }
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      // Calculate total percentage over ALL active records, not just current page
      db.recommendedPortfolio.aggregate({
        where: {
          ...whereClause,
          isActive: true
        },
        _sum: {
          percentage: true
        }
      })
    ]);

    const result = {
      portfolios,
      pagination: {
        page,
        pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
      totalPercentage: totalPercentageResult._sum.percentage || 0
    };

    // Cache for 5 minutes if no search
    if (!search) {
      cache.set(cacheKey, result, 5 * 60 * 1000);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching recommended portfolio:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommended portfolio" },
      { status: 500 }
    );
  }
}

// POST - Add new FII to recommended portfolio
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId || !(await isAdmin(userId))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fiiCode, fiiName, sector, percentage, reasoning, isActive = true } = body;

    // Validation
    if (!fiiCode || !fiiName || !sector || percentage === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: fiiCode, fiiName, sector, percentage" },
        { status: 400 }
      );
    }

    if (!Object.values(FiiSector).includes(sector)) {
      return NextResponse.json(
        { error: "Invalid sector" },
        { status: 400 }
      );
    }

    if (percentage < 0 || percentage > 100) {
      return NextResponse.json(
        { error: "Percentage must be between 0 and 100" },
        { status: 400 }
      );
    }

    // Check if FII code already exists
    const existingFii = await db.recommendedPortfolio.findUnique({
      where: { fiiCode: fiiCode.toUpperCase() }
    });

    if (existingFii) {
      return NextResponse.json(
        { error: "FII code already exists in recommended portfolio" },
        { status: 409 }
      );
    }

    // Create new entry
    const newPortfolio = await db.recommendedPortfolio.create({
      data: {
        fiiCode: fiiCode.toUpperCase(),
        fiiName,
        sector,
        percentage: parseFloat(percentage),
        reasoning,
        isActive: Boolean(isActive)
      }
    });

    // Clear cache
    cache.clear();

    return NextResponse.json(newPortfolio, { status: 201 });
  } catch (error) {
    console.error("Error creating recommended portfolio entry:", error);
    return NextResponse.json(
      { error: "Failed to create recommended portfolio entry" },
      { status: 500 }
    );
  }
}