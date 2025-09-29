-- CreateEnum
CREATE TYPE "public"."AnalysisType" AS ENUM ('PORTFOLIO_EVALUATION', 'INVESTMENT_RECOMMENDATION');

-- CreateEnum
CREATE TYPE "public"."FiiSector" AS ENUM ('LOGISTICO', 'SHOPPING', 'CORPORATIVO', 'RESIDENCIAL', 'TIJOLO', 'PAPEL', 'FUNDOS', 'HIBRIDO', 'OUTROS');

-- CreateEnum
CREATE TYPE "public"."RecommendationType" AS ENUM ('STRONG_BUY', 'BUY', 'HOLD', 'SELL', 'STRONG_SELL');

-- CreateEnum
CREATE TYPE "public"."FundRecommendation" AS ENUM ('BUY', 'SELL', 'HOLD');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('ANALYSIS_COMPLETE', 'CREDIT_LOW', 'CREDIT_DEPLETED', 'MARKET_ALERT', 'SYSTEM_UPDATE', 'PORTFOLIO_ALERT', 'RECOMMENDATION_READY');

-- CreateEnum
CREATE TYPE "public"."NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- AlterEnum
ALTER TYPE "public"."OperationType" ADD VALUE 'FII_PORTFOLIO_ANALYSIS';
ALTER TYPE "public"."OperationType" ADD VALUE 'FII_INVESTMENT_RECOMMENDATION';

-- CreateTable
CREATE TABLE "public"."recommended_portfolios" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "recommended_portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."recommended_funds" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "currentPrice" DECIMAL(10,2) NOT NULL,
    "averagePrice" DECIMAL(10,2) NOT NULL,
    "ceilingPrice" DECIMAL(10,2) NOT NULL,
    "allocation" DECIMAL(5,2) NOT NULL,
    "recommendation" "public"."FundRecommendation" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommended_funds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserPortfolio" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "positions" JSONB NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "lastAnalyzedAt" TIMESTAMP(3),

    CONSTRAINT "UserPortfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AnalysisReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userPortfolioId" TEXT,
    "analysisType" "public"."AnalysisType" NOT NULL,
    "aiAgentVersion" TEXT NOT NULL DEFAULT 'v1.0',
    "summary" TEXT NOT NULL,
    "currentAllocation" JSONB NOT NULL,
    "riskAssessment" JSONB NOT NULL,
    "performanceMetrics" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "processingTime" INTEGER,
    "creditsUsed" INTEGER NOT NULL DEFAULT 10,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InvestmentRecommendation" (
    "id" TEXT NOT NULL,
    "analysisReportId" TEXT NOT NULL,
    "fiiCode" TEXT NOT NULL,
    "fiiName" TEXT NOT NULL,
    "recommendation" "public"."RecommendationType" NOT NULL,
    "targetPercentage" DOUBLE PRECISION,
    "investmentAmount" DOUBLE PRECISION,
    "reasoning" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "InvestmentRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "priority" "public"."NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recommended_portfolios_isActive_idx" ON "public"."recommended_portfolios"("isActive");

-- CreateIndex
CREATE INDEX "recommended_portfolios_createdAt_idx" ON "public"."recommended_portfolios"("createdAt");

-- CreateIndex
CREATE INDEX "recommended_funds_portfolioId_idx" ON "public"."recommended_funds"("portfolioId");

-- CreateIndex
CREATE INDEX "recommended_funds_ticker_idx" ON "public"."recommended_funds"("ticker");

-- CreateIndex
CREATE INDEX "recommended_funds_recommendation_idx" ON "public"."recommended_funds"("recommendation");

-- CreateIndex
CREATE INDEX "UserPortfolio_userId_idx" ON "public"."UserPortfolio"("userId");

-- CreateIndex
CREATE INDEX "UserPortfolio_uploadedAt_idx" ON "public"."UserPortfolio"("uploadedAt");

-- CreateIndex
CREATE INDEX "UserPortfolio_totalValue_idx" ON "public"."UserPortfolio"("totalValue");

-- CreateIndex
CREATE INDEX "AnalysisReport_userId_idx" ON "public"."AnalysisReport"("userId");

-- CreateIndex
CREATE INDEX "AnalysisReport_analysisType_idx" ON "public"."AnalysisReport"("analysisType");

-- CreateIndex
CREATE INDEX "AnalysisReport_generatedAt_idx" ON "public"."AnalysisReport"("generatedAt");

-- CreateIndex
CREATE INDEX "AnalysisReport_userPortfolioId_idx" ON "public"."AnalysisReport"("userPortfolioId");

-- CreateIndex
CREATE INDEX "InvestmentRecommendation_analysisReportId_idx" ON "public"."InvestmentRecommendation"("analysisReportId");

-- CreateIndex
CREATE INDEX "InvestmentRecommendation_fiiCode_idx" ON "public"."InvestmentRecommendation"("fiiCode");

-- CreateIndex
CREATE INDEX "InvestmentRecommendation_recommendation_idx" ON "public"."InvestmentRecommendation"("recommendation");

-- CreateIndex
CREATE INDEX "InvestmentRecommendation_priority_idx" ON "public"."InvestmentRecommendation"("priority");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "public"."Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "public"."Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_priority_idx" ON "public"."Notification"("priority");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "public"."Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "public"."Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_expiresAt_idx" ON "public"."Notification"("expiresAt");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "public"."Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "public"."Notification"("userId", "createdAt");

-- Add missing indexes from original User table
CREATE INDEX "User_email_idx" ON "public"."User"("email");
CREATE INDEX "User_name_idx" ON "public"."User"("name");
CREATE INDEX "User_createdAt_idx" ON "public"."User"("createdAt");
CREATE INDEX "User_isActive_idx" ON "public"."User"("isActive");

-- Add missing indexes from CreditBalance table
CREATE INDEX "CreditBalance_creditsRemaining_idx" ON "public"."CreditBalance"("creditsRemaining");
CREATE INDEX "CreditBalance_lastSyncedAt_idx" ON "public"."CreditBalance"("lastSyncedAt");

-- Add missing indexes from UsageHistory table
CREATE INDEX "UsageHistory_operationType_idx" ON "public"."UsageHistory"("operationType");
CREATE INDEX "UsageHistory_userId_timestamp_idx" ON "public"."UsageHistory"("userId", "timestamp");
CREATE INDEX "UsageHistory_operationType_timestamp_idx" ON "public"."UsageHistory"("operationType", "timestamp");

-- Add missing indexes from StorageObject table
CREATE INDEX "StorageObject_contentType_idx" ON "public"."StorageObject"("contentType");
CREATE INDEX "StorageObject_deletedAt_idx" ON "public"."StorageObject"("deletedAt");
CREATE INDEX "StorageObject_name_idx" ON "public"."StorageObject"("name");

-- AddForeignKey
ALTER TABLE "public"."recommended_funds" ADD CONSTRAINT "recommended_funds_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "public"."recommended_portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPortfolio" ADD CONSTRAINT "UserPortfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnalysisReport" ADD CONSTRAINT "AnalysisReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnalysisReport" ADD CONSTRAINT "AnalysisReport_userPortfolioId_fkey" FOREIGN KEY ("userPortfolioId") REFERENCES "public"."UserPortfolio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvestmentRecommendation" ADD CONSTRAINT "InvestmentRecommendation_analysisReportId_fkey" FOREIGN KEY ("analysisReportId") REFERENCES "public"."AnalysisReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
