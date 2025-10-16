// src/pages/ChatPage.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Profile, ConversationSummary } from '../types';
import Spinner from '../components/Spinner';
import Conversation from '../components/Conversation';
import CreateGroupModal from '../components/CreateGroupModal';
import { useChat } from '../hooks/useChat';
import { formatTimestamp } from '../utils/timeUtils';
import { ChatIcon, UserGroupIcon } from '../components/icons';

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { conversations, loading, markConversationAsRead, fetchConversations, updateConversationId } = useChat();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGroupModalOpen, setGroupModalOpen] = useState(false);

  useEffect(() => {
    const recipient = location.state?.recipient as Profile | undefined;
    if (recipient) {
      const existingChat = conversations.find(c => 
        c.type === 'dm' && c.participants.some(p => p.user_id === recipient.user_id)
      );

      if (existingChat) {
        setSelectedConversationId(existingChat.conversation_id);
        if (!existingChat.conversation_id.startsWith('placeholder_')) {
            markConversationAsRead(existingChat.conversation_id);
        }
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state, conversations, markConversationAsRead]);

  const handleSelectConversation = useCallback((conversation: ConversationSummary) => {
    setSelectedConversationId(conversation.conversation_id);
    if (!conversation.conversation_id.startsWith('placeholder_')) {
      markConversationAsRead(conversation.conversation_id);
    }
  }, [markConversationAsRead]);
  
  const handleConversationCreated = (placeholderId: string, newConversationId: string) => {
    updateConversationId(placeholderId, newConversationId);
    setSelectedConversationId(newConversationId);
  };

  const handleGroupCreated = (conversationId: string) => {
    setGroupModalOpen(false);
    fetchConversations();
    setSelectedConversationId(conversationId);
  };

  const getOtherParticipant = (convo: ConversationSummary) => {
    return convo.participants.find(p => p.user_id !== user?.id) || convo.participants[0] || null;
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const selectedConversation = conversations.find(c => c.conversation_id === selectedConversationId);

  let conversationKey: string | undefined;
  if (selectedConversation) {
    if (selectedConversation.type === 'dm') {
      const otherParticipant = getOtherParticipant(selectedConversation);
      conversationKey = otherParticipant?.user_id;
    } else {
      conversationKey = selectedConversation.conversation_id;
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-80px)]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-144px)] md:h-[calc(100vh-120px)] w-full overflow-hidden bg-white dark:bg-gray-900 md:rounded-xl md:border md:border-gray-200 dark:md:border-gray-800">
      {isGroupModalOpen && <CreateGroupModal onClose={() => setGroupModalOpen(false)} onGroupCreated={handleGroupCreated} />}
      
      <div className={`relative w-full h-full flex transition-transform duration-300 ease-in-out md:transform-none ${selectedConversationId ? '-translate-x-full' : 'translate-x-0'}`}>
        {/* Sidebar */}
        <div className="w-full h-full flex-shrink-0 md:w-80 md:border-r md:border-gray-200 dark:md:border-gray-800 flex flex-col bg-white dark:bg-gray-900">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Messages
              </h2>
              <button 
                onClick={() => setGroupModalOpen(true)} 
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" 
                title="Create a group"
              >
                <UserGroupIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            
            {/* Search Input */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Search" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border-0 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green/20 transition-all"
              />
            </div>
          </div>

          {/* Conversations List */}
          <ul className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                  <ChatIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">No conversations yet</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Start chatting with someone</p>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const otherParticipant = conv.type === 'dm' ? getOtherParticipant(conv) : null;
                const displayName = conv.type === 'group' ? conv.name : otherParticipant?.full_name || 'User';
                const avatar = conv.type === 'dm' ? otherParticipant?.avatar_url : null;
                const avatarSrc = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
                const isSelected = selectedConversationId === conv.conversation_id;

                return (
                  <li 
                    key={conv.conversation_id} 
                    onClick={() => handleSelectConversation(conv)}
                    className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-gray-50 dark:bg-gray-800' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      {conv.type === 'group' ? (
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <UserGroupIcon className="w-6 h-6 text-gray-600 dark:text-gray-400"/>
                        </div>
                      ) : (
                        <img 
                          src={avatarSrc} 
                          alt={displayName} 
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      {conv.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 bg-brand-green text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                          {conv.unread_count > 9 ? '9+' : conv.unread_count}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                          {displayName}
                        </p>
                        {conv.last_message_at && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 flex-shrink-0 ml-2">
                            {formatTimestamp(conv.last_message_at)}
                          </p>
                        )}
                      </div>
                      <p className={`text-sm truncate ${
                        conv.unread_count > 0 
                          ? 'font-medium text-gray-900 dark:text-white' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {conv.last_message_sender_id === user?.id && (
                          <span className="text-gray-500">You: </span>
                        )}
                        {conv.last_message_content || 'No messages yet'}
                      </p>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        {/* Main Chat Area */}
        <div className="w-full h-full flex-shrink-0 md:flex-1 flex flex-col bg-white dark:bg-gray-900">
          {selectedConversation ? (
            <Conversation 
              key={conversationKey}
              conversation={selectedConversation}
              onBack={() => setSelectedConversationId(null)}
              onConversationCreated={handleConversationCreated}
            />
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <ChatIcon className="w-8 h-8 text-gray-400" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Your Messages
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                Select a conversation to start chatting
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;