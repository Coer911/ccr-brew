import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6 py-4">
      <h1 className="text-xl font-light tracking-wide">Страница не найдена</h1>
      <p className="mt-4 text-sm text-neutral-500">Запрошенная страница не найдена</p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-neutral-100 px-4 py-2 text-sm text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
      >
        На главную
      </Link>
    </div>
  );
}
