# Bulk User Import Feature

## 📋 Overview

Feature for importing users in bulk via spreadsheet upload (.xlsx, .xls, .csv). Allows administrators to quickly onboard multiple users at once through a simple drag-and-drop interface.

## ✨ Features

### Core Functionality
- **Multi-format Support**: Excel (.xlsx, .xls) and CSV files
- **Drag & Drop Upload**: Intuitive file upload interface
- **Real-time Validation**: Client-side and server-side validation
- **Preview & Edit**: Review data before import with ability to remove invalid rows
- **Batch Processing**: Imports in batches of 10 users with retry logic
- **Progress Tracking**: Visual feedback during import process
- **Detailed Reporting**: Success/failure counts with error details

### Validation Features
- Email format validation
- Name length validation (minimum 2 characters)
- Duplicate detection within file
- Existing user detection in Clerk
- Free email domain warnings
- Maximum 500 users per file
- Maximum 5MB file size

### User Experience
- **Multi-step Modal**: Upload → Preview → Processing → Complete
- **Error Handling**: User-friendly error messages
- **Automatic Refresh**: User list updates after successful import
- **Resilient Processing**: Retry logic for transient failures

## 🏗️ Architecture

### Frontend Components

#### `BulkUserImportDialog.tsx`
Main modal component orchestrating the import flow.
- Manages 4-step process: upload, preview, processing, complete
- Coordinates file parsing, validation, and import
- Provides visual feedback at each stage

#### `FileUploadZone.tsx`
Drag-and-drop file upload component.
- Uses react-dropzone for file handling
- Shows template table with expected format
- Displays file requirements and errors

#### `ImportDataPreview.tsx`
Data preview table with validation status.
- Displays all uploaded rows
- Shows validation errors inline
- Allows removing invalid rows
- Color-coded status indicators

### Backend API Routes

#### `POST /api/admin/users/validate-bulk`
Server-side validation endpoint.
- Checks for duplicate emails within file
- Verifies emails don't exist in Clerk
- Returns warnings for free email domains
- Provides validation summary

#### `POST /api/admin/users/bulk-import`
Bulk import processing endpoint.
- Batch processing (10 users per batch)
- Exponential backoff retry (3 attempts)
- Rate limit respect (Clerk API: 100 req/10s)
- Detailed success/failure reporting

### Data Flow

```
1. User uploads file → FileUploadZone
2. File parsed → Excel/CSV Parser
3. Client validation → user-import-validator
4. Preview display → ImportDataPreview
5. User clicks "Validar no Servidor" → validate-bulk API
6. Server validation results displayed
7. User clicks "Importar" → bulk-import API
8. Batch processing with retry logic
9. Results displayed → Complete step
10. User list refreshed automatically
```

## 📁 File Structure

```
src/
├── types/
│   └── bulk-import.ts                    # TypeScript interfaces
├── app/
│   └── api/
│       └── admin/
│           └── users/
│               ├── validate-bulk/
│               │   └── route.ts          # Validation API
│               └── bulk-import/
│                   └── route.ts          # Import API
├── lib/
│   ├── parsers/
│   │   ├── excel-parser.ts               # Excel file parser
│   │   └── csv-parser.ts                 # CSV file parser
│   └── validators/
│       └── user-import-validator.ts      # Client validation
├── hooks/
│   └── admin/
│       ├── use-parse-user-file.ts        # File parsing hook
│       └── use-bulk-import-users.ts      # Import/validation hooks
└── components/
    └── admin/
        └── users/
            ├── BulkUserImportDialog.tsx  # Main modal
            ├── FileUploadZone.tsx        # Upload component
            └── ImportDataPreview.tsx     # Preview table
```

## 🔧 Configuration

### Environment Variables
```env
NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com,admin2@example.com
CLERK_SECRET_KEY=sk_***
```

### File Limits
- Max file size: 5MB
- Max rows: 500 users
- Supported formats: .xlsx, .xls, .csv
- Required columns: `nome`, `email`

### Processing Configuration
- Batch size: 10 users
- Retry attempts: 3
- Retry delay: 1 second (exponential backoff)
- Rate limit: 100 requests per 10 seconds

## 📝 Usage

### For Administrators

1. **Navigate to Admin Panel**
   - Go to `/admin/users`
   - Ensure you are authenticated as admin

2. **Open Import Modal**
   - Click "Importar Planilha" button
   - Modal opens with upload zone

3. **Upload File**
   - Drag and drop file or click to select
   - Supported formats: Excel (.xlsx, .xls) or CSV
   - File must have columns: `nome`, `email`

4. **Review Data**
   - Preview shows all rows
   - Check for validation errors (red X)
   - Remove invalid rows if needed
   - Click "Validar no Servidor" for server-side checks

5. **Import Users**
   - Click "Importar X Usuários"
   - Wait for processing to complete
   - Review success/failure report

6. **Complete**
   - Click "Fechar" to close modal
   - User list automatically refreshes

### File Format Example

**CSV:**
```csv
nome,email
João Silva,joao.silva@company.com
Maria Santos,maria.santos@company.com
Pedro Oliveira,pedro.oliveira@company.com
```

**Excel:**
| nome            | email                      |
|-----------------|----------------------------|
| João Silva      | joao.silva@company.com     |
| Maria Santos    | maria.santos@company.com   |
| Pedro Oliveira  | pedro.oliveira@company.com |

## ⚠️ Error Handling

### Common Errors

**"Formato não suportado"**
- Only .xlsx, .xls, .csv files are accepted
- Solution: Convert file to supported format

**"Arquivo muito grande (máximo 5MB)"**
- File exceeds size limit
- Solution: Split into multiple smaller files

**"Máximo de 500 usuários por importação"**
- Too many rows in file
- Solution: Import in multiple batches

**"Email inválido"**
- Email format doesn't match pattern
- Solution: Fix email address

**"X emails duplicados na planilha"**
- Same email appears multiple times
- Solution: Remove duplicates

**"Email já existe no sistema"**
- User already registered in Clerk
- Note: Can still proceed, will create invitation

### Retry Logic

The system automatically retries failed user creations:
- 3 attempts per user
- Exponential backoff (1s, 2s, 4s)
- Handles rate limiting (429 errors)
- Reports failures with details

## 🔒 Security

### Admin-Only Access
- Requires authentication via Clerk
- Email must be in `NEXT_PUBLIC_ADMIN_EMAILS` whitelist
- API endpoints validate admin permission

### Input Validation
- Client-side validation before upload
- Server-side validation before processing
- Email format validation with regex
- Name length validation
- XSS protection on all inputs

### Rate Limiting
- Respects Clerk API limits (100 req/10s)
- Batch processing prevents overwhelming API
- Exponential backoff on failures

## 📊 Monitoring

### Logs
All operations are logged to console:
- File parsing start/end
- Validation results
- Batch processing progress
- Individual user creation attempts
- Errors with stack traces

### Metrics
Track these metrics for monitoring:
- Import success rate
- Average import duration
- File parsing errors
- Validation failures
- API errors

## 🚀 Future Enhancements

### Potential Improvements
1. **Email Templates**: Custom invitation emails
2. **Role Assignment**: Specify user roles in spreadsheet
3. **Credit Allocation**: Assign initial credits during import
4. **Import History**: Track all imports with audit log
5. **Schedule Imports**: Queue imports for later processing
6. **Email Notifications**: Notify users after import
7. **Advanced Validation**: Check email deliverability
8. **Template Download**: Provide pre-formatted template file

### Technical Improvements
1. Add automated E2E tests (Playwright)
2. Implement background job processing (for large imports)
3. Add progress bar with percentage
4. Store import results in database
5. Export failed users to CSV for correction

## 📚 Related Documentation

- [Testing Guide](./BULK_IMPORT_TESTING.md)
- [Plan-004](../plans/plan-004-importacao-usuarios-planilha.md)
- [User Management API](./API_ADMIN_USERS.md)

## 🤝 Support

For issues or questions:
- Check testing guide for common problems
- Review error messages in UI
- Check browser console for detailed errors
- Verify Clerk API key is valid
- Ensure admin email is whitelisted
