// src/components/NotificationPanel.tsx

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { Notification as NotificationType } from '../types';
import Spinner from './Spinner';
import { formatTimestamp } from '../utils/timeUtils';

interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotificationItem: React.FC<{ notification: NotificationType, onClose: () => void }> = ({ notification, onClose }) => {
    const navigate = useNavigate();
    
    let text = '';
    let link = '/';

    switch(notification.type) {
        case 'like':
            text = 'liked your post.';
            link = `/post/${notification.entity_id}`;
            break;
        case 'comment':
            text = 'commented on your post.';
            link = `/post/${notification.entity_id}`;
            break;
        case 'follow':
            text = 'started following you.';
            link = `/profile/${notification.actor.username}`;
            break;
        case 'mention':
            text = 'mentioned you in a post.';
            link = `/post/${notification.entity_id}`;
            break;
        case 'community_join_request':
            text = 'requested to join a community you manage.';
            link = `/communities/${notification.entity_id}/members`;
            break;
        // --- THIS IS THE FIX ---
        case 'new_message':
            text = 'sent you a message.';
            link = `/chat`; // Navigate to the main chat page
            break;
        // -----------------------
        case 'bits_coin_claim':
            text = 'claimed your Bits-coin request.';
            link = `/campus/bits-coin`; // Or a specific link if available
            break;
        default:
            text = 'sent you a notification.';
    }

    const handleClick = () => {
        navigate(link);
        onClose();
    };

    return (
        <div onClick={handleClick} className="p-3 flex items-start gap-3 hover:bg-tertiary-light/50 dark:hover:bg-tertiary/50 cursor-pointer transition-colors relative">
            {!notification.is_read && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>}
            <img
              src={notification.actor.avatar_url || `https://ui-avatars.com/api/?name=${notification.actor.full_name || notification.actor.username}&background=random&color=fff&bold=true`}
              alt={notification.actor.username}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0 ml-3 bg-tertiary"
            />
            <div className="flex-1">
                <p className="text-sm text-text-secondary-light dark:text-text-secondary">
                    <span className="font-bold text-text-main-light dark:text-text-main">{notification.actor.full_name}</span> {text}
                </p>
                <p className="text-xs text-text-tertiary-light dark:text-text-tertiary mt-1">{formatTimestamp(notification.created_at)}</p>
            </div>
        </div>
    );
};

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
    const { notifications, loading, markAsRead, unreadCount } = useNotifications();
    const panelRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && unreadCount > 0) {
            const timer = setTimeout(() => {
                const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
                if (unreadIds.length > 0) {
                    markAsRead(unreadIds);
                }
            }, 2000); // Mark as read after 2 seconds of being open
            return () => clearTimeout(timer);
        }
    }, [isOpen, unreadCount, notifications, markAsRead]);

    if (!isOpen) return null;

    return (
        <div
            ref={panelRef}
            onClick={onClose}
            className="absolute top-full right-0 mt-3 w-80 md:w-96 bg-secondary-light dark:bg-secondary rounded-xl shadow-2xl border border-tertiary-light dark:border-tertiary animate-fadeIn origin-top-right"
        >
            <div className="p-4 border-b border-tertiary-light dark:border-tertiary">
                <h3 className="font-bold text-lg">Notifications</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {loading ? (
                    <div className="p-8 flex justify-center"><Spinner /></div>
                ) : notifications.length === 0 ? (
                    <p className="p-8 text-center text-sm text-text-tertiary-light dark:text-text-tertiary">You're all caught up!</p>
                ) : (
                    <div className="divide-y divide-tertiary-light/50 dark:divide-tertiary/50">
                        {notifications.map(n => <NotificationItem key={n.id} notification={n} onClose={onClose} />)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationPanel;