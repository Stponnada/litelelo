// src/components/Conversation.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { ConversationSummary, Message, Profile } from '../types';
import Spinner from './Spinner';
import { SendIcon, UserGroupIcon } from './icons';

// Simple Back Icon
const BackIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

interface ConversationProps {
  conversation: ConversationSummary;
  onBack?: () => void;
  // This will be needed to handle creating a new chat from a "placeholder"
  onConversationCreated: (placeholderId: string, newConversationId: string) => void;
}

const Conversation: React.FC<ConversationProps> = ({ conversation, onBack, onConversationCreated }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // This state will hold the real conversation ID once it's created
    const [currentConversationId, setCurrentConversationId] = useState(conversation.conversation_id);
    
    const otherParticipant = conversation.type === 'dm'
      ? conversation.participants.find(p => p.user_id !== user?.id)
      : null;

    useEffect(() => {
        if (!user || currentConversationId.startsWith('placeholder_')) {
            setMessages([]);
            setLoading(false);
            return;
        }

        const fetchMessages = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('messages')
                .select('*, profiles:sender_id (*)')
                .eq('conversation_id', currentConversationId)
                .order('created_at', { ascending: true });

            if (error) console.error("Error fetching messages:", error);
            else setMessages(data as unknown as Message[]);
            
            setLoading(false);
        };

        fetchMessages();
    }, [currentConversationId, user]);
    
    useEffect(() => {
        if (!user || currentConversationId.startsWith('placeholder_')) return;

        const channel = supabase.channel(`conversation:${currentConversationId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages', 
                filter: `conversation_id=eq.${currentConversationId}` 
            }, async (payload) => {
                const newMsgRaw = payload.new;
                
                // Don't add our own messages via subscription
                if (newMsgRaw.sender_id === user.id) return;
                
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', newMsgRaw.sender_id)
                    .single();

                const newMsg: Message = {
                    ...newMsgRaw,
                    profiles: profile as Profile
                };

                setMessages((prev) => [...prev, newMsg]);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [currentConversationId, user]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newMessage.trim()) return;

        setIsSending(true);
        let convId = currentConversationId;

        try {
            // If it's a placeholder, we must first create the real conversation
            if (convId.startsWith('placeholder_') && otherParticipant) {
                const { data: newConversationId, error: rpcError } = await supabase
                    .rpc('create_dm_conversation', { recipient_id: otherParticipant.user_id });

                if (rpcError) throw rpcError;
                
                convId = newConversationId; // Use the new ID for this message
                onConversationCreated(conversation.conversation_id, newConversationId);
                setCurrentConversationId(newConversationId); // Update state for future fetches
            }

            const messageContent = newMessage.trim();
            setNewMessage('');

            const { data: sentMessage, error } = await supabase.from('messages').insert({
                conversation_id: convId,
                sender_id: user.id,
                content: messageContent,
                message_type: 'text'
            }).select('*, profiles:sender_id (*)').single();

            if (error) throw error;
            
            // Add our own sent message to the UI
            setMessages(prev => [...prev, sentMessage as unknown as Message]);

        } catch (err) { 
            console.error("Failed to send message:", err);
            alert("Failed to send message.");
        } finally { 
            setIsSending(false); 
        }
    };

    const renderHeader = () => {
      if (conversation.type === 'group') {
        return (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-tertiary flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6 text-brand-green" />
            </div>
            <h3 className="font-bold text-lg text-text-main-light dark:text-text-main truncate">{conversation.name}</h3>
          </div>
        );
      }
      
      if (otherParticipant) {
        return (
          <Link to={`/profile/${otherParticipant.username}`} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <img src={otherParticipant.avatar_url || `https://ui-avatars.com/api/?name=${otherParticipant.full_name}`} alt={otherParticipant.username} className="w-10 h-10 rounded-full object-cover" />
              <div>
                  <h3 className="font-bold text-lg text-text-main-light dark:text-text-main truncate">{otherParticipant.full_name}</h3>
                  <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">@{otherParticipant.username}</p>
              </div>
          </Link>
        );
      }
      return null;
    };
    
    return (
        <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shrink-0">
                {onBack && (
                    <button onClick={onBack} className="md:hidden p-1 text-text-secondary dark:text-text-secondary hover:text-text-main dark:hover:text-text-main">
                        <BackIcon />
                    </button>
                )}
                {renderHeader()}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                {loading ? (
                    <div className="flex justify-center pt-10"><Spinner /></div>
                ) : (
                    messages.map((msg) => {
                        const isOwn = msg.sender_id === user?.id;
                        return (
                            <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                {!isOwn && msg.profiles && (
                                    <img 
                                        src={msg.profiles.avatar_url || `https://ui-avatars.com/api/?name=${msg.profiles.username}`} 
                                        className="w-8 h-8 rounded-full mb-1"
                                        alt="avatar"
                                    />
                                )}
                                <div 
                                    className={`max-w-[70%] px-4 py-2 rounded-2xl break-words ${
                                        isOwn 
                                            ? 'bg-brand-green text-black rounded-br-none' 
                                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-none'
                                    }`}
                                >
                                    <p className="text-[15px]">{msg.content}</p>
                                    <p className={`text-[10px] mt-1 text-right ${isOwn ? 'text-black/60' : 'text-gray-500'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-brand-green rounded-full text-gray-900 dark:text-white focus:outline-none transition-colors"
                    />
                    <button 
                        type="submit" 
                        disabled={isSending || !newMessage.trim()}
                        className="p-2 bg-brand-green text-black rounded-full hover:bg-brand-green-darker transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                        {isSending ? <Spinner /> : <SendIcon className="w-5 h-5" />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Conversation;