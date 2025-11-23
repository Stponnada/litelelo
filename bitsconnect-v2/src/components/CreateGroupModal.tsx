// src/components/CreateGroupModal.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Profile, DirectoryProfile } from '../types';
import Spinner from './Spinner';
import { XCircleIcon, UserGroupIcon } from './icons';

interface CreateGroupModalProps {
  onClose: () => void;
  onGroupCreated: (conversationId: string) => void;
}

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onGroupCreated }) => {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [availableUsers, setAvailableUsers] = useState<DirectoryProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<DirectoryProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_unified_directory');
      if (error) {
        console.error("Error fetching users for group chat:", error);
      } else {
        const usersOnly = (data as DirectoryProfile[] || []).filter(p => p.type === 'user' && p.id !== user?.id);
        setAvailableUsers(usersOnly);
      }
      setLoading(false);
    };
    fetchUsers();
  }, [user]);

  const handleToggleUser = (profile: DirectoryProfile) => {
    if (selectedUsers.some(u => u.id === profile.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== profile.id));
    } else {
      setSelectedUsers([...selectedUsers, profile]);
    }
  };

  const handleSubmit = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      setError("Group name and at least one member are required.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const participant_ids = selectedUsers.map(u => u.id);
      const { data, error: rpcError } = await supabase.rpc('create_group_chat', { group_name: groupName, participant_ids });
      if (rpcError) throw rpcError;
      onGroupCreated(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = availableUsers.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.username!.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-slideUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-8 pt-8 pb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10" />
          <div className="relative flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <UserGroupIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Create Group
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Bring your team together
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-all duration-200 group"
            >
              <XCircleIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 pb-6 space-y-6">
          {/* Group Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-400"
              placeholder="e.g., Marketing Team, Book Club..."
            />
          </div>

          {/* Selected Members */}
          {selectedUsers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Selected Members
                </label>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                  {selectedUsers.length} {selectedUsers.length === 1 ? 'member' : 'members'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <div
                    key={user.id}
                    className="group flex items-center gap-2.5 pl-1 pr-3 py-1 bg-white dark:bg-gray-800 rounded-full border-2 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <img
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name || user.username}&background=random&color=fff&bold=true`}
                      alt={user.username!}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {user.name || user.username}
                    </span>
                    <button
                      onClick={() => handleToggleUser(user)}
                      className="w-5 h-5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center transition-colors ml-1"
                    >
                      <XCircleIcon className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Add Members
            </label>
            <div className="relative">
              <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-400"
                placeholder="Search people..."
              />
            </div>
          </div>

          {/* User List */}
          <div className="space-y-2">
            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <UserGroupIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">No users found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredUsers.map(profile => {
                  const isSelected = selectedUsers.some(u => u.id === profile.id);
                  return (
                    <button
                      key={profile.id}
                      onClick={() => handleToggleUser(profile)}
                      className={`group flex items-center gap-4 p-3.5 w-full rounded-xl transition-all duration-200 ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <div className="relative">
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                          isSelected
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-gray-300 dark:border-gray-600 group-hover:border-emerald-400'
                        }`}>
                          {isSelected && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </div>
                      
                      <img
                        src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.name || profile.username}&background=random&color=fff&bold=true`}
                        alt={profile.username!}
                        className={`w-11 h-11 rounded-xl object-cover shadow-sm transition-all duration-200 ${
                          isSelected ? 'ring-2 ring-emerald-400 shadow-emerald-200 dark:shadow-emerald-900/50' : ''
                        }`}
                      />
                      
                      <div className="flex-1 text-left min-w-0">
                        <p className={`font-semibold truncate transition-colors ${
                          isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-white'
                        }`}>
                          {profile.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          @{profile.username}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-8 mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !groupName.trim() || selectedUsers.length === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Spinner />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <UserGroupIcon className="w-5 h-5" />
                  <span>Create Group</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;