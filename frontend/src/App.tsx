import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Forum from './Forum.tsx';
import CreatePost from './CreatePost.tsx';
import PostDetail from './PostDetail.tsx';
import './App.css';

import {
  registerUser,
  loginUser,
  getCurrentUser,
  submitVote,
  getPosts,
  createPost
} from './api/auth';

interface User {
  id: number;
  username: string;
  email: string;
  grade: string;
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

type AuthMode = 'none' | 'login' | 'signup' | 'logout-confirm';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();


  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [authMode, setAuthMode] = useState<AuthMode>('none');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [userVotes, setUserVotes] = useState<Record<string, 'up' | 'down' | null>>({});


  const loadPosts = async () => {
    try {
      const response = await getPosts();
      setForumPosts(response.data ?? []);
    } catch (err) {
      console.error('Failed to load posts:', err);
      setForumPosts([]);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);


  useEffect(() => {
    const path = location.pathname;

    if (path === '/') document.title = 'Home';
    else if (path === '/forum') document.title = 'Forum';
    else if (path === '/create-post') document.title = 'Create Post';
    else if (path.startsWith('/post/')) document.title = 'View Post';
    else document.title = 'EduShare';
  }, [location.pathname]);


  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) fetchCurrentUser();
  }, []);

  const normalizeVotes = (votes: Array<{ post_id: string; value: 'up' | 'down' }>) => {
    return votes.reduce((acc, vote) => {
      acc[vote.post_id] = vote.value;
      return acc;
    }, {} as Record<string, 'up' | 'down' | null>);
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await getCurrentUser();
      setCurrentUser(response.data);
      setUserVotes(normalizeVotes(response.data.votes || []));
      setIsLoggedIn(true);
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setIsLoggedIn(false);
      setCurrentUser(null);
      setUserVotes({});
    }
  };


  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    const formData = new FormData(e.currentTarget);

    try {
      const response = await registerUser({
        username: formData.get('username') as string,
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        grade: formData.get('grade') as string,
      });

      const { access, refresh, votes, ...userData } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      setCurrentUser(userData);
      setUserVotes(normalizeVotes(votes || []));
      setIsLoggedIn(true);
      setAuthMode('none');
    } catch (error: any) {
      setAuthError(error.response?.data?.error || 'Registration failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    const formData = new FormData(e.currentTarget);

    try {
      const response = await loginUser({
        username: formData.get('email') as string,
        password: formData.get('password') as string,
      });

      const { access, refresh, votes, ...userData } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      setCurrentUser(userData);
      setUserVotes(normalizeVotes(votes || []));
      setIsLoggedIn(true);
      setAuthMode('none');
    } catch (error: any) {
      setAuthError(error.response?.data?.error || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    setIsLoggedIn(false);
    setCurrentUser(null);
    setUserVotes({});
    setAuthMode('none');

    navigate('/');
  };


  const handleHomeSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      navigate(`/forum?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/forum');
    }
  };


  const handleForumVote = async (postId: string, voteType: 'up' | 'down') => {
    if (!isLoggedIn) {
      setAuthMode('login');
      return false;
    }

    const currentVote = userVotes[postId];
    const nextVote = currentVote === voteType ? null : voteType;
    const voteValue = nextVote === null ? 'none' : nextVote;

    try {
      await submitVote({ post_id: postId, value: voteValue });

      setUserVotes(prev => ({
        ...prev,
        [postId]: nextVote,
      }));

      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };


  const handlePublishPost = async (newPostData: any) => {
    try {
      await createPost(newPostData);
      await loadPosts();
      navigate('/forum');
    } catch (err) {
      console.error('Failed to create post:', err);
    }
  };


  const categories = ['Mathematics', 'Biology', 'History', 'Computer Science', 'Physics', 'Literature'];

  return (
    <>
      <div className={`app-container ${authMode !== 'none' ? 'content-blur' : ''}`}>
        <header className="navbar">
          <div className="logo" onClick={() => navigate('/')}>EduShare</div>

          <nav className="nav-links">
            <button onClick={() => navigate('/')}>Home</button>
            <button onClick={() => navigate('/forum')}>Forum</button>

            {isLoggedIn ? (
              <div>
                👤 {currentUser?.username}
                <button onClick={() => setAuthMode('logout-confirm')}>Log Out</button>
              </div>
            ) : (
              <>
                <button onClick={() => setAuthMode('login')}>Log In</button>
                <button onClick={() => setAuthMode('signup')}>Sign Up</button>
              </>
            )}
          </nav>
        </header>

        <Routes>
          <Route path="/" element={
            <main>
              <form onSubmit={handleHomeSearchSubmit}>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                />
                <button type="submit">Search</button>
              </form>
            </main>
          } />

          <Route path="/forum" element={
            <Forum
              categories={categories}
              forumPosts={forumPosts}
              userVotes={userVotes}
              onVote={handleForumVote}
            />
          } />

          <Route path="/create-post" element={
            <CreatePost
              categories={categories}
              onPublish={handlePublishPost}
              onCancel={() => navigate('/forum')}
            />
          } />

          <Route path="/post/:id" element={
            <PostDetail
              forumPosts={forumPosts}
              userVotes={userVotes}
              onVote={handleForumVote}
              onAddReplyCount={() => {}}
            />
          } />
        </Routes>
      </div>
    </>
  );
}