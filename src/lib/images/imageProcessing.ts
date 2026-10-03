import {
  GIF_IMAGE_MIME_TYPE,
  isHeifImageMimeType,
  isSupportedSourceImageFile,
  normalizeImageMimeType,
} from '@/lib/images/imageFormat';
import {
  Base64CompressionOptions,
  compressBase64Image,
  readFileAsDataUrl,
} from '@/lib/utils/imageCompression';

const DEFAULT_MAX_IMAGE_SIZE_BYTES = 50 * 1024 * 1024;
export const NOTE_IMAGE_COMPRESSION_OPTIONS = {
  maxSizeMB: 0.1,
  maxWidthOrHeight: 1200,
  initialQuality: 0.8,
} satisfies Base64CompressionOptions;
export const NOTE_IMAGE_MAX_SIZE_BYTES =
  NOTE_IMAGE_COMPRESSION_OPTIONS.maxSizeMB * 1024 * 1024;
export const COFFEE_BEAN_IMAGE_COMPRESSION_OPTIONS = {
  maxSizeMB: 0.3,
  maxWidthOrHeight: 1024,
  initialQuality: 0.8,
} satisfies Base64CompressionOptions;
export const COFFEE_BEAN_IMAGE_MAX_SIZE_BYTES =
  COFFEE_BEAN_IMAGE_COMPRESSION_OPTIONS.maxSizeMB * 1024 * 1024;
export const ROASTER_LOGO_COMPRESSION_OPTIONS = {
  maxSizeMB: 0.12,
  maxWidthOrHeight: 512,
  initialQuality: 0.9,
} satisfies Base64CompressionOptions;
export const ROASTER_LOGO_MAX_SIZE_BYTES =
  ROASTER_LOGO_COMPRESSION_OPTIONS.maxSizeMB * 1024 * 1024;

type ImageProcessingErrorCode =
  | 'unsupported-type'
  | 'too-large'
  | 'decode-failed'
  | 'read-failed';

interface ImageFailureDiagnostics {
  fileName: string;
  declaredType: string;
  size: string;
  runtime: string;
  reason: string;
}

export class ImageProcessingError extends Error {
  constructor(
    message: string,
    readonly code: ImageProcessingErrorCode,
    readonly file?: File,
    readonly originalError?: unknown,
    readonly diagnostics?: ImageFailureDiagnostics
  ) {
    super(message);
    this.name = 'ImageProcessingError';
  }
}

export interface ImageProcessingOptions {
  maxFileSizeBytes?: number;
  compression?: Base64CompressionOptions;
}

export interface ImageBatchProcessingOptions extends ImageProcessingOptions {
  limit?: number;
}

export interface ImageBatchProcessingResult {
  images: string[];
  errors: ImageProcessingError[];
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return 'Неизвестно';

  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 1)}${units[unitIndex]}`;
}

function getRuntimeLabel() {
  if (typeof navigator === 'undefined') return 'unknown';

  const userAgent = navigator.userAgent || '';
  if (/Android/i.test(userAgent)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
  if (/Macintosh|Mac OS X/i.test(userAgent)) return 'macOS';
  if (/Windows/i.test(userAgent)) return 'Windows';
  return navigator.platform || 'browser';
}

function getErrorReason(error: unknown) {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    return `${error.name}: ${error.message || 'Нет подробностей'}`;
  }

  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return typeof error === 'string' ? error : 'Неизвестная ошибка';
}

function getImageFailureDiagnostics(
  file: File,
  error: unknown
): ImageFailureDiagnostics {
  return {
    fileName: file.name || 'Файл без названия',
    declaredType: file.type || 'Пусто',
    size: formatBytes(file.size),
    runtime: getRuntimeLabel(),
    reason: getErrorReason(error),
  };
}

function createImageReadFailedError(file: File, error: unknown) {
  const diagnostics = getImageFailureDiagnostics(file, error);
  return new ImageProcessingError(
    [
      'Не удалось прочитать фото, попробуйте ещё раз',
      `Диагностика: файл=${diagnostics.fileName}, тип=${diagnostics.declaredType}, размер=${diagnostics.size}, платформа=${diagnostics.runtime}, причина=${diagnostics.reason}`,
    ].join('\n'),
    'read-failed',
    file,
    error,
    diagnostics
  );
}

export async function processImageFile(
  file: File,
  options: ImageProcessingOptions = {}
) {
  const { maxFileSizeBytes = DEFAULT_MAX_IMAGE_SIZE_BYTES, compression } =
    options;
  const mimeType = normalizeImageMimeType(file);

  if (!isSupportedSourceImageFile(file)) {
    throw new ImageProcessingError(
      'Загрузите фото в формате JPG, PNG, WebP, GIF или HEIF/HEIC',
      'unsupported-type',
      file
    );
  }

  if (file.size > maxFileSizeBytes) {
    throw new ImageProcessingError(
      'Файл слишком большой, выберите фото меньше 50 МБ',
      'too-large',
      file
    );
  }

  let dataUrl: string;
  try {
    dataUrl = await readFileAsDataUrl(file);
  } catch (error) {
    const readError = createImageReadFailedError(file, error);
    console.error('Image file read failed', readError.diagnostics);
    throw readError;
  }

  if (mimeType === GIF_IMAGE_MIME_TYPE) {
    return dataUrl;
  }

  try {
    return await compressBase64Image(dataUrl, compression);
  } catch (error) {
    const message = isHeifImageMimeType(mimeType)
      ? 'Этот браузер не открывает HEIF/HEIC — переведите фото в JPG или PNG в галерее и добавьте снова'
      : 'Не удалось открыть или сжать фото, попробуйте другое';
    throw new ImageProcessingError(message, 'decode-failed', file, error);
  }
}

export async function processImageFiles(
  files: FileList | File[],
  options: ImageBatchProcessingOptions = {}
): Promise<ImageBatchProcessingResult> {
  const selectedFiles = Array.from(files).slice(0, options.limit);
  const result: ImageBatchProcessingResult = {
    images: [],
    errors: [],
  };

  for (const file of selectedFiles) {
    try {
      result.images.push(await processImageFile(file, options));
    } catch (error) {
      result.errors.push(
        error instanceof ImageProcessingError
          ? error
          : new ImageProcessingError(
              'Не удалось обработать фото, попробуйте другое',
              'decode-failed',
              file
            )
      );
    }
  }

  return result;
}

export function getImageProcessingErrorMessage(errors: ImageProcessingError[]) {
  if (errors.length === 0) return '';

  const uniqueMessages = Array.from(
    new Set(errors.map(error => error.message))
  );
  return uniqueMessages.length === 1
    ? uniqueMessages[0]
    : uniqueMessages.join('\n');
}
