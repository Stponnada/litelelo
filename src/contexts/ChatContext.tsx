'use client';
// src/contexts/ChatContext.tsx

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { ConversationSummary, Profile, Message, ConversationParticipant } from '../types';

interface ChatContextType {
  conversations: ConversationSummary[];
  totalUnreadCount: number;
  loading: boolean;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  updateConversationId: (placeholderId: string, newId: string) => void;
  onlineUsers: Set<string>;
  fetchConversations: () => void;
  latestMessage: Message | null;
  togglePin: (conversationId: string) => Promise<void>;
  toggleArchive: (conversationId: string) => Promise<void>;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestMessage, setLatestMessage] = useState<Message | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const fetchConversations = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const { data: convosWithDetails, error: rpcError } = await supabase.rpc('get_conversations_for_user_v3');
      if (rpcError) throw rpcError;

      const conversationsFromRpc = convosWithDetails || [];
      const conversationIds = conversationsFromRpc.map((c: Record<string, unknown>) => c.conversation_id as string);

      let finalSummaries: ConversationSummary[] = [];

      if (conversationIds.length > 0) {
        const { data: participantsData, error: participantsError } = await supabase
          .from('conversation_participants')
          .select(`conversation_id, profiles!inner(user_id, username, full_name, avatar_url)`)
          .in('conversation_id', conversationIds);

        if (participantsError) throw participantsError;

        const participantsMap = new Map<string, ConversationParticipant[]>();
        (participantsData || []).forEach((p: { conversation_id: string; profiles: Partial<Profile> | Partial<Profile>[] }) => {
          if (!participantsMap.has(p.conversation_id)) {
            participantsMap.set(p.conversation_id, []);
          }
          if (p.profiles) {
            const profiles = Array.isArray(p.profiles) ? p.profiles : [p.profiles];
            participantsMap.get(p.conversation_id)!.push(...(profiles as ConversationParticipant[]));
          }
        });

        finalSummaries = conversationsFromRpc.map((convo: Record<string, unknown>) => {
          const participants = participantsMap.get(convo.conversation_id as string) || [];
          const otherParticipants = participants.filter(p => p.user_id !== user.id);

          let name = convo.name;
          if (convo.type === 'dm' && otherParticipants.length > 0) {
            name = otherParticipants[0].full_name || otherParticipants[0].username;
          }

          return { ...convo, name: name, participants: otherParticipants };
        });
      }

      const { data: directoryData, error: directoryError } = await supabase.rpc('get_unified_directory');
      if (directoryError) throw directoryError;

      const allProfiles = (directoryData || []).filter((item: Record<string, unknown>) => item.type === 'user');
      // Include anyone who is either followed by you OR follows you (to ensure mutual friends show up)
      const contacts = allProfiles.filter((p: Record<string, unknown>) => p.is_following || p.is_followed_by);
      const existingDmParticipantIds = new Set(
        (finalSummaries || [])
          .filter(c => c.type === 'dm')
          .flatMap(c => (c.participants || []).map(p => p.user_id))
      );

      const placeholderConversations = contacts
        .filter((contact: Record<string, unknown>) => !existingDmParticipantIds.has(contact.id as string))
        .map((contact: Record<string, unknown>) => ({
          conversation_id: `placeholder_${contact.id}`,
          type: 'dm' as const,
          name: contact.name,
          participants: [{
            user_id: contact.id,
            username: contact.username!,
            full_name: contact.name,
            avatar_url: contact.avatar_url
          }],
          last_message_content: "Start a conversation!",
          last_message_at: null,
          last_message_sender_id: null,
          unread_count: 0,
        }));

      const combinedList = [...finalSummaries, ...placeholderConversations];
      combinedList.sort((a, b) => {
        // 1. Pinned chats always first
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;

        // 2. Then by recency
        const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;

        if (timeA !== timeB) return timeB - timeA;

        // 3. If no messages, put placeholders at the end alphabetically
        return (a.name || '').localeCompare(b.name || '');
      });

      setConversations(combinedList);

    } catch (error) {
      console.error('Error fetching chat list:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]); // DEPENDENCY STABILIZED

  useEffect(() => {
    if (user?.id) fetchConversations();
  }, [user?.id, fetchConversations]); // DEPENDENCY STABILIZED

  // ... rest of subscriptions and presence logic (uses user.id which is stable) ...

  useEffect(() => {
    if (!user) return;
    const presenceChannel = supabase.channel('online-users');
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState();
        const userIds = new Set<string>();
        for (const id in newState) {
          (newState[id] as unknown as { user_id: string }[]).forEach(presence => {
            userIds.add(presence.user_id);
          });
        }
        setOnlineUsers(userIds);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          (newPresences as unknown as { user_id: string }[]).forEach(p => newSet.add(p.user_id));
          return newSet;
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          (leftPresences as unknown as { user_id: string }[]).forEach(p => newSet.delete(p.user_id));
          return newSet;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });
    return () => { supabase.removeChannel(presenceChannel); };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('chat-feed-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMessage = payload.new as unknown as Message;
          setLatestMessage(newMessage);
          setConversations(prev => {
            const convoIndex = prev.findIndex(c => c.conversation_id === newMessage.conversation_id);
            if (convoIndex === -1) {
              fetchConversations();
              return prev;
            }
            const conversationsCopy = [...prev];
            const updatedConvo = { ...conversationsCopy[convoIndex] };
            updatedConvo.last_message_content = newMessage.content;
            updatedConvo.last_message_encrypted_content = newMessage.encrypted_content;
            updatedConvo.last_message_encrypted_key_sender = newMessage.encrypted_key_sender;
            updatedConvo.last_message_encrypted_key_recipient = newMessage.encrypted_key_recipient;
            updatedConvo.last_message_encryption_version = newMessage.encryption_version;
            updatedConvo.last_message_at = newMessage.created_at;
            updatedConvo.last_message_sender_id = newMessage.sender_id;
            if (newMessage.sender_id !== user.id) {
              updatedConvo.unread_count = (updatedConvo.unread_count || 0) + 1;
            }
            conversationsCopy.splice(convoIndex, 1);
            return [updatedConvo, ...conversationsCopy];
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchConversations]);

  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!user?.id || conversationId.startsWith('placeholder_')) return;
    setConversations(prev =>
      prev.map(c => (c.conversation_id === conversationId ? { ...c, unread_count: 0 } : c))
    );
    const { error } = await supabase
      .from('conversation_read_timestamps')
      .upsert({
        conversation_id: conversationId,
        user_id: user.id,
        last_read_at: new Date().toISOString(),
      }, { onConflict: 'conversation_id, user_id' });
    if (error) {
      console.error('Failed to mark as read on backend:', error);
      fetchConversations();
    }
  }, [user, fetchConversations]);

  const totalUnreadCount = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);

  const updateConversationId = (placeholderId: string, newId: string) => {
    setConversations(prev => prev.map(c => c.conversation_id === placeholderId ? { ...c, conversation_id: newId } : c));
  };

  const togglePin = async (conversationId: string) => {
    if (!user?.id || conversationId.startsWith('placeholder_')) return;
    const convo = conversations.find(c => c.conversation_id === conversationId);
    if (!convo) return;

    const nextPinnedStatus = !convo.is_pinned;
    setConversations(prev => prev.map(c =>
      c.conversation_id === conversationId ? { ...c, is_pinned: nextPinnedStatus } : c
    ).sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return timeB - timeA;
    }));

    const { error } = await supabase
      .from('conversation_participants')
      .update({ is_pinned: nextPinnedStatus })
      .match({ conversation_id: conversationId, user_id: user?.id });

    if (error) console.error("Error toggling pin:", error);
  };

  const toggleArchive = async (conversationId: string) => {
    if (!user?.id || conversationId.startsWith('placeholder_')) return;
    const convo = conversations.find(c => c.conversation_id === conversationId);
    if (!convo) return;

    const nextArchivedStatus = !convo.is_archived;
    setConversations(prev => prev.map(c =>
      c.conversation_id === conversationId ? { ...c, is_archived: nextArchivedStatus } : c
    ));

    const { error } = await supabase
      .from('conversation_participants')
      .update({ is_archived: nextArchivedStatus })
      .match({ conversation_id: conversationId, user_id: user?.id });

    if (error) console.error("Error toggling archive:", error);
  };

  const value = {
    conversations,
    totalUnreadCount,
    loading,
    markConversationAsRead,
    fetchConversations,
    updateConversationId,
    latestMessage,
    onlineUsers,
    togglePin,
    toggleArchive
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};