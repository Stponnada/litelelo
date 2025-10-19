// src/pages/LostAndFoundPage.tsx

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { LostAndFoundItem as ItemType, Profile } from '../types';
import Spinner from '../components/Spinner';
import { XCircleIcon, ImageIcon, ChatIcon } from '../components/icons';
import { formatTimestamp } from '../utils/timeUtils';

const TabButton: React.FC<{ label: string; count?: number; isActive: boolean; onClick: () => void }> = ({ label, count, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-2 ${
        isActive
          ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/30'
          : 'bg-secondary-light dark:bg-secondary text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light/70 dark:hover:bg-tertiary/70 border border-tertiary-light dark:border-tertiary'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
          isActive 
            ? 'bg-white/20 text-white' 
            : 'bg-tertiary-light dark:bg-tertiary text-text-secondary-light dark:text-text-secondary'
        }`}>
          {count}
        </span>
      )}
    </button>
);

const LostAndFoundPage: React.FC = () => {
    const { profile } = useAuth();
    const [items, setItems] = useState<ItemType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'found' | 'lost'>('found');

    const fetchItems = async (campus: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('lost_and_found_items')
                .select('*, profiles(*)')
                .eq('campus', campus)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setItems(data as any[] || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (profile?.campus) {
            fetchItems(profile.campus);
        }
    }, [profile?.campus]);

    const handlePostCreated = (newItem: ItemType) => {
        setItems(prevItems => [newItem, ...prevItems]);
        setCreateModalOpen(false);
    };

    const handleItemReclaimed = async (itemId: string) => {
        if (!window.confirm("Are you sure you want to mark this item as reclaimed/found? This will remove the post.")) return;

        try {
            const { error } = await supabase
                .from('lost_and_found_items')
                .update({ status: 'reclaimed' })
                .eq('id', itemId);

            if (error) throw error;
            setItems(items.filter(item => item.id !== itemId));
        } catch (err: any) {
            console.error("Failed to update item status:", err);
        }
    };
    
    const filteredItems = useMemo(() => items.filter(item => item.item_type === activeTab), [items, activeTab]);
    const foundCount = items.filter(item => item.item_type === 'found').length;
    const lostCount = items.filter(item => item.item_type === 'lost').length;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {isCreateModalOpen && profile && (
                <CreateItemModal 
                    campus={profile.campus!}
                    itemType={activeTab}
                    onClose={() => setCreateModalOpen(false)} 
                    onPostCreated={handlePostCreated} 
                />
            )}

            {/* Enhanced Header Section */}
            <header className="mb-10 relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/20 via-red-500/10 to-transparent dark:from-orange-500/10 dark:via-red-500/5 p-8 border border-orange-500/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-500/10 rounded-full blur-3xl -ml-24 -mb-24"></div>
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <h1 className="text-5xl font-extrabold text-text-main-light dark:text-text-main bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                                    Lost & Found
                                </h1>
                            </div>
                            <p className="text-lg text-text-secondary-light dark:text-text-secondary max-w-xl">
                                Help reunite lost items with their owners or report what you've found
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2 bg-green-500/10 text-green-400 px-3 py-1.5 rounded-full border border-green-500/30">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="font-semibold">{foundCount} Found Items</span>
                                </div>
                                <div className="flex items-center gap-2 bg-red-500/10 text-red-400 px-3 py-1.5 rounded-full border border-red-500/30">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span className="font-semibold">{lostCount} Lost Items</span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setCreateModalOpen(true)}
                            className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-4 px-8 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2 group whitespace-nowrap"
                        >
                            <span className="text-2xl group-hover:rotate-90 transition-transform duration-200">+</span>
                            <span>Post {activeTab === 'found' ? 'Found' : 'Lost'} Item</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Enhanced Tabs */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-1 w-12 bg-orange-500 rounded-full"></div>
                    <h2 className="text-sm font-bold text-text-secondary-light dark:text-text-secondary uppercase tracking-wider">Browse Items</h2>
                </div>
                <div className="inline-flex gap-3 p-1.5 bg-secondary-light dark:bg-secondary rounded-xl border border-tertiary-light dark:border-tertiary">
                    <TabButton 
                        label="✓ Found Items" 
                        count={foundCount}
                        isActive={activeTab === 'found'} 
                        onClick={() => setActiveTab('found')} 
                    />
                    <TabButton 
                        label="⚠ Lost Items" 
                        count={lostCount}
                        isActive={activeTab === 'lost'} 
                        onClick={() => setActiveTab('lost')} 
                    />
                </div>
            </div>

            {/* Content */}
            {loading && (
                <div className="flex justify-center items-center py-32 bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 rounded-2xl border border-tertiary-light dark:border-tertiary">
                    <Spinner />
                </div>
            )}
            
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800/30 rounded-2xl p-8 text-center">
                    <div className="inline-block p-4 bg-red-500/10 rounded-full mb-3">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-red-600 dark:text-red-400 font-semibold">Error: {error}</p>
                </div>
            )}
            
            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.length > 0 ? (
                        filteredItems.map(item => <ItemCard key={item.id} item={item} onItemReclaimed={handleItemReclaimed} />)
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-24 bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 rounded-2xl border-2 border-dashed border-tertiary-light dark:border-tertiary">
                            <div className="inline-block p-6 bg-orange-500/10 rounded-full mb-4">
                                <svg className="w-16 h-16 text-orange-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-text-main-light dark:text-text-main mb-2">
                                No {activeTab === 'found' ? 'found' : 'lost'} items yet
                            </h3>
                            <p className="text-text-secondary-light dark:text-text-secondary">
                                Be the first to post an item!
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const ItemCard: React.FC<{ item: ItemType; onItemReclaimed: (itemId: string) => void; }> = ({ item, onItemReclaimed }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const poster = item.profiles;

    const handleContact = () => {
        if (!poster) return;
        navigate('/chat', { state: { recipient: poster } });
    };

    const isOwner = user?.id === item.user_id;
    const locationLabel = item.item_type === 'found' ? 'Found near' : 'Last seen near';
    const isFound = item.item_type === 'found';

    return (
        <div className="group bg-gradient-to-br from-secondary-light to-secondary-light dark:from-secondary dark:to-secondary rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl border border-tertiary-light dark:border-tertiary flex flex-col transition-all duration-300 hover:-translate-y-1 hover:border-orange-500 hover:shadow-orange-500/20 relative">
            {/* Decorative gradient overlay */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${isFound ? 'bg-green-500/5' : 'bg-red-500/5'} rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>
            
            {/* Image */}
            <div className="relative overflow-hidden">
                <img 
                    className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110" 
                    src={item.image_url || `https://placehold.co/600x400/1e293b/3cfba2?text=${item.item_type === 'lost' ? 'Lost+Item' : 'Found+Item'}`} 
                    alt={item.title} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-3 right-3">
                    <span className={`px-4 py-1.5 rounded-xl text-xs font-bold shadow-lg border backdrop-blur-sm ${
                        isFound
                            ? 'bg-green-500/90 text-white border-green-400/50'
                            : 'bg-red-500/90 text-white border-red-400/50'
                    }`}>
                        {isFound ? '✓ Found' : '⚠ Lost'}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 p-5 flex-grow flex flex-col">
                <h3 className="text-xl font-bold text-text-main-light dark:text-text-main truncate mb-3 group-hover:text-orange-500 transition-colors duration-200">
                    {item.title}
                </h3>
                
                <div className="flex items-start gap-2 mb-3 px-3 py-2 bg-tertiary-light/50 dark:bg-tertiary/50 rounded-lg border border-tertiary-light dark:border-tertiary">
                    <svg className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                        <p className="text-xs font-bold text-text-secondary-light dark:text-text-secondary uppercase tracking-wide">
                            {locationLabel}
                        </p>
                        <p className="text-sm font-semibold text-text-main-light dark:text-text-main">
                            {item.location_found}
                        </p>
                    </div>
                </div>
                
                <p className="text-sm text-text-secondary-light dark:text-text-secondary mb-4 flex-grow line-clamp-3 leading-relaxed">
                    {item.description || 'No description provided.'}
                </p>
                
                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-tertiary-light dark:border-tertiary">
                    <Link 
                        to={`/profile/${poster?.username}`}
                        className="min-w-0 flex items-center gap-2 group/avatar"
                    >
                        <div className="relative">
                            <img 
                                src={poster?.avatar_url || `https://ui-avatars.com/api/?name=${poster?.username}&background=10b981&color=fff`}
                                alt={poster?.username}
                                className="w-9 h-9 rounded-full ring-2 ring-tertiary-light dark:ring-tertiary group-hover/avatar:ring-orange-500 transition-all duration-200"
                            />
                            <div className="absolute inset-0 rounded-full bg-orange-500 opacity-0 group-hover/avatar:opacity-20 transition-opacity duration-200"></div>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase text-text-tertiary-light dark:text-text-tertiary tracking-wide">
                                Posted by
                            </p>
                            <p className="text-sm font-bold text-text-main-light dark:text-text-main group-hover/avatar:text-orange-500 transition-colors duration-200 truncate">
                                @{poster?.username || 'Unknown'}
                            </p>
                        </div>
                    </Link>
                    
                    {isOwner ? (
                        <button 
                            onClick={() => onItemReclaimed(item.id)} 
                            className="flex-shrink-0 font-bold py-2 px-4 rounded-lg text-xs transition-all bg-gradient-to-r from-green-500/20 to-green-600/20 border-2 border-green-500/30 text-green-500 hover:from-green-500 hover:to-green-600 hover:text-white hover:border-transparent hover:scale-105"
                        >
                            Mark {isFound ? 'Reclaimed' : 'Found'}
                        </button>
                    ) : (
                        <button 
                            onClick={handleContact} 
                            className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-red-600/20 border-2 border-orange-500/30 font-bold text-sm py-2 px-4 rounded-lg hover:from-orange-500 hover:to-red-600 hover:border-transparent text-orange-500 hover:text-white transition-all hover:scale-105"
                        >
                            <ChatIcon className="w-4 h-4" />
                            <span>Contact</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const CreateItemModal: React.FC<{ campus: string; itemType: 'lost' | 'found'; onClose: () => void; onPostCreated: (newItem: ItemType) => void; }> = ({ campus, itemType, onClose, onPostCreated }) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const isFoundItem = itemType === 'found';
        if (!user || !title || !location || (isFoundItem && !imageFile)) {
            setError(`Title, location, and ${isFoundItem ? 'an image are' : 'is'} required.`);
            return;
        }
        setIsSubmitting(true);
        setError('');

        try {
            let publicUrl = null;
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const filePath = `${user.id}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('lost-and-found-images').upload(filePath, imageFile);
                if (uploadError) throw uploadError;
                publicUrl = supabase.storage.from('lost-and-found-images').getPublicUrl(filePath).data.publicUrl;
            }

            const { data: newItem, error: insertError } = await supabase
                .from('lost_and_found_items')
                .insert({
                    user_id: user.id,
                    item_type: itemType,
                    title,
                    description,
                    location_found: location,
                    image_url: publicUrl,
                    campus,
                })
                .select('*, profiles(*)')
                .single();

            if (insertError) throw insertError;
            onPostCreated(newItem as any);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const locationLabel = itemType === 'found' ? 'Location Found' : 'Last Seen At';
    const imageLabel = itemType === 'found' ? 'Image' : 'Image (Optional)';
    const isFound = itemType === 'found';

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 rounded-2xl shadow-2xl w-full max-w-2xl border border-tertiary-light dark:border-tertiary animate-slideUp" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6">
                    {/* Header */}
                    <header className="flex items-center justify-between pb-5 border-b border-tertiary-light dark:border-tertiary">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl flex items-center justify-center shadow-md ${
                                isFound
                                    ? 'bg-gradient-to-br from-green-500 to-green-600' 
                                    : 'bg-gradient-to-br from-red-500 to-red-600'
                            }`}>
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {isFound ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    )}
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                                    Post a {isFound ? 'Found' : 'Lost'} Item
                                </h2>
                                <p className="text-sm text-text-secondary-light dark:text-text-secondary mt-1">
                                    Help reunite items with their owners
                                </p>
                            </div>
                        </div>
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="hover:bg-tertiary-light dark:hover:bg-tertiary rounded-lg p-1 transition-colors"
                        >
                            <XCircleIcon className="w-7 h-7 text-text-tertiary-light dark:text-text-tertiary" />
                        </button>
                    </header>
                    
                    {/* Form Fields */}
                    <div className="mt-6 space-y-5 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
                        <div>
                            <label className="block text-sm font-bold mb-2 text-text-main-light dark:text-text-main">
                                Item Name <span className="text-orange-500">*</span>
                            </label>
                            <input 
                                type="text" 
                                value={title} 
                                onChange={e => setTitle(e.target.value)} 
                                placeholder="e.g., Blue Backpack, iPhone 13, Keys..."
                                className="w-full px-4 py-3 bg-tertiary-light dark:bg-tertiary rounded-xl border-2 border-tertiary-light dark:border-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold mb-2 text-text-main-light dark:text-text-main">
                                {locationLabel} <span className="text-orange-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">📍</span>
                                <input 
                                    type="text" 
                                    value={location} 
                                    onChange={e => setLocation(e.target.value)}
                                    placeholder="e.g., Library 2nd floor, Main cafeteria..."
                                    className="w-full pl-10 pr-4 py-3 bg-tertiary-light dark:bg-tertiary rounded-xl border-2 border-tertiary-light dark:border-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold mb-2 text-text-main-light dark:text-text-main">
                                Description
                            </label>
                            <textarea 
                                value={description} 
                                onChange={e => setDescription(e.target.value)} 
                                rows={4}
                                placeholder="Provide any additional details that might help..."
                                className="w-full px-4 py-3 bg-tertiary-light dark:bg-tertiary rounded-xl border-2 border-tertiary-light dark:border-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all outline-none resize-none"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold mb-2 text-text-main-light dark:text-text-main">
                                {imageLabel} {isFound && <span className="text-orange-500">*</span>}
                            </label>
                            <input type="file" ref={imageInputRef} onChange={handleFileChange} accept="image/*" hidden />
                            
                            {imagePreview ? (
                                <div className="relative rounded-xl overflow-hidden border-2 border-tertiary-light dark:border-tertiary">
                                    <img src={imagePreview} alt="Preview" className="w-full h-56 object-cover" />
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setImageFile(null);
                                            setImagePreview(null);
                                        }}
                                        className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all hover:scale-110 shadow-lg"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    type="button" 
                                    onClick={() => imageInputRef.current?.click()} 
                                    className="w-full flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-tertiary-light dark:border-tertiary bg-tertiary-light/30 dark:bg-tertiary/30 hover:bg-tertiary-light/50 dark:hover:bg-tertiary/50 hover:border-orange-500/50 transition-all group"
                                >
                                    <div className="p-4 bg-orange-500/10 rounded-full group-hover:bg-orange-500/20 transition-colors">
                                        <ImageIcon className="w-8 h-8 text-orange-500" />
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-sm font-bold text-text-main-light dark:text-text-main mb-1">
                                            Click to upload image
                                        </span>
                                        <span className="text-xs text-text-secondary-light dark:text-text-secondary">
                                            PNG, JPG up to 10MB
                                        </span>
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="mt-5 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800/30 rounded-xl flex items-start gap-3">
                            <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
                        </div>
                    )}
                    
                    {/* Footer */}
                    <footer className="flex justify-end gap-3 pt-6 mt-6 border-t border-tertiary-light dark:border-tertiary">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="py-3 px-6 rounded-xl font-semibold text-text-main-light dark:text-text-main hover:bg-tertiary-light dark:hover:bg-tertiary transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="py-3 px-8 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-red-600 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Spinner />
                                    <span>Posting...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Post Item
                                </>
                            )}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default LostAndFoundPage;