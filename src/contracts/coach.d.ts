import type { ISODate } from './dates';
import type { CurrencyConfig } from './money';
import type { AchievementKey, StreakInfo, TrackedDay } from './progress';
import type { PeriodState } from './types';
export interface NotificationPrefs {
    /** 70 % du budget du jour. */
    daily70: boolean;
    /** 90 % du budget du jour. */
    daily90: boolean;
    dailyReached: boolean;
    dailyExceeded: boolean;
    /** Avancement des plans de rattrapage. */
    recovery: boolean;
    /** Encouragements, séries et succès. */
    achievements: boolean;
}
export declare const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs;
export type CoachTone = 'positive' | 'info' | 'warning' | 'celebration';
export type CoachSurface = 'card' | 'toast' | 'modal';
export interface CoachEvent {
    type: string;
    /** Unicité : un même événement n'est jamais émis deux fois. */
    dedupeKey: string;
    tone: CoachTone;
    surface: CoachSurface;
    title: string;
    body: string;
    /** Écran utile pour agir, s'il y en a un. */
    route: string | null;
    priority: number;
}
export interface CoachContext {
    today: ISODate;
    currency: CurrencyConfig;
    prefs: NotificationPrefs;
    period: PeriodState;
    streak: StreakInfo;
    /** Jours clôturés récents. */
    history: TrackedDay[];
    newlyUnlocked: AchievementKey[];
    /** Messages déjà émis récemment (pour l'unicité et les délais de repos). */
    recent: {
        type: string;
        dedupeKey: string;
        date: ISODate;
    }[];
    /** Période qui vient de se terminer, s'il y en a une. */
    finishedPeriod?: {
        start: ISODate;
        inBudget: boolean;
    } | null;
}
export declare function detectCoachEvents(ctx: CoachContext): CoachEvent[];
/** Types de messages affichés en carte sur le tableau de bord. */
export declare const CARD_TYPES: ReadonlySet<string>;
