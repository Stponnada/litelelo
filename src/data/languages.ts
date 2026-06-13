// Curated list of languages for the on-campus discovery axis.
// Same philosophy as the city list: canonicalize common variants, but allow
// a free-text fallback for anything not listed (dialects, mother tongues).

import type { PlaceOption } from './indianCities';

export const LANGUAGES: PlaceOption[] = [
    { name: 'Hindi' },
    { name: 'English' },
    { name: 'Telugu' },
    { name: 'Tamil' },
    { name: 'Kannada' },
    { name: 'Malayalam' },
    { name: 'Marathi' },
    { name: 'Bengali', aliases: ['Bangla'] },
    { name: 'Gujarati' },
    { name: 'Punjabi' },
    { name: 'Odia', aliases: ['Oriya'] },
    { name: 'Assamese' },
    { name: 'Urdu' },
    { name: 'Konkani' },
    { name: 'Tulu' },
    { name: 'Kashmiri' },
    { name: 'Sindhi' },
    { name: 'Nepali' },
    { name: 'Maithili' },
    { name: 'Bhojpuri' },
    { name: 'Rajasthani', aliases: ['Marwari'] },
    { name: 'Haryanvi' },
    { name: 'Sanskrit' },
    { name: 'Manipuri', aliases: ['Meitei'] },
];

export function canonicalizeLanguage(input: string): string {
    const trimmed = input.trim();
    if (!trimmed) return '';
    const lower = trimmed.toLowerCase();
    for (const lang of LANGUAGES) {
        if (lang.name.toLowerCase() === lower) return lang.name;
        if (lang.aliases?.some(a => a.toLowerCase() === lower)) return lang.name;
    }
    return trimmed;
}
