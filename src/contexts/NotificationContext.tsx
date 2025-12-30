'use client';
// src/contexts/NotificationContext.tsx

import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Notification as NotificationType, NotificationType as NotificationTypeEnum } from '../types';
import { useRouter } from 'next/navigation';

interface NotificationContextType {
    notifications: NotificationType[];
    unreadCount: number;
    loading: boolean;
    markAsRead: (notificationIds: string[]) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const getNotificationDetails = (notification: NotificationType) => {
    let text = '';
    let link = '/';

    switch (notification.type) {
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
        case 'community_added':
            text = 'added you to a community.';
            link = `/communities/${notification.entity_id}`;
            break;
        case 'friend_request':
            text = 'sent you a friend request.';
            link = `/profile/${notification.actor.username}`;
            break;
        case 'new_message':
            text = 'sent you a message.';
            link = `/chat`;
            break;
        case 'bits_coin_claim':
            text = 'claimed your Bits-coin request.';
            link = `/campus/bits-coin`;
            break;
        case 'new_post':
            text = 'shared a new post.';
            link = `/post/${notification.entity_id}`;
            break;
        case 'repost':
            text = 'reposted your post.';
            link = `/post/${notification.entity_id}`;
            break;
        default:
            text = `sent you a ${notification.type} notification.`;
            if (notification.entity_type === 'post') link = `/post/${notification.entity_id}`;
            else if (notification.entity_type === 'user') link = `/profile/${notification.actor.username}`;
            else if (notification.entity_type === 'community') link = `/communities/${notification.entity_id}`;
            else link = '/';
    }
    return { text, link };
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<NotificationType[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_my_notifications');
            if (error) throw error;
            setNotifications(data as NotificationType[] || []);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Request notification permission
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    }, []);

    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('notifications-channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                async (payload) => {
                    const { data: actorProfile, error } = await supabase.from('profiles').select('*').eq('user_id', payload.new.actor_id).single();
                    if (error) {
                        console.error("Error fetching actor for new notification:", error);
                        return;
                    }
                    const newNotification = {
                        ...payload.new,
                        actor: {
                            user_id: actorProfile.user_id,
                            username: actorProfile.username,
                            full_name: actorProfile.full_name,
                            avatar_url: actorProfile.avatar_url,
                        }
                    } as NotificationType;

                    setNotifications(prev => [newNotification, ...prev]);

                    // SHOW BROWSER NOTIFICATION
                    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                        const { text, link } = getNotificationDetails(newNotification);
                        const n = new Notification('litelelo.', {
                            body: `${newNotification.actor.full_name || newNotification.actor.username} ${text}`,
                            icon: newNotification.actor.avatar_url || '/icon.png',
                            tag: newNotification.id, // Prevent duplicate notifications
                        });

                        n.onclick = (e) => {
                            e.preventDefault();
                            window.focus();
                            router.push(link);
                            n.close();
                        };
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, router]);

    const markAsRead = useCallback(async (notificationIds: string[]) => {
        if (notificationIds.length === 0) return;

        setNotifications(prev =>
            prev.map(n => notificationIds.includes(n.id) ? { ...n, is_read: true } : n)
        );

        const { error } = await supabase.rpc('mark_notifications_as_read', { notification_ids: notificationIds });
        if (error) {
            console.error("Failed to mark notifications as read:", error);
            fetchNotifications();
        }
    }, [fetchNotifications]);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const value = { notifications, unreadCount, loading, markAsRead };

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};