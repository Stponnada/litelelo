import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { PhotoIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
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

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
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
                    .from('post-images')
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
        <div className="fixed inset-0 z-50 bg-white dark:bg-[#0a0a0a] overflow-y-auto">
            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
                    >
                        <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Back</span>
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !title.trim() || !content.trim()}
                            className="px-6 py-2.5 bg-brand-green text-white font-semibold rounded-full hover:bg-brand-green-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-green/20 hover:shadow-xl hover:shadow-brand-green/30"
                        >
                            {loading ? 'Publishing...' : 'Publish'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Cover Image Section */}
                    <div className="space-y-4">
                        {imagePreview ? (
                            <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden group">
                                <Image
                                    src={imagePreview}
                                    alt="Cover preview"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                                    >
                                        Change Image
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full aspect-[21/9] rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-green dark:hover:border-brand-green flex flex-col items-center justify-center gap-3 transition-all hover:bg-gray-50 dark:hover:bg-white/5 group"
                            >
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center group-hover:bg-brand-green/10 transition-colors">
                                    <PhotoIcon className="w-8 h-8 text-gray-400 dark:text-gray-500 group-hover:text-brand-green transition-colors" />
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 group-hover:text-brand-green transition-colors">
                                        Add a cover image
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                        Make your story stand out with a stunning visual
                                    </p>
                                </div>
                            </button>
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
                            placeholder="Give your story a captivating title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-transparent text-4xl md:text-5xl font-black text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 border-none focus:ring-0 p-0 leading-tight"
                            autoFocus
                        />
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200 dark:border-gray-800"></div>

                    {/* Content Input */}
                    <div>
                        <textarea
                            placeholder="Tell your story...

Write freely. Use line breaks to create paragraphs. Share your thoughts, experiences, and insights with the community."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full min-h-[500px] bg-transparent text-xl text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-700 border-none focus:ring-0 p-0 resize-none leading-relaxed font-serif"
                            style={{ lineHeight: '1.8' }}
                        />
                    </div>
                </form>

                {/* Writing Tips */}
                <div className="mt-16 p-6 bg-gradient-to-br from-brand-green/5 to-blue-500/5 dark:from-brand-green/10 dark:to-blue-500/10 rounded-2xl border border-brand-green/20 dark:border-brand-green/30">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                        ✨ Writing Tips
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li className="flex items-start gap-2">
                            <span className="text-brand-green mt-0.5">•</span>
                            <span>Start with a hook that grabs attention</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-green mt-0.5">•</span>
                            <span>Break up long paragraphs for better readability</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-green mt-0.5">•</span>
                            <span>Use a conversational tone to connect with readers</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand-green mt-0.5">•</span>
                            <span>End with a thought-provoking conclusion</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
