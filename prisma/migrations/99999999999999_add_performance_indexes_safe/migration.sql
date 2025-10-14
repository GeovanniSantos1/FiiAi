-- PLAN-006: Performance Indexes (Safe with IF NOT EXISTS)
-- This migration adds composite indexes for better query performance
-- Uses IF NOT EXISTS to avoid conflicts with existing indexes

-- ============================================
-- USER TABLE INDEXES
-- ============================================

-- Index for active users ordered by creation date (dashboard queries)
CREATE INDEX IF NOT EXISTS "User_isActive_createdAt_idx" 
ON "User"("isActive", "createdAt" DESC);

-- Index for login queries (email + active status)
CREATE INDEX IF NOT EXISTS "User_email_isActive_idx" 
ON "User"("email", "isActive");

-- ============================================
-- CREDIT BALANCE INDEXES
-- ============================================

-- Index for finding low balance users that need sync
CREATE INDEX IF NOT EXISTS "CreditBalance_creditsRemaining_lastSyncedAt_idx" 
ON "CreditBalance"("creditsRemaining" ASC, "lastSyncedAt");

-- ============================================
-- USAGE HISTORY INDEXES
-- ============================================

-- Index for user's usage history by operation type
CREATE INDEX IF NOT EXISTS "UsageHistory_userId_operationType_timestamp_idx" 
ON "UsageHistory"("userId", "operationType", "timestamp" DESC);

-- Index for operation type statistics over time
CREATE INDEX IF NOT EXISTS "UsageHistory_operationType_timestamp_idx" 
ON "UsageHistory"("operationType", "timestamp" DESC);

-- Index for recent usage queries
CREATE INDEX IF NOT EXISTS "UsageHistory_timestamp_desc_idx" 
ON "UsageHistory"("timestamp" DESC);

-- ============================================
-- STORAGE OBJECT INDEXES
-- ============================================

-- Index for user's active files (excluding deleted)
CREATE INDEX IF NOT EXISTS "StorageObject_userId_deletedAt_createdAt_idx" 
ON "StorageObject"("userId", "deletedAt", "createdAt" DESC);

-- Index for large files by content type
CREATE INDEX IF NOT EXISTS "StorageObject_contentType_size_idx" 
ON "StorageObject"("contentType", "size" DESC);

-- ============================================
-- RECOMMENDED FUND INDEXES
-- ============================================

-- Index for funds by recommendation and allocation
CREATE INDEX IF NOT EXISTS "RecommendedFund_recommendation_allocation_idx" 
ON "recommended_funds"("recommendation", "allocation" DESC);

-- Index for fund price lookups
CREATE INDEX IF NOT EXISTS "RecommendedFund_ticker_currentPrice_idx" 
ON "recommended_funds"("ticker", "currentPrice");

-- ============================================
-- USER PORTFOLIO INDEXES
-- ============================================

-- Index for user's recent portfolios
CREATE INDEX IF NOT EXISTS "UserPortfolio_userId_uploadedAt_idx" 
ON "UserPortfolio"("userId", "uploadedAt" DESC);

-- Index for portfolios pending analysis
CREATE INDEX IF NOT EXISTS "UserPortfolio_userId_lastAnalyzedAt_idx" 
ON "UserPortfolio"("userId", "lastAnalyzedAt");

-- ============================================
-- ANALYSIS REPORT INDEXES
-- ============================================

-- Index for user's recent analyses
CREATE INDEX IF NOT EXISTS "AnalysisReport_userId_generatedAt_idx" 
ON "AnalysisReport"("userId", "generatedAt" DESC);

-- Index for user's analyses by type
CREATE INDEX IF NOT EXISTS "AnalysisReport_userId_analysisType_generatedAt_idx" 
ON "AnalysisReport"("userId", "analysisType", "generatedAt" DESC);

-- Index for portfolio's analysis history
CREATE INDEX IF NOT EXISTS "AnalysisReport_userPortfolioId_generatedAt_idx" 
ON "AnalysisReport"("userPortfolioId", "generatedAt" DESC);

-- ============================================
-- INVESTMENT RECOMMENDATION INDEXES
-- ============================================

-- Index for finding recommendations by FII code
CREATE INDEX IF NOT EXISTS "InvestmentRecommendation_fiiCode_recommendation_idx" 
ON "InvestmentRecommendation"("fiiCode", "recommendation");

-- Index for top recommendations by confidence
CREATE INDEX IF NOT EXISTS "InvestmentRecommendation_recommendation_confidence_idx" 
ON "InvestmentRecommendation"("recommendation", "confidence" DESC);

-- Index for analysis report's prioritized recommendations
CREATE INDEX IF NOT EXISTS "InvestmentRecommendation_analysisReportId_priority_idx" 
ON "InvestmentRecommendation"("analysisReportId", "priority" ASC);

-- ============================================
-- SUMMARY
-- ============================================
-- Total: 18 composite indexes added for performance optimization
-- All indexes use IF NOT EXISTS to prevent conflicts
-- Note: AporteRecomendacao indexes skipped (table may not exist yet)
