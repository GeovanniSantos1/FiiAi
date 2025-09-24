import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin-utils";
import { cache } from "@/lib/cache";
import { FiiSector } from "@prisma/client";

// GET - Get single recommended portfolio entry
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId || !(await isAdmin(userId))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const portfolio = await db.recommendedPortfolio.findUnique({
      where: { id: params.id }
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: "Recommended portfolio entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(portfolio);
  } catch (error) {
    console.error("Error fetching recommended portfolio entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommended portfolio entry" },
      { status: 500 }
    );
  }
}

// PUT - Update recommended portfolio entry
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId || !(await isAdmin(userId))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fiiCode, fiiName, sector, percentage, reasoning, isActive } = body;

    // Check if entry exists
    const existingEntry = await db.recommendedPortfolio.findUnique({
      where: { id: params.id }
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Recommended portfolio entry not found" },
        { status: 404 }
      );
    }

    // Validation
    if (percentage !== undefined && (percentage < 0 || percentage > 100)) {
      return NextResponse.json(
        { error: "Percentage must be between 0 and 100" },
        { status: 400 }
      );
    }

    if (sector && !Object.values(FiiSector).includes(sector)) {
      return NextResponse.json(
        { error: "Invalid sector" },
        { status: 400 }
      );
    }

    // Check if fiiCode is changing to an existing one
    if (fiiCode && fiiCode.toUpperCase() !== existingEntry.fiiCode) {
      const existingFii = await db.recommendedPortfolio.findUnique({
        where: { fiiCode: fiiCode.toUpperCase() }
      });

      if (existingFii) {
        return NextResponse.json(
          { error: "FII code already exists in recommended portfolio" },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (fiiCode !== undefined) updateData.fiiCode = fiiCode.toUpperCase();
    if (fiiName !== undefined) updateData.fiiName = fiiName;
    if (sector !== undefined) updateData.sector = sector;
    if (percentage !== undefined) updateData.percentage = parseFloat(percentage);
    if (reasoning !== undefined) updateData.reasoning = reasoning;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updatedPortfolio = await db.recommendedPortfolio.update({
      where: { id: params.id },
      data: updateData
    });

    // Clear cache
    cache.clear();

    return NextResponse.json(updatedPortfolio);
  } catch (error) {
    console.error("Error updating recommended portfolio entry:", error);
    return NextResponse.json(
      { error: "Failed to update recommended portfolio entry" },
      { status: 500 }
    );
  }
}

// DELETE - Remove recommended portfolio entry
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId || !(await isAdmin(userId))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if entry exists
    const existingEntry = await db.recommendedPortfolio.findUnique({
      where: { id: params.id }
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Recommended portfolio entry not found" },
        { status: 404 }
      );
    }

    await db.recommendedPortfolio.delete({
      where: { id: params.id }
    });

    // Clear cache
    cache.clear();

    return NextResponse.json({ message: "Recommended portfolio entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting recommended portfolio entry:", error);
    return NextResponse.json(
      { error: "Failed to delete recommended portfolio entry" },
      { status: 500 }
    );
  }
}