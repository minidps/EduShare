import React, { useState } from 'react';
import './Forum.css';

interface ForumPost {
  id: string;
  title: string;
  author: string;
  avatar: string;
  replies: number;
  views: number;
  upvotes: number;
  tags: string[];
  category: string;
  timeAgo: string;
  description?: string;
  fileName?: string | null;
}

interface ForumProps {
  categories: string[];
  onOpenAuth: (mode: 'login' | 'signup') => void;
  setCurrentPage: (page: 'home' | 'forum' | 'create-post') => void;
  forumPosts: ForumPost[];
  setForumPosts: React.Dispatch<React.SetStateAction<ForumPost[]>>;
  onSelectPost: (post: ForumPost) => void;
}

export default function Forum({ categories, onOpenAuth, setCurrentPage, forumPosts, setForumPosts, onSelectPost }: ForumProps) {
  // Supports 'all', 'popular', 'unanswered', or specific categories
  const [forumFilter, setForumFilter] = useState<string>('all');
  // Controls top headers ordering: 'latest' | 'top' | 'trending'
  const [sortTab, setSortTab] = useState<'latest' | 'top' | 'trending'>('latest');
  
  const [votesRecord, setVotesRecord] = useState<Record<string, 'up' | 'down' | null>>({});

  // 1. STEP ONE: Apply Feed Sidebar Constraints
  let processedPosts = [...forumPosts];
  
  if (forumFilter === 'unanswered') {
    processedPosts = processedPosts.filter(post => post.replies === 0);
  } else if (forumFilter === 'popular') {
    // Treat posts with high interaction (upvotes + replies) as popular this week
    processedPosts = processedPosts.filter(post => (post.upvotes + post.replies) >= 15);
  } else if (forumFilter !== 'all') {
    processedPosts = processedPosts.filter(post => post.category === forumFilter);
  }

  // 2. STEP TWO: Apply Top Sorting Tab Conversions
  if (sortTab === 'top') {
    processedPosts.sort((a, b) => b.upvotes - a.upvotes);
  } else if (sortTab === 'trending') {
    processedPosts.sort((a, b) => b.views - a.views);
  } else {
    // 'latest' - assumes items higher up in array or higher numeric ID are newer 
    processedPosts.sort((a, b) => Number(b.id) - Number(a.id));
  }

  const handleVote = (id: string, incomingVote: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation(); 
    const currentVote = votesRecord[id] || null;

    setForumPosts(prev => prev.map(post => {
      if (post.id !== id) return post;
      let voteAdjustment = 0;

      if (currentVote === incomingVote) {
        voteAdjustment = incomingVote === 'up' ? -1 : 1;
        setVotesRecord(prevRecord => ({ ...prevRecord, [id]: null }));
      } else if (currentVote === null) {
        voteAdjustment = incomingVote === 'up' ? 1 : -1;
        setVotesRecord(prevRecord => ({ ...prevRecord, [id]: incomingVote }));
      } else {
        voteAdjustment = incomingVote === 'up' ? 2 : -2;
        setVotesRecord(prevRecord => ({ ...prevRecord, [id]: incomingVote }));
      }

      return { ...post, upvotes: post.upvotes + voteAdjustment };
    }));
  };

  const getHeaderTitle = () => {
    if (forumFilter === 'all') return 'All Discussions';
    if (forumFilter === 'popular') return '🔥 Popular This Week';
    if (forumFilter === 'unanswered') return '❓ Unanswered Questions';
    return `${forumFilter} Feed`;
  };

  return (
    <div className="forum-page-layout animate-fade">
      {/* Left Sidebar Sub-Navigation */}
      <aside className="forum-sidebar">
        <button className="btn-primary create-post-btn" onClick={() => setCurrentPage('create-post')}>
          + Create New Post
        </button>
        
        <div className="sidebar-menu-wrapper">
          <h3>Feeds</h3>
          <button 
            className={`sidebar-link ${forumFilter === 'all' ? 'active' : ''}`} 
            onClick={() => setForumFilter('all')}
          >
            🌐 All Discussions
          </button>
          <button 
            className={`sidebar-link ${forumFilter === 'popular' ? 'active' : ''}`} 
            onClick={() => setForumFilter('popular')}
          >
            🔥 Popular This Week
          </button>
          <button 
            className={`sidebar-link ${forumFilter === 'unanswered' ? 'active' : ''}`} 
            onClick={() => setForumFilter('unanswered')}
          >
            ❓ Unanswered Questions
          </button>
        </div>

        <div className="sidebar-menu-wrapper">
          <h3>Subjects</h3>
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`sidebar-link ${forumFilter === cat ? 'active' : ''}`} 
              onClick={() => setForumFilter(cat)}
            >
              📚 {cat}
            </button>
          ))}
        </div>
      </aside>

      {/* Right Forum Feed Container */}
      <div className="forum-feed-container">
        <div className="forum-feed-header">
          <h2>{getHeaderTitle()}</h2>
          
          {/* Functional sorting tabs configuration setup */}
          <div className="forum-sorting-tabs">
            <span 
              className={sortTab === 'latest' ? 'active-tab' : ''} 
              onClick={() => setSortTab('latest')}
            >
              Latest
            </span>
            <span 
              className={sortTab === 'top' ? 'active-tab' : ''} 
              onClick={() => setSortTab('top')}
            >
              Top Rated
            </span>
            <span 
              className={sortTab === 'trending' ? 'active-tab' : ''} 
              onClick={() => setSortTab('trending')}
            >
              Trending
            </span>
          </div>
        </div>

        <div className="extended-forum-list">
          {processedPosts.length === 0 ? (
            <div className="empty-feed-placeholder">
              p No matching discussions found matching this criteria. Be the first to start one!
            </div>
          ) : (
            processedPosts.map((post) => {
              const userVoteStatus = votesRecord[post.id] || null;
              
              return (
                <div key={post.id} className="extended-post-card interactive-row" onClick={() => onSelectPost(post)}>
                  <div className="post-vote-box">
                    <button className={`vote-btn ${userVoteStatus === 'up' ? 'active-upvote' : ''}`} onClick={(e) => handleVote(post.id, 'up', e)}>▲</button>
                    <span className={`vote-count ${userVoteStatus ? 'voted-count' : ''}`}>{post.upvotes}</span>
                    <button className={`vote-btn ${userVoteStatus === 'down' ? 'active-downvote' : ''}`} onClick={(e) => handleVote(post.id, 'down', e)}>▼</button>
                  </div>

                  <div className="post-main-content">
                    <span className="post-category-tag">{post.category}</span>
                    <h3 className="post-title-text">{post.title}</h3>
                    <div className="post-tags-container">
                      {post.tags.map(tag => <span key={tag} className="hash-tag">#{tag}</span>)}
                    </div>
                    <div className="post-author-footer">
                      <span className="author-avatar">{post.avatar}</span>
                      <span className="author-name">{post.author}</span>
                      <span className="bullet-divider">•</span>
                      <span className="post-time">{post.timeAgo}</span>
                    </div>
                  </div>

                  <div className="post-metrics-box">
                    <div className="metric"><span>💬</span> <strong>{post.replies}</strong> replies</div>
                    <div className="metric"><span>👁️</span> <strong>{post.views}</strong> views</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}