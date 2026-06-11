import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PostDetail.css';

interface Reply {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timeAgo: string;
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
}

export default function PostDetail({ forumPosts, userVotes, onVote, onAddReplyCount }: PostDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  
  const post = forumPosts.find(p => p.id === id);
  const currentVote = id ? userVotes[id] : null;

  const [replies, setReplies] = useState<Reply[]>([
    { id: '1', author: 'AlgeBrah', avatar: '🧙‍♂️', text: 'Closures are amazing once you get the hang of them. Think of it as a backpack that a function carries around everywhere!', timeAgo: '1 hour ago' },
    { id: '2', author: 'CodeNewbie', avatar: '👨‍💻', text: 'Ah, that backpack analogy makes so much sense! Thanks!', timeAgo: '45 mins ago' }
  ]);

  if (!post) {
    return (
      <div className="post-detail-layout" style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>Post not found</h2>
        <button className="btn-primary" onClick={() => navigate('/forum')}>Back to Forum</button>
      </div>
    );
  }

  const handleVote = async (type: 'up' | 'down') => {
    await onVote(post.id, type);
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newReply: Reply = {
      id: String(replies.length + 1),
      author: 'CurrentUser',
      avatar: '🎓',
      text: commentText.trim(),
      timeAgo: 'Just now'
    };

    setReplies([...replies, newReply]);
    setCommentText('');
    onAddReplyCount(post.id);
  };

  return (
    <div className="post-detail-layout animate-fade">
      <button className="back-feed-btn" onClick={() => navigate(-1)}>&larr; Back to Feed</button>

      <div className="thread-main-container">
        <article className="thread-header-card">
          <div className="thread-meta-top">
            <span className="post-category-tag">{post.category}</span>
            <span className="reply-time">{post.timeAgo}</span>
          </div>

          <h2 className="thread-title">{post.title}</h2>

          <div className="post-author-footer" style={{ marginBottom: '1.5rem' }}>
            <span className="author-avatar">{post.avatar}</span>
            <span className="author-name">{post.author}</span>
          </div>

          <div className="thread-body-description">
            {post.description || "No description provided."}
          </div>

          <div className="post-tags-container" style={{ marginBottom: '1.5rem' }}>
            {post.tags.map(tag => <span key={tag} className="hash-tag">#{tag}</span>)}
          </div>

          <div className="thread-voting-actions">
            {/* Оправени кавички на атрибута type тук: */}
            <button className={`btn-secondary ${currentVote === 'up' ? 'active-upvote' : ''}`} type="button" onClick={() => handleVote('up')}>
              ▲ Upvote
            </button>
            {/* Оправени кавички на атрибута type тук: */}
            <button className={`btn-secondary ${currentVote === 'down' ? 'active-downvote' : ''}`} type="button" onClick={() => handleVote('down')}>
              ▼ Downvote
            </button>
          </div>
        </article>

        <section className="replies-section-wrapper">
          <h3>Discussion Thread</h3>
          <div className="replies-stream-box">
            {replies.map(reply => (
              <div key={reply.id} className="reply-node-card">
                <div className="reply-avatar-col">{reply.avatar}</div>
                <div className="reply-content-col">
                  <div className="reply-meta-line">
                    <strong>{reply.author}</strong>
                    <span className="reply-time">{reply.timeAgo}</span>
                  </div>
                  <p className="reply-text-paragraph">{reply.text}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleReplySubmit} className="add-reply-form-node">
            <textarea rows={3} placeholder="Write a response..." value={commentText} onChange={(e) => setCommentText(e.target.value)} required />
            <button type="submit" className="submit-reply-btn">Post Reply</button>
          </form>
        </section>
      </div>
    </div>
  );
}