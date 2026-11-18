import type { ISODate } from './dates';
import type { CurrencyConfig, Money } from './money';
/** « 15 000 Ar », « 12,50 € » — formatage français, sans dépendre d'Intl. */
export declare function formatMoney(amount: Money, currency: CurrencyConfig): string;
export declare const WEEKDAY_NAMES: readonly ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
export declare const MONTH_NAMES: readonly ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
/** « vendredi 20 novembre » */
export declare function formatLongDate(date: ISODate): string;
/** « 20 novembre » */
export declare function formatDayMonth(date: ISODate): string;
export declare function yesterdayOf(date: ISODate): ISODate;
