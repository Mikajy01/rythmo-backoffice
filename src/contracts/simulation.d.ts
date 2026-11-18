import type { ISODate } from './dates';
import type { Money } from './money';
import type { RecoveryOption } from './recovery';
import type { PeriodInput } from './types';
export type SimulationVerdict = 
/** La dépense tient dans le budget du jour : aucun ajustement. */
'fits'
/** Rattrapable en douceur. */
 | 'comfortable'
/** Rattrapable, mais seulement avec un effort marqué. */
 | 'demanding'
/** Aucun plan standard ne suffit d'ici la fin de la période. */
 | 'threatens'
/** Dépasse tout le budget flexible restant. */
 | 'impossible';
export interface SimulatedDay {
    date: ISODate;
    /** Budget prévu actuellement. */
    current: Money;
    special: string | null;
    weekend: boolean;
}
export interface SimulationResult {
    amount: Money;
    date: ISODate;
    /** Budget disponible ce jour-là avant la dépense simulée. */
    availableThatDay: Money;
    /** Part de la dépense qui dépasse le budget du jour : c'est elle qu'il faut rattraper. */
    excess: Money;
    verdict: SimulationVerdict;
    /** Jours après la dépense, tels que prévus aujourd'hui. */
    daysAfter: SimulatedDay[];
    /** Douce, Équilibrée, Intense. Vide si la dépense tient dans le budget du jour. */
    scenarios: RecoveryOption[];
    /** Alternative réaliste si aucun scénario standard ne suffit. */
    fallback: RecoveryOption | null;
    /** Sans plan : effort moyen réparti sur tous les jours qui suivent. */
    automaticSpread: {
        days: number;
        averageReduction: Money;
    } | null;
    budget: {
        /** Budget flexible restant aujourd'hui. */
        remainingBefore: Money;
        /** Budget flexible restant si la dépense est faite. */
        remainingAfter: Money;
        /** Manque si la dépense excède tout le restant. */
        deficit: Money;
        /** La dépense met-elle en danger le budget du mois ? */
        threatensMonth: boolean;
        /** Moyenne journalière des jours qui suivent, avant et après la dépense. */
        averageDailyBefore: Money;
        averageDailyAfter: Money;
    };
}
export type SimulationErrorCode = 'INVALID_AMOUNT' | 'INVALID_DATE' | 'DATE_IN_PAST' | 'DATE_OUT_OF_PERIOD';
export declare class SimulationError extends Error {
    readonly code: SimulationErrorCode;
    constructor(code: SimulationErrorCode);
}
export declare function simulateExpense(input: PeriodInput, simulated: {
    amount: Money;
    date: ISODate;
}): SimulationResult;
