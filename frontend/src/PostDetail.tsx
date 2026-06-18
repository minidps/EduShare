import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PostDetail.css';

interface Reply {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timeAgo: string;
  isPinned?: boolean;
}

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

interface PostDetailProps {
  forumPosts: ForumPost[];
  userVotes: Record<string, 'up' | 'down' | null>;
  onVote: (postId: string, voteType: 'up' | 'down') => Promise<boolean>;
  onAddReplyCount: (id: string) => void;
  currentUser?: string | null;
}

export default function PostDetail({
  forumPosts,
  userVotes,
  onVote,
  onAddReplyCount,
  currentUser
}: PostDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [replies, setReplies] = useState<Reply[]>([]);
  const [commentText, setCommentText] = useState<string>('');
  const post = forumPosts.find((p) => String(p.id) === String(id)) || null;  useEffect(() => {
    if (!id) return;
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/posts/${id}/comments/`);
        if (response.ok) {
          const data = await response.json();
          setReplies(data);
        }
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      }
    };
    fetchComments();
  }, [id]);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentText.trim()) return;

    try {
      const token = localStorage.getItem('access_token'); 
      const response = await fetch(`/api/posts/${id}/comments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: commentText }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        alert(`Server Error (${response.status}): ${responseText}`);
        return;
      }

      const newComment: Reply = JSON.parse(responseText);
      setReplies((prev) => [...prev, newComment]);
      setCommentText('');
      onAddReplyCount(id); 
    } catch (err: any) {
      alert("Network or Parsing error: " + err.message);
    }
  };

  const handlePinToggle = async (replyId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/comments/${replyId}/pin/`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        setReplies((prev) =>
          prev.map((r) => (r.id === replyId ? { ...r, isPinned: !r.isPinned } : r))
        );
      } else {
        alert("Failed to update pin status. Make sure you are the post author!");
      }
    } catch (err) {
      console.error("Error pinning comment:", err);
    }
  };

  const handleReportComment = async (replyId: string) => {
    if (!window.confirm("Are you sure you want to report this comment?")) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/comments/${replyId}/report/`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        alert("Thank you. This comment has been reported for moderation.");
      } else {
        alert("Failed to send report.");
      }
    } catch (err) {
      console.error("Error reporting comment:", err);
    }
  };

  const handleReportPost = async () => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to report this post thread?")) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/posts/${id}/report/`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        alert("Thank you. This post thread has been flagged for review.");
      } else {
        alert("Failed to submit post report.");
      }
    } catch (err) {
      console.error("Error reporting post:", err);
    }
  };

  if (!post) {
    return (
      <div className="post-detail-layout">
        <button className="back-feed-btn" onClick={() => navigate('/forum')}>&larr; Back to Forum</button>
        <p>Loading thread context or post not found...</p>
      </div>
    );
  }

  const currentVote = userVotes[post.id] || null;

  return (
    <div className="post-detail-layout animate-fade">
      <button className="back-feed-btn" onClick={() => navigate('/forum')}>&larr; Back to Forum</button>

      <div className="thread-main-container">
        <article className="thread-header-card">
          <div className="thread-meta-top">
            <span className="post-category-tag">{post.category}</span>
            <span className="reply-time">{post.timeAgo}</span>
          </div>

          <h1 className="thread-title">{post.title}</h1>

          <div className="thread-body-description">
            {post.description ? (
              <div dangerouslySetInnerHTML={{ __html: post.description }} />
            ) : (
              <span style={{ color: '#94a3b8', fontSize: '0.95rem' }}>No body text provided for this thread.</span>
            )}
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="post-tags-container" style={{ marginBottom: '1.5rem' }}>
              {post.tags.map(tag => <span key={tag} className="hash-tag">#{tag}</span>)}
            </div>
          )}

          <div className="post-author-footer">
            <span className="author-avatar">{post.avatar || '👤'}</span>
            <span className="author-name">{post.author}</span>
            {currentUser === post.author && <span className="owner-badge">Author</span>}
            <span style={{ color: '#94a3b8', marginLeft: 'auto', fontSize: '0.9rem' }}>👁️ {post.views} views</span>
          </div>

          <div className="thread-action-bar">
            <div className="thread-voting-actions">
              <button 
                className={currentVote === 'up' ? 'active-upvote' : ''} 
                onClick={() => onVote(post.id, 'up')}
              >
                ▲ Upvote
              </button>
              <span className="detail-vote-count-display">{post.upvotes}</span>
              <button 
                className={currentVote === 'down' ? 'active-downvote' : ''} 
                onClick={() => onVote(post.id, 'down')}
              >
                ▼ Downvote
              </button>
            </div>

            <button className="btn-report-action" onClick={handleReportPost}>
              🚩 Report Thread
            </button>
          </div>
        </article>

        <section className="replies-section-wrapper">
          <h3>Responses ({replies.length})</h3>

          <div className="replies-stream-box">
            {replies.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.95rem' }}>No responses yet. Be the first to join the conversation!</p>
            ) : (
              [...replies]
                .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
                .map((reply) => (
                  <div key={reply.id} className={`reply-node-card ${reply.isPinned ? 'pinned-reply-border' : ''}`}>
                    <div className="reply-avatar-col">
                      {reply.avatar || reply.author.charAt(0).toUpperCase()}
                    </div>

                    <div className="reply-content-col">
                      <div className="reply-meta-line">
                        <div className="reply-user-info">
                          <strong>{reply.author}</strong>
                          {reply.isPinned && <span className="pinned-label-badge">Pinned</span>}
                          <span className="reply-time">• {reply.timeAgo}</span>
                        </div>
                      </div>

                      <p className="reply-text-paragraph">{reply.text}</p>

                      <div className="reply-actions-footer">
                        <button 
                          className={`reply-action-btn pin-toggle-btn ${reply.isPinned ? 'unpin-style' : ''}`}
                          onClick={() => handlePinToggle(reply.id)}
                        >
                          📌 {reply.isPinned ? 'Unpin Comment' : 'Pin Comment'}
                        </button>
                        <button 
                          className="reply-action-btn report-toggle-btn"
                          onClick={() => handleReportComment(reply.id)}
                        >
                          🚩 Report
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>

          <form onSubmit={handleReplySubmit} className="add-reply-form-node">
            <textarea
              rows={4}
              placeholder={currentUser ? "Share your thoughts or answer questions..." : "Please log in to post responses."}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={!currentUser}
              required
            />
            <button type="submit" className="submit-reply-btn" disabled={!currentUser || !commentText.trim()}>
              Post Reply
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}