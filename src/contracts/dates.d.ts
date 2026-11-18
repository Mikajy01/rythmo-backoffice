/**
 * Dates civiles (sans heure ni fuseau) au format ISO `YYYY-MM-DD`.
 * Tous les calculs passent par un « numéro de jour » UTC, ce qui évite les pièges
 * de fuseau horaire et de changement d'heure. Deux dates ISO se comparent
 * directement comme des chaînes.
 */
export type ISODate = string;
export interface DateParts {
    year: number;
    /** 1 à 12 */
    month: number;
    /** 1 à 31 */
    day: number;
}
export declare function isISODate(value: unknown): value is ISODate;
export declare function parseISO(date: ISODate): DateParts;
export declare function formatISO(year: number, month: number, day: number): ISODate;
export declare function toEpochDay(date: ISODate): number;
export declare function fromEpochDay(epochDay: number): ISODate;
export declare function addDays(date: ISODate, count: number): ISODate;
/** Nombre de jours de `from` à `to` (positif si `to` est après `from`). */
export declare function diffDays(from: ISODate, to: ISODate): number;
/** 0 = lundi … 6 = dimanche. */
export declare function weekdayOf(date: ISODate): number;
export declare function isWeekend(date: ISODate): boolean;
export declare function isLeapYear(year: number): boolean;
export declare function daysInMonth(year: number, month: number): number;
/** Liste inclusive des jours de `start` à `end`. */
export declare function eachDay(start: ISODate, end: ISODate): ISODate[];
/** Lundi de la semaine contenant `date`. */
export declare function startOfWeek(date: ISODate): ISODate;
export declare function maxDate(a: ISODate, b: ISODate): ISODate;
export declare function minDate(a: ISODate, b: ISODate): ISODate;
export interface PeriodRange {
    /** Premier jour, inclus. */
    start: ISODate;
    /** Dernier jour, inclus. */
    end: ISODate;
}
/**
 * Période budgétaire contenant `date`, pour une période qui démarre chaque mois le
 * jour `startDay` (1 à 31). Si le mois est plus court, le démarrage est ramené au
 * dernier jour du mois : les périodes se suivent sans trou ni chevauchement.
 */
export declare function periodContaining(date: ISODate, startDay: number): PeriodRange;
/** Période qui suit immédiatement `period`. */
export declare function nextPeriod(period: PeriodRange, startDay: number): PeriodRange;
