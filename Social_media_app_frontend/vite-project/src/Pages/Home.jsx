import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../axiosCalls/axios";
import { useAuth } from "../context/AuthContext";
import {
  addPost,
  fetchFeedPosts,
  updatePostLike,
} from "../redux/postsSlice";
import { addReel, fetchReels, updateReelLike } from "../redux/reelsSlice";
import { addStory, fetchStories } from "../redux/storiesSlice";
import Navbar from "../components/Navbar";
import MobileBottomNav from "../components/MobileBottomNav";
import SearchModal from "../components/SearchModal";
import NotificationsPanel from "../components/NotificationsPanel";
import { addFollowing, removeFollowing } from "../redux/authSlice";

function Avatar({ initials, tone = "from-indigo-600 to-violet-600", size = "h-11 w-11" }) {
  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${tone} text-xs font-bold text-white shadow-sm ring-2 ring-white`}
    >
      {initials}
    </div>
  );
}

const getLikeId = (like) => like?._id || like;

function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state
  const posts = useSelector((state) => state.posts.items);
  const postsLoading = useSelector((state) => state.posts.loading);
  const postsError = useSelector((state) => state.posts.error);

  const reels = useSelector((state) => state.reels.items);
  const reelsLoading = useSelector((state) => state.reels.loading);
  const reelsError = useSelector((state) => state.reels.error);

  const stories = useSelector((state) => state.stories.items);
  const storyLoading = useSelector((state) => state.stories.loading);
  const storyStoreError = useSelector((state) => state.stories.error);

  const unreadCount = useSelector((state) => state.notifications.unreadCount);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Story state
  const [storyError, setStoryError] = useState("");
  const [storyFile, setStoryFile] = useState(null);
  const [storyCaption, setStoryCaption] = useState("");
  const [storyCreating, setStoryCreating] = useState(false);
  const [activeStory, setActiveStory] = useState(null);

  // Content composer state
  const [contentType, setContentType] = useState("post"); // 'post' | 'reel'
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Feed filter
  const [feedFilter, setFeedFilter] = useState("all"); // 'all' | 'posts' | 'reels'

  // Like & Comment interaction state
  const [openComments, setOpenComments] = useState({});
  const [commentsByItem, setCommentsByItem] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentLoading, setCommentLoading] = useState({});
  const [likeLoading, setLikeLoading] = useState({});
  const [interactionError, setInteractionError] = useState({});

  // Suggested users
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followLoading, setFollowLoading] = useState({});

  const fileInputRef = useRef(null);

  const getItemKey = (type, id) => `${type}-${id}`;

  const isLikedByCurrentUser = (item) => {
    if (!user?._id) return false;
    return (item.likes || []).some(
      (like) => getLikeId(like)?.toString() === user._id.toString()
    );
  };

  useEffect(() => {
    dispatch(fetchFeedPosts());
    dispatch(fetchReels());
    dispatch(fetchStories());
    fetchSuggestions();
  }, [dispatch]);

  const fetchSuggestions = async () => {
    try {
      const res = await axiosInstance.get("/users/suggestions");
      setSuggestedUsers(res.data.suggestions || []);
    } catch (err) {
      console.error("Suggestions fetch error:", err);
    }
  };

  const handleFollowSuggestion = async (targetUser) => {
    const targetId = targetUser._id;
    if (followLoading[targetId]) return;

    const isFollowing = (user?.followings || []).some(
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
      setSuggestedUsers((prev) =>
        prev.map((u) =>
          u._id === targetId ? { ...u, isFollowing: !isFollowing } : u
        )
      );
    } catch (err) {
      console.error("Follow error:", err);
    } finally {
      setFollowLoading((prev) => ({ ...prev, [targetId]: false }));
    }
  };

  const handleCreateStory = async (event) => {
    event.preventDefault();

    if (!storyFile) {
      setStoryError("Please select an image for your story.");
      return;
    }

    try {
      setStoryCreating(true);
      setStoryError("");

      const formData = new FormData();
      formData.append("caption", storyCaption.trim());
      formData.append("image", storyFile);

      const response = await axiosInstance.post("/stories/createStory", formData);
      dispatch(addStory(response.data.story));
      setStoryFile(null);
      setStoryCaption("");
      event.target.reset();
    } catch (error) {
      console.error("Story creation failed:", error);
      setStoryError(error.response?.data?.message || "Unable to create story.");
    } finally {
      setStoryCreating(false);
    }
  };

  const getStoryLabel = (story) => {
    if (story.author?._id === user?._id) return "Your Story";
    return story.author?.username || "Story";
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (contentType === "post" && !file.type.startsWith("image/")) {
      setCreateError("Please select an image file for posts.");
      return;
    }

    if (contentType === "reel" && !file.type.startsWith("video/")) {
      setCreateError("Please select a video file for reels.");
      return;
    }

    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
    setCreateError("");
  };

  const handleContentTypeChange = (type) => {
    setContentType(type);
    setSelectedFile(null);
    setFilePreview("");
    setCreateError("");
  };

  const handleCreateContent = async (event) => {
    event.preventDefault();

    if (contentType === "post" && !caption.trim() && !selectedFile) {
      setCreateError("Add a caption or select an image.");
      return;
    }

    if (contentType === "reel" && !selectedFile) {
      setCreateError("Please select a video for your reel.");
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError("");

      const formData = new FormData();
      formData.append("caption", caption.trim());
      if (selectedFile) {
        formData.append(contentType === "post" ? "image" : "video", selectedFile);
      }

      if (contentType === "post") {
        const response = await axiosInstance.post("/posts", formData);
        dispatch(addPost(response.data.post));
      } else {
        const response = await axiosInstance.post("/reels", formData);
        dispatch(addReel(response.data.reel));
      }

      setCaption("");
      setSelectedFile(null);
      setFilePreview("");
      setIsCreateModalOpen(false);
      event.target.reset?.();
    } catch (error) {
      console.error("Content creation failed:", error);
      setCreateError(error.response?.data?.message || "Unable to create content.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleLike = async (type, id) => {
    const key = getItemKey(type, id);

    try {
      setLikeLoading((prev) => ({ ...prev, [key]: true }));
      setInteractionError((prev) => ({ ...prev, [key]: "" }));

      const endpoint = type === "post" ? `/posts/${id}/like` : `/reels/${id}/like`;
      const response = await axiosInstance.patch(endpoint);
      const liked = response.data.liked;

      if (type === "post") {
        dispatch(
          updatePostLike({
            postId: id,
            userId: user?._id,
            liked,
          })
        );
      } else {
        dispatch(updateReelLike({ reelId: id, userId: user?._id, liked }));
      }
    } catch (error) {
      console.error("Like update failed:", error);
      setInteractionError((prev) => ({
        ...prev,
        [key]: error.response?.data?.message || "Unable to update like.",
      }));
    } finally {
      setLikeLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleToggleComments = async (type, id) => {
    const key = getItemKey(type, id);
    const willOpen = !openComments[key];

    setOpenComments((prev) => ({ ...prev, [key]: willOpen }));

    if (!willOpen || commentsByItem[key] !== undefined) {
      return;
    }

    try {
      setCommentLoading((prev) => ({ ...prev, [key]: true }));
      setInteractionError((prev) => ({ ...prev, [key]: "" }));

      const response = await axiosInstance.get(`/comments/${type}/${id}`);

      setCommentsByItem((prev) => ({
        ...prev,
        [key]: response.data.comments || [],
      }));
    } catch (error) {
      console.error("Comments fetch failed:", error);
      setInteractionError((prev) => ({
        ...prev,
        [key]: error.response?.data?.message || "Unable to load comments.",
      }));
    } finally {
      setCommentLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleAddComment = async (event, type, id) => {
    event.preventDefault();

    const key = getItemKey(type, id);
    const text = commentInputs[key]?.trim();

    if (!text) return;

    try {
      setCommentLoading((prev) => ({ ...prev, [key]: true }));
      setInteractionError((prev) => ({ ...prev, [key]: "" }));

      const response = await axiosInstance.post(`/comments/${type}/${id}`, {
        text,
      });

      setCommentsByItem((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), response.data.comment],
      }));

      setCommentInputs((prev) => ({
        ...prev,
        [key]: "",
      }));
    } catch (error) {
      console.error("Comment create failed:", error);
      setInteractionError((prev) => ({
        ...prev,
        [key]: error.response?.data?.message || "Unable to add comment.",
      }));
    } finally {
      setCommentLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleDeleteComment = async (commentId, type, id) => {
    const key = getItemKey(type, id);

    try {
      setInteractionError((prev) => ({ ...prev, [key]: "" }));
      await axiosInstance.delete(`/comments/${commentId}`);

      setCommentsByItem((prev) => ({
        ...prev,
        [key]: (prev[key] || []).filter((comment) => comment._id !== commentId),
      }));
    } catch (error) {
      console.error("Comment delete failed:", error);
      setInteractionError((prev) => ({
        ...prev,
        [key]: error.response?.data?.message || "Unable to delete comment.",
      }));
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const getInitials = (name) =>
    name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "U";

  const renderInteractions = (item, type) => {
    const key = getItemKey(type, item._id);
    const liked = isLikedByCurrentUser(item);
    const comments = commentsByItem[key];

    return (
      <>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="text-rose-500 font-bold">♥</span> {item.likes?.length || 0} likes
          </span>
          <span>
            {comments !== undefined
              ? `${comments.length} ${comments.length === 1 ? "comment" : "comments"}`
              : "View discussion"}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-2.5">
          <button
            type="button"
            onClick={() => handleLike(type, item._id)}
            disabled={likeLoading[key]}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
              liked
                ? "bg-rose-50 text-rose-600"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className="text-sm">{liked ? "❤️" : "🤍"}</span>
            <span>{liked ? "Liked" : "Like"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleToggleComments(type, item._id)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition active:scale-95"
          >
            <span className="text-sm">💬</span>
            <span>{openComments[key] ? "Hide" : "Comment"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: "SST Social Post",
                  url: window.location.href,
                }).catch(() => {});
              } else {
                navigator.clipboard?.writeText(window.location.href);
                alert("Post link copied to clipboard!");
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition active:scale-95"
          >
            <span className="text-sm">↗️</span>
            <span>Share</span>
          </button>
        </div>

        {interactionError[key] && (
          <p className="mt-2 text-xs text-red-500">{interactionError[key]}</p>
        )}

        {openComments[key] && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            {commentLoading[key] && comments === undefined ? (
              <p className="text-xs text-slate-400 py-2">Loading comments...</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {(comments || []).map((comment) => (
                  <div key={comment._id} className="flex items-start gap-2.5">
                    <img
                      src={
                        comment.user?.profileImage ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          comment.user?.name || "User"
                        )}&background=6366f1&color=fff`
                      }
                      alt={comment.user?.name || "User"}
                      className="h-7 w-7 shrink-0 rounded-full object-cover"
                    />

                    <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 px-3.5 py-2.5 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-800">
                          {comment.user?.name || "User"}
                        </span>
                        {comment.user?._id === user?._id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment._id, type, item._id)}
                            className="text-[11px] font-semibold text-slate-400 hover:text-red-500"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="mt-1 break-words text-slate-600 leading-relaxed">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))}

                {comments?.length === 0 && (
                  <p className="text-xs text-slate-400 py-1">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                )}
              </div>
            )}

            <form
              onSubmit={(event) => handleAddComment(event, type, item._id)}
              className="mt-3 flex items-center gap-2"
            >
              <input
                type="text"
                value={commentInputs[key] || ""}
                onChange={(event) =>
                  setCommentInputs((prev) => ({
                    ...prev,
                    [key]: event.target.value,
                  }))
                }
                maxLength={500}
                placeholder="Write a comment..."
                className="min-w-0 flex-1 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700 outline-none focus:bg-slate-100 focus:ring-1 focus:ring-indigo-400 transition"
              />
              <button
                type="submit"
                disabled={commentLoading[key] || !commentInputs[key]?.trim()}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Post
              </button>
            </form>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20 md:pb-8">
      {/* Top Navbar */}
      <Navbar onOpenCreate={() => setIsCreateModalOpen(true)} />

      {/* Main 3-Column Responsive Layout */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 grid grid-cols-1 gap-6 lg:grid-cols-[250px_minmax(0,1fr)_320px]">
        {/* Left Sticky Navigation (Desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-3 shadow-xs">
              <button
                type="button"
                onClick={() => setFeedFilter("all")}
                className={`flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-left transition ${
                  feedFilter === "all"
                    ? "bg-indigo-50 font-bold text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 font-semibold"
                }`}
              >
                <span className="text-xl">🏠</span>
                <span className="text-sm">Home Feed</span>
              </button>

              <button
                type="button"
                onClick={() => setFeedFilter("posts")}
                className={`flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-left transition ${
                  feedFilter === "posts"
                    ? "bg-indigo-50 font-bold text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 font-semibold"
                }`}
              >
                <span className="text-xl">📸</span>
                <span className="text-sm">Posts Only</span>
              </button>

              <button
                type="button"
                onClick={() => setFeedFilter("reels")}
                className={`flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-left transition ${
                  feedFilter === "reels"
                    ? "bg-indigo-50 font-bold text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 font-semibold"
                }`}
              >
                <span className="text-xl">🎬</span>
                <span className="text-sm">Reels Explorer</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-left text-slate-600 transition hover:bg-slate-50 font-semibold"
              >
                <span className="text-xl">🔍</span>
                <span className="text-sm">Search</span>
              </button>

              <button
                type="button"
                onClick={() => setIsNotificationsOpen(true)}
                className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-slate-600 transition hover:bg-slate-50 font-semibold"
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-xl">🔔</span>
                  <span className="text-sm">Notifications</span>
                </div>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate(`/profile/${user?.username}`)}
                className="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-left text-slate-600 transition hover:bg-slate-50 font-semibold"
              >
                <span className="text-xl">👤</span>
                <span className="text-sm">My Profile</span>
              </button>
            </div>

            {/* Quick Action Button */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-700 hover:to-violet-700 active:scale-98 transition"
            >
              <span>➕</span>
              <span>New Post / Reel</span>
            </button>

            {/* User Mini Profile Card */}
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
              <img
                src={
                  user?.profileImage ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.name || "User"
                  )}&background=6366f1&color=fff`
                }
                alt={user?.name}
                className="h-10 w-10 rounded-full object-cover border border-slate-200"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">@{user?.username}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 text-xs transition"
                title="Logout"
              >
                🚪
              </button>
            </div>
          </div>
        </aside>

        {/* Center Column: Stories + Composer + Feed */}
        <section className="min-w-0 space-y-5">
          {/* Stories Card */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">✨</span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Stories</h2>
              </div>
              <span className="text-[11px] text-slate-400">Expires in 24h</span>
            </div>

            <div className="p-4">
              {/* Add Story Input Row */}
              <form onSubmit={handleCreateStory} className="mb-4 flex flex-wrap items-center gap-2 bg-slate-50/70 p-2.5 rounded-2xl border border-slate-100">
                <input
                  type="text"
                  value={storyCaption}
                  onChange={(e) => setStoryCaption(e.target.value)}
                  maxLength={200}
                  placeholder="Share a thought with your story..."
                  className="min-w-0 flex-1 bg-white rounded-xl px-3 py-2 text-xs text-slate-700 outline-none border border-slate-200 focus:border-indigo-400"
                />
                <label className="cursor-pointer rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
                  {storyFile ? storyFile.name : "📷 Photo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setStoryFile(f);
                      setStoryError("");
                    }}
                  />
                </label>
                <button
                  type="submit"
                  disabled={storyCreating || !storyFile}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {storyCreating ? "Uploading..." : "Share Story"}
                </button>
              </form>

              {storyError && <p className="mb-3 text-xs text-rose-500 font-medium">{storyError}</p>}

              {storyLoading ? (
                <p className="text-xs text-slate-400 py-3">Loading stories...</p>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
                  {stories.map((story) => (
                    <button
                      key={story._id}
                      type="button"
                      onClick={() => setActiveStory(story)}
                      className="group flex w-18 shrink-0 flex-col items-center gap-1.5 focus:outline-none"
                    >
                      <div className="rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[2.5px] transition group-hover:scale-105 shadow-sm">
                        <div className="rounded-full bg-white p-[2px]">
                          <img
                            src={story.author?.profileImage || story.image}
                            alt={story.author?.username || "Story"}
                            className="h-13 w-13 rounded-full object-cover"
                          />
                        </div>
                      </div>
                      <span className="w-full truncate text-center text-[11px] font-semibold text-slate-700">
                        {getStoryLabel(story)}
                      </span>
                    </button>
                  ))}

                  {stories.length === 0 && (
                    <div className="py-2 text-xs text-slate-400 italic">
                      No active stories right now. Be the first to add one!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Inline Composer (Desktop) */}
          <div className="hidden sm:block rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-start gap-3.5">
              <img
                src={
                  user?.profileImage ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.name || "User"
                  )}&background=6366f1&color=fff`
                }
                alt={user?.name}
                className="h-10 w-10 rounded-full object-cover border border-slate-200"
              />

              <div className="flex-1">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder={`What's happening, ${user?.name?.split(" ")[0] || "there"}?`}
                  className="w-full resize-none rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-400 transition"
                />

                {filePreview && (
                  <div className="relative mt-3 inline-block">
                    {contentType === "post" ? (
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="max-h-48 rounded-2xl object-cover border border-slate-200 shadow-sm"
                      />
                    ) : (
                      <video
                        src={filePreview}
                        controls
                        className="max-h-48 rounded-2xl object-cover border border-slate-200 shadow-sm"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview("");
                      }}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center shadow"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleContentTypeChange("post")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        contentType === "post"
                          ? "bg-indigo-50 text-indigo-700 font-bold"
                          : "text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      📷 Photo Post
                    </button>

                    <button
                      type="button"
                      onClick={() => handleContentTypeChange("reel")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        contentType === "reel"
                          ? "bg-indigo-50 text-indigo-700 font-bold"
                          : "text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      🎬 Video Reel
                    </button>

                    <label className="cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition">
                      {selectedFile ? "Change file" : "Upload file"}
                      <input
                        type="file"
                        accept={contentType === "post" ? "image/*" : "video/*"}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateContent}
                    disabled={createLoading}
                    className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
                  >
                    {createLoading ? "Sharing..." : contentType === "post" ? "Publish Post" : "Publish Reel"}
                  </button>
                </div>

                {createError && (
                  <p className="mt-2 text-xs text-rose-500 font-medium">{createError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Feed Filter Header */}
          <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFeedFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  feedFilter === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                All Feed
              </button>
              <button
                type="button"
                onClick={() => setFeedFilter("posts")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  feedFilter === "posts" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Posts ({posts.length})
              </button>
              <button
                type="button"
                onClick={() => setFeedFilter("reels")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  feedFilter === "reels" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Reels ({reels.length})
              </button>
            </div>

            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Sorted by Latest
            </span>
          </div>

          {/* Feed List Items */}
          <div className="space-y-5">
            {postsLoading && (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent"></div>
                <p className="mt-3">Loading your personalized feed...</p>
              </div>
            )}

            {/* Posts */}
            {(feedFilter === "all" || feedFilter === "posts") &&
              posts.map((post) => (
                <article
                  key={post._id}
                  className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs hover:border-slate-300 transition"
                >
                  {/* Post Header */}
                  <div className="flex items-center justify-between px-5 py-4">
                    <button
                      type="button"
                      onClick={() => navigate(`/profile/${post.author?.username}`)}
                      className="flex items-center gap-3 text-left group"
                    >
                      <img
                        src={
                          post.author?.profileImage ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            post.author?.name || "User"
                          )}&background=6366f1&color=fff`
                        }
                        alt={post.author?.name || "User"}
                        className="h-10 w-10 rounded-full object-cover border border-slate-200 group-hover:ring-2 group-hover:ring-indigo-400 transition"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">
                          {post.author?.name || "User"}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          @{post.author?.username} •{" "}
                          {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Post Media */}
                  {post.image && (
                    <img
                      src={post.image}
                      alt={post.caption || "Post"}
                      className="max-h-[580px] w-full object-cover border-y border-slate-100"
                    />
                  )}

                  {/* Post Content & Actions */}
                  <div className="px-5 py-4">
                    {post.caption && (
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                        {post.caption}
                      </p>
                    )}

                    {renderInteractions(post, "post")}
                  </div>
                </article>
              ))}

            {/* Reels */}
            {(feedFilter === "all" || feedFilter === "reels") &&
              reels.map((reel) => (
                <article
                  key={reel._id}
                  className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs"
                >
                  <div className="flex items-center justify-between px-5 py-4">
                    <button
                      type="button"
                      onClick={() => navigate(`/profile/${reel.author?.username}`)}
                      className="flex items-center gap-3 text-left group"
                    >
                      <img
                        src={
                          reel.author?.profileImage ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            reel.author?.name || "User"
                          )}&background=6366f1&color=fff`
                        }
                        alt={reel.author?.name || "User"}
                        className="h-10 w-10 rounded-full object-cover border border-slate-200 group-hover:ring-2 group-hover:ring-indigo-400 transition"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">
                            {reel.author?.name || "User"}
                          </p>
                          <span className="px-1.5 py-0.5 rounded-md bg-purple-50 text-[10px] font-bold text-purple-600 border border-purple-200">
                            Reel
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          @{reel.author?.username} •{" "}
                          {new Date(reel.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                  </div>

                  {reel.video && (
                    <div className="relative bg-black flex items-center justify-center max-h-[620px] aspect-[9/16] sm:aspect-auto">
                      <video
                        src={reel.video}
                        controls
                        className="max-h-[620px] w-full object-contain"
                      />
                    </div>
                  )}

                  <div className="px-5 py-4">
                    {reel.caption && (
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                        {reel.caption}
                      </p>
                    )}

                    {renderInteractions(reel, "reel")}
                  </div>
                </article>
              ))}

            {/* Empty State */}
            {!postsLoading && posts.length === 0 && reels.length === 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
                <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl">
                  🚀
                </div>
                <h3 className="text-sm font-bold text-slate-800">Your feed is waiting</h3>
                <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                  Publish a post or reel, or search for other users to build your circle!
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
                >
                  Create First Post
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Right Sticky Sidebar (Desktop): Suggested Users */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-5">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Who to follow
                </h2>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Explore →
                </button>
              </div>

              <div className="space-y-3.5">
                {suggestedUsers.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">
                    No new suggestions at the moment.
                  </p>
                ) : (
                  suggestedUsers.map((sugUser) => (
                    <div
                      key={sugUser._id}
                      className="flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-slate-50 transition"
                    >
                      <button
                        type="button"
                        onClick={() => navigate(`/profile/${sugUser.username}`)}
                        className="flex items-center gap-3 min-w-0 text-left"
                      >
                        <img
                          src={
                            sugUser.profileImage ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              sugUser.name || "User"
                            )}&background=6366f1&color=fff`
                          }
                          alt={sugUser.name}
                          className="h-9 w-9 rounded-full object-cover border border-slate-200"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {sugUser.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            @{sugUser.username}
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleFollowSuggestion(sugUser)}
                        disabled={followLoading[sugUser._id]}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                          sugUser.isFollowing
                            ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs"
                        }`}
                      >
                        {followLoading[sugUser._id]
                          ? "..."
                          : sugUser.isFollowing
                          ? "Following"
                          : "Follow"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="p-4 rounded-3xl bg-slate-100/70 border border-slate-200/60 text-[11px] text-slate-400 space-y-2">
              <p className="font-semibold text-slate-500">SST Social Platform</p>
              <div className="flex flex-wrap gap-2 text-slate-500">
                <span>Privacy</span>•
                <span>Terms</span>•
                <span>Community Guidelines</span>
              </div>
              <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
            </div>
          </div>
        </aside>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        onOpenCreate={() => setIsCreateModalOpen(true)}
        onSelectReels={() => setFeedFilter("reels")}
      />

      {/* Story Fullscreen Viewer Modal */}
      {activeStory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={() => setActiveStory(null)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-3xl bg-slate-950 shadow-2xl border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar with Timer */}
            <div className="p-3 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <img
                  src={activeStory.author?.profileImage || activeStory.image}
                  alt={activeStory.author?.username}
                  className="h-8 w-8 rounded-full object-cover border border-white/40"
                />
                <div>
                  <p className="text-xs font-bold">{getStoryLabel(activeStory)}</p>
                  <p className="text-[10px] text-white/60">
                    {new Date(activeStory.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveStory(null)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <img
              src={activeStory.image}
              alt="Story"
              className="max-h-[68vh] w-full object-contain bg-black"
            />

            {activeStory.caption && (
              <div className="p-4 bg-slate-950 text-white text-xs leading-relaxed border-t border-slate-800">
                {activeStory.caption}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content Creation Modal (Mobile & Universal) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-base">✨</span>
                <h3 className="text-sm font-bold text-slate-800">
                  Create {contentType === "post" ? "Photo Post" : "Video Reel"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-700 text-lg flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => handleContentTypeChange("post")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                    contentType === "post"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  📷 Photo Post
                </button>
                <button
                  type="button"
                  onClick={() => handleContentTypeChange("reel")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                    contentType === "reel"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  🎬 Video Reel
                </button>
              </div>

              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Write a caption or description..."
                className="w-full rounded-2xl bg-slate-50 p-4 text-xs sm:text-sm text-slate-800 outline-none border border-slate-200 focus:border-indigo-400 transition"
              />

              {filePreview ? (
                <div className="relative inline-block w-full">
                  {contentType === "post" ? (
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="max-h-56 w-full rounded-2xl object-cover border border-slate-200"
                    />
                  ) : (
                    <video
                      src={filePreview}
                      controls
                      className="max-h-56 w-full rounded-2xl object-cover border border-slate-200"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview("");
                    }}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-slate-900/80 text-white text-xs flex items-center justify-center shadow"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/20 transition">
                  <span className="text-3xl mb-2">
                    {contentType === "post" ? "🖼️" : "🎥"}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    Click to select {contentType === "post" ? "image" : "video"}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    {contentType === "post" ? "PNG, JPG up to 5MB" : "MP4, WebM up to 50MB"}
                  </span>
                  <input
                    type="file"
                    accept={contentType === "post" ? "image/*" : "video/*"}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}

              {createError && (
                <p className="text-xs text-rose-500 font-medium">{createError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateContent}
                  disabled={createLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 transition shadow-sm"
                >
                  {createLoading ? "Sharing..." : "Publish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Search and Notifications Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <NotificationsPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
}

export default Home;