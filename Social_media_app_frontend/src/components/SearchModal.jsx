import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axiosInstance from '../axiosCalls/axios';
import { addFollowing, removeFollowing } from '../redux/authSlice';

export default function SearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const currentUser = useSelector((state) => state.auth.user);

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'posts'
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState({});

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      fetchSuggestions();
    } else {
      setQuery('');
      setUsers([]);
      setPosts([]);
    }
  }, [isOpen]);

  const fetchSuggestions = async () => {
    try {
      const res = await axiosInstance.get('/users/suggestions');
      setSuggestions(res.data.suggestions || []);
    } catch (err) {
      console.error('Suggestions error:', err);
    }
  };

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setUsers([]);
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const handler = setTimeout(async () => {
      try {
        const [usersRes, postsRes] = await Promise.all([
          axiosInstance.get(`/users/search?q=${encodeURIComponent(trimmed)}`),
          axiosInstance.get(`/posts/search?q=${encodeURIComponent(trimmed)}`)
        ]);

        setUsers(usersRes.data.users || []);
        setPosts(postsRes.data.posts || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  const handleFollowToggle = async (e, targetUser) => {
    e.stopPropagation();
    const targetId = targetUser._id;
    if (followLoading[targetId]) return;

    const isFollowing = (currentUser?.followings || []).some(
      (id) => (id?._id || id)?.toString() === targetId.toString()
    );

    try {
      setFollowLoading((prev) => ({ ...prev, [targetId]: true }));
      if (isFollowing) {
        await axiosInstance.delete(`/users/${targetId}/follow`);
        dispatch(removeFollowing(targetId));
      } else {
        await axiosInstance.post(`/users/${targetId}/follow`);
        dispatch(addFollowing(targetId));
      }

      // Update local isFollowing flag in search results
      setUsers((prev) =>
        prev.map((u) =>
          u._id === targetId ? { ...u, isFollowing: !isFollowing } : u
        )
      );
      setSuggestions((prev) =>
        prev.map((u) =>
          u._id === targetId ? { ...u, isFollowing: !isFollowing } : u
        )
      );
    } catch (err) {
      console.error('Follow toggle error:', err);
    } finally {
      setFollowLoading((prev) => ({ ...prev, [targetId]: false }));
    }
  };

  const handleUserSelect = (username) => {
    onClose();
    navigate(`/profile/${username}`);
  };

  if (!isOpen) return null;

  const currentList = activeTab === 'users' ? users : posts;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-0 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl h-full sm:h-auto sm:max-h-[85vh] bg-white sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Search Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-white">
          <div className="relative flex items-center">
            <span className="absolute left-4 text-slate-400 text-lg pointer-events-none">
              🔍
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people, usernames, or posts..."
              className="w-full rounded-2xl bg-slate-100 pl-11 pr-24 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
            />
            <div className="absolute right-3 flex items-center gap-2">
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 text-xs"
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
              >
                ESC
              </button>
            </div>
          </div>

          {/* Result Filter Tabs */}
          {query.trim() && (
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'users'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                People ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('posts')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'posts'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Posts ({posts.length})
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent"></div>
              <p className="mt-3 text-xs font-medium">Searching SST Social...</p>
            </div>
          ) : !query.trim() ? (
            /* Suggested Users When Query is Empty */
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Suggested for you
                </h3>
                <span className="text-xs text-indigo-600 font-semibold">
                  People to follow
                </span>
              </div>

              {suggestions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  Type in the box above to find creators and friends.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestions.map((user) => {
                    const isFollowing = (currentUser?.followings || []).some(
                      (id) => (id?._id || id)?.toString() === user._id?.toString()
                    );

                    return (
                      <div
                        key={user._id}
                        onClick={() => handleUserSelect(user.username)}
                        className="group flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-indigo-50/40 hover:border-indigo-100 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={
                              user.profileImage ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                user.name || 'User'
                              )}&background=6366f1&color=fff`
                            }
                            alt={user.name}
                            className="h-10 w-10 rounded-full object-cover border border-slate-200"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {user.name}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              @{user.username}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleFollowToggle(e, user)}
                          disabled={followLoading[user._id]}
                          className={`ml-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                            isFollowing
                              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          {followLoading[user._id]
                            ? '...'
                            : isFollowing
                            ? 'Following'
                            : 'Follow'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : currentList.length === 0 ? (
            /* Empty State */
            <div className="py-16 text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-xl text-slate-400">
                🔎
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                No matching {activeTab} found
              </h4>
              <p className="mt-1 text-xs text-slate-400">
                Try searching for another keyword or username.
              </p>
            </div>
          ) : activeTab === 'users' ? (
            /* User Results List */
            <div className="divide-y divide-slate-100">
              {users.map((user) => {
                const isFollowing =
                  user.isFollowing ||
                  (currentUser?.followings || []).some(
                    (id) => (id?._id || id)?.toString() === user._id?.toString()
                  );

                return (
                  <div
                    key={user._id}
                    onClick={() => handleUserSelect(user.username)}
                    className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={
                          user.profileImage ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            user.name || 'User'
                          )}&background=6366f1&color=fff`
                        }
                        alt={user.name}
                        className="h-11 w-11 rounded-full object-cover border border-slate-200"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {user.name}
                          </p>
                          <span className="text-[11px] text-slate-400">
                            @{user.username}
                          </span>
                        </div>
                        {user.bio && (
                          <p className="text-xs text-slate-500 truncate mt-0.5 max-w-sm">
                            {user.bio}
                          </p>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {user.followersCount || 0} followers
                        </span>
                      </div>
                    </div>

                    {!user.isSelf && (
                      <button
                        type="button"
                        onClick={(e) => handleFollowToggle(e, user)}
                        disabled={followLoading[user._id]}
                        className={`ml-3 px-4 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                          isFollowing
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {followLoading[user._id]
                          ? '...'
                          : isFollowing
                          ? 'Following'
                          : 'Follow'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Post Results Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {posts.map((post) => (
                <div
                  key={post._id}
                  onClick={() => {
                    onClose();
                    navigate(`/home`);
                  }}
                  className="rounded-2xl border border-slate-200 bg-white p-3.5 hover:border-indigo-200 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <img
                      src={
                        post.author?.profileImage ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          post.author?.name || 'User'
                        )}&background=6366f1&color=fff`
                      }
                      alt={post.author?.name}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      @{post.author?.username}
                    </span>
                  </div>

                  {post.image && (
                    <img
                      src={post.image}
                      alt="Post"
                      className="w-full h-36 rounded-xl object-cover mb-2"
                    />
                  )}

                  {post.caption && (
                    <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                      {post.caption}
                    </p>
                  )}

                  <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100">
                    <span>❤️ {post.likes?.length || 0} likes</span>
                    <span className="text-indigo-600 font-semibold">View in feed →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
