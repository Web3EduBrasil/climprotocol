'use client';

import Link from 'next/link';
import { HiOutlineHome } from 'react-icons/hi2';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
      <div className="text-8xl font-bold gradient-text">404</div>
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
        Page not found
      </h1>
      <p className="text-[var(--text-muted)] max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground,#1A2B47)] font-semibold hover:opacity-90 transition-opacity"
      >
        <HiOutlineHome className="w-5 h-5" />
        Back to Home
      </Link>
    </div>
  );
}
