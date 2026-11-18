import type { ISODate } from './dates';
import type { Money } from './money';
import type { PeriodInput, RecoveryStrategy, ScheduleEntry } from './types';
export interface StrategyRule {
    key: Exclude<RecoveryStrategy, 'custom'>;
    /** Réduction maximale d'un jour, en % de son rythme normal. */
    maxCutPercent: number;
    /** Durée minimale, pour que les trois plans restent bien distincts. */
    minDays: number;
    /** Politique vis-à-vis des jours spéciaux non protégés. */
    specialDays: 'preserve' | 'preserve_if_possible' | 'include';
}
export declare const STRATEGY_RULES: Record<Exclude<RecoveryStrategy, 'custom'>, StrategyRule>;
/** Aucun plan ne peut retirer plus de 90 % d'un jour : il faut toujours pouvoir vivre. */
export declare const HARD_MAX_CUT_PERCENT = 90;
/** Jour candidat pour porter une réduction. */
export interface BaseDay {
    date: ISODate;
    /** Budget du jour avant réduction. */
    base: Money;
    special: {
        id: string;
        label: string;
        protected: boolean;
    } | null;
}
export interface PlannedDay {
    date: ISODate;
    base: Money;
    reduction: Money;
    allowance: Money;
    special: boolean;
    weekend: boolean;
}
export interface SpecialDayImpact {
    date: ISODate;
    label: string;
    before: Money;
    after: Money;
    preserved: boolean;
    protected: boolean;
}
export type InfeasibleCode = 'NO_DAYS_LEFT' | 'NOT_ENOUGH_ROOM' | 'BUDGET_EXHAUSTED';
export interface Infeasibility {
    code: InfeasibleCode;
    /** Maximum récupérable avec cette intensité d'ici la fin de la période. */
    maxRecoverable: Money;
    /** Jours disponibles pour porter l'effort. */
    daysAvailable: number;
    /** Réduction moyenne qu'il faudrait appliquer (en %), si calculable. */
    requiredCutPercent: number | null;
    /** Montant qui resterait non récupéré. */
    shortfall: Money;
}
export interface RecoveryOption {
    strategy: RecoveryStrategy;
    feasible: boolean;
    amount: Money;
    days: number;
    startDate: ISODate | null;
    endDate: ISODate | null;
    /** Jours de la fenêtre du plan, y compris les jours préservés (réduction nulle). */
    schedule: PlannedDay[];
    averageReduction: Money;
    maxReduction: Money;
    /** Réduction moyenne en % du rythme normal des jours réduits. */
    cutPercent: number;
    specialDays: SpecialDayImpact[];
    weekendDaysAffected: number;
    /** Premier jour de retour au rythme normal (null s'il tombe après la période). */
    backToNormalOn: ISODate | null;
    infeasible: Infeasibility | null;
}
export interface PlanOnDaysParams {
    strategy: RecoveryStrategy;
    amount: Money;
    maxCutPercent: number;
    minDays: number;
    /** Les jours spéciaux non protégés peuvent-ils être réduits ? */
    includeSpecialDays: boolean;
    /** Forcer la protection de tous les jours spéciaux. */
    protectSpecialDays: boolean;
    /** Durée imposée (plan sur mesure). */
    fixedDays?: number;
    step: Money;
    periodEnd: ISODate;
}
/**
 * Construit un plan sur une liste de jours candidats (dans l'ordre chronologique).
 * Fonction pure, partagée par le rattrapage réel et par la simulation.
 */
export declare function planOnDays(baseDays: readonly BaseDay[], params: PlanOnDaysParams): RecoveryOption;
/** Applique la règle d'une stratégie standard, avec repli sur les jours spéciaux si prévu. */
export declare function planWithStrategy(baseDays: readonly BaseDay[], rule: StrategyRule, amount: Money, common: {
    step: Money;
    periodEnd: ISODate;
    protectSpecialDays: boolean;
}): RecoveryOption;
export interface Impossibility {
    code: InfeasibleCode;
    /** Ce qu'il est réaliste de récupérer d'ici la fin de la période. */
    maxRecoverable: Money;
    shortfall: Money;
    daysAvailable: number;
    /** Complément de budget qui rendrait le rattrapage possible. */
    suggestedBudgetIncrease: Money;
}
export interface RecoveryProposal {
    /** Montant total à récupérer (dépassement en attente + reste d'un plan en cours). */
    amount: Money;
    pending: Money;
    /** Reste du plan actif qui serait repris dans le nouveau plan. */
    carriedFromPlan: Money;
    startDate: ISODate | null;
    daysAvailable: number;
    /** Douce, Équilibrée, Intense — toujours dans cet ordre. */
    options: RecoveryOption[];
    /** Plan sur mesure demandé (Premium). */
    custom: RecoveryOption | null;
    /**
     * Alternative réaliste quand une stratégie est impossible : étaler sur tous les
     * jours restants avec la réduction strictement nécessaire.
     */
    fallback: RecoveryOption | null;
    /** Renseigné si aucun plan n'est mathématiquement possible. */
    impossible: Impossibility | null;
    /** Ce qui se passe sans plan : effort moyen réparti sur tous les jours restants. */
    automaticSpread: {
        days: number;
        averageReduction: Money;
    } | null;
}
export interface ProposalOptions {
    customDays?: number;
    protectSpecialDays?: boolean;
}
/**
 * Propose les plans de rattrapage pour la situation actuelle.
 * Un plan démarre toujours le lendemain : le budget d'aujourd'hui, déjà figé, ne bouge pas.
 */
export declare function buildRecoveryProposal(input: PeriodInput, options?: ProposalOptions): RecoveryProposal;
/** Convertit une option retenue en échéancier à enregistrer. */
export declare function toSchedule(option: RecoveryOption): ScheduleEntry[];
