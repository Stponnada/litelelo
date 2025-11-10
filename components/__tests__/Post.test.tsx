import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Post from '../Post';
import { PostsProvider } from '../../contexts/PostsContext';
import { AuthContext } from '../../contexts/AuthContext';
import type { Post as PostType } from '../../types';

// Mock supabase
const mockRpc = jest.fn().mockResolvedValue({ data: true, error: null });
jest.mock('../../services/supabase', () => ({
  supabase: {
    rpc: mockRpc
  }
}));

// Mock Intersection Observer
const mockIntersectionObserver = jest.fn();
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();

mockIntersectionObserver.mockReturnValue({
  observe: mockObserve,
  unobserve: mockUnobserve,
  disconnect: mockDisconnect
});
window.IntersectionObserver = mockIntersectionObserver;

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    username: 'testuser'
  },
  aud: 'authenticated',
  app_metadata: {},
  created_at: new Date().toISOString(),
  role: '',
  updated_at: new Date().toISOString()
};

const mockPost: PostType = {
  id: 'test-post-id',
  content: 'Test post content',
  image_url: null,
  created_at: new Date().toISOString(),
  like_count: 0,
  dislike_count: 0,
  comment_count: 0,
  view_count: 0,
  repost_count: 0,
  user_vote: null,
  is_bookmarked: false,
  user_has_reposted: false,
  community_id: null,
  is_public: true,
  is_deleted: false,
  is_edited: false,
  user_id: 'test-user-id',
  author: {
    author_id: 'test-user-id',
    author_type: 'user',
    author_name: 'Test User',
    author_username: 'testuser',
    author_avatar_url: null,
    author_flair_details: null
  },
  original_poster_username: null,
  poll: null,
  quoted_post: null,
  reposted_by: null
};

const mockAuthContext = {
  user: mockUser,
  isLoading: false,
  session: null,
  profile: null,
  updateProfileContext: jest.fn()
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter>
    <AuthContext.Provider value={mockAuthContext}>
      <PostsProvider>
        {children}
      </PostsProvider>
    </AuthContext.Provider>
  </MemoryRouter>
);

describe('Post Component View Counter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with initial view count of 0', () => {
    render(
      <TestWrapper>
        <Post post={mockPost} />
      </TestWrapper>
    );

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('initializes intersection observer for view counting', () => {
    render(
      <TestWrapper>
        <Post post={mockPost} />
      </TestWrapper>
    );

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ threshold: 0.5 })
    );
  });

  it('increments view count when post becomes visible', async () => {
    render(
      <TestWrapper>
        <Post post={mockPost} />
      </TestWrapper>
    );

    // Simulate intersection observer callback
    const [[callback]] = mockIntersectionObserver.mock.calls;
    act(() => {
      callback([{ isIntersecting: true }]);
    });

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith(
        'increment_post_view',
        {
          post_id: mockPost.id
        }
      );
    });
  });

  it('only counts view once per session', async () => {
    render(
      <TestWrapper>
        <Post post={mockPost} />
      </TestWrapper>
    );

    // Simulate intersection observer callback twice
    const [[callback]] = mockIntersectionObserver.mock.calls;
    
    act(() => {
      callback([{ isIntersecting: true }]);
    });

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledTimes(1);
    });

    act(() => {
      callback([{ isIntersecting: true }]);
    });

    // Should still only be called once
    expect(mockRpc).toHaveBeenCalledTimes(1);
  });

  it('handles error when incrementing view count', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockRpc.mockRejectedValueOnce(new Error('API Error'));

    render(
      <TestWrapper>
        <Post post={mockPost} />
      </TestWrapper>
    );

    // Simulate intersection observer callback
    const [[callback]] = mockIntersectionObserver.mock.calls;
    act(() => {
      callback([{ isIntersecting: true }]);
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error incrementing view count:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('does not increment view count when not logged in', async () => {
    render(
      <TestWrapper>
        <AuthContext.Provider value={{ ...mockAuthContext, user: null }}>
          <Post post={mockPost} />
        </AuthContext.Provider>
      </TestWrapper>
    );

    // Simulate intersection observer callback
    const [[callback]] = mockIntersectionObserver.mock.calls;
    act(() => {
      callback([{ isIntersecting: true }]);
    });

    // Wait a bit to ensure no API call is made
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(mockRpc).not.toHaveBeenCalled();
  });
});