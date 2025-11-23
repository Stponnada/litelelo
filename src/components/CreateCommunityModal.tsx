// src/components/CreateCommunityModal.tsx

import React, { useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import Spinner from './Spinner';
import { XCircleIcon, CameraIcon } from './icons';
import ImageCropper from './ImageCropper';

interface Props {
    campus: string;
    onClose: () => void;
    onCommunityCreated: (newCommunity: any) => void;
}

const CreateCommunityModal: React.FC<Props> = ({ campus, onClose, onCommunityCreated }) => {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [accessType, setAccessType] = useState<'public' | 'restricted'>('public');
    
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);

    const [cropperState, setCropperState] = useState<{ isOpen: boolean; type: 'avatar' | 'banner' | null; src: string | null; }>({ isOpen: false, type: null, src: null });
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => setCropperState({ isOpen: true, type, src: reader.result as string });
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const handleCropSave = (croppedImageFile: File) => {
        const previewUrl = URL.createObjectURL(croppedImageFile);
        if (cropperState.type === 'avatar') {
            setAvatarFile(croppedImageFile);
            setAvatarPreview(previewUrl);
        } else if (cropperState.type === 'banner') {
            setBannerFile(croppedImageFile);
            setBannerPreview(previewUrl);
        }
        setCropperState({ isOpen: false, type: null, src: null });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Community name is required.');
            return;
        }
        if (!user) {
            setError('You must be logged in.');
            return;
        }

        setIsSubmitting(true);
        setError('');
        
        try {
            // Step 1: Upload images first to get their URLs
            let avatar_url = null;
            if (avatarFile) {
                const filePath = `${user.id}/community-assets/${Date.now()}-avatar`;
                const { error: uploadError } = await supabase.storage.from('community-assets').upload(filePath, avatarFile);
                if (uploadError) throw uploadError;
                avatar_url = supabase.storage.from('community-assets').getPublicUrl(filePath).data.publicUrl;
            }

            let banner_url = null;
            if (bannerFile) {
                const filePath = `${user.id}/community-assets/${Date.now()}-banner`;
                const { error: uploadError } = await supabase.storage.from('community-assets').upload(filePath, bannerFile);
                if (uploadError) throw uploadError;
                banner_url = supabase.storage.from('community-assets').getPublicUrl(filePath).data.publicUrl;
            }

            // Step 2: Call the RPC with all data
            const { data: newCommunityId, error: rpcError } = await supabase.rpc('create_community', {
                p_name: name,
                p_description: description,
                p_campus: campus,
                p_access_type: accessType,
                p_avatar_url: avatar_url,
                p_banner_url: banner_url,
            });

            if (rpcError) throw rpcError;

            // Step 3: Fetch the complete new community to update the UI
            const { data: newCommunityData, error: fetchError } = await supabase
                .rpc('get_communities_list', { p_campus: campus })
                .eq('id', newCommunityId)
                .single();
            
            if (fetchError) throw fetchError;
            
            onCommunityCreated(newCommunityData);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (cropperState.isOpen && cropperState.src) {
        return (
            <ImageCropper
                imageSrc={cropperState.src}
                aspect={cropperState.type === 'avatar' ? 1 : 16 / 6}
                cropShape={cropperState.type === 'avatar' ? 'round' : 'rect'}
                onSave={handleCropSave}
                onClose={() => setCropperState({ isOpen: false, type: null, src: null })}
                isSaving={isSubmitting}
            />
        );
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-secondary-light dark:bg-secondary rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <header className="p-6 flex justify-between items-start border-b border-tertiary-light dark:border-tertiary">
                        <div>
                            <h2 className="text-2xl font-bold text-text-main-light dark:text-text-main">Create a Community</h2>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary mt-1">
                                Build a new space for your club, batch, or interest group.
                            </p>
                        </div>
                        <button type="button" onClick={onClose} className="text-text-tertiary-light dark:text-text-tertiary hover:text-text-main-light dark:hover:text-text-main">
                            <XCircleIcon className="w-7 h-7" />
                        </button>
                    </header>
                    
                    <main className="flex-1 p-6 overflow-y-auto space-y-6">
                        {/* Banner & Avatar */}
                        <div className="relative h-40 bg-tertiary-light dark:bg-tertiary rounded-xl mb-20 group">
                            {bannerPreview && <img src={bannerPreview} className="w-full h-full object-cover rounded-xl" alt="Banner Preview"/>}
                            <button type="button" onClick={() => bannerInputRef.current?.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                <CameraIcon className="w-8 h-8 text-white"/>
                            </button>
                            <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" hidden />
                            
                            <div className="absolute -bottom-16 left-6 w-32 h-32 rounded-full border-4 border-secondary-light dark:border-secondary bg-tertiary-light dark:bg-tertiary overflow-hidden shadow-lg group">
                                {avatarPreview && <img src={avatarPreview} className="w-full h-full object-cover" alt="Avatar Preview"/>}
                                <button type="button" onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-full transition-opacity">
                                    <CameraIcon className="w-6 h-6 text-white"/>
                                </button>
                                <input type="file" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" hidden />
                            </div>
                        </div>

                        {/* Text Fields */}
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-text-main-light dark:text-text-main">Community Name*</label>
                                <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required
                                    className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-600 rounded-md focus:ring-brand-green focus:border-brand-green"/>
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-text-main-light dark:text-text-main">Description (Optional)</label>
                                <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3}
                                    className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-600 rounded-md focus:ring-brand-green focus:border-brand-green"/>
                            </div>
                        </div>
                        
                        {/* Access Type */}
                        <div>
                            <label className="block text-sm font-medium text-text-main-light dark:text-text-main">Access Type</label>
                            <div className="mt-2 flex gap-4">
                                <label className={`flex-1 p-4 border rounded-md cursor-pointer transition-all ${accessType === 'public' ? 'border-brand-green bg-brand-green/10' : 'border-tertiary-light dark:border-gray-600'}`}>
                                    <input type="radio" name="accessType" value="public" checked={accessType === 'public'} onChange={() => setAccessType('public')} className="sr-only" />
                                    <p className="font-semibold">🌍 Public</p>
                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary">Anyone can join.</p>
                                </label>
                                <label className={`flex-1 p-4 border rounded-md cursor-pointer transition-all ${accessType === 'restricted' ? 'border-brand-green bg-brand-green/10' : 'border-tertiary-light dark:border-gray-600'}`}>
                                    <input type="radio" name="accessType" value="restricted" checked={accessType === 'restricted'} onChange={() => setAccessType('restricted')} className="sr-only" />
                                    <p className="font-semibold">🔒 Restricted</p>
                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary">Members must be approved.</p>
                                </label>
                            </div>
                        </div>
                        
                        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
                    </main>

                    <footer className="px-6 py-4 bg-tertiary-light/30 dark:bg-tertiary/30 flex justify-end items-center space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-md hover:bg-tertiary-light/60 dark:hover:bg-tertiary">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-brand-green text-black font-bold rounded-md disabled:opacity-50 flex items-center">
                            {isSubmitting && <Spinner />}
                            {isSubmitting ? 'Creating...' : 'Create'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default CreateCommunityModal;