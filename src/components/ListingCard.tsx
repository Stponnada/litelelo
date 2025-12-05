// src/components/ListingCard.tsx

import React from 'react';
import Image from 'next/image';
import { MarketplaceListing } from '../types';

interface ListingCardProps {
    listing: MarketplaceListing;
    onClick: () => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick }) => {
    // --- THIS IS THE FIX ---
    // A more robust way to get a resized image URL from Supabase Storage.
    // It replaces the part of the URL that fetches the object with the part that renders a transformation.
    const getResizedImageUrl = (url: string | null, width: number, height: number) => {
        if (!url) {
            return `https://placehold.co/${width}x${height}/1e293b/3cfba2?text=No+Image`;
        }
        if (url.includes('/object/public/')) {
            const transformedUrl = url.replace('/object/public/', '/render/image/public/');
            const separator = transformedUrl.includes('?') ? '&' : '?';
            return `${transformedUrl}${separator}width=${width}&height=${height}&resize=cover`;
        }
        return url;
    };
    // ----------------------

    return (
        <div
            onClick={onClick}
            className="group cursor-pointer bg-gradient-to-r from-emerald-500/5 to-green-500/5 dark:from-emerald-500/10 dark:to-green-500/10 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-emerald-500/20 hover:border-emerald-500/40 backdrop-blur-md mb-2 p-3.5"
        >
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-tertiary-light dark:bg-tertiary">
                    <Image
                        src={getResizedImageUrl(listing.primary_image_url, 80, 80)}
                        alt={listing.title}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        unoptimized
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mb-1.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        {listing.category}
                    </span>
                    <h3 className="font-bold text-base text-text-main-light dark:text-text-main truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {listing.title}
                    </h3>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        ₹{listing.price.toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ListingCard;