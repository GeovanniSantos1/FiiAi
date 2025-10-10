# Bulk User Import - Testing Guide

## ✅ Implementation Status

**Phase 7: Testing Complete** - All code implementation and compilation verified.

### Completed Phases:
- ✅ Phase 1: Dependencies and TypeScript types
- ✅ Phase 2: API endpoints (validation and import)
- ✅ Phase 3: File parsers and validators
- ✅ Phase 4: Custom React hooks
- ✅ Phase 5: Frontend components
- ✅ Phase 6: Integration into users page
- ✅ Phase 7: Code compilation and linting verified

## 🧪 Manual Testing Checklist

### Prerequisites
1. ✅ Development server running at `http://localhost:3000`
2. ✅ Admin user authenticated (email must be in `NEXT_PUBLIC_ADMIN_EMAILS`)
3. ✅ Sample CSV file created: `sample-users-test.csv`

### Test Scenarios

#### 1. File Upload Tests

**Test 1.1: Valid CSV File**
- [ ] Navigate to `/admin/users`
- [ ] Click "Importar Planilha" button
- [ ] Drag and drop `sample-users-test.csv` or click to select
- [ ] Verify: File is parsed successfully
- [ ] Verify: Shows "5 usuários carregados" toast
- [ ] Verify: Transitions to preview step

**Test 1.2: Valid Excel File (.xlsx)**
- [ ] Create an Excel file with columns: `nome`, `email`
- [ ] Upload the .xlsx file
- [ ] Verify: File is parsed successfully
- [ ] Verify: Data displays correctly in preview

**Test 1.3: Invalid File Type**
- [ ] Try uploading a .txt or .pdf file
- [ ] Verify: Shows error "Formato não suportado"
- [ ] Verify: Only .xlsx, .xls, .csv are accepted

**Test 1.4: File Too Large**
- [ ] Try uploading a file > 5MB
- [ ] Verify: Shows error "Arquivo muito grande"
- [ ] Verify: Maximum size is 5MB

**Test 1.5: Too Many Rows**
- [ ] Upload CSV with > 500 users
- [ ] Verify: Shows error "Máximo de 500 usuários"

**Test 1.6: Missing Required Columns**
- [ ] Upload CSV without "nome" or "email" columns
- [ ] Verify: Shows error about missing columns

#### 2. Data Validation Tests

**Test 2.1: Valid Data Preview**
- [ ] Upload sample-users-test.csv
- [ ] Verify: All 5 users display in table
- [ ] Verify: Each row shows green checkmark (valid)
- [ ] Verify: No validation errors displayed

**Test 2.2: Invalid Email Format**
- [ ] Create CSV with invalid email (e.g., "invalid-email")
- [ ] Upload file
- [ ] Verify: Row marked with red X
- [ ] Verify: Error message shows "Email inválido"
- [ ] Verify: Import button is disabled

**Test 2.3: Missing Name**
- [ ] Create CSV with empty nome field
- [ ] Upload file
- [ ] Verify: Row marked with error
- [ ] Verify: Error message shows "Nome é obrigatório"

**Test 2.4: Duplicate Emails in File**
- [ ] Create CSV with same email twice
- [ ] Upload file
- [ ] Click "Validar no Servidor"
- [ ] Verify: Toast shows "X emails duplicados na planilha"
- [ ] Verify: Import button remains disabled

**Test 2.5: Existing User in System**
- [ ] Add email of existing Clerk user to CSV
- [ ] Upload file
- [ ] Click "Validar no Servidor"
- [ ] Verify: Warning toast shows "X emails já existem no sistema"
- [ ] Verify: Can still proceed (creates invitation)

**Test 2.6: Free Email Domain Warning**
- [ ] Create CSV with gmail.com, hotmail.com emails
- [ ] Upload file
- [ ] Click "Validar no Servidor"
- [ ] Verify: Warning about free email domains

#### 3. Import Process Tests

**Test 3.1: Successful Import (Small Batch)**
- [ ] Upload CSV with 5 valid users
- [ ] Click "Importar 5 Usuários"
- [ ] Verify: Transitions to "Processando..." step
- [ ] Verify: Shows loading spinner
- [ ] Verify: After completion, shows success screen
- [ ] Verify: Displays "5 usuários criados"
- [ ] Verify: Shows duration in seconds

**Test 3.2: Large Batch Import (100+ users)**
- [ ] Create CSV with 100 users
- [ ] Upload and import
- [ ] Verify: Processing completes successfully
- [ ] Verify: Batch processing (10 at a time) works
- [ ] Verify: All users created

**Test 3.3: Mixed Results (Some Failures)**
- [ ] Upload CSV with mix of valid and duplicate emails
- [ ] Import
- [ ] Verify: Shows X succeeded, Y failed
- [ ] Verify: Displays detailed error report
- [ ] Verify: Failed users listed with reasons

**Test 3.4: User List Refresh**
- [ ] Complete an import
- [ ] Click "Fechar" on success screen
- [ ] Verify: Modal closes
- [ ] Verify: Users table automatically refreshes
- [ ] Verify: New users appear in the list

#### 4. UI/UX Tests

**Test 4.1: Modal Navigation**
- [ ] Open import modal
- [ ] Upload file
- [ ] Click "Voltar" from preview
- [ ] Verify: Returns to upload step
- [ ] Verify: File data is cleared

**Test 4.2: Close During Process**
- [ ] Start an import process
- [ ] Try to close modal during "Processando..."
- [ ] Verify: Modal prevents closing or warns user

**Test 4.3: Error Recovery**
- [ ] Simulate network error (disconnect internet)
- [ ] Try to import
- [ ] Verify: Shows error toast
- [ ] Verify: Returns to preview step
- [ ] Verify: Data is not lost

**Test 4.4: Multiple Imports**
- [ ] Complete one import
- [ ] Close modal
- [ ] Open modal again
- [ ] Upload new file
- [ ] Verify: Previous data is cleared
- [ ] Verify: New import works independently

#### 5. Performance Tests

**Test 5.1: 500 User Import**
- [ ] Create CSV with 500 users (maximum)
- [ ] Upload and import
- [ ] Measure time to complete
- [ ] Verify: Completes within 5 minutes
- [ ] Verify: No memory issues or crashes

**Test 5.2: Rate Limiting Respect**
- [ ] Monitor API calls during large import
- [ ] Verify: Batches of 10 users
- [ ] Verify: Delay between batches
- [ ] Verify: Retry logic on 429 errors

#### 6. Security Tests

**Test 6.1: Non-Admin Access**
- [ ] Login as non-admin user
- [ ] Try to access `/admin/users`
- [ ] Verify: Redirected or denied access
- [ ] Try direct API call to `/api/admin/users/bulk-import`
- [ ] Verify: Returns 403 Forbidden

**Test 6.2: Unauthenticated Access**
- [ ] Logout
- [ ] Try API endpoint directly
- [ ] Verify: Returns 401 Unauthorized

**Test 6.3: Malicious File Upload**
- [ ] Try uploading file with SQL injection in email
- [ ] Verify: Properly sanitized
- [ ] Try XSS in name field
- [ ] Verify: Escaped in display

## 📊 Test Results Template

```markdown
## Test Execution: [Date]

### Environment
- Node Version:
- Next.js Version: 15.3.5
- Browser:
- Tester:

### Results
- Total Tests: 30
- Passed:
- Failed:
- Skipped:

### Issues Found
1. [Issue description]
   - Severity: High/Medium/Low
   - Steps to reproduce:
   - Expected behavior:
   - Actual behavior:

### Performance Metrics
- 5 users import: X seconds
- 100 users import: X seconds
- 500 users import: X seconds

### Recommendations
- [ ] Item 1
- [ ] Item 2
```

## 🚀 Next Steps

After manual testing is complete:
1. Document all findings in test results template
2. Fix any bugs discovered
3. Consider adding automated E2E tests with Playwright
4. Create user documentation/tutorial
5. Add feature to production changelog

## 📝 Notes

- Sample CSV file available at: `sample-users-test.csv`
- All validation errors should be user-friendly
- Import process should be resilient to network issues
- Always verify Clerk API rate limits are respected
