// src/components/CreateSubcommunityModal.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import Spinner from './Spinner';
import { XCircleIcon } from './icons';

interface Props {
    parentCommunityId: string;
    onClose: () => void;
    onSubcommunityCreated: () => void;
}

const CreateSubcommunityModal: React.FC<Props> = ({ parentCommunityId, onClose, onSubcommunityCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [accessType, setAccessType] = useState<'public' | 'restricted'>('public');
    const [parentMembers, setParentMembers] = useState<Profile[]>([]);
    const [selectedConsuls, setSelectedConsuls] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchParentMembers = async () => {
            const { data, error } = await supabase.rpc('get_community_members', { p_community_id: parentCommunityId });
            if (data) setParentMembers(data.filter((m: any) => m.status === 'approved'));
        };
        fetchParentMembers();
    }, [parentCommunityId]);

    const handleToggleConsul = (userId: string) => {
        setSelectedConsuls(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Subcommunity name is required.'); return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            const { error: rpcError } = await supabase.rpc('create_subcommunity', {
                p_parent_community_id: parentCommunityId,
                p_name: name,
                p_description: description,
                p_access_type: accessType,
                p_consul_ids: selectedConsuls,
            });
            if (rpcError) throw rpcError;
            onSubcommunityCreated();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-secondary-light dark:bg-secondary rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <header className="p-6 flex justify-between items-start border-b border-tertiary-light dark:border-tertiary">
                        <div>
                            <h2 className="text-2xl font-bold text-text-main-light dark:text-text-main">Create Subcommunity</h2>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary mt-1">Create a new channel within your community.</p>
                        </div>
                        <button type="button" onClick={onClose}><XCircleIcon className="w-7 h-7" /></button>
                    </header>
                    
                    <main className="flex-1 p-6 overflow-y-auto space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium">Name*</label>
                            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium">Description</label>
                            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={2} className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Access Type</label>
                            <div className="mt-2 flex gap-4">
                                <label className={`flex-1 p-3 border rounded-md cursor-pointer ${accessType === 'public' ? 'border-brand-green bg-brand-green/10' : 'border-tertiary-light dark:border-gray-600'}`}>
                                    <input type="radio" value="public" checked={accessType === 'public'} onChange={() => setAccessType('public')} className="sr-only"/>
                                    <p className="font-semibold">Public</p><p className="text-xs">Any community member can join.</p>
                                </label>
                                <label className={`flex-1 p-3 border rounded-md cursor-pointer ${accessType === 'restricted' ? 'border-brand-green bg-brand-green/10' : 'border-tertiary-light dark:border-gray-600'}`}>
                                    <input type="radio" value="restricted" checked={accessType === 'restricted'} onChange={() => setAccessType('restricted')} className="sr-only"/>
                                    <p className="font-semibold">Restricted</p><p className="text-xs">Join by approval from Consul.</p>
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Assign Consuls (Optional)</label>
                            <div className="max-h-48 overflow-y-auto space-y-2 p-2 bg-tertiary-light dark:bg-tertiary rounded-md">
                                {parentMembers.map(member => (
                                    <div key={member.user_id} onClick={() => handleToggleConsul(member.user_id)} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer">
                                        <input type="checkbox" checked={selectedConsuls.includes(member.user_id)} readOnly className="form-checkbox rounded text-brand-green"/>
                                        <img src={member.avatar_url || ''} alt={member.username} className="w-8 h-8 rounded-full" />
                                        <span>{member.full_name || member.username}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
                    </main>
                    
                    <footer className="px-6 py-4 bg-tertiary-light/30 dark:bg-tertiary/30 flex justify-end items-center space-x-3">
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-brand-green text-black font-bold rounded-md disabled:opacity-50">
                            {isSubmitting ? <Spinner /> : 'Create'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default CreateSubcommunityModal;