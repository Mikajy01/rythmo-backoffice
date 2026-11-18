export interface Category {
    id: string;
    label: string;
}
/** Catégories de dépenses. L'icône et la couleur sont choisies côté interface. */
export declare const CATEGORIES: readonly Category[];
export declare const CATEGORY_IDS: readonly string[];
export declare function isCategoryId(value: unknown): value is string;
