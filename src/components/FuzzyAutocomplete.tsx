'use client';

import React, { useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import type { PlaceOption } from '@/data/indianCities';

interface FuzzyAutocompleteProps {
    options: PlaceOption[];
    value: string;
    onChange: (value: string) => void;
    /** Canonicalizes a free-text entry to a known option when it matches an alias. */
    canonicalize: (input: string) => string;
    placeholder?: string;
    /** Names shown as one-tap chips when the field is focused and empty. */
    quickPicks?: string[];
    inputClassName?: string;
}

const DEFAULT_INPUT_CLASS =
    'w-full p-3 bg-gray-700/80 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green';

const FuzzyAutocomplete: React.FC<FuzzyAutocompleteProps> = ({
    options,
    value,
    onChange,
    canonicalize,
    placeholder,
    quickPicks = [],
    inputClassName = DEFAULT_INPUT_CLASS,
}) => {
    const [focused, setFocused] = useState(false);
    const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fuse = useMemo(
        () => new Fuse(options, { keys: ['name', 'aliases'], threshold: 0.4 }),
        [options]
    );

    // Typed → fuzzy matches; empty → the quick-pick chips.
    const suggestions = useMemo(() => {
        const q = value.trim();
        if (!q) return [];
        return fuse.search(q).slice(0, 6).map(r => r.item.name);
    }, [value, fuse]);

    const commit = (next: string) => {
        onChange(canonicalize(next));
        setFocused(false);
    };

    const showChips = focused && !value.trim() && quickPicks.length > 0;
    const showSuggestions = focused && suggestions.length > 0;

    return (
        <div className="relative">
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                onFocus={() => { if (blurTimer.current) clearTimeout(blurTimer.current); setFocused(true); }}
                onBlur={() => { blurTimer.current = setTimeout(() => commit(value), 150); }}
                placeholder={placeholder}
                className={inputClassName}
                autoComplete="off"
            />

            {showSuggestions && (
                <ul className="absolute z-20 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg overflow-hidden shadow-xl">
                    {suggestions.map(name => (
                        <li key={name}>
                            <button
                                type="button"
                                // onMouseDown fires before the input's onBlur, so the pick lands.
                                onMouseDown={e => { e.preventDefault(); commit(name); }}
                                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-brand-green/15"
                            >
                                {name}
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {showChips && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {quickPicks.map(name => (
                        <button
                            key={name}
                            type="button"
                            onMouseDown={e => { e.preventDefault(); commit(name); }}
                            className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-700 text-gray-200 border border-gray-600 hover:border-brand-green hover:text-white transition-colors"
                        >
                            {name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FuzzyAutocomplete;
