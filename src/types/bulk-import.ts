export interface UserImportRow {
  nome: string;
  email: string;
  rowNumber: number; // Linha original na planilha
}

export interface ValidationError {
  rowNumber: number;
  field: 'nome' | 'email';
  error: string;
  value: string;
}

export interface ValidationWarning {
  rowNumber: number;
  message: string;
}

export interface ImportValidationResult {
  valid: UserImportRow[];
  errors: ValidationError[];
  warnings: ValidationWarning[];
  duplicatesInFile: Array<{ email: string; rowNumber: number }>;
  existingUsers: Array<{ email: string; rowNumber: number }>;
  summary?: {
    total: number;
    valid: number;
    duplicates: number;
    existing: number;
  };
}

export interface BulkImportProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  currentBatch: number;
}

export interface BulkImportResult {
  total: number;
  succeeded: number;
  failed: number;
  errors: Array<{
    rowNumber: number;
    email: string;
    error: string;
  }>;
  duration: number; // ms
  timestamp: Date;
}

export interface ParsedFileData {
  data: UserImportRow[];
  fileName: string;
  fileSize: number;
  rowCount: number;
}
