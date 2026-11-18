import type { ISODate, PeriodRange } from './dates';
import type { CurrencyConfig, Money } from './money';
export type RecurringFrequency = 'monthly' | 'weekly';
/** Charge fixe ou récurrente : jamais considérée comme de l'argent librement disponible. */
export interface RecurringExpense {
    id: string;
    label: string;
    amount: Money;
    frequency: RecurringFrequency;
    /** 1 à 31, pour une charge mensuelle. */
    dayOfMonth: number | null;
    /** 0 (lundi) à 6 (dimanche), pour une charge hebdomadaire. */
    weekday: number | null;
    categoryId: string | null;
    active: boolean;
}
/** Jour spécial : un budget personnalisé remplace celui du jour de semaine. */
export interface SpecialDay {
    id: string;
    date: ISODate;
    label: string;
    amount: Money;
    /** Protection (Premium) : aucun plan de rattrapage ne peut réduire ce jour. */
    protected: boolean;
}
export interface ExpenseEntry {
    date: ISODate;
    amount: Money;
}
/** Budget d'un jour, figé à l'ouverture de la journée. Sert de référence historique. */
export interface DayRecord {
    date: ISODate;
    /** Montant autorisé ce jour-là (après réduction de rattrapage). */
    allowance: Money;
    /** Rythme normal du jour, avant réduction. */
    normal: Money;
    reduction: Money;
    planId: string | null;
}
export type RecoveryStrategy = 'easy' | 'balanced' | 'extreme' | 'custom';
export type RecoveryPlanStatus = 'active' | 'completed' | 'partial' | 'cancelled' | 'replaced';
export interface ScheduleEntry {
    date: ISODate;
    reduction: Money;
}
export interface RecoveryPlan {
    id: string;
    strategy: RecoveryStrategy;
    /** Montant total à récupérer. */
    amount: Money;
    createdOn: ISODate;
    startDate: ISODate;
    endDate: ISODate;
    schedule: ScheduleEntry[];
    status: RecoveryPlanStatus;
    protectSpecialDays: boolean;
}
export interface PeriodInput {
    currency: CurrencyConfig;
    /** Période budgétaire complète (bornes incluses). */
    period: PeriodRange;
    /** Premier jour réellement suivi (utile si l'utilisateur démarre en cours de période). */
    trackingStart?: ISODate | null;
    /** Budget total disponible pour la période suivie. */
    monthlyBudget: Money;
    /** Rythme souhaité du lundi (index 0) au dimanche (index 6). Sert de pondération. */
    weekdayAmounts: Money[];
    recurring: RecurringExpense[];
    specialDays: SpecialDay[];
    /** Dépenses flexibles réelles de la période. */
    expenses: ExpenseEntry[];
    /** Budgets journaliers déjà figés. */
    dayRecords: DayRecord[];
    /** Plans de rattrapage de la période (tous statuts). */
    plans: RecoveryPlan[];
    /** Part des dépassements déjà prise en charge (plan activé ou répartition acceptée). */
    acknowledgedExcess: Money;
    today: ISODate;
}
export type DayPhase = 'past' | 'today' | 'future';
export type DayStatus = 'respected' | 'exceeded' | 'open' | 'upcoming';
export interface FixedCharge {
    id: string;
    label: string;
    amount: Money;
    date: ISODate;
    categoryId: string | null;
}
export interface DayState {
    date: ISODate;
    /** 0 = lundi … 6 = dimanche */
    weekday: number;
    phase: DayPhase;
    allowance: Money;
    normal: Money;
    reduction: Money;
    spent: Money;
    status: DayStatus;
    special: {
        id: string;
        label: string;
        amount: Money;
        protected: boolean;
    } | null;
    fixed: FixedCharge[];
    planId: string | null;
}
/** Niveau de consommation du budget du jour. */
export type DailyLevel = 'calm' | 'notice' | 'warning' | 'reached' | 'exceeded';
export interface TodayState {
    date: ISODate;
    allowance: Money;
    normal: Money;
    reduction: Money;
    spent: Money;
    /** Reste disponible aujourd'hui (jamais négatif). */
    remaining: Money;
    /** Dépassement du jour (0 si aucun). */
    excess: Money;
    /** Part consommée, en pourcentage entier. */
    usedPercent: number;
    level: DailyLevel;
    /** Vrai si le budget figé a dû être plafonné au restant du mois. */
    capped: boolean;
}
export type Situation = 'on_track' | 'ahead' | 'tense' | 'recovering' | 'overspent' | 'exhausted' | 'invalid';
export type IssueCode = 'FIXED_EXCEEDS_BUDGET' | 'BUDGET_EXHAUSTED' | 'SPECIAL_DAYS_AT_RISK' | 'PLAN_UNSUSTAINABLE';
export interface Issue {
    code: IssueCode;
    /** Montant associé (déficit, manque…), si pertinent. */
    amount: Money;
}
export interface OverspendState {
    /** Somme des dépassements journaliers de la période. */
    total: Money;
    acknowledged: Money;
    /** Dépassement pas encore pris en charge. */
    pending: Money;
    /** Seuil à partir duquel un rattrapage est proposé. */
    threshold: Money;
    significant: boolean;
}
export type RecoveryStepState = 'done' | 'partial' | 'missed' | 'today' | 'upcoming';
export interface RecoveryStep {
    date: ISODate;
    reduction: Money;
    normal: Money;
    allowance: Money;
    spent: Money;
    recovered: Money;
    state: RecoveryStepState;
}
export interface RecoveryView {
    plan: RecoveryPlan;
    steps: RecoveryStep[];
    recovered: Money;
    remaining: Money;
    progressPercent: number;
    daysDone: number;
    daysTotal: number;
    daysLeft: number;
    /** Jours du plan dépassés depuis son activation. */
    missedDays: number;
    /** Premier jour au rythme normal, s'il tombe dans la période. */
    backToNormalOn: ISODate | null;
}
export interface FinishedPlan {
    id: string;
    outcome: 'completed' | 'partial';
    amount: Money;
    recovered: Money;
}
export interface BudgetSummary {
    monthly: Money;
    fixedTotal: Money;
    /** Budget flexible : budget mensuel moins charges fixes et récurrentes. */
    flexible: Money;
    spent: Money;
    remaining: Money;
    /** Cumul des budgets autorisés des jours écoulés (hors aujourd'hui). */
    plannedToDate: Money;
    /** Cumul des dépenses des jours écoulés (hors aujourd'hui). */
    spentToDate: Money;
    /** Avance (positif) ou retard (négatif) sur le plan, jours écoulés uniquement. */
    margin: Money;
    usedPercent: number;
}
export interface PeriodState {
    period: {
        start: ISODate;
        end: ISODate;
        trackingStart: ISODate;
        totalDays: number;
        /** Rang du jour courant (1 = premier jour suivi) ; totalDays + 1 si la période est terminée. */
        dayIndex: number;
        /** Jours restants, aujourd'hui inclus. */
        daysLeft: number;
        finished: boolean;
    };
    budget: BudgetSummary;
    today: TodayState | null;
    days: DayState[];
    upcomingFixed: FixedCharge[];
    overspend: OverspendState;
    recovery: RecoveryView | null;
    finishedPlans: FinishedPlan[];
    situation: Situation;
    issues: Issue[];
    /** Budgets journaliers nouvellement figés, à persister. */
    newRecords: DayRecord[];
}
