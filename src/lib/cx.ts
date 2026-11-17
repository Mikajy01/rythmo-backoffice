/** Assemble des noms de classes en ignorant les valeurs vides. */
export const cx = (...parts: (string | false | null | undefined)[]): string => parts.filter(Boolean).join(' ');
