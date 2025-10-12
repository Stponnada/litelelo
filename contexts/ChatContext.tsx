// src/contexts/ChatContext.tsx

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { ConversationSummary, Profile } from '../types';

interface ChatContextType {
  conversations: ConversationSummary[];
  totalUnreadCount: number;
  loading: boolean;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  updateConversationId: (placeholderId: string, newId: string) => void;
  fetchConversations: () => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const { data: convosWithDetails, error: rpcError } = await supabase.rpc('get_conversations_for_user_v2');
      if (rpcError) throw rpcError;

      const conversationsFromRpc = (convosWithDetails as ConversationSummary[]) || [];
      const conversationIds = conversationsFromRpc.map(c => c.conversation_id);

      let finalSummaries: ConversationSummary[] = [];

      if (conversationIds.length > 0) {
        const { data: participantsData, error: participantsError } = await supabase
          .from('conversation_participants')
          .select(`conversation_id, profiles!inner(user_id, username, full_name, avatar_url)`)
          .in('conversation_id', conversationIds);

        if (participantsError) throw participantsError;

        const participantsMap = new Map<string, Profile[]>();
        (participantsData || []).forEach((p: any) => {
          if (!participantsMap.has(p.conversation_id)) {
            participantsMap.set(p.conversation_id, []);
          }
          if (p.profiles) {
            participantsMap.get(p.conversation_id)!.push(p.profiles);
          }
        });

        finalSummaries = conversationsFromRpc.map(convo => {
          const participants = participantsMap.get(convo.conversation_id) || [];
          const otherParticipants = participants.filter(p => p.user_id !== user.id);
          
          let name = convo.name;
          if (convo.type === 'dm' && otherParticipants.length > 0) {
            name = otherParticipants[0].full_name || otherParticipants[0].username;
          }

          return { ...convo, name: name, participants: otherParticipants };
        });
      }

      const { data: profiles, error: profilesError } = await supabase.rpc('get_directory_profiles');
      if (profilesError) throw profilesError;
      
      const contacts = (profiles as Profile[] || []).filter(p => p.is_following || p.is_followed_by);
      
      const existingParticipantIds = new Set(
        (finalSummaries || []).flatMap(c => (c.participants || []).map(p => p.user_id))
      );

      const placeholderConversations = contacts
        .filter(contact => !existingParticipantIds.has(contact.user_id))
        .map(contact => ({
            conversation_id: `placeholder_${contact.user_id}`, type: 'dm' as const, name: contact.full_name,
            participants: [contact], last_message_content: "Start a conversation!", last_message_at: null,
            last_message_sender_id: null, unread_count: 0,
        }));
      
      const combinedList = [...finalSummaries, ...placeholderConversations];

      combinedList.sort((a, b) => {
        if (!a.last_message_at) return 1; if (!b.last_message_at) return -1;
        return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
      });

      setConversations(combinedList);

    } catch (error) {
      console.error('Error fetching chat list:', error); setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  useEffect(() => { if (user) fetchConversations() }, [user, fetchConversations]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, 
      (payload) => {
        const newMessage = payload.new as { conversation_id: string };
        const isParticipant = conversations.some(c => c.conversation_id === newMessage.conversation_id);
        if (isParticipant) {
          fetchConversations();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, conversations, fetchConversations]);
  
  // --- THIS IS THE FIX ---
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!user?.id || conversationId.startsWith('placeholder_')) return;

    // Optimistic UI update for immediate feedback
    setConversations(prev =>
        prev.map(c => (c.conversation_id === conversationId ? { ...c, unread_count: 0 } : c))
    );

    // Update the backend
    const { error } = await supabase
      .from('conversation_read_timestamps')
      .upsert({
        conversation_id: conversationId,
        user_id: user.id,
        last_read_at: new Date().toISOString(),
      }, { onConflict: 'conversation_id, user_id' });

    if (error) {
      console.error('Failed to mark as read on backend:', error);
      // If the backend fails, refetch to revert the optimistic update
      fetchConversations();
    }
  }, [user, fetchConversations]);
  
  const totalUnreadCount = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
  
  const updateConversationId = (placeholderId: string, newId: string) => {
    setConversations(prev => prev.map(c => c.conversation_id === placeholderId ? { ...c, conversation_id: newId } : c));
    fetchConversations(); // Refetch to get the proper conversation details
  };

  const value = { conversations, totalUnreadCount, loading, markConversationAsRead, fetchConversations, updateConversationId };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};