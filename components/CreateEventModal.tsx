// src/components/CreateEventModal.tsx

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { CampusEvent } from '../types';
import Spinner from './Spinner';
import { XCircleIcon, CameraIcon } from './icons';
import ImageCropper from './ImageCropper';
import { format } from 'date-fns';

interface CreateEventModalProps {
  onClose: () => void;
  onEventCreated: (newEvent: CampusEvent) => void;
  onEventUpdated: (updatedEvent: CampusEvent) => void;
  existingEvent?: CampusEvent | null;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ onClose, onEventCreated, onEventUpdated, existingEvent }) => {
    const { user, profile } = useAuth();
    const isEditMode = !!existingEvent;

    const [step, setStep] = useState(1);
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
    
    useEffect(() => {
        if (isEditMode && existingEvent) {
            setName(existingEvent.name);
            setDescription(existingEvent.description || '');
            setLocation(existingEvent.location || '');
            setImagePreview(existingEvent.image_url || null);

            if (existingEvent.start_time) {
                const start = new Date(existingEvent.start_time);
                setStartDate(format(start, 'yyyy-MM-dd'));
                setStartTime(format(start, 'HH:mm'));
            }
            if (existingEvent.end_time) {
                const end = new Date(existingEvent.end_time);
                setEndDate(format(end, 'yyyy-MM-dd'));
                setEndTime(format(end, 'HH:mm'));
            }
        }
    }, [isEditMode, existingEvent]);

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
            let imageUrl: string | null = existingEvent?.image_url || null;
            if (imageFile) {
                const filePath = `${user.id}/event-images/${Date.now()}-${imageFile.name}`;
                const { error: uploadError } = await supabase.storage.from('event-images').upload(filePath, imageFile, { upsert: true });
                if (uploadError) throw uploadError;
                imageUrl = supabase.storage.from('event-images').getPublicUrl(filePath).data.publicUrl;
            }

            const start_time = new Date(`${startDate}T${startTime}`).toISOString();
            let end_time: string | null = null;
            if (endDate && endTime) {
                end_time = new Date(`${endDate}T${endTime}`).toISOString();
            }

            if (isEditMode && existingEvent) {
                const { data, error: updateError } = await supabase
                    .from('events')
                    .update({
                        name, description, start_time, end_time, location, image_url: imageUrl
                    })
                    .eq('id', existingEvent.id)
                    .select('*, created_by:profiles!events_created_by_fkey(*)')
                    .single();

                if (updateError) throw updateError;
                onEventUpdated(data as CampusEvent);

            } else {
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

                const { data: newEventData, error: fetchError } = await supabase.rpc('get_campus_events', { p_campus: profile.campus }).eq('id', data).single();
                if (fetchError) throw fetchError;
                onEventCreated(newEventData as CampusEvent);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const canGoToStep = (targetStep: number) => {
        if (targetStep === 1) return true;
        if (targetStep === 2) return name.trim().length > 0;
        if (targetStep === 3) return name.trim().length > 0 && startDate && startTime;
        if (targetStep === 4) return name.trim().length > 0 && startDate && startTime;
        return false;
    };

    const goToNextStep = () => {
        if (step === 1 && name.trim().length > 0) setStep(2);
        else if (step === 2 && startDate && startTime) setStep(3);
        else if (step === 3) setStep(4);
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

    // In edit mode, show all fields at once
    if (isEditMode) {
        return (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-secondary-light dark:bg-secondary rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <form onSubmit={handleSubmit} className="p-6">
                        <header className="flex items-center justify-between pb-4 border-b border-tertiary-light dark:border-tertiary">
                            <h2 className="text-xl font-bold">Edit Event</h2>
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
                                        <img src={imagePreview} alt="Banner Preview" className="w-full h-full object-cover rounded-lg" />
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
                            <button type="submit" disabled={isSubmitting} className="py-2 px-6 rounded-full text-black bg-brand-green hover:bg-brand-green-darker disabled:opacity-50">
                                {isSubmitting ? <Spinner /> : 'Save Changes'}
                            </button>
                        </footer>
                    </form>
                </div>
            </div>
        );
    }
    
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-secondary-light dark:bg-secondary rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-8">
                    {/* Header */}
                    <header className="flex items-center justify-between pb-6">
                        <div>
                            <h2 className="text-2xl font-bold">Create an Event</h2>
                            <p className="text-sm text-text-tertiary-light dark:text-text-tertiary mt-1">
                                Step {step} of 4
                            </p>
                        </div>
                        <button type="button" onClick={onClose}>
                            <XCircleIcon className="w-8 h-8 text-text-tertiary-light dark:text-text-tertiary hover:text-text-primary-light dark:hover:text-text-primary" />
                        </button>
                    </header>

                    {/* Progress Bar */}
                    <div className="flex gap-2 mb-8">
                        {[1, 2, 3, 4].map((s) => (
                            <div
                                key={s}
                                className={`h-1.5 flex-1 rounded-full transition-all ${
                                    s <= step ? 'bg-brand-green' : 'bg-tertiary-light dark:bg-tertiary'
                                }`}
                            />
                        ))}
                    </div>

                    {/* Step Content */}
                    <div className="min-h-[300px]">
                        {/* Step 1: Event Name */}
                        {step === 1 && (
                            <div className="space-y-6 animate-fadeIn">
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">What's your event called?</h3>
                                    <p className="text-sm text-text-tertiary-light dark:text-text-tertiary mb-4">
                                        Choose a catchy name that tells people what it's about
                                    </p>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="e.g., Tech Talk: AI in Healthcare"
                                        className="w-full p-4 text-lg bg-tertiary-light dark:bg-tertiary rounded-lg border-2 border-transparent focus:border-brand-green outline-none transition-all"
                                        autoFocus
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 2: When */}
                        {step === 2 && (
                            <div className="space-y-6 animate-fadeIn">
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">When is it happening?</h3>
                                    <p className="text-sm text-text-tertiary-light dark:text-text-tertiary mb-4">
                                        Let people know when to show up
                                    </p>
                                    
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Start Date</label>
                                                <input
                                                    type="date"
                                                    value={startDate}
                                                    onChange={e => setStartDate(e.target.value)}
                                                    className="w-full p-3 bg-tertiary-light dark:bg-tertiary rounded-lg border-2 border-transparent focus:border-brand-green outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Start Time</label>
                                                <input
                                                    type="time"
                                                    value={startTime}
                                                    onChange={e => setStartTime(e.target.value)}
                                                    className="w-full p-3 bg-tertiary-light dark:bg-tertiary rounded-lg border-2 border-transparent focus:border-brand-green outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-tertiary-light dark:border-tertiary">
                                            <p className="text-sm text-text-tertiary-light dark:text-text-tertiary mb-3">
                                                When does it end? (optional)
                                            </p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium mb-2 text-text-tertiary-light dark:text-text-tertiary">End Date</label>
                                                    <input
                                                        type="date"
                                                        value={endDate}
                                                        onChange={e => setEndDate(e.target.value)}
                                                        className="w-full p-3 bg-tertiary-light dark:bg-tertiary rounded-lg border-2 border-transparent focus:border-brand-green outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium mb-2 text-text-tertiary-light dark:text-text-tertiary">End Time</label>
                                                    <input
                                                        type="time"
                                                        value={endTime}
                                                        onChange={e => setEndTime(e.target.value)}
                                                        className="w-full p-3 bg-tertiary-light dark:bg-tertiary rounded-lg border-2 border-transparent focus:border-brand-green outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Where & Details */}
                        {step === 3 && (
                            <div className="space-y-6 animate-fadeIn">
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Where and what?</h3>
                                    <p className="text-sm text-text-tertiary-light dark:text-text-tertiary mb-4">
                                        Add location and describe what to expect
                                    </p>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Location (optional)</label>
                                            <input
                                                type="text"
                                                value={location}
                                                onChange={e => setLocation(e.target.value)}
                                                placeholder="e.g., Library Auditorium, Room F-101"
                                                className="w-full p-3 bg-tertiary-light dark:bg-tertiary rounded-lg border-2 border-transparent focus:border-brand-green outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Description (optional)</label>
                                            <textarea
                                                value={description}
                                                onChange={e => setDescription(e.target.value)}
                                                rows={4}
                                                placeholder="What's this event about? What should people bring or know beforehand?"
                                                className="w-full p-3 bg-tertiary-light dark:bg-tertiary rounded-lg border-2 border-transparent focus:border-brand-green outline-none resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Banner */}
                        {step === 4 && (
                            <div className="space-y-6 animate-fadeIn">
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Add a banner image?</h3>
                                    <p className="text-sm text-text-tertiary-light dark:text-text-tertiary mb-4">
                                        Make your event stand out with a great image (optional)
                                    </p>
                                    
                                    <input type="file" ref={imageInputRef} onChange={handleFileChange} accept="image/*" hidden />
                                    
                                    {!imagePreview ? (
                                        <div
                                            onClick={() => imageInputRef.current?.click()}
                                            className="w-full aspect-[16/9] bg-tertiary-light dark:bg-tertiary rounded-xl border-2 border-dashed border-tertiary-light dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-brand-green/50 hover:bg-tertiary-light/50 dark:hover:bg-tertiary/50 transition-all group"
                                        >
                                            <CameraIcon className="w-16 h-16 mb-4 text-text-tertiary-light dark:text-text-tertiary group-hover:text-brand-green transition-colors" />
                                            <p className="text-lg font-medium">Click to upload an image</p>
                                            <p className="text-sm text-text-tertiary-light dark:text-text-tertiary mt-1">
                                                Or drag and drop here
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="relative group">
                                            <img 
                                                src={imagePreview} 
                                                alt="Banner Preview" 
                                                className="w-full aspect-[16/9] object-cover rounded-xl"
                                            />
                                            <div 
                                                onClick={() => imageInputRef.current?.click()}
                                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center cursor-pointer"
                                            >
                                                <div className="text-center text-white">
                                                    <CameraIcon className="w-12 h-12 mx-auto mb-2" />
                                                    <p className="font-medium">Change image</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-red-400 text-sm text-center">{error}</p>
                        </div>
                    )}

                    {/* Navigation */}
                    <footer className="flex justify-between items-center pt-8 mt-8 border-t border-tertiary-light dark:border-tertiary">
                        <button
                            type="button"
                            onClick={() => setStep(Math.max(1, step - 1))}
                            className={`py-2 px-6 rounded-full transition-all ${
                                step === 1
                                    ? 'opacity-0 pointer-events-none'
                                    : 'hover:bg-tertiary-light/60 dark:hover:bg-tertiary'
                            }`}
                        >
                            Back
                        </button>

                        <div className="flex gap-3">
                            {step < 4 ? (
                                <button
                                    type="button"
                                    onClick={goToNextStep}
                                    disabled={!canGoToStep(step + 1)}
                                    className="py-2 px-8 rounded-full text-black bg-brand-green hover:bg-brand-green-darker disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Continue
                                </button>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!imagePreview) {
                                                imageInputRef.current?.click();
                                            }
                                        }}
                                        className="py-2 px-6 rounded-full hover:bg-tertiary-light/60 dark:hover:bg-tertiary transition-all"
                                    >
                                        {imagePreview ? 'Skip' : 'Add Image'}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="py-2 px-8 rounded-full text-black bg-brand-green hover:bg-brand-green-darker disabled:opacity-50 transition-all"
                                    >
                                        {isSubmitting ? <Spinner /> : 'Create Event'}
                                    </button>
                                </>
                            )}
                        </div>
                    </footer>
                </form>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default CreateEventModal;