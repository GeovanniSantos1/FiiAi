-- Migration: update_fii_sectors
-- Created at: 2025-10-13
-- Description: Expands FII sectors from 9 to 16 categories with data migration

-- Step 1: Add new enum values temporarily alongside old ones
ALTER TYPE "FiiSector" ADD VALUE IF NOT EXISTS 'LAJES';
ALTER TYPE "FiiSector" ADD VALUE IF NOT EXISTS 'LOGISTICA';
ALTER TYPE "FiiSector" ADD VALUE IF NOT EXISTS 'VAREJO_RENDA_URBANA';
ALTER TYPE "FiiSector" ADD VALUE IF NOT EXISTS 'HEDGE_FUNDS';
ALTER TYPE "FiiSector" ADD VALUE IF NOT EXISTS 'HIBRIDOS';
ALTER TYPE "FiiSector" ADD VALUE IF NOT EXISTS 'EDUCACIONAL';
ALTER TYPE "FiiSector" ADD VALUE IF NOT EXISTS 'AGRO';
ALTER TYPE "FiiSector" ADD VALUE IF NOT EXISTS 'INFRA';
ALTER TYPE "FiiSector" ADD VALUE IF NOT EXISTS 'DESENVOLVIMENTO';
ALTER TYPE "FiiSector" ADD VALUE IF NOT EXISTS 'HOSPITAIS';
ALTER TYPE "FiiSector" ADD VALUE IF NOT EXISTS 'HOTEIS';
ALTER TYPE "FiiSector" ADD VALUE IF NOT EXISTS 'AGENCIAS';

-- Step 2: Migrate existing data in recommended_funds
-- IMPORTANT: This updates all references in the database

-- Migrate LOGISTICO → LOGISTICA
UPDATE "recommended_funds"
SET segment = 'LOGISTICA'
WHERE segment = 'LOGISTICO';

-- Migrate CORPORATIVO → LAJES
UPDATE "recommended_funds"
SET segment = 'LAJES'
WHERE segment = 'CORPORATIVO';

-- Migrate TIJOLO → LAJES
UPDATE "recommended_funds"
SET segment = 'LAJES'
WHERE segment = 'TIJOLO';

-- Migrate FUNDOS → HEDGE_FUNDS
UPDATE "recommended_funds"
SET segment = 'HEDGE_FUNDS'
WHERE segment = 'FUNDOS';

-- Migrate HIBRIDO → HIBRIDOS
UPDATE "recommended_funds"
SET segment = 'HIBRIDOS'
WHERE segment = 'HIBRIDO';

-- Step 3: Handle JSON fields in UserPortfolio.positions
-- Note: PostgreSQL JSON update for nested arrays
UPDATE "user_portfolios"
SET positions = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'sector' = 'LOGISTICO' THEN jsonb_set(elem, '{sector}', '"LOGISTICA"')
      WHEN elem->>'sector' = 'CORPORATIVO' THEN jsonb_set(elem, '{sector}', '"LAJES"')
      WHEN elem->>'sector' = 'TIJOLO' THEN jsonb_set(elem, '{sector}', '"LAJES"')
      WHEN elem->>'sector' = 'FUNDOS' THEN jsonb_set(elem, '{sector}', '"HEDGE_FUNDS"')
      WHEN elem->>'sector' = 'HIBRIDO' THEN jsonb_set(elem, '{sector}', '"HIBRIDOS"')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(positions::jsonb) AS elem
)
WHERE positions IS NOT NULL
  AND (
    positions::text LIKE '%LOGISTICO%' OR
    positions::text LIKE '%CORPORATIVO%' OR
    positions::text LIKE '%TIJOLO%' OR
    positions::text LIKE '%FUNDOS%' OR
    positions::text LIKE '%HIBRIDO%'
  );

-- Step 4: Handle JSON fields in AnalysisReport.currentAllocation
UPDATE "analysis_reports"
SET "currentAllocation" = (
  SELECT jsonb_object_agg(
    CASE
      WHEN key = 'LOGISTICO' THEN 'LOGISTICA'
      WHEN key = 'CORPORATIVO' THEN 'LAJES'
      WHEN key = 'TIJOLO' THEN 'LAJES'
      WHEN key = 'FUNDOS' THEN 'HEDGE_FUNDS'
      WHEN key = 'HIBRIDO' THEN 'HIBRIDOS'
      ELSE key
    END,
    value
  )
  FROM jsonb_each("currentAllocation"::jsonb)
)
WHERE "currentAllocation" IS NOT NULL
  AND (
    "currentAllocation"::text LIKE '%LOGISTICO%' OR
    "currentAllocation"::text LIKE '%CORPORATIVO%' OR
    "currentAllocation"::text LIKE '%TIJOLO%' OR
    "currentAllocation"::text LIKE '%FUNDOS%' OR
    "currentAllocation"::text LIKE '%HIBRIDO%'
  );

-- Step 5: Add comment to enum for documentation
COMMENT ON TYPE "FiiSector" IS 'Updated 2025-10-13: Expanded FII sectors from 9 to 16 categories. Old values (LOGISTICO, CORPORATIVO, TIJOLO, FUNDOS, HIBRIDO) migrated to new equivalents.';
