// src/pages/NoticeboardPage.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { CampusNotice, Profile } from '../types';
import Spinner from '../components/Spinner';
import CreateNoticeModal from '../components/CreateNoticeModal';
import { Link } from 'react-router-dom';
import { formatTimestamp } from '../utils/timeUtils';
import { ClipboardDocumentListIcon } from '../components/icons';

const BackIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ForwardIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const ThumbtackIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
    </svg>
);

const PdfIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm-6.5-2h1v-1h-1v1zm4.5 0h1v-1h-1v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z"/>
    </svg>
);

const NoticeCard: React.FC<{ notice: CampusNotice, onDelete: (id: string) => void, onEdit: (notice: CampusNotice) => void }> = ({ notice, onDelete, onEdit }) => {
    const { user } = useAuth();
    const isOwner = user?.id === notice.user_id;
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const files = notice.files || [];

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation(); e.preventDefault();
        setCurrentImageIndex(prev => (prev + 1) % files.length);
    };
    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation(); e.preventDefault();
        setCurrentImageIndex(prev => (prev - 1 + files.length) % files.length);
    };

    const currentFile = files[currentImageIndex];

    return (
        <div className="group relative break-inside-avoid-column bg-gradient-to-br from-yellow-50 to-amber-50/80 dark:from-yellow-900/20 dark:to-amber-900/10 shadow-lg rounded-2xl p-5 transition-all duration-300 hover:-translate-y-2 hover:rotate-[-0.5deg] hover:shadow-2xl border-2 border-yellow-200/50 dark:border-yellow-800/50 hover:border-yellow-400">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-400/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            
            {/* Enhanced Thumbtack */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 drop-shadow-lg">
                <ThumbtackIcon className="w-8 h-8 text-red-500 transform -rotate-45 group-hover:rotate-[-30deg] transition-transform duration-300" />
            </div>

            {isOwner && (
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button 
                        onClick={() => onEdit(notice)} 
                        className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all hover:scale-110 shadow-lg"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                    <button 
                        onClick={() => onDelete(notice.id)} 
                        className="p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all hover:scale-110 shadow-lg"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Image/PDF Section */}
            <div className="relative mb-4 mt-2">
                {currentFile ? (
                    <a href={currentFile.file_url} target="_blank" rel="noopener noreferrer" className="block group/image">
                        {currentFile.file_type === 'image' ? (
                            <div className="relative overflow-hidden rounded-xl">
                                <img 
                                    src={currentFile.file_url} 
                                    alt={notice.title} 
                                    className="w-full h-auto rounded-xl object-cover max-h-96 transition-transform duration-500 group-hover/image:scale-105" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300"></div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-gray-800 dark:to-gray-700 h-48 rounded-xl text-amber-700 dark:text-yellow-400 border-2 border-dashed border-amber-300 dark:border-yellow-600 group-hover/image:border-solid transition-all">
                                <PdfIcon className="w-16 h-16 group-hover/image:scale-110 transition-transform duration-300" />
                                <span className="text-sm font-bold mt-2">Click to View PDF</span>
                            </div>
                        )}
                    </a>
                ) : (
                    <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600"></div>
                )}
                
                {files.length > 1 && (
                    <>
                        <button 
                            onClick={prevImage} 
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/80 transition-all hover:scale-110"
                        >
                            <BackIcon className="w-5 h-5"/>
                        </button>
                        <button 
                            onClick={nextImage} 
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/80 transition-all hover:scale-110"
                        >
                            <ForwardIcon className="w-5 h-5"/>
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
                            {currentImageIndex + 1} / {files.length}
                        </div>
                    </>
                )}
            </div>
            
            {/* Content */}
            <div className="relative z-10">
                <h3 className="font-bold text-xl text-gray-800 dark:text-yellow-100 mb-2 line-clamp-2 group-hover:text-amber-700 dark:group-hover:text-yellow-300 transition-colors">
                    {notice.title}
                </h3>
                {notice.description && (
                    <p className="text-sm text-gray-600 dark:text-yellow-200/80 mb-4 line-clamp-3 leading-relaxed">
                        {notice.description}
                    </p>
                )}
                
                {/* Footer */}
                <div className="flex items-center justify-between text-xs pt-3 border-t-2 border-yellow-200 dark:border-yellow-900/50">
                    <Link 
                        to={`/profile/${notice.profiles?.username}`}
                        className="flex items-center gap-2 group/user"
                    >
                        <div className="relative">
                            <img 
                                src={notice.profiles?.avatar_url || ''} 
                                alt={notice.profiles?.username} 
                                className="w-6 h-6 rounded-full ring-2 ring-yellow-300 dark:ring-yellow-700 group-hover/user:ring-amber-500 transition-all"
                            />
                        </div>
                        <span className="font-semibold text-gray-700 dark:text-yellow-300 group-hover/user:text-amber-600 dark:group-hover/user:text-yellow-400 transition-colors">
                            @{notice.profiles?.username}
                        </span>
                    </Link>
                    <span className="text-gray-500 dark:text-yellow-400/70 font-medium">
                        {formatTimestamp(notice.created_at)}
                    </span>
                </div>
            </div>
        </div>
    );
};

const NoticeboardPage: React.FC = () => {
    const { profile } = useAuth();
    const [notices, setNotices] = useState<CampusNotice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalState, setModalState] = useState<{ isOpen: boolean, noticeToEdit: CampusNotice | null }>({ isOpen: false, noticeToEdit: null });

    const fetchNotices = async () => {
        if (!profile?.campus) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_campus_notices_with_files', { p_campus: profile.campus });
            if (error) throw error;
            setNotices(data as any[] || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchNotices();
    }, [profile?.campus]);

    const handleNoticeCreated = (newNotice: CampusNotice) => {
        setNotices(prev => [newNotice, ...prev]);
        setModalState({ isOpen: false, noticeToEdit: null });
    };

    const handleNoticeUpdated = (updatedNotice: CampusNotice) => {
        setNotices(prev => prev.map(n => n.id === updatedNotice.id ? updatedNotice : n));
        setModalState({ isOpen: false, noticeToEdit: null });
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this notice? This action is permanent.")) return;
        
        const originalNotices = [...notices];
        setNotices(prev => prev.filter(n => n.id !== id));

        try {
            const { error } = await supabase.rpc('delete_notice', { p_notice_id: id });
            if (error) throw error;
        } catch (err: any) {
            console.error("Failed to delete notice:", err);
            setNotices(originalNotices);
        }
    };
    
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {modalState.isOpen && profile && (
                <CreateNoticeModal 
                    campus={profile.campus!}
                    onClose={() => setModalState({ isOpen: false, noticeToEdit: null })}
                    onNoticeCreated={handleNoticeCreated}
                    onNoticeUpdated={handleNoticeUpdated}
                    existingNotice={modalState.noticeToEdit}
                />
            )}
            
            {/* Enhanced Header Section */}
            <header className="mb-10 relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-transparent dark:from-yellow-500/10 dark:via-amber-500/5 p-8 border border-yellow-500/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -ml-24 -mb-24"></div>
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl shadow-lg">
                                    <ClipboardDocumentListIcon className="w-8 h-8 text-white" />
                                </div>
                                <h1 className="text-5xl font-extrabold text-text-main-light dark:text-text-main bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent">
                                    Noticeboard
                                </h1>
                            </div>
                            <p className="text-lg text-text-secondary-light dark:text-text-secondary max-w-xl">
                                Campus announcements, event posters, and important notices
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-3 py-1.5 rounded-full border border-yellow-500/30">
                                    <ThumbtackIcon className="w-4 h-4" />
                                    <span className="font-semibold">{notices.length} Active Notices</span>
                                </div>
                                <div className="flex items-center gap-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-full border border-amber-500/30">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <span className="font-semibold">{profile?.campus || 'Campus'}</span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setModalState({ isOpen: true, noticeToEdit: null })}
                            className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold py-4 px-8 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2 group whitespace-nowrap"
                        >
                            <span className="text-2xl group-hover:rotate-90 transition-transform duration-200">+</span>
                            <span>Post Notice</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Content Section */}
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
                    <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
                </div>
            )}
            
            {!loading && notices.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 bg-gradient-to-br from-yellow-50 to-amber-50/50 dark:from-yellow-900/10 dark:to-amber-900/5 rounded-2xl border-2 border-dashed border-yellow-200 dark:border-yellow-800">
                    <div className="inline-block p-6 bg-yellow-500/10 rounded-full mb-4">
                        <ClipboardDocumentListIcon className="w-16 h-16 text-yellow-500 opacity-50" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-yellow-100 mb-2">The noticeboard is empty!</h3>
                    <p className="text-gray-600 dark:text-yellow-200/70">Be the first to post something.</p>
                </div>
            )}

            {!loading && notices.length > 0 && (
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-1 w-12 bg-yellow-500 rounded-full"></div>
                        <h2 className="text-2xl font-bold text-text-main-light dark:text-text-main">
                            Pinned Notices
                        </h2>
                    </div>
                    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
                        {notices.map(notice => (
                            <NoticeCard 
                                key={notice.id} 
                                notice={notice} 
                                onDelete={handleDelete} 
                                onEdit={(n) => setModalState({ isOpen: true, noticeToEdit: n })} 
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NoticeboardPage;