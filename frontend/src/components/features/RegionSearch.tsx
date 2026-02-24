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
  const [searchError, setSearchError] = useState(false);
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

  // Normalize string removing accents for comparison
  const normalize = useCallback((s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''), []);

  const fetchWithRetry = useCallback(async (url: string, retries = 2): Promise<Response> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, {
          headers: { 'Accept': 'application/json' },
        });
        if (res.ok) return res;
        // 429 Too Many Requests or 425 Too Early — backoff and retry
        if ((res.status === 429 || res.status === 425) && attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        return res;
      } catch {
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
          continue;
        }
        throw new Error('Network error');
      }
    }
    throw new Error('Max retries');
  }, []);

  const search = useCallback(async (query: string) => {
    if (query.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setSearchError(false);
    try {
      // Nominatim free geocoding API — restrict to Brazilian settlements (cities/towns/villages)
      const params = `format=json&q=${encodeURIComponent(query)}&limit=12&addressdetails=1&countrycodes=br&accept-language=pt&featuretype=settlement&dedupe=1`;
      const res = await fetchWithRetry(`https://nominatim.openstreetmap.org/search?${params}`);
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

      // Client-side relevance filter: all significant query words must appear in the result
      const queryWords = normalize(query).split(/\s+/).filter(w => w.length >= 3);
      const filtered = queryWords.length > 0
        ? parsed.filter(r => {
          const haystack = normalize(`${r.displayName} ${r.city} ${r.state}`);
          return queryWords.every(w => haystack.includes(w));
        })
        : parsed;

      // Prefer results where city name closely matches (sort by relevance)
      const normQuery = normalize(query);
      filtered.sort((a, b) => {
        const aCity = normalize(a.city);
        const bCity = normalize(b.city);
        const aExact = aCity.startsWith(normQuery) ? 0 : 1;
        const bExact = bCity.startsWith(normQuery) ? 0 : 1;
        if (aExact !== bExact) return aExact - bExact;
        // Prefer results where city contains more of the query
        const aMatch = aCity.includes(normQuery) ? 0 : 1;
        const bMatch = bCity.includes(normQuery) ? 0 : 1;
        return aMatch - bMatch;
      });

      const finalResults = filtered.slice(0, 6);
      setResults(finalResults);
      setIsOpen(finalResults.length > 0);
      setHighlightIdx(-1);
    } catch {
      setResults([]);
      setSearchError(true);
      setIsOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, [normalize]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    // Debounce 600ms — higher to avoid Nominatim rate limiting
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 600);
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
        <HiOutlineMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-faint)" />
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full h-12 bg-(--surface-input) border border-(--border) rounded-xl pl-10 pr-10 text-(--text-primary) focus:border-(--accent) outline-none transition-colors"
          required
          autoComplete="off"
        />
        {isLoading ? (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
        ) : (
          <HiOutlineMagnifyingGlass className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-faint)" />
        )}
      </div>

      {/* Error message */}
      {isOpen && searchError && results.length === 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-(--surface) border border-red-500/20 rounded-xl shadow-2xl p-4 text-center">
          <p className="text-xs text-red-400">Search service unavailable. Please type the city name and coordinates manually.</p>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-(--surface) border border-(--border) rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={`${r.lat}-${r.lon}-${i}`}
              type="button"
              className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors border-b border-(--border) last:border-0 ${i === highlightIdx ? 'bg-(--accent-glow)' : 'hover:bg-(--surface-input)'
                }`}
              onClick={() => handleSelect(r)}
              onMouseEnter={() => setHighlightIdx(i)}
            >
              <HiOutlineMapPin className="w-4 h-4 text-(--accent) mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-(--text-primary) truncate">
                  {formatResultLabel(r)}
                </p>
                <p className="text-[10px] text-(--text-faint) mt-0.5">
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
