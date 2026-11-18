/**
 * Montants monétaires.
 *
 * Tous les montants sont des ENTIERS exprimés dans la plus petite unité de la devise
 * (1 Ar pour l'ariary, 1 centime pour l'euro). Aucune arithmétique flottante n'est
 * utilisée pour produire un montant : les répartitions passent par `allocate`, qui
 * travaille en entiers (BigInt pour les produits intermédiaires) et garantit que la
 * somme des parts est exactement égale au total.
 */
export type Money = number;
export interface CurrencyConfig {
    code: string;
    name: string;
    symbol: string;
    /** Nombre de décimales de l'unité principale (0 pour MGA, 2 pour EUR). */
    decimals: number;
    /** Pas d'arrondi des budgets journaliers, en plus petite unité (100 Ar, 10 centimes…). */
    step: Money;
    symbolPosition: 'before' | 'after';
}
export declare const CURRENCIES: Record<string, CurrencyConfig>;
export declare const DEFAULT_CURRENCY = "MGA";
export declare function getCurrency(code: string): CurrencyConfig;
export declare function isMoney(value: unknown): value is Money;
export declare function assertMoney(value: unknown, label?: string): asserts value is Money;
export declare function sum(values: readonly Money[]): Money;
export declare function clamp(value: number, min: number, max: number): number;
/** Arrondit vers le bas au multiple de `step`. */
export declare function floorToStep(value: Money, step: Money): Money;
/** Partie entière de `value * numerator / denominator`, calculée sans flottant. */
export declare function mulDiv(value: Money, numerator: number, denominator: number): Money;
/** Pourcentage entier (arrondi au plus proche) de `part` dans `whole`. */
export declare function percentOf(part: Money, whole: Money): number;
/**
 * Répartit `total` proportionnellement à `weights` (méthode du plus fort reste).
 *
 * - Chaque part est un multiple de `step`, sauf le reliquat (< step) qui est ajouté
 *   à la dernière case de poids non nul.
 * - La somme des parts vaut toujours exactement `total`.
 * - Un total négatif ou nul donne des parts nulles.
 * - Si tous les poids sont nuls, la répartition est égale.
 */
export declare function allocate(total: Money, weights: readonly number[], step?: Money): Money[];
