// src/components/CreateCommunityModal.tsx

import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import Spinner from './Spinner';
import { XCircleIcon } from './icons';

interface Props {
    campus: string;
    onClose: () => void;
    onCommunityCreated: (newCommunity: any) => void;
}

const CreateCommunityModal: React.FC<Props> = ({ campus, onClose, onCommunityCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Community name is required.');
            return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            const { data, error: rpcError } = await supabase.rpc('create_community', {
                p_name: name,
                p_description: description,
                p_campus: campus
            });

            if (rpcError) throw rpcError;

            // Fetch the newly created community to pass back to the list page
            const { data: newCommunityData, error: fetchError } = await supabase
                .rpc('get_communities_list', { p_campus: campus })
                .eq('id', data)
                .single();

            if (fetchError) throw fetchError;
            
            onCommunityCreated(newCommunityData);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-secondary-light dark:bg-secondary rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="flex justify-between items-start">
                            <h2 className="text-2xl font-bold text-text-main-light dark:text-text-main">Create a Community</h2>
                            <button type="button" onClick={onClose} className="text-text-tertiary-light dark:text-text-tertiary hover:text-text-main-light dark:hover:text-text-main">
                                <XCircleIcon className="w-7 h-7" />
                            </button>
                        </div>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary mt-1">Create a new space for your club, batch, or interest group.</p>

                        <div className="mt-6 space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-text-main-light dark:text-text-main">Community Name</label>
                                <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required
                                    className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-600 rounded-md focus:ring-brand-green focus:border-brand-green"/>
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-text-main-light dark:text-text-main">Description (Optional)</label>
                                <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3}
                                    className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-600 rounded-md focus:ring-brand-green focus:border-brand-green"/>
                            </div>
                        </div>
                        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
                    </div>

                    <div className="px-6 py-4 bg-tertiary-light/30 dark:bg-tertiary/30 flex justify-end items-center space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-md hover:bg-tertiary-light/60 dark:hover:bg-tertiary">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-brand-green text-black font-bold rounded-md disabled:opacity-50 flex items-center">
                            {isSubmitting && <Spinner />}
                            {isSubmitting ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateCommunityModal;