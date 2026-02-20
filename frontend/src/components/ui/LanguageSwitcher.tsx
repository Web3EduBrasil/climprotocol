'use client';

import { useLanguage } from '@/i18n/LanguageContext';
import { Locale, localeNames, localeFlags } from '@/i18n/translations';
import { useState, useRef, useEffect } from 'react';

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all">
        <span>{localeFlags[locale]}</span>
        <span className="hidden sm:inline uppercase">{locale}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-[var(--surface-strong)] border border-[var(--border-strong)] rounded-xl overflow-hidden shadow-xl z-50 min-w-[120px]">
          {(Object.keys(localeNames) as Locale[]).map(l => (
            <button
              key={l}
              onClick={() => { setLocale(l); setIsOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${locale === l ? 'bg-[var(--accent-glow)] text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'}`}
            >
              <span>{localeFlags[l]}</span>
              <span>{localeNames[l]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
