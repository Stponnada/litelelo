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
      // Step 1: Use the RPC that gives us last message details.
      const { data: convosWithDetails, error: rpcError } = await supabase.rpc('get_conversations_for_user_v2');
      if (rpcError) throw rpcError;

      const conversationsFromRpc = (convosWithDetails as ConversationSummary[]) || [];
      const conversationIds = conversationsFromRpc.map(c => c.conversation_id);

      let finalSummaries: ConversationSummary[] = [];

      if (conversationIds.length > 0) {
        // Step 2: Fetch the correct participant data for all conversations.
        const { data: participantsData, error: participantsError } = await supabase
          .from('conversation_participants')
          .select(`conversation_id, profiles!inner(user_id, username, full_name, avatar_url)`)
          .in('conversation_id', conversationIds);

        if (participantsError) throw participantsError;

        // Step 3: Organize participant data into a map for easy lookup.
        const participantsMap = new Map<string, Profile[]>();
        (participantsData || []).forEach((p: any) => {
          if (!participantsMap.has(p.conversation_id)) {
            participantsMap.set(p.conversation_id, []);
          }
          // THE FIX: Ensure we always push to an array.
          if (p.profiles) {
            participantsMap.get(p.conversation_id)!.push(p.profiles);
          }
        });

        // Step 4: Rebuild the summaries with the correct participant data.
        finalSummaries = conversationsFromRpc.map(convo => {
          const participants = participantsMap.get(convo.conversation_id) || [];
          const otherParticipants = participants.filter(p => p.user_id !== user.id);
          
          let name = convo.name;
          if (convo.type === 'dm' && otherParticipants.length > 0) {
            name = otherParticipants[0].full_name || otherParticipants[0].username;
          }

          return {
            ...convo,
            name: name,
            participants: otherParticipants,
          };
        });
      }

      // Add back the placeholder logic for contacts without conversations.
      const { data: profiles, error: profilesError } = await supabase.rpc('get_directory_profiles');
      if (profilesError) throw profilesError;
      
      const contacts = (profiles as Profile[] || []).filter(p => p.is_following || p.is_followed_by);
      
      // THIS IS THE FIX for the "not iterable" error.
      // We ensure finalSummaries is an array before trying to map/filter it.
      const existingParticipantIds = new Set(
        (finalSummaries || []).flatMap(c => (c.participants || []).map(p => p.user_id))
      );

      const placeholderConversations = contacts
        .filter(contact => !existingParticipantIds.has(contact.user_id))
        .map(contact => ({
            conversation_id: `placeholder_${contact.user_id}`,
            type: 'dm' as const,
            name: contact.full_name,
            participants: [contact],
            last_message_content: "Start a conversation!",
            last_message_at: null,
            last_message_sender_id: null,
            unread_count: 0,
        }));
      
      const combinedList = [...finalSummaries, ...placeholderConversations];

      // Sort the final list
      combinedList.sort((a, b) => {
        if (!a.last_message_at) return 1;
        if (!b.last_message_at) return -1;
        return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
      });

      setConversations(combinedList);

    } catch (error) {
      console.error('Error fetching chat list:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  // All other functions and useEffects remain the same.
  useEffect(() => { if (user) fetchConversations() }, [user, fetchConversations]);
  useEffect(() => { /* ... Realtime listener ... */ }, [user, fetchConversations]);
  const markConversationAsRead = useCallback(async (conversationId: string) => { /* ... */ }, [user, fetchConversations]);
  const totalUnreadCount = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
  const updateConversationId = (placeholderId: string, newId: string) => { fetchConversations() };
  const value = { conversations, totalUnreadCount, loading, markConversationAsRead, fetchConversations, updateConversationId };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};