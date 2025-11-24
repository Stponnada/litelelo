import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

interface CreateBlogModalProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    onSuccess: () => void;
}

export default function CreateBlogModal({ isOpen, onClose, communityId, onSuccess }: CreateBlogModalProps) {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim() || !user) return;

        setLoading(true);
        try {
            let imageUrl = null;

            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${user.id}/blog-images/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('post-images') // Reusing post-images bucket
                    .upload(filePath, imageFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('post-images')
                    .getPublicUrl(filePath);

                imageUrl = publicUrl;
            }

            const { error } = await supabase.rpc('create_blog_post', {
                p_community_id: communityId,
                p_title: title.trim(),
                p_content: content.trim(),
                p_image_url: imageUrl
            });

            if (error) throw error;

            onSuccess();
            onClose();
            setTitle('');
            setContent('');
            setImageFile(null);
            setImagePreview(null);
        } catch (error) {
            console.error('Error creating blog:', error);
            alert('Failed to create blog post. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-surface-light dark:bg-surface w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-border-light dark:border-border flex justify-between items-center">
                    <h2 className="text-xl font-bold text-text-main-light dark:text-text-main">Write a Blog</h2>
                    <button onClick={onClose} className="p-2 hover:bg-hover-light dark:hover:bg-hover rounded-full transition-colors">
                        <XMarkIcon className="w-6 h-6 text-text-secondary-light dark:text-text-secondary" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Image Upload */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative w-full h-48 rounded-xl border-2 border-dashed border-border-light dark:border-border flex flex-col items-center justify-center cursor-pointer hover:bg-hover-light dark:hover:bg-hover transition-colors overflow-hidden ${imagePreview ? 'border-none' : ''}`}
                    >
                        {imagePreview ? (
                            <Image src={imagePreview} alt="Preview" fill className="object-cover" unoptimized />
                        ) : (
                            <>
                                <PhotoIcon className="w-12 h-12 text-text-tertiary-light dark:text-text-tertiary mb-2" />
                                <span className="text-sm text-text-tertiary-light dark:text-text-tertiary">Add Cover Image</span>
                            </>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>

                    {/* Title Input */}
                    <div>
                        <input
                            type="text"
                            placeholder="Headline"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-transparent text-3xl font-bold text-text-main-light dark:text-text-main placeholder-text-tertiary-light dark:placeholder-text-tertiary border-none focus:ring-0 p-0"
                            maxLength={100}
                        />
                    </div>

                    {/* Content Input */}
                    <div className="flex-1">
                        <textarea
                            placeholder="Write your story..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-64 bg-transparent text-lg text-text-main-light dark:text-text-main placeholder-text-tertiary-light dark:placeholder-text-tertiary border-none focus:ring-0 p-0 resize-none"
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className="p-4 border-t border-border-light dark:border-border flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-text-secondary-light dark:text-text-secondary hover:bg-hover-light dark:hover:bg-hover rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !title.trim() || !content.trim()}
                        className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Publishing...' : 'Publish'}
                    </button>
                </div>
            </div>
        </div>
    );
}
