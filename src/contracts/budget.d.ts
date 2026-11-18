import type { ISODate, PeriodRange } from './dates';
import type { Money } from './money';
import type { DayRecord, FixedCharge, Issue, PeriodInput, PeriodState, RecoveryPlan, RecurringExpense, SpecialDay } from './types';
/**
 * Dates d'échéance d'une charge dans une période complète.
 * - Mensuelle : exactement une échéance par période (le jour demandé, ramené au
 *   dernier jour du mois si le mois est plus court ; à défaut, le dernier jour de
 *   la période), pour qu'aucune charge ne soit comptée deux fois ni oubliée.
 * - Hebdomadaire : chaque occurrence du jour de semaine.
 */
export declare function recurringOccurrences(expense: RecurringExpense, period: PeriodRange): ISODate[];
export interface PeriodContext {
    input: PeriodInput;
    trackingStart: ISODate;
    days: ISODate[];
    daySet: Set<ISODate>;
    step: Money;
    specialByDate: Map<ISODate, SpecialDay>;
    fixedByDate: Map<ISODate, FixedCharge[]>;
    fixedTotal: Money;
    /** Budget flexible (peut être négatif si les charges dépassent le budget). */
    flexible: Money;
    /** Budget flexible utilisable (jamais négatif). */
    usable: Money;
    spentByDate: Map<ISODate, Money>;
    recordByDate: Map<ISODate, DayRecord>;
    activePlan: RecoveryPlan | null;
}
export declare function buildContext(input: PeriodInput): PeriodContext;
export interface DistributedDay {
    date: ISODate;
    normal: Money;
    reduction: Money;
    allowance: Money;
}
export interface Distribution {
    days: DistributedDay[];
    byDate: Map<ISODate, DistributedDay>;
    issues: Issue[];
    /** Vrai si les réductions du plan ont pu être appliquées. */
    planApplied: boolean;
}
/**
 * Répartit `remaining` sur les jours suivis à partir de `from`.
 * Avec un plan : enveloppe du rythme normal = restant + réductions encore prévues,
 * puis chaque jour du plan est réduit. La somme des budgets vaut toujours `remaining`.
 */
export declare function distribute(ctx: PeriodContext, from: ISODate, remaining: Money, plan: RecoveryPlan | null): Distribution;
export interface PeriodAnalysis {
    ctx: PeriodContext;
    state: PeriodState;
    /** Dépenses cumulées des jours écoulés (hors aujourd'hui). */
    spentBeforeToday: Money;
    /** Restant projeté demain matin (aujourd'hui supposé respecté, ou réel si dépassé). */
    projectedAfterToday: Money | null;
    /** Répartition prévisionnelle des jours à venir. */
    future: Distribution | null;
}
export declare function analysePeriod(input: PeriodInput): PeriodAnalysis;
export declare function computePeriodState(input: PeriodInput): PeriodState;
