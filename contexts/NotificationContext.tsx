// src/contexts/NotificationContext.tsx

import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Notification as NotificationType } from '../types';

interface NotificationContextType {
    notifications: NotificationType[];
    unreadCount: number;
    loading: boolean;
    markAsRead: (notificationIds: string[]) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<NotificationType[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
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
    }, [user]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                async (payload) => {
                    // We need to fetch the actor profile manually for the new notification
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
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const markAsRead = useCallback(async (notificationIds: string[]) => {
        if (notificationIds.length === 0) return;
        
        // Optimistic update
        setNotifications(prev => 
            prev.map(n => notificationIds.includes(n.id) ? { ...n, is_read: true } : n)
        );

        const { error } = await supabase.rpc('mark_notifications_as_read', { notification_ids: notificationIds });
        if (error) {
            console.error("Failed to mark notifications as read:", error);
            // Revert on error
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