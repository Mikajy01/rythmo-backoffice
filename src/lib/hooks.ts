import { useQuery } from '@tanstack/react-query';
import type { CurrencyConfig, MetaView } from '@/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { api } from './api';

/** Données de référence (devises, catégories) : publiques et quasi immuables. */
export function useMeta() {
  return useQuery({ queryKey: ['meta'], queryFn: () => api.get<MetaView>('/meta'), staleTime: Infinity });
}

const FALLBACK: CurrencyConfig = { code: 'MGA', name: 'Ariary malgache', symbol: 'Ar', decimals: 0, step: 100, symbolPosition: 'after' };

/** Devise par code, avec un repli sûr tant que les données de référence ne sont pas chargées. */
export function useCurrencies(): (code: string) => CurrencyConfig {
  const { data } = useMeta();
  return useCallback((code: string) => data?.currencies.find((c) => c.code === code) ?? { ...FALLBACK, code }, [data]);
}

/**
 * État d'une liste porté par l'adresse (`?page=2&q=…&tier=premium`) : on peut partager ou
 * recharger la page sans perdre ses filtres, et le bouton « précédent » fonctionne.
 * Modifier un filtre revient à la première page.
 */
export function useUrlState<T extends Record<string, string>>(defaults: T) {
  const [params, setParams] = useSearchParams();
  const values = { ...defaults } as Record<string, string>;
  for (const key of Object.keys(defaults)) values[key] = params.get(key) ?? defaults[key]!;

  const update = useCallback(
    (patch: Partial<T>, { keepPage = false }: { keepPage?: boolean } = {}) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(patch)) {
            if (value === undefined || value === '' || value === defaults[key]) next.delete(key);
            else next.set(key, value);
          }
          if (!keepPage && !('page' in patch)) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    // `defaults` est un littéral recréé à chaque rendu : seules ses valeurs comptent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setParams, JSON.stringify(defaults)],
  );
  return [values as T, update] as const;
}

/** Valeur retardée : évite d'interroger l'API à chaque frappe d'une recherche. */
export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** Largeur d'un élément, suivie en continu (graphiques responsives). */
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    setWidth(element.clientWidth);
    const observer = new ResizeObserver(([entry]) => entry && setWidth(Math.round(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

export type Theme = 'light' | 'dark';
const THEME_KEY = 'rythmo.admin.theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'));
  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* préférence non conservée */
    }
    setTheme(next);
  }, [theme]);
  return { theme, toggle };
}
