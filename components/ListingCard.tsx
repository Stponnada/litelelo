// src/components/ListingCard.tsx

import React from 'react';
import { MarketplaceListing } from '../types';

interface ListingCardProps {
    listing: MarketplaceListing;
    onClick: () => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick }) => {
    // --- THIS IS THE FIX ---
    // Function to get a resized image URL from Supabase Storage
    const getResizedImageUrl = (url: string | null, width: number, height: number) => {
        if (!url) {
            return `https://placehold.co/${width}x${height}/1e293b/3cfba2?text=No+Image`;
        }
        // Use Supabase's 'render' path for transformations
        const urlObject = new URL(url);
        const pathParts = urlObject.pathname.split('/');
        const bucket = pathParts[3]; // e.g., 'marketplace-images'
        const imagePath = pathParts.slice(4).join('/');
        
        return `${urlObject.origin}/storage/v1/render/image/public/${bucket}/${imagePath}?width=${width}&height=${height}&resize=cover`;
    };
    // ----------------------

    return (
        <div 
            onClick={onClick} 
            className="group cursor-pointer bg-secondary-light dark:bg-secondary rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border border-tertiary-light dark:border-tertiary flex flex-col"
        >
            <div className="relative w-full aspect-square overflow-hidden">
                <img 
                    // Use the new function to request a smaller, optimized image
                    src={getResizedImageUrl(listing.primary_image_url, 400, 400)} 
                    alt={listing.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-text-main-light dark:text-text-main text-lg truncate group-hover:text-brand-green">{listing.title}</h3>
                <p className="text-sm text-text-tertiary-light dark:text-text-tertiary mt-1">{listing.category}</p>
                <p className="mt-auto text-xl font-semibold text-brand-green pt-2">₹{listing.price.toLocaleString()}</p>
            </div>
        </div>
    );
};

export default ListingCard;