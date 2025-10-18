// src/components/CreateEventModal.tsx

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { CampusEvent } from '../types';
import Spinner from './Spinner';
import { XCircleIcon, CameraIcon } from './icons';
import ImageCropper from './ImageCropper';

interface CreateEventModalProps {
  onClose: () => void;
  onEventCreated: (newEvent: CampusEvent) => void;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ onClose, onEventCreated }) => {
    const { user, profile } = useAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [cropperState, setCropperState] = useState<{ isOpen: boolean; src: string | null }>({ isOpen: false, src: null });
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setCropperState({ isOpen: true, src: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const handleCropSave = (croppedImageFile: File) => {
        setImageFile(croppedImageFile);
        setImagePreview(URL.createObjectURL(croppedImageFile));
        setCropperState({ isOpen: false, src: null });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !profile?.campus || !name || !startDate || !startTime) {
            setError('Please fill all required fields.');
            return;
        }
        setIsSubmitting(true);
        setError('');

        try {
            let imageUrl: string | null = null;
            if (imageFile) {
                const filePath = `${user.id}/event-images/${Date.now()}-${imageFile.name}`;
                const { error: uploadError } = await supabase.storage.from('event-images').upload(filePath, imageFile);
                if (uploadError) throw uploadError;
                imageUrl = supabase.storage.from('event-images').getPublicUrl(filePath).data.publicUrl;
            }

            const start_time = new Date(`${startDate}T${startTime}`).toISOString();
            let end_time: string | null = null;
            if (endDate && endTime) {
                end_time = new Date(`${endDate}T${endTime}`).toISOString();
            }
            
            const { data, error: rpcError } = await supabase.rpc('create_event', {
                p_name: name,
                p_description: description,
                p_start_time: start_time,
                p_end_time: end_time,
                p_location: location,
                p_campus: profile.campus,
                p_image_url: imageUrl,
            });
            if (rpcError) throw rpcError;

            // Refetch the full event details to pass back
            const { data: newEventData, error: fetchError } = await supabase.rpc('get_campus_events', { p_campus: profile.campus }).eq('id', data).single();
            if (fetchError) throw fetchError;

            onEventCreated(newEventData as CampusEvent);

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
                aspect={16 / 9}
                cropShape="rect"
                onSave={handleCropSave}
                onClose={() => setCropperState({ isOpen: false, src: null })}
                isSaving={isSubmitting}
            />
        );
    }
    
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-secondary-light dark:bg-secondary rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6">
                    <header className="flex items-center justify-between pb-4 border-b border-tertiary-light dark:border-tertiary">
                        <h2 className="text-xl font-bold">Create New Event</h2>
                        <button type="button" onClick={onClose}><XCircleIcon className="w-8 h-8 text-text-tertiary-light dark:text-text-tertiary" /></button>
                    </header>
                    
                    <div className="mt-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Event Name*</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded border border-tertiary-light dark:border-gray-600" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium">Date*</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded border border-tertiary-light dark:border-gray-600" /></div>
                            <div><label className="block text-sm font-medium">Start Time*</label><input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded border border-tertiary-light dark:border-gray-600" /></div>
                            <div><label className="block text-sm font-medium">End Date</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded border border-tertiary-light dark:border-gray-600" /></div>
                            <div><label className="block text-sm font-medium">End Time</label><input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded border border-tertiary-light dark:border-gray-600" /></div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Location (Optional)</label>
                            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g., Library Audi, F-101" className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded border border-tertiary-light dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Description</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded border border-tertiary-light dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Banner Image</label>
                            <input type="file" ref={imageInputRef} onChange={handleFileChange} accept="image/*" hidden />
                            <div 
                                onClick={() => imageInputRef.current?.click()}
                                className="relative w-full aspect-[16/9] bg-tertiary-light dark:bg-tertiary rounded-lg border-2 border-dashed border-tertiary-light dark:border-gray-600 flex items-center justify-center text-sm text-text-tertiary-light dark:text-text-tertiary hover:border-brand-green/50 cursor-pointer"
                            >
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Banner Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center">
                                        <CameraIcon className="w-10 h-10 mx-auto mb-2" />
                                        <span>Upload Banner</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
                    
                    <footer className="flex justify-end space-x-4 pt-6 mt-4 border-t border-tertiary-light dark:border-tertiary">
                        <button type="button" onClick={onClose} className="py-2 px-6 rounded-full hover:bg-tertiary-light/60 dark:hover:bg-tertiary">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="py-2 px-6 rounded-full text-black bg-brand-green hover:bg-brand-green-darker disabled:opacity-50">{isSubmitting ? <Spinner /> : 'Create Event'}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default CreateEventModal;