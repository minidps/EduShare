import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Forum.css';
import './App.css';

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
  forumPosts: ForumPost[];
  userVotes: Record<string, 'up' | 'down' | null>;
  onVote: (postId: string, voteType: 'up' | 'down') => Promise<boolean>;
}

export default function Forum({ categories, forumPosts, userVotes, onVote }: ForumProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    document.title = 'Forum';
  }, []);

  const forumFilter = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const [sortTab, setSortTab] = useState<'latest' | 'top' | 'trending'>('latest');
  const votesRecord = userVotes;

  const getDisplayedUpvotes = (postId: string, baseUpvotes: number) => {
    const vote = votesRecord[postId];
    if (vote === 'up') return baseUpvotes + 1;
    if (vote === 'down') return baseUpvotes - 1;
    return baseUpvotes;
  };

  const handleVote = async (postId: string, type: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    await onVote(postId, type);
  };

  const filteredPosts = forumPosts.filter(post => {
    const matchesCategory = forumFilter === 'all' || post.category.toLowerCase() === forumFilter.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortTab === 'top') {
      return getDisplayedUpvotes(b.id, b.upvotes) - getDisplayedUpvotes(a.id, a.upvotes);
    }
    if (sortTab === 'trending') {
      return (b.replies + b.views) - (a.replies + a.views);
    }
    return 0;
  });

  const getCategoryCount = (catName: string) => {
    return forumPosts.filter(p => p.category.toLowerCase() === catName.toLowerCase()).length;
  };

  return (
    <div className="forum-page-layout animate-fade">
      <aside className="forum-sidebar-left">
        <button className="create-new-thread-cta" onClick={() => navigate('/create-post')}>
          <span>➕</span> Create New Thread
        </button>

        <div className="forum-sidebar-nav-panel">
          <button 
            className={`sidebar-nav-btn ${forumFilter === 'all' ? 'active-filter-sidebar' : ''}`}
            onClick={() => setSearchParams(searchQuery ? { category: 'all', search: searchQuery } : { category: 'all' })}
          >
            <span>🌍 All Subjects</span>
            <span className="sidebar-count-bubble">{forumPosts.length}</span>
          </button>

          {categories.map(cat => (
            <button
              key={cat}
              className={`sidebar-nav-btn ${forumFilter.toLowerCase() === cat.toLowerCase() ? 'active-filter-sidebar' : ''}`}
              onClick={() => setSearchParams(searchQuery ? { category: cat.toLowerCase(), search: searchQuery } : { category: cat.toLowerCase() })}
            >
              <span>📚 {cat}</span>
              <span className="sidebar-count-bubble">{getCategoryCount(cat)}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="forum-main-content-area">
        <div className="forum-sort-header-tabs">
          <button className={`sort-tab-btn ${sortTab === 'latest' ? 'active-sort-tab' : ''}`} onClick={() => setSortTab('latest')}>Latest</button>
          <button className={`sort-tab-btn ${sortTab === 'top' ? 'active-sort-tab' : ''}`} onClick={() => setSortTab('top')}>Top Voted</button>
          <button className={`sort-tab-btn ${sortTab === 'trending' ? 'active-sort-tab' : ''}`} onClick={() => setSortTab('trending')}>Trending</button>
        </div>

        {searchQuery && (
          <div style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Showing results for: <strong>"{searchQuery}"</strong> 
            <span style={{ color: '#0070f3', cursor: 'pointer', marginLeft: '0.5rem' }} onClick={() => setSearchParams(forumFilter !== 'all' ? { category: forumFilter } : {})}>[Clear Search]</span>
          </div>
        )}

        <div className="forum-posts-feed-list">
          {sortedPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eaeaea', color: '#64748b' }}>
              No threads found matching the selection. Be the first to create one!
            </div>
          ) : (
            sortedPosts.map(post => {
              const userVoteStatus = votesRecord[post.id];
              return (
                <div key={post.id} className="forum-post-row-item" onClick={() => navigate(`/post/${post.id}`)}>
                  <div className="post-vote-sidebar-col">
                    <button className={`vote-btn ${userVoteStatus === 'up' ? 'active-upvote' : ''}`} onClick={(e) => handleVote(post.id, 'up', e)}>▲</button>
                    <span className={`vote-count ${userVoteStatus ? 'voted-count' : ''}`}>{getDisplayedUpvotes(post.id, post.upvotes)}</span>
                    <button className={`vote-btn ${userVoteStatus === 'down' ? 'active-downvote' : ''}`} onClick={(e) => handleVote(post.id, 'down', e)}>▼</button>
                  </div>

                  <div className="post-main-content">
                    <span className="post-category-tag">{post.category}</span>
                    <h3 className="post-title-text">{post.title}</h3>
                    <div className="post-tags-container">{post.tags.map(tag => <span key={tag} className="hash-tag">#{tag}</span>)}</div>
                    <div className="post-author-footer">
                      <span className="author-avatar">{post.avatar}</span>
                      <span className="author-name">{post.author}</span>
                      <span className="bullet-divider">•</span>
                      <span className="post-time">{post.timeAgo}</span>
                    </div>
                  </div>

                  <div className="post-metrics-box">
                    <div className="metric"><span>💬</span> <strong>{post.replies}</strong> replies</div>
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