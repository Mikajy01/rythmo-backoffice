import type { ISODate } from './dates';
import type { Money } from './money';
/** Jour clôturé : budget figé et dépense réelle. */
export interface TrackedDay {
    date: ISODate;
    allowance: Money;
    spent: Money;
}
export declare const STREAK_TARGETS: readonly [3, 7, 14, 30];
export type WeekDotStatus = 'respected' | 'exceeded' | 'today' | 'upcoming' | 'untracked';
export interface StreakInfo {
    /** Jours consécutifs respectés (jusqu'à hier ; 0 si aujourd'hui est déjà dépassé). */
    current: number;
    best: number;
    /** Longueur de la série qui vient de s'interrompre (hier ou aujourd'hui), sinon 0. */
    brokenStreak: number;
    /** Premier jour de la série en cours. */
    startedOn: ISODate | null;
    todayStatus: 'open' | 'exceeded' | 'none';
    nextTarget: number | null;
    /** Lundi → dimanche de la semaine en cours. */
    week: {
        date: ISODate;
        status: WeekDotStatus;
    }[];
    /** Semaines complètes consécutives terminées dans le budget. */
    weeklyStreak: number;
}
export declare function computeWeeklyStreak(history: readonly TrackedDay[], today: ISODate): number;
export declare function computeStreak(history: readonly TrackedDay[], today: ISODate, todayState: {
    allowance: Money;
    spent: Money;
} | null): StreakInfo;
export type AchievementKey = 'first_expense' | 'streak_3' | 'streak_7' | 'streak_14' | 'streak_30' | 'friday_master' | 'weekend_master' | 'recovery_done' | 'month_in_budget' | 'weeks_3' | 'comeback';
export interface AchievementDefinition {
    key: AchievementKey;
    title: string;
    description: string;
}
export declare const ACHIEVEMENTS: readonly AchievementDefinition[];
export interface AchievementView extends AchievementDefinition {
    unlocked: boolean;
    unlockedAt: string | null;
    /** Avancement vers le succès, quand il est mesurable. */
    progress: {
        value: number;
        target: number;
    } | null;
}
export type MissionState = 'active' | 'done' | 'paused';
export interface MissionView {
    key: string;
    title: string;
    description: string;
    progress: number;
    target: number;
    unit: 'days' | 'money';
    state: MissionState;
    hint: string | null;
}
export interface ProgressInput {
    today: ISODate;
    /** Jours clôturés, toutes périodes confondues (les plus récents suffisent). */
    history: TrackedDay[];
    todayState: {
        allowance: Money;
        spent: Money;
    } | null;
    /** Nombre total de dépenses enregistrées. */
    expenseCount: number;
    completedRecoveries: number;
    activeRecovery: {
        amount: Money;
        recovered: Money;
    } | null;
    /** Périodes passées terminées sans dépasser le budget flexible. */
    periodsInBudget: number;
    currentPeriod: {
        flexible: Money;
        spent: Money;
        dayIndex: number;
        totalDays: number;
    } | null;
    /** Succès déjà débloqués (persistés). */
    unlocked: {
        key: string;
        unlockedAt: string;
    }[];
}
export interface ProgressResult {
    streak: StreakInfo;
    missions: MissionView[];
    achievements: AchievementView[];
    /** Succès dont la condition vient d'être remplie : à persister. */
    newlyUnlocked: AchievementKey[];
}
export declare function evaluateProgress(input: ProgressInput): ProgressResult;
