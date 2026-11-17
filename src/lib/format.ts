import type { CurrencyConfig } from '@rythmo/engine';

/**
 * `Intl` sépare les milliers par une espace fine insécable (U+202F) que Plus Jakarta Sans ne dessine pas :
 * « 48 833 » s'afficherait « 48833 ». On la remplace par l'espace insécable classique, comme l'application web.
 */
const NBSP = String.fromCharCode(0xa0);
const NARROW_NBSP = new RegExp(String.fromCharCode(0x202f), 'g');
const fix = (text: string): string => text.replace(NARROW_NBSP, String.fromCharCode(0xa0));

const NUMBER = new Intl.NumberFormat('fr-FR');
const PERCENT = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1 });
const DATE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const DATE_TIME = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const DAY_MONTH = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });

export const formatNumber = (value: number): string => fix(NUMBER.format(value));
export const formatPercent = (ratio: number): string => fix(PERCENT.format(ratio));
export const formatDate = (iso: string): string => DATE.format(new Date(iso));
export const formatDateTime = (iso: string): string => DATE_TIME.format(new Date(iso));
export const formatDayMonth = (isoDate: string): string => DAY_MONTH.format(new Date(`${isoDate}T00:00:00`));

/** Montant en plus petite unité → texte avec le symbole de la devise (« 12 000 Ar », « $4.50 »). */
export function formatMoney(amount: number, currency: Pick<CurrencyConfig, 'decimals' | 'symbol' | 'symbolPosition'>): string {
  const value = amount / 10 ** currency.decimals;
  const text = fix(
    new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals,
    }).format(value),
  );
  return currency.symbolPosition === 'before' ? `${currency.symbol}${text}` : `${text}${NBSP}${currency.symbol}`;
}

/** Version courte pour les axes de graphiques : 12k, 1,2 M. */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return fix(`${(value / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}${NBSP}M`);
  if (abs >= 10_000) return `${Math.round(value / 1000)}k`;
  if (abs >= 1000) return fix(`${(value / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}k`);
  return formatNumber(value);
}

/** Écart relatif entre deux périodes : « +12 % », « −8 % », « — » si la référence est nulle. */
export function formatDelta(current: number, previous: number): { text: string; direction: 'up' | 'down' | 'flat' } {
  if (previous === 0) return current === 0 ? { text: '0 %', direction: 'flat' } : { text: 'Nouveau', direction: 'up' };
  const change = (current - previous) / previous;
  const rounded = Math.round(change * 100);
  if (rounded === 0) return { text: '0 %', direction: 'flat' };
  return { text: `${rounded > 0 ? '+' : '−'}${Math.abs(rounded)} %`, direction: rounded > 0 ? 'up' : 'down' };
}

/** Depuis combien de temps : « il y a 3 h », « il y a 2 j ». */
export function formatAgo(iso: string | null): string {
  if (!iso) return 'Jamais';
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'À l’instant';
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `Il y a ${days} j`;
  return formatDate(iso);
}

export const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

export const plural = (count: number, singular: string, pluralForm = `${singular}s`): string =>
  `${formatNumber(count)} ${count > 1 ? pluralForm : singular}`;

/** Saisie d'un prix (« 12 000 » ou « 4,50 ») → plus petite unité de la devise ; `null` si illisible. */
export function parseMoneyInput(text: string, currency: Pick<CurrencyConfig, 'decimals'>): number | null {
  const cleaned = text.replace(/[\s  ]/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  const minor = Math.round(value * 10 ** currency.decimals);
  return Number.isSafeInteger(minor) ? minor : null;
}

/** Plus petite unité → texte éditable (« 12000 », « 4.5 »). */
export function toMoneyInput(amount: number, currency: Pick<CurrencyConfig, 'decimals'>): string {
  return String(amount / 10 ** currency.decimals);
}

/** ISO → valeur d'un champ `datetime-local` (heure locale). */
export function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Valeur d'un champ `datetime-local` → ISO (UTC), ou `null` si vide. */
export const fromLocalInput = (value: string): string | null => (value ? new Date(value).toISOString() : null);
