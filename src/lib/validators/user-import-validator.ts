import type {
  UserImportRow,
  ValidationError,
  ImportValidationResult,
} from '@/types/bulk-import';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function validateImportData(
  users: UserImportRow[]
): Pick<ImportValidationResult, 'valid' | 'errors'> {
  const errors: ValidationError[] = [];
  const valid: UserImportRow[] = [];

  users.forEach((user) => {
    let hasError = false;

    // Validar nome
    if (!user.nome || user.nome.length === 0) {
      errors.push({
        rowNumber: user.rowNumber,
        field: 'nome',
        error: 'Nome é obrigatório',
        value: user.nome,
      });
      hasError = true;
    } else if (user.nome.length < 2) {
      errors.push({
        rowNumber: user.rowNumber,
        field: 'nome',
        error: 'Nome muito curto (mínimo 2 caracteres)',
        value: user.nome,
      });
      hasError = true;
    }

    // Validar email
    if (!user.email || user.email.length === 0) {
      errors.push({
        rowNumber: user.rowNumber,
        field: 'email',
        error: 'Email é obrigatório',
        value: user.email,
      });
      hasError = true;
    } else if (!EMAIL_REGEX.test(user.email)) {
      errors.push({
        rowNumber: user.rowNumber,
        field: 'email',
        error: 'Email inválido',
        value: user.email,
      });
      hasError = true;
    }

    if (!hasError) {
      valid.push(user);
    }
  });

  return { valid, errors };
}
