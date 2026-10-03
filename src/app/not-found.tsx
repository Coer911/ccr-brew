import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="space-y-3 pt-10 text-center">
      <p className="text-4xl">☕</p>
      <p>Такой страницы нет.</p>
      <Link href="/" className="btn">К каталогу</Link>
    </div>
  );
}
