import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin-utils";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId || !(await isAdmin(userId))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [totalUsers] = await Promise.all([
      db.user.count(),
    ])

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    // Count users with recent analysis reports (active users)
    const activeUsers = await db.analysisReport.findMany({
      where: { generatedAt: { gte: last30Days } },
      distinct: ["userId"],
      select: { userId: true },
    })

    // Get total analysis reports count
    const totalAnalysisReports = await db.analysisReport.count()

    // Build months range: last 6 months for basic activity metrics
    const months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - (5 - i))
      return d
    })

    // Get analysis activity by month
    const activitySeries = [] as { label: string; value: number }[]
    const userActivitySeries = [] as { label: string; value: number }[]
    
    for (const d of months) {
      const label = d.toLocaleString('default', { month: 'short' })
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
      
      // Count total analysis reports in this month
      const monthlyReports = await db.analysisReport.count({
        where: {
          generatedAt: { gte: start, lte: end }
        }
      })
      
      // Count unique active users in this month
      const monthlyActiveUsers = await db.analysisReport.findMany({
        where: {
          generatedAt: { gte: start, lte: end }
        },
        distinct: ["userId"],
        select: { userId: true }
      })
      
      activitySeries.push({ label, value: monthlyReports })
      userActivitySeries.push({ label, value: monthlyActiveUsers.length })
    }

    return NextResponse.json({
      totalUsers,
      activeUsers: activeUsers.length,
      totalAnalysisReports,
      activitySeries,
      userActivitySeries,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
