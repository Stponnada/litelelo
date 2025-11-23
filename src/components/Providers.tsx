'use client';

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { PostsProvider } from '@/contexts/PostsContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import Polyfill from './Polyfill';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Polyfill />
            <ThemeProvider>
                <AuthProvider>
                    <PostsProvider>
                        <ChatProvider>
                            <NotificationProvider>
                                {children}
                            </NotificationProvider>
                        </ChatProvider>
                    </PostsProvider>
                </AuthProvider>
            </ThemeProvider>
        </>
    );
}
