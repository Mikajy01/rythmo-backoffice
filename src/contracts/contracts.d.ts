/**
 * Contrats de l'API REST (types uniquement).
 * Source unique pour l'API NestJS, l'application web React et, demain, l'application Flutter.
 */
import type { NotificationPrefs, CoachSurface, CoachTone } from './coach';
import type { ISODate } from './dates';
import type { CurrencyConfig, Money } from './money';
import type { AchievementView, MissionView, StreakInfo } from './progress';
import type { RecoveryOption, RecoveryProposal } from './recovery';
import type { SimulationResult } from './simulation';
import type { SubscriptionView } from './subscription';
import type { PeriodState, RecurringExpense, SpecialDay } from './types';
export interface UserView {
    id: string;
    email: string;
    displayName: string;
}
export interface AuthSession {
    token: string;
    user: UserView;
}
export interface SettingsView {
    currency: string;
    periodStartDay: number;
    monthlyBudget: Money;
    weekdayAmounts: Money[];
    notificationPrefs: NotificationPrefs;
}
export interface ExpenseView {
    id: string;
    date: ISODate;
    amount: Money;
    categoryId: string;
    description: string;
    createdAt: string;
}
export interface NotificationView {
    id: string;
    type: string;
    tone: CoachTone;
    surface: CoachSurface;
    title: string;
    body: string;
    route: string | null;
    date: ISODate;
    createdAt: string;
    read: boolean;
}
export type PeriodView = Omit<PeriodState, 'newRecords'>;
export interface ProgressView {
    streak: StreakInfo;
    missions: MissionView[];
    achievements: AchievementView[];
}
/** Photographie complète de la situation de l'utilisateur : la réponse centrale de l'API. */
export interface Snapshot {
    today: ISODate;
    user: UserView;
    onboarded: boolean;
    currency: CurrencyConfig;
    settings: SettingsView;
    recurring: RecurringExpense[];
    specialDays: SpecialDay[];
    period: PeriodView | null;
    progress: ProgressView | null;
    todayExpenses: ExpenseView[];
    recentExpenses: ExpenseView[];
    /** Message du coach à afficher sur le tableau de bord (au plus un). */
    coach: NotificationView | null;
    /** Célébrations à montrer une fois (plan terminé, palier atteint…). */
    celebrations: NotificationView[];
    /** Messages créés par cette requête (alertes de seuil à afficher tout de suite). */
    fresh: NotificationView[];
    unreadCount: number;
    subscription: SubscriptionView;
    /** Outils de test activés côté serveur. */
    demoTools: boolean;
}
/** Réponse standard d'une opération qui modifie les données. */
export interface Mutation<T = null> {
    result: T;
    snapshot: Snapshot;
}
/** Option de plan, éventuellement réservée au Premium (détails masqués si verrouillée). */
export interface GatedOption extends RecoveryOption {
    locked: boolean;
}
export interface RecoveryProposalView extends Omit<RecoveryProposal, 'options' | 'custom' | 'fallback'> {
    options: GatedOption[];
    custom: GatedOption | null;
    fallback: GatedOption | null;
    canCustomize: boolean;
    canProtectSpecialDays: boolean;
    hasActivePlan: boolean;
}
export interface SimulationView extends Omit<SimulationResult, 'scenarios' | 'fallback'> {
    scenarios: GatedOption[];
    fallback: GatedOption | null;
    /** Projections détaillées réservées au Premium. */
    detailsLocked: boolean;
}
/** Aperçu calculé pendant la configuration initiale (aucune écriture). */
export interface OnboardingPreview {
    period: {
        start: ISODate;
        end: ISODate;
        totalDays: number;
        daysLeft: number;
        startsToday: boolean;
    };
    /** Budget suggéré pour finir la période en cours quand on démarre en cours de mois. */
    suggestedPeriodBudget: Money;
    state: PeriodView;
}
export interface ApiErrorBody {
    error: {
        code: string;
        message: string;
        details: unknown;
    };
}
export interface MetaView {
    currencies: CurrencyConfig[];
    categories: {
        id: string;
        label: string;
    }[];
    trialDurationDays: number;
}
