import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as XLSX from 'xlsx';
import { put } from '@vercel/blob';

// Interface for portfolio position
interface PortfolioPosition {
  fiiCode: string;
  fiiName?: string;
  quantity: number;
  avgPrice: number;
  currentPrice?: number;
  currentValue: number;
  sector?: string;
  percentage?: number;
}

// Expected Excel columns (flexible mapping)
const COLUMN_MAPPINGS = {
  fiiCode: ['codigo', 'código', 'fii', 'ticker', 'ativo', 'código do fii', 'code'],
  fiiName: ['nome', 'name', 'fundo', 'fii name', 'denominação', 'denominacao'],
  quantity: ['quantidade', 'qty', 'cotas', 'shares', 'qtd', 'quantidade de cotas'],
  avgPrice: ['preço médio', 'preco medio', 'pm', 'preço', 'preco', 'avg price', 'average price'],
  currentPrice: ['preço atual', 'preco atual', 'cotação', 'cotacao', 'current price', 'price'],
  currentValue: ['valor atual', 'valor', 'value', 'current value', 'valor total', 'patrimônio', 'patrimonio'],
  sector: ['setor', 'sector', 'categoria', 'category', 'segmento']
};

function normalizeColumnName(column: string): string {
  return column.toLowerCase().trim().replace(/[^\w\s]/g, '');
}

function findColumnIndex(headers: string[], possibleNames: string[]): number {
  const normalizedHeaders = headers.map(h => normalizeColumnName(h));
  
  for (const possibleName of possibleNames) {
    const normalizedPossible = normalizeColumnName(possibleName);
    const index = normalizedHeaders.findIndex(h => 
      h.includes(normalizedPossible) || normalizedPossible.includes(h)
    );
    if (index !== -1) return index;
  }
  return -1;
}

function parseNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Remove currency symbols and whitespace
    let cleaned = value.replace(/[R$\s]/g, '');
    
    if (cleaned.includes(',')) {
      // Comma present - likely Brazilian format
      const lastCommaIndex = cleaned.lastIndexOf(',');
      const lastDotIndex = cleaned.lastIndexOf('.');
      
      if (lastCommaIndex > lastDotIndex) {
        // Brazilian format: 1.234.567,89 or 100,50
        // Comma is decimal separator, dots are thousands separators
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else {
        // Format like: 1,234.56 (American with comma thousands separator)
        cleaned = cleaned.replace(/,/g, '');
      }
    } else if (cleaned.includes('.')) {
      // Only dots, no comma
      const dotCount = (cleaned.match(/\./g) || []).length;
      
      if (dotCount === 1) {
        // Single dot - could be decimal or thousands separator
        const dotIndex = cleaned.indexOf('.');
        const afterDot = cleaned.substring(dotIndex + 1);
        
        // If exactly 2 digits after dot, likely decimal (12.34)
        // If 3+ digits or not exactly 2, likely thousands separator (1.234 or 1.2345)
        if (afterDot.length === 2 && /^\d{2}$/.test(afterDot)) {
          // Keep as decimal: 12.34
          // No change needed
        } else {
          // Treat as thousands separator: 1.234 -> 1234
          cleaned = cleaned.replace('.', '');
        }
      } else {
        // Multiple dots - all are thousands separators except possibly the last
        // For Brazilian format without comma: 1.234.567 (all dots are thousands)
        cleaned = cleaned.replace(/\./g, '');
      }
    }
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function validatePortfolioPosition(position: any): PortfolioPosition | null {
  if (!position.fiiCode || !position.quantity || !position.avgPrice) {
    return null;
  }

  // Clean and validate FII code
  const fiiCode = String(position.fiiCode).trim().toUpperCase();
  if (!/^[A-Z]{4}\d{2}$/.test(fiiCode)) {
    return null; // Invalid FII code format
  }

  const quantity = parseNumber(position.quantity);
  const avgPrice = parseNumber(position.avgPrice);
  const currentPrice = parseNumber(position.currentPrice);
  
  if (quantity <= 0 || avgPrice <= 0) {
    return null;
  }

  const currentValue = currentPrice > 0 ? quantity * currentPrice : quantity * avgPrice;

  return {
    fiiCode,
    fiiName: position.fiiName ? String(position.fiiName).trim() : undefined,
    quantity,
    avgPrice,
    currentPrice: currentPrice > 0 ? currentPrice : undefined,
    currentValue,
    sector: position.sector ? String(position.sector).trim() : undefined
  };
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find or create user in our database using Clerk ID
    let user = await db.user.findUnique({
      where: { clerkId: clerkUserId }
    });

    if (!user) {
      // Create user if doesn't exist
      user = await db.user.create({
        data: {
          clerkId: clerkUserId,
          email: '', // Will be updated by webhook
          isActive: true
        }
      });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload Excel (.xlsx, .xls) or CSV files only." },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Save file to Vercel Blob first
    let blobUrl: string | undefined;
    let blobPathname: string | undefined;
    
    try {
      const ext = file.name?.split('.').pop()?.toLowerCase() || 'xlsx';
      const safeName = file.name?.replace(/[^a-z0-9._-]/gi, '_') || `portfolio.${ext}`;
      const key = `portfolios/${clerkUserId}/${Date.now()}-${safeName}`;
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      
      if (token) {
        const uploaded = await put(key, file, { access: 'public', token });
        blobUrl = uploaded.url;
        blobPathname = uploaded.pathname;
        
        // Register in StorageObject table
        await db.storageObject.create({
          data: {
            userId: user.id,
            clerkUserId: clerkUserId,
            provider: 'vercel_blob',
            url: uploaded.url,
            pathname: uploaded.pathname,
            name: file.name || safeName,
            contentType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            size: file.size,
          },
        });
      }
    } catch (blobError) {
      console.error('Failed to save file to blob storage:', blobError);
      // Continue processing even if blob storage fails
    }

    // Read file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let workbook: XLSX.WorkBook;
    
    try {
      if (file.type === 'text/csv') {
        const csvText = buffer.toString('utf-8');
        workbook = XLSX.read(csvText, { type: 'string' });
      } else {
        workbook = XLSX.read(buffer, { type: 'buffer' });
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to parse file. Please ensure it's a valid Excel or CSV file." },
        { status: 400 }
      );
    }

    // Get first worksheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json(
        { error: "No data found in the file." },
        { status: 400 }
      );
    }

    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    if (jsonData.length < 2) {
      return NextResponse.json(
        { error: "File must contain at least a header row and one data row." },
        { status: 400 }
      );
    }

    // Extract headers and find column mappings
    const headers = jsonData[0].map((h: any) => String(h || '').trim());
    const columnIndexes = {
      fiiCode: findColumnIndex(headers, COLUMN_MAPPINGS.fiiCode),
      fiiName: findColumnIndex(headers, COLUMN_MAPPINGS.fiiName),
      quantity: findColumnIndex(headers, COLUMN_MAPPINGS.quantity),
      avgPrice: findColumnIndex(headers, COLUMN_MAPPINGS.avgPrice),
      currentPrice: findColumnIndex(headers, COLUMN_MAPPINGS.currentPrice),
      currentValue: findColumnIndex(headers, COLUMN_MAPPINGS.currentValue),
      sector: findColumnIndex(headers, COLUMN_MAPPINGS.sector),
    };

    // Validate required columns
    if (columnIndexes.fiiCode === -1 || columnIndexes.quantity === -1 || columnIndexes.avgPrice === -1) {
      return NextResponse.json(
        { 
          error: "Required columns not found. Please ensure your file contains columns for: FII Code, Quantity, and Average Price.",
          foundHeaders: headers,
          requiredColumns: ["FII Code/Código", "Quantity/Quantidade", "Average Price/Preço Médio"]
        },
        { status: 400 }
      );
    }

    // Process data rows
    const positions: PortfolioPosition[] = [];
    let skippedRows = 0;

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;

      const rawPosition = {
        fiiCode: columnIndexes.fiiCode !== -1 ? row[columnIndexes.fiiCode] : undefined,
        fiiName: columnIndexes.fiiName !== -1 ? row[columnIndexes.fiiName] : undefined,
        quantity: columnIndexes.quantity !== -1 ? row[columnIndexes.quantity] : undefined,
        avgPrice: columnIndexes.avgPrice !== -1 ? row[columnIndexes.avgPrice] : undefined,
        currentPrice: columnIndexes.currentPrice !== -1 ? row[columnIndexes.currentPrice] : undefined,
        currentValue: columnIndexes.currentValue !== -1 ? row[columnIndexes.currentValue] : undefined,
        sector: columnIndexes.sector !== -1 ? row[columnIndexes.sector] : undefined,
      };

      const validPosition = validatePortfolioPosition(rawPosition);
      if (validPosition) {
        positions.push(validPosition);
      } else {
        skippedRows++;
      }
    }

    if (positions.length === 0) {
      return NextResponse.json(
        { error: "No valid positions found in the file. Please check the data format." },
        { status: 400 }
      );
    }

    // Calculate total value and percentages
    const totalValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0);
    const positionsWithPercentage = positions.map(pos => ({
      ...pos,
      percentage: (pos.currentValue / totalValue) * 100
    }));

    // Save to database
    const userPortfolio = await db.userPortfolio.create({
      data: {
        userId: user.id, // Use our internal user ID, not Clerk ID
        originalFileName: file.name,
        positions: positionsWithPercentage,
        totalValue,
      }
    });

    // Return success response
    return NextResponse.json({
      success: true,
      portfolio: {
        id: userPortfolio.id,
        totalValue,
        positionsCount: positions.length,
        skippedRows,
        positions: positionsWithPercentage, // Return all positions
      },
      storage: {
        saved: !!blobUrl,
        url: blobUrl,
        pathname: blobPathname
      },
      message: `Portfolio uploaded successfully! ${positions.length} positions imported${skippedRows > 0 ? `, ${skippedRows} rows skipped due to invalid data.` : '.'}`
    });

  } catch (error) {
    console.error("Portfolio upload error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error while processing the file.",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}