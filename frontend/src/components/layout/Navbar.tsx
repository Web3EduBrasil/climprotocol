'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { HiOutlineHome, HiOutlineShieldCheck, HiOutlineCurrencyDollar, HiOutlineChartBar, HiOutlineScale, HiOutlineCog } from 'react-icons/hi2';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAdminRoles } from '@/hooks/useAdminRoles';

export function Navbar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { isAnyAdmin } = useAdminRoles();

  const navItems = [
    { href: '/', label: t.nav.dashboard, icon: HiOutlineHome },
    { href: '/protection', label: t.nav.protection, icon: HiOutlineShieldCheck },
    { href: '/liquidity', label: t.nav.liquidity, icon: HiOutlineCurrencyDollar },
    { href: '/events', label: t.nav.events, icon: HiOutlineChartBar },
    { href: '/settlement', label: t.nav.settlement, icon: HiOutlineScale },
  ];

  const isAdminActive = pathname === '/admin';

  return (
    <nav className="glass-strong sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 relative group-hover:scale-110 transition-transform duration-300">
              <Image
                src="/newLogo.png"
                alt="Clim Protocol"
                fill
                className="object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold gradient-text">Clim</span>
              <span className="text-lg font-bold text-[var(--text-primary)]">Protocol</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link key={href} href={href} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'bg-[var(--accent-glow)] text-[var(--accent)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'}`}>
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            {isAnyAdmin && (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${isAdminActive
                    ? 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30'
                    : 'bg-yellow-500/5 text-yellow-500/70 border-yellow-500/15 hover:bg-yellow-500/15 hover:text-yellow-500'
                  }`}
              >
                <HiOutlineCog className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
            <ConnectButton chainStatus="icon" showBalance={false} accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }} />
          </div>
        </div>

        <div className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${isActive ? 'bg-[var(--accent-glow)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
