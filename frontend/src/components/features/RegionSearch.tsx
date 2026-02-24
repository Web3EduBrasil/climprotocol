'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { HiOutlineMapPin, HiOutlineMagnifyingGlass } from 'react-icons/hi2';

export interface GeoResult {
  displayName: string;
  city: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
}

interface RegionSearchProps {
  value: string;
  onChange: (region: string) => void;
  onSelect: (result: GeoResult) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Autocomplete region search using OpenStreetMap Nominatim API (free, no API key).
 * When the user selects a result, it fills the region name and lat/lon.
 */
export function RegionSearch({ value, onChange, onSelect, placeholder = 'Search city, state...', className = '' }: RegionSearchProps) {
  const [results, setResults] = useState<GeoResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback(async (query: string) => {
    if (query.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      // Nominatim free geocoding API — bias towards Brazil
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1&countrycodes=br&accept-language=pt`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'ClimProtocol/1.0 (hackathon project)' },
      });
      const data = await res.json();

      const parsed: GeoResult[] = data.map((item: {
        display_name: string;
        lat: string;
        lon: string;
        address?: {
          city?: string;
          town?: string;
          village?: string;
          municipality?: string;
          state?: string;
          country?: string;
        };
      }) => {
        const addr = item.address || {};
        const city = addr.city || addr.town || addr.village || addr.municipality || '';
        const state = addr.state || '';
        const country = addr.country || 'Brazil';
        return {
          displayName: item.display_name,
          city,
          state,
          country,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        };
      });

      setResults(parsed);
      setIsOpen(parsed.length > 0);
      setHighlightIdx(-1);
    } catch {
      setResults([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    // Debounce 400ms
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 400);
  };

  const handleSelect = (result: GeoResult) => {
    const label = result.city && result.state
      ? `${result.city}, ${result.state}`
      : result.displayName.split(',').slice(0, 2).join(',').trim();
    onChange(label);
    onSelect(result);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && highlightIdx >= 0) {
      e.preventDefault();
      handleSelect(results[highlightIdx]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const formatResultLabel = (r: GeoResult) => {
    if (r.city && r.state) return `${r.city}, ${r.state}`;
    return r.displayName.split(',').slice(0, 3).join(',').trim();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <HiOutlineMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-faint)]" />
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full h-12 bg-[var(--surface-input)] border border-[var(--border)] rounded-xl pl-10 pr-10 text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-colors"
          required
          autoComplete="off"
        />
        {isLoading ? (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        ) : (
          <HiOutlineMagnifyingGlass className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-faint)]" />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={`${r.lat}-${r.lon}-${i}`}
              type="button"
              className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors border-b border-[var(--border)] last:border-0 ${i === highlightIdx ? 'bg-[var(--accent-glow)]' : 'hover:bg-[var(--surface-input)]'
                }`}
              onClick={() => handleSelect(r)}
              onMouseEnter={() => setHighlightIdx(i)}
            >
              <HiOutlineMapPin className="w-4 h-4 text-[var(--accent)] mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {formatResultLabel(r)}
                </p>
                <p className="text-[10px] text-[var(--text-faint)] mt-0.5">
                  {r.lat.toFixed(4)}, {r.lon.toFixed(4)} · {r.country}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
