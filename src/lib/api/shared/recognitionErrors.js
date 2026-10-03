export function normalizeRecognitionErrorMessage(message) {
  const fallback = 'Не удалось распознать, попробуйте позже';
  const text = String(message || '').trim();
  if (!text) return fallback;

  const sanitized = text
    .replace(/\s*\(?request[_ -]?id\s*:\s*[^)\s]+[)]?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!sanitized) return fallback;

  if (
    /invalid\s+user|invalid\s+api\s*key|unauthori[sz]ed|authentication|forbidden|permission\s+denied|access\s+denied|denied\s+for/i.test(
      sanitized
    )
  ) {
    return 'Ошибка авторизации сервиса распознавания, попробуйте позже';
  }

  return sanitized;
}
