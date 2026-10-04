// Собственного API-сервера у сайта нет: встроенные функции (распознавание по фото,
// список спонсоров) включаются только при заданном NEXT_PUBLIC_API_URL.
export const API_CONFIG = {
  baseURL: (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, ''),
  timeoutMs: 125000,
} as const;

export const IS_BUILTIN_API_ENABLED = API_CONFIG.baseURL !== '';

export const BUILTIN_RECOGNITION_UNAVAILABLE_MESSAGE =
  'Распознавание по фото недоступно. Скопируйте запрос для любого ИИ или подключите свой ИИ-сервис в разделе «Эксперименты».';
