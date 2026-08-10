export const validatePDF = (file: File): { valid: boolean; error?: string } => {
  // 1. Check extension
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return { valid: false, error: 'File must be a PDF' };
  }

  // 2. Check MIME type
  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'Invalid PDF format' };
  }

  // 3. Check size (Max 100MB for print files)
  const MAX_SIZE = 100 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File size too large (Max 100MB)' };
  }

  return { valid: true };
};
