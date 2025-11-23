// src/components/CreateNoticeModal.tsx

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { CampusNotice, CampusNoticeFile } from '../types';
import Spinner from './Spinner';
import { XCircleIcon, ImageIcon, TrashIcon } from './icons';

interface CreateNoticeModalProps {
    campus: string;
    onClose: () => void;
    onNoticeCreated: (newNotice: CampusNotice) => void;
    onNoticeUpdated: (updatedNotice: CampusNotice) => void;
    existingNotice?: CampusNotice | null;
}

const CreateNoticeModal: React.FC<CreateNoticeModalProps> = ({ campus, onClose, onNoticeCreated, onNoticeUpdated, existingNotice }) => {
    const { user } = useAuth();
    const isEditMode = !!existingNotice;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    
    const [existingFiles, setExistingFiles] = useState<CampusNoticeFile[]>([]);
    const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
    const [filesToDelete, setFilesToDelete] = useState<string[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditMode && existingNotice) {
            setTitle(existingNotice.title);
            setDescription(existingNotice.description || '');
            setExistingFiles(existingNotice.files || []);
        }
    }, [isEditMode, existingNotice]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFilesToUpload(prev => [...prev, ...Array.from(e.target.files)]);
        }
    };

    const removeNewFile = (index: number) => {
        setFilesToUpload(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingFile = (fileUrl: string) => {
        setFilesToDelete(prev => [...prev, fileUrl]);
        setExistingFiles(prev => prev.filter(f => f.file_url !== fileUrl));
    };

    const uploadFiles = async (files: File[], noticeId: string) => {
        if (files.length === 0) return [];
        
        const uploadPromises = files.map(async file => {
            const fileExt = file.name.split('.').pop();
            const filePath = `${user!.id}/noticeboard/${noticeId}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('noticeboard-files').upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('noticeboard-files').getPublicUrl(filePath);
            return {
                notice_id: noticeId,
                file_url: data.publicUrl,
                file_type: file.type.startsWith('image/') ? 'image' : 'pdf',
            };
        });

        const newFileRecords = await Promise.all(uploadPromises);
        const { error: insertError } = await supabase.from('campus_notice_files').insert(newFileRecords);
        if (insertError) throw insertError;
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const hasFiles = existingFiles.length > 0 || filesToUpload.length > 0;
        if (!user || !title || !hasFiles) {
            setError('A title and at least one file are required.');
            return;
        }
        setIsSubmitting(true);
        setError('');

        try {
            if (isEditMode && existingNotice) {
                // --- UPDATE LOGIC ---
                // 1. Update notice text
                const { error: textUpdateError } = await supabase.from('campus_notices')
                    .update({ title, description }).eq('id', existingNotice.id);
                if (textUpdateError) throw textUpdateError;

                // 2. Delete marked files
                if (filesToDelete.length > 0) {
                    const filePaths = filesToDelete.map(url => url.substring(url.indexOf(`/${user.id}/`)));
                    await supabase.storage.from('noticeboard-files').remove(filePaths);
                    await supabase.from('campus_notice_files').delete().in('file_url', filesToDelete);
                }

                // 3. Upload new files
                await uploadFiles(filesToUpload, existingNotice.id);
                
                // Refetch and call callback
                const { data, error } = await supabase.rpc('get_campus_notices_with_files', { p_campus: campus }).eq('id', existingNotice.id).single();
                if (error) throw error;
                onNoticeUpdated(data as any);

            } else {
                // --- CREATE LOGIC ---
                const { data: newNotice, error: insertError } = await supabase.from('campus_notices')
                    .insert({ user_id: user.id, title, description, campus }).select().single();
                if (insertError) throw insertError;
                
                await uploadFiles(filesToUpload, newNotice.id);

                const { data, error } = await supabase.rpc('get_campus_notices_with_files', { p_campus: campus }).eq('id', newNotice.id).single();
                if (error) throw error;
                onNoticeCreated(data as any);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-secondary-light dark:bg-secondary rounded-xl shadow-lg w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6">
                    <header className="flex items-center justify-between pb-4 border-b border-tertiary-light dark:border-tertiary">
                        <h2 className="text-xl font-bold">{isEditMode ? 'Edit Notice' : 'Post a New Notice'}</h2>
                        <button type="button" onClick={onClose}><XCircleIcon className="w-8 h-8 text-text-tertiary-light dark:text-text-tertiary" /></button>
                    </header>
                    
                    <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                        <div>
                            <label className="block text-sm font-medium">Title*</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded border border-tertiary-light dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Description</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded border border-tertiary-light dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Files (Images or PDFs)*</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {existingFiles.map(file => (
                                    <div key={file.file_url} className="relative group aspect-square">
                                        {file.file_type === 'image' ? (
                                            <img src={file.file_url} alt="Preview" className="w-full h-full object-cover rounded" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-700 text-white flex items-center justify-center rounded p-2 text-xs">PDF</div>
                                        )}
                                        <button type="button" onClick={() => removeExistingFile(file.file_url)} className="absolute top-1 right-1 p-1 bg-red-600/80 text-white rounded-full opacity-0 group-hover:opacity-100"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                ))}
                                {filesToUpload.map((file, index) => (
                                    <div key={index} className="relative group aspect-square">
                                        {file.type.startsWith('image/') ? (
                                            <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover rounded" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-700 text-white flex items-center justify-center rounded p-2 text-xs truncate">{file.name}</div>
                                        )}
                                        <button type="button" onClick={() => removeNewFile(index)} className="absolute top-1 right-1 p-1 bg-red-600/80 text-white rounded-full opacity-0 group-hover:opacity-100"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center aspect-square text-sm p-2 rounded bg-tertiary-light dark:bg-tertiary hover:bg-gray-300 dark:hover:bg-gray-600 border-2 border-dashed">
                                    <ImageIcon className="w-10 h-10" /><span>Add File</span>
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,application/pdf" multiple hidden />
                            </div>
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
                    
                    <footer className="flex justify-end space-x-4 pt-6 mt-4 border-t border-tertiary-light dark:border-tertiary">
                        <button type="button" onClick={onClose} className="py-2 px-6 rounded-full hover:bg-tertiary-light/60 dark:hover:bg-tertiary">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="py-2 px-6 rounded-full text-black bg-brand-green hover:bg-brand-green-darker disabled:opacity-50">
                            {isSubmitting ? <Spinner /> : isEditMode ? 'Save Changes' : 'Post Notice'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default CreateNoticeModal;