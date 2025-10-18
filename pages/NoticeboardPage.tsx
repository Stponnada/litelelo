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
        <div className="group relative break-inside-avoid-column bg-yellow-50 dark:bg-yellow-900/20 shadow-lg rounded-lg p-4 transition-transform duration-300 hover:-translate-y-1 hover:rotate-[-1deg]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <ThumbtackIcon className="w-6 h-6 text-red-500 transform -rotate-45" />
            </div>

            {isOwner && (
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button onClick={() => onEdit(notice)} className="p-1.5 bg-blue-600/80 text-white rounded-full"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                    <button onClick={() => onDelete(notice.id)} className="p-1.5 bg-red-600/80 text-white rounded-full"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
            )}

            <div className="relative mb-3">
                {currentFile ? (
                    <a href={currentFile.file_url} target="_blank" rel="noopener noreferrer" className="block">
                        {currentFile.file_type === 'image' ? (
                            <img src={currentFile.file_url} alt={notice.title} className="w-full h-auto rounded-md object-cover max-h-96" />
                        ) : (
                            <div className="flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-800 h-48 rounded-md text-gray-500 dark:text-gray-400">
                                <PdfIcon className="w-16 h-16" />
                                <span className="text-sm mt-2">View PDF</span>
                            </div>
                        )}
                    </a>
                ) : <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-md"></div>}
                {files.length > 1 && (
                    <>
                        <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1 rounded-full hover:bg-black/60"><BackIcon className="w-5 h-5"/></button>
                        <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1 rounded-full hover:bg-black/60"><ForwardIcon className="w-5 h-5"/></button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">{currentImageIndex + 1} / {files.length}</div>
                    </>
                )}
            </div>
            
            <h3 className="font-bold text-lg text-gray-800 dark:text-yellow-100 mb-2">{notice.title}</h3>
            {notice.description && <p className="text-sm text-gray-600 dark:text-yellow-200/80 mb-4">{notice.description}</p>}
            
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-yellow-300/70 pt-2 border-t border-gray-200 dark:border-yellow-900/50">
                <div className="flex items-center gap-2">
                    <img src={notice.profiles?.avatar_url || ''} alt={notice.profiles?.username} className="w-5 h-5 rounded-full" />
                    <span>@{notice.profiles?.username}</span>
                </div>
                <span>{formatTimestamp(notice.created_at)}</span>
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
        <div className="max-w-7xl mx-auto">
            {modalState.isOpen && profile && (
                <CreateNoticeModal 
                    campus={profile.campus!}
                    onClose={() => setModalState({ isOpen: false, noticeToEdit: null })}
                    onNoticeCreated={handleNoticeCreated}
                    onNoticeUpdated={handleNoticeUpdated}
                    existingNotice={modalState.noticeToEdit}
                />
            )}
            
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-text-main-light dark:text-text-main">Noticeboard</h1>
                    <p className="text-lg text-text-secondary-light dark:text-text-secondary">Announcements, posters, and more for {profile?.campus} campus.</p>
                </div>
                <button 
                    onClick={() => setModalState({ isOpen: true, noticeToEdit: null })}
                    className="bg-brand-green text-black font-bold py-2 px-6 rounded-full hover:bg-brand-green-darker"
                >
                    + Post a Notice
                </button>
            </header>

            {loading && <div className="text-center py-20"><Spinner /></div>}
            {error && <p className="text-center py-20 text-red-500">{error}</p>}
            
            {!loading && notices.length === 0 && (
                <div className="text-center py-20 bg-secondary-light dark:bg-secondary rounded-lg border-2 border-dashed border-tertiary-light dark:border-tertiary">
                    <ClipboardDocumentListIcon className="w-12 h-12 mx-auto text-text-tertiary-light dark:text-text-tertiary mb-4" />
                    <h3 className="text-xl font-bold">The noticeboard is empty!</h3>
                    <p className="text-text-secondary-light dark:text-text-secondary mt-2">Be the first to post something.</p>
                </div>
            )}

            {!loading && notices.length > 0 && (
                <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
                    {notices.map(notice => <NoticeCard key={notice.id} notice={notice} onDelete={handleDelete} onEdit={(n) => setModalState({ isOpen: true, noticeToEdit: n })} />)}
                </div>
            )}
        </div>
    );
};

export default NoticeboardPage;