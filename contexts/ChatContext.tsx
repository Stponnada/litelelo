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
      // Step 1: Fetch all conversations with their last message and unread count.
      // This is the most reliable way to get the core data for all conversation types.
      const { data: initialConvos, error: rpcError } = await supabase.rpc('get_conversations_for_user_v2');
      if (rpcError) throw rpcError;

      const allConversations = (initialConvos as ConversationSummary[]) || [];

      // Step 2: Separate the conversations into DMs and Groups. Groups are already correct.
      const groupConversations = allConversations.filter(c => c.type === 'group');
      const dmsFromRpc = allConversations.filter(c => c.type === 'dm');
      const dmConversationIds = dmsFromRpc.map(c => c.conversation_id);

      let correctedDms: ConversationSummary[] = [];

      if (dmConversationIds.length > 0) {
        // Step 3: Fetch the *other* participant's profile for ALL DMs in a single, efficient query.
        // This is the key fix to solve the "User" name bug.
        const { data: otherParticipantsData, error: participantsError } = await supabase
          .from('conversation_participants')
          .select(`
            conversation_id,
            profiles!inner (
              user_id,
              username,
              full_name,
              avatar_url
            )
          `)
          .in('conversation_id', dmConversationIds)
          .neq('user_id', user.id); // Crucially, we only fetch the OTHER user's profile.

        if (participantsError) throw participantsError;

        // Step 4: Create a simple map for easy lookup: { conversation_id -> other_user_profile }
        const participantMap = new Map<string, Profile>();
        (otherParticipantsData || []).forEach((p: any) => {
          participantMap.set(p.conversation_id, p.profiles);
        });

        // Step 5: Rebuild the DM conversation summaries with the CORRECT participant data.
        correctedDms = dmsFromRpc.map(dm => {
          const otherUser = participantMap.get(dm.conversation_id);
          // If we can't find the other user for some reason, we skip this conversation.
          if (!otherUser) return null;

          return {
            ...dm, // Keep the last_message, unread_count, etc. from the RPC
            name: otherUser.full_name || otherUser.username, // Use the correct name
            participants: [otherUser], // The participants list should only contain the other person.
          };
        }).filter((c): c is ConversationSummary => c !== null); // Filter out any null/broken DMs
      }

      // Step 6: Combine the correct groups and the corrected DMs.
      // Sort them by the last message time so the most recent chats are always at the top.
      const finalConversationList = [...groupConversations, ...correctedDms].sort((a, b) => {
        if (!a.last_message_at) return 1;
        if (!b.last_message_at) return -1;
        return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
      });

      setConversations(finalConversationList);

    } catch (error) {
      console.error('Error fetching chat list:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [user]);


  useEffect(() => {
    if (user) fetchConversations();
  }, [user, fetchConversations]);

  // Real-time listener for new messages (no changes needed)
  useEffect(() => {
    if (!user) return;
    const handleNewMessage = (payload: any) => {
        const newMessage = payload.new;
        const convoExists = conversations.some(c => c.conversation_id === newMessage.conversation_id);

        if (!convoExists) {
            fetchConversations();
            return;
        }

        setConversations(prevConvos => {
            const convoIndex = prevConvos.findIndex(c => c.conversation_id === newMessage.conversation_id);
            if (convoIndex === -1) return prevConvos;

            const targetConvo = prevConvos[convoIndex];
            const updatedConvo = {
                ...targetConvo,
                last_message_content: newMessage.content || '[Attachment]',
                last_message_at: newMessage.created_at,
                last_message_sender_id: newMessage.sender_id,
                unread_count: newMessage.sender_id !== user.id 
                    ? (targetConvo.unread_count || 0) + 1 
                    : targetConvo.unread_count,
            };
            const newConvos = [
                updatedConvo,
                ...prevConvos.slice(0, convoIndex),
                ...prevConvos.slice(convoIndex + 1)
            ];
            return newConvos;
        });
    };
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, handleNewMessage)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations, conversations]);
  
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!user || conversationId.startsWith('placeholder_')) return;
    const convo = conversations.find(c => c.conversation_id === conversationId);
    if (!convo || convo.unread_count === 0) return;
    setConversations(prev => prev.map(c => 
      c.conversation_id === conversationId ? { ...c, unread_count: 0 } : c
    ));
    await supabase.rpc('mark_messages_as_read_for_convo', { p_conversation_id: conversationId });
  }, [user, conversations]);

  const totalUnreadCount = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);

  const updateConversationId = (placeholderId: string, newId: string) => {
    fetchConversations();
  };

  const value = { conversations, totalUnreadCount, loading, markConversationAsRead, fetchConversations, updateConversationId };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};