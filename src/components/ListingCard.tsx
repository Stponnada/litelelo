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
            className="group cursor-pointer bg-secondary-light dark:bg-secondary rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-tertiary-light dark:border-tertiary flex gap-3 p-3"
        >
            <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg">
                <Image
                    src={getResizedImageUrl(listing.primary_image_url, 200, 200)}
                    alt={listing.title}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                />
            </div>
            <div className="flex flex-col flex-grow min-w-0">
                <h3 className="font-bold text-text-main-light dark:text-text-main text-sm truncate group-hover:text-brand-green transition-colors">{listing.title}</h3>
                <p className="text-xs text-text-tertiary-light dark:text-text-tertiary mt-0.5">{listing.category}</p>
                <p className="mt-auto text-lg font-bold text-brand-green pt-1">₹{listing.price.toLocaleString()}</p>
            </div>
        </div>
    );
};

export default ListingCard;