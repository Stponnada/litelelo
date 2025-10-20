import React, { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
      
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, conversations, markConversationAsRead, navigate, location.pathname]);

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
    <div className="relative h-[calc(100vh-144px)] md:h-[calc(100vh-96px)] w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 md:rounded-2xl shadow-2xl">
      {isGroupModalOpen && <CreateGroupModal onClose={() => setGroupModalOpen(false)} onGroupCreated={handleGroupCreated} />}
      
      <div className={`relative w-full h-full flex transition-transform duration-300 ease-in-out md:transform-none ${selectedConversationId ? '-translate-x-full' : 'translate-x-0'}`}>
        {/* Sidebar */}
        <div className="w-full h-full flex-shrink-0 md:w-[360px] md:border-r md:border-gray-200/50 dark:md:border-gray-800/50 flex flex-col bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          {/* Header */}
          <div className="p-5 border-b border-gray-200/50 dark:border-gray-800/50 bg-gradient-to-b from-white/50 to-transparent dark:from-gray-900/50">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                  Messages
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                  {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button 
                onClick={() => setGroupModalOpen(true)} 
                className="group relative p-2.5 rounded-xl bg-gradient-to-br from-brand-green to-brand-green/80 hover:from-brand-green/90 hover:to-brand-green/70 text-white shadow-lg shadow-brand-green/20 hover:shadow-xl hover:shadow-brand-green/30 transition-all duration-200 hover:scale-105 active:scale-95" 
                title="Create a group"
              >
                <UserGroupIcon className="w-5 h-5" />
              </button>
            </div>
            
            {/* Search Input */}
            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors">
                <svg className="w-4.5 h-4.5 text-gray-400 group-focus-within:text-brand-green transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Search conversations..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100/80 dark:bg-gray-800/80 border-0 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green/40 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200 shadow-sm"
              />
            </div>
          </div>

          {/* Conversations List */}
          <ul className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center mb-4 shadow-inner">
                  <ChatIcon className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-base text-gray-700 dark:text-gray-300 font-semibold mb-1">No conversations yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">Start a new chat to get connected</p>
              </div>
            ) : (
              filteredConversations.map((conv, idx) => {
                const otherParticipant = conv.type === 'dm' ? getOtherParticipant(conv) : null;
                const displayName = conv.type === 'group' ? conv.name : otherParticipant?.full_name || 'User';
                const avatar = conv.type === 'dm' ? otherParticipant?.avatar_url : null;
                const avatarSrc = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || ' ')}&background=random`;
                const isSelected = selectedConversationId === conv.conversation_id;

                return (
                  <li 
                    key={conv.conversation_id} 
                    onClick={() => handleSelectConversation(conv)}
                    className={`mx-2 my-1 px-3.5 py-3.5 flex items-center gap-3.5 cursor-pointer transition-all duration-200 rounded-xl ${
                      isSelected 
                        ? 'bg-gradient-to-r from-brand-green/10 to-brand-green/5 dark:from-brand-green/20 dark:to-brand-green/10 shadow-md scale-[0.98]' 
                        : 'hover:bg-gray-100/60 dark:hover:bg-gray-800/60 hover:scale-[0.99] active:scale-[0.97]'
                    }`}
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <div className="relative flex-shrink-0">
                      {conv.type === 'group' ? (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-gray-900">
                          <UserGroupIcon className="w-7 h-7 text-purple-600 dark:text-purple-400"/>
                        </div>
                      ) : (
                        <img 
                          src={avatarSrc} 
                          alt={displayName || ''} 
                          className="w-14 h-14 rounded-2xl object-cover shadow-lg ring-2 ring-white dark:ring-gray-900"
                        />
                      )}
                      {conv.unread_count > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg shadow-red-500/50 ring-2 ring-white dark:ring-gray-900 animate-pulse">
                          {conv.unread_count > 9 ? '9+' : conv.unread_count}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <p className={`font-semibold truncate text-sm ${
                          isSelected 
                            ? 'text-brand-green dark:text-brand-green' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {displayName}
                        </p>
                        {conv.last_message_at && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 flex-shrink-0 ml-2 font-medium">
                            {formatTimestamp(conv.last_message_at)}
                          </p>
                        )}
                      </div>
                      <p className={`text-sm truncate leading-relaxed ${
                        conv.unread_count > 0 
                          ? 'font-medium text-gray-800 dark:text-gray-200' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {conv.last_message_sender_id === user?.id && (
                          <span className="text-gray-500 dark:text-gray-500">You: </span>
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
        <div className="w-full h-full flex-shrink-0 md:flex-1 flex flex-col bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
          {selectedConversation ? (
            <Conversation 
              key={conversationKey}
              conversation={selectedConversation}
              onBack={() => setSelectedConversationId(null)}
              onConversationCreated={handleConversationCreated}
            />
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full text-center p-8">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-green/20 to-blue-500/20 blur-3xl rounded-full" />
                <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center shadow-2xl ring-1 ring-gray-200/50 dark:ring-gray-700/50">
                  <ChatIcon className="w-12 h-12 text-brand-green dark:text-brand-green" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-2">
                Your Messages
              </h3>
              <p className="text-base text-gray-600 dark:text-gray-400 max-w-sm leading-relaxed">
                Select a conversation from the sidebar to start chatting with your connections
              </p>
              
              <div className="mt-8 flex gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-green/40 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-brand-green/40 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 rounded-full bg-brand-green/40 animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;