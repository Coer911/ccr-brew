import { isSupportedSourceImageFile } from '@/lib/images/imageFormat';

export const RECOGNITION_UPLOAD_CONFIG = {
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/heic-sequence',
    'image/heif-sequence',
  ],
  maxSize: 5 * 1024 * 1024,
} as const;

export { normalizeRecognitionErrorMessage } from './recognitionErrors';

export function validateRecognitionImageFile(file: File): void {
  if (!isSupportedSourceImageFile(file)) {
    throw new Error('Неподдерживаемый тип файла, загрузите JPG, PNG, WebP или HEIF');
  }

  if (file.size > RECOGNITION_UPLOAD_CONFIG.maxSize) {
    const maxSizeMB = RECOGNITION_UPLOAD_CONFIG.maxSize / (1024 * 1024);
    throw new Error(`Файл слишком большой, загрузите фото не больше ${maxSizeMB} МБ`);
  }

  if (
    file.name.includes('..') ||
    file.name.includes('/') ||
    file.name.includes('\\')
  ) {
    throw new Error('Имя файла содержит недопустимые символы');
  }
}
