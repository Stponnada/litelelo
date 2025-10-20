// src/types.ts
// --- NEW: Interface for a roommate ---
export interface Roommate {
    user_id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
}

// --- NEW: A polymorphic "Author" type that can be a user OR a community ---
export interface AuthorProfile {
author_id: string;
author_type: 'user' | 'community';
author_name: string | null;
author_username: string | null;
author_avatar_url: string | null;
}
// --- NEW: A polymorphic "Directory" entry ---
export interface DirectoryProfile {
  id: string;
  type: 'user' | 'community';
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_following: boolean | null;
  follower_count: number | null;
  member_count: number | null;
  admission_year: number | null;
  branch: string | null;
  dual_degree_branch: string | null;
  gender: string | null;
  dorm_building: string | null;
  relationship_status: string | null;
  dining_hall: string | null;
}

export interface Friend {
user_id: string;
username: string;
full_name: string | null;
avatar_url: string | null;
}
export interface Profile {
user_id: string;
username: string;
full_name: string | null;
email?: string;
avatar_url: string | null;
banner_url: string | null;
bio: string | null;
campus: string | null;
admission_year: number | null;
branch: string | null;
dual_degree_branch: string | null;
relationship_status: string | null;
dorm_building: string | null;
dorm_room: string | null;
dining_hall: string | null;
clubs?: string | null;
profile_complete?: boolean;
created_at?: string;
updated_at?: string;
following_count: number;
follower_count: number;
is_following: boolean;
is_followed_by?: boolean;
roommates: Roommate[] | null;
gender: string | null;
birthday: string | null;
avg_seller_rating?: number;
total_seller_ratings?: number;
avg_bits_coin_rating?: number;
total_bits_coin_ratings?: number;
bits_coin_balance?: number; // Added for CryptoHubWidget
}
export interface ConversationSummary {
conversation_id: string;
type: 'dm' | 'group';
name: string | null;
participants: ConversationParticipant[];
last_message_content: string | null;
last_message_at: string | null;
last_message_sender_id: string | null;
unread_count: number;
}

export interface Post {
    id: string;
    content: string;
    image_url: string | null;
    created_at: string;
    like_count: number;
    dislike_count: number;
    comment_count: number;
    user_vote: 'like' | 'dislike' | null;
    is_bookmarked: boolean;
    community_id: string | null;
    is_public: boolean;
    author: AuthorProfile;
    original_poster_username: string | null;
    poll: Poll | null; // <-- ADD THIS
    is_edited: boolean; // <-- ADD THIS
    is_deleted: boolean; // <-- ADD THIS
    user_id: string; // <-- ADD THIS
}

export interface CampusNotice {
    id: string;
    user_id: string;
    campus: string;
    title: string;
    description: string | null;
    created_at: string;
    profiles: Profile | null; // For author details
    files: CampusNoticeFile[];
}

export interface CampusNoticeFile {
    file_url: string;
    file_type: 'image' | 'pdf';
}

export interface Comment {
id: number;
content: string;
user_id: string;
post_id: string;
created_at: string;
profiles: Profile | null;
}
export interface UserSearchResult {
username: string;
full_name: string;
avatar_url: string;
}
export interface PostSearchResult {
id: string;
content: string;
author_username: string;
author_full_name: string;
}
export interface SearchResults {
users: UserSearchResult[];
posts: PostSearchResult[];
}
export interface CampusPlace {
  id: string;
  name: string;
  category: string;
  location: string | null;
  // image_url: string | null; <-- REMOVE THIS LINE
  primary_image_url: string | null; // <-- ADD THIS LINE
  campus: string;
  avg_rating: number;
  review_count: number;
}
export interface Review {
id: string;
place_id: string;
user_id: string;
rating: number;
comment: string | null;
created_at: string;
profiles: Profile | null;
}
export interface LostAndFoundItem {
id: string;
user_id: string;
item_type: 'lost' | 'found';
title: string;
description: string | null;
location_found: string | null;
image_url: string | null;
status: 'active' | 'reclaimed';
campus: string;
created_at: string;
profiles: Profile | null;
}
export interface MarketplaceImage {
id: string;
listing_id: string;
image_url: string;
}
export interface MarketplaceListing {
id: string;
seller_id: string;
title: string;
description: string;
price: number;
category: 'Books & Notes' | 'Electronics' | 'Furniture' | 'Apparel' | 'Cycles & Vehicles' | 'Other';
campus: string;
status: 'available' | 'sold';
created_at: string;
seller_profile: Profile;
primary_image_url: string | null;
all_images: string[] | null;
}
export interface ConversationParticipant {
user_id: string;
username: string;
full_name: string | null;
avatar_url: string | null;
}
export interface Conversation {
id: string;
name: string | null;
type: 'dm' | 'group';
participants: ConversationParticipant[];
}
export interface MessageReaction {
message_id: number;
user_id: string;
emoji: string;
profiles: Profile | null;
created_at: string; // <-- ADD THIS
}
export interface Message {
id: number;
conversation_id: string;
sender_id: string;
content: string | null;
created_at: string;
message_type: 'text' | 'image' | 'gif';
attachment_url: string | null;
profiles: Profile | null;
reply_to_message_id: number | null;
is_edited: boolean;
is_deleted: boolean;
reactions: MessageReaction[];
status?: 'sending' | 'failed';
}

export interface PollOption {
    id: string;
    option_text: string;
    vote_count: number;
}

export interface Poll {
    id: string;
    allow_multiple_answers: boolean;
    options: PollOption[];
    total_votes: number;
    user_votes: string[] | null; // Array of option IDs the user has voted for
}

export interface FollowSuggestion {
    user_id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
}

export interface TrendingPost {
    id: string;
    content: string;
    like_count: number;
    comment_count: number;
    author_name: string | null;
    author_username: string | null;
    author_avatar_url: string | null;
}

export interface TrendingPoll {
    id: string;
    content: string;
    total_votes: number;
    author_name: string | null;
    author_username: string | null;
    author_avatar_url: string | null;
}

export interface RecommendedContent {
    follow_suggestions: FollowSuggestion[];
    trending_posts: TrendingPost[];
    trending_polls: TrendingPoll[];
}

export interface PinnedMessage {
  id: number;
  conversation_id: string;
  message_id: number;
  pinned_by_user_id: string;
  created_at: string;
  expires_at: string | null;
  message: Message;
  pinner: Profile;
}

export interface ReadTimestamp {
  user_id: string;
  last_read_at: string;
}

export type RsvpStatus = 'going' | 'interested';

export interface EventRsvp {
  event_id: string;
  user_id: string;
  rsvp_status: RsvpStatus;
  profiles: Profile; // Assuming a nested profile object
}

export interface CampusEvent {
  id: string;
  created_at: string;
  name: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  location: string | null;
  campus: string;
  image_url: string | null;
  created_by: {
    user_id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };

  community: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
  going_count: number;
  interested_count: number;
  user_rsvp_status: RsvpStatus | null;
}

export interface BitsCoinRequest {
    id: string;
    created_at: string;
    title: string;
    description: string;
    reward: number;
    status: 'open' | 'claimed' | 'completed' | 'cancelled';
    requester: { user_id: string; username: string; full_name: string; avatar_url: string; };
    claimer: { user_id: string; username: string; full_name: string; avatar_url: string; } | null;
    category: string; // Added
    deadline: string | null; // Added
}

export type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'bits_coin_claim';

export interface Notification {
    id: string;
    user_id: string;
    type: NotificationType;
    entity_id: string | null;
    entity_type: 'post' | 'user' | 'bits_coin_request' | null;
    is_read: boolean;
    created_at: string;
    actor: {
        user_id: string;
        username: string;
        full_name: string | null;
        avatar_url: string | null;
    };

}

// src/types.ts

// ... (other types)

export interface RideShare {
    id: string;
    created_at: string;
    user_id: string;
    campus: string;
    type: 'offer' | 'request';
    origin: string;
    destination: string;
    departure_time: string;
    seats: number;
    description: string | null;
    status: 'active' | 'full' | 'completed' | 'cancelled';
    user: {
        user_id: string;
        username: string;
        full_name: string | null;
        avatar_url: string | null;
    };
}