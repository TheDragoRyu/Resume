'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { NavData, NavSubItem } from '@/content/content-types';

interface NavItem {
  href: string;
  label: string;
  subItems?: NavSubItem[];
}

function buildNavItems(navData: NavData): NavItem[] {
  return [
    { href: '/', label: 'Home' },
    { href: '/resume', label: 'Resume', subItems: navData.resumeSections },
    { href: '/projects', label: 'Projects', subItems: navData.projects },
    { href: '/contact', label: 'Contact' },
  ];
}

interface DesktopDropdownProps {
  item: NavItem;
  isActive: boolean;
}

function DesktopDropdown({ item, isActive }: DesktopDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLLIElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const openDropdown = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  }, []);

  const closeDropdown = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        containerRef.current?.querySelector('a')?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (!item.subItems || item.subItems.length === 0) {
    return (
      <li>
        <Link
          href={item.href}
          className={`text-sm font-medium transition-colors ${
            isActive ? 'text-accent text-glow-cyan' : 'text-gray-300 hover:text-accent'
          }`}
          aria-current={isActive ? 'page' : undefined}
        >
          {item.label}
        </Link>
      </li>
    );
  }

  return (
    <li
      ref={containerRef}
      className="relative"
      onMouseEnter={openDropdown}
      onMouseLeave={closeDropdown}
    >
      <Link
        href={item.href}
        className={`text-sm font-medium transition-colors ${
          isActive ? 'text-accent text-glow-cyan' : 'text-gray-300 hover:text-accent'
        }`}
        aria-current={isActive ? 'page' : undefined}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {item.label}
      </Link>
      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2">
          <ul className="min-w-[180px] rounded-lg border border-accent/20 bg-surface-overlay/95 py-1 shadow-xl backdrop-blur-md">
            {item.subItems.map((sub) => (
              <li key={sub.href}>
                <Link
                  href={sub.href}
                  className="block px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-accent/10 hover:text-accent"
                >
                  {sub.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

interface MobileNavItemProps {
  item: NavItem;
  isActive: boolean;
  onNavigate: () => void;
}

function MobileNavItem({ item, isActive, onNavigate }: MobileNavItemProps) {
  const [expanded, setExpanded] = useState(false);

  if (!item.subItems || item.subItems.length === 0) {
    return (
      <li>
        <Link
          href={item.href}
          className={`block py-2 text-sm font-medium transition-colors ${
            isActive ? 'text-accent text-glow-cyan' : 'text-gray-300 hover:text-accent'
          }`}
          aria-current={isActive ? 'page' : undefined}
          onClick={onNavigate}
        >
          {item.label}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <div className="flex items-center">
        <Link
          href={item.href}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            isActive ? 'text-accent text-glow-cyan' : 'text-gray-300 hover:text-accent'
          }`}
          aria-current={isActive ? 'page' : undefined}
          onClick={onNavigate}
        >
          {item.label}
        </Link>
        <button
          type="button"
          className="rounded p-2 text-gray-400 hover:text-accent"
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${item.label} sub-menu`}
          onClick={() => setExpanded(!expanded)}
        >
          <svg
            className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>
      {expanded && (
        <ul className="ml-4 border-l border-accent/20 pl-3">
          {item.subItems.map((sub) => (
            <li key={sub.href}>
              <Link
                href={sub.href}
                className="block py-1.5 text-sm text-gray-400 transition-colors hover:text-accent"
                onClick={onNavigate}
              >
                {sub.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

interface HeaderProps {
  navData: NavData;
}

export default function Header({ navData }: HeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = buildNavItems(navData);

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-accent/20 bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-accent text-glow-cyan hover:text-accent-hover transition-colors"
        >
          Portfolio
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="hidden md:block">
          <ul className="flex gap-6">
            {navItems.map((item) => (
              <DesktopDropdown
                key={item.href}
                item={item}
                isActive={isActive(item.href)}
              />
            ))}
          </ul>
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden rounded p-2 text-gray-300 hover:text-accent"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav aria-label="Mobile navigation" className="md:hidden border-t border-accent/20">
          <ul className="flex flex-col px-4 py-2">
            {navItems.map((item) => (
              <MobileNavItem
                key={item.href}
                item={item}
                isActive={isActive(item.href)}
                onNavigate={() => setMenuOpen(false)}
              />
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
