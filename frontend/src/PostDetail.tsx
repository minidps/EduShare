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
  onAddReplyCount: (id: string) => void;
}

export default function PostDetail({ forumPosts, onAddReplyCount }: PostDetailProps) {
  const { id } = useParams<{ id: string }>(); // Вземане на ID-то директно от URL адреса
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  
  const post = forumPosts.find(p => p.id === id);

  const [replies, setReplies] = useState<Reply[]>([
    { id: '1', author: 'StudyGuru99', avatar: '🦉', text: 'Thanks for bringing this up!', timeAgo: '1 hour ago' },
  ]);

  if (!post) {
    return (
      <div className="post-detail-layout" style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>Post not found</h2>
        <button className="btn-primary" onClick={() => navigate('/forum')}>Return to Forum</button>
      </div>
    );
  }

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReply: Reply = {
      id: String(replies.length + 1),
      author: 'CurrentStudent',
      avatar: '🦊',
      text: commentText,
      timeAgo: 'Just now'
    };

    setReplies([...replies, newReply]);
    onAddReplyCount(post.id);
    setCommentText('');
  };

  return (
    <div className="post-detail-layout">
      <button className="back-feed-btn" onClick={() => navigate('/forum')}>
        &larr; Back to Discussion Feed
      </button>

      <div className="thread-main-container">
        <article className="thread-header-card">
          <div className="thread-meta-top">
            <span className="post-category-tag">{post.category}</span>
            <div className="tags-wrapper">{post.tags.map(tag => <span key={tag} className="hash-tag">#{tag}</span>)}</div>
          </div>

          <h2 className="thread-title-main">{post.title}</h2>

          <div className="thread-author-profile-bar">
            <span className="author-avatar">{post.avatar}</span>
            <div className="author-profile-details">
              <strong>{post.author}</strong>
              <span className="time-posted">Published {post.timeAgo}</span>
            </div>
          </div>

          <div className="thread-body-text-content" dangerouslySetInnerHTML={{ __html: post.description || '' }} />

          <div className="thread-footer-metrics">
            <span className="metric-badge">▲ {post.upvotes} Upvotes</span>
            <span className="metric-badge">💬 {post.replies + replies.length - 1} Replies</span>
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
            <button type="submit" className="btn-primary submit-reply-btn">Post Reply</button>
          </form>
        </section>
      </div>
    </div>
  );
}