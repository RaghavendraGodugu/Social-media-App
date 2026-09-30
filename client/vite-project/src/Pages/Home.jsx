import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { axiosInstance } from "../axiosCalls/axios";
import { useDispatch } from "react-redux";
import { setPosts } from "../redux/postSlice";



const getStories = async () => {
  const response = await axiosInstance.get("/story/getStories");
  return response.data.stories || [];
};


function Avatar({ initials, tone = "from-slate-700 to-slate-900", size = "h-11 w-11" }) {
  return (
    <div className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${tone} text-xs font-bold text-white ring-2 ring-white`}>
      {initials}
    </div>
  );
}

function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [contentType, setContentType] = useState("post");
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedItems, setFeedItems] = useState([]);
  const [fetchingFeed, setFetchingFeed] = useState(true);
  const [stories, setStories] = useState([]);
  const [fetchingStories, setFetchingStories] = useState(true);
  const [storyFormOpen, setStoryFormOpen] = useState(false);
  const [storyCaption, setStoryCaption] = useState("");
  const [storyFile, setStoryFile] = useState(null);
  const [storyPreview, setStoryPreview] = useState("");
  const [creatingStory, setCreatingStory] = useState(false);
  const [activeStory, setActiveStory] = useState(null);
  const [openComments, setOpenComments] = useState({});
  const [commentsByItem, setCommentsByItem] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentLoading, setCommentLoading] = useState({});
  const [interactionError, setInteractionError] = useState({});

  const dispatch = useDispatch()

  const getInitials = (name) =>
    name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "U";

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  // Group all active stories by author so one user gets one story bubble.
  // Keep the logged-in user's story group first.
  const storyGroups = Object.values(
    stories.reduce((groups, story) => {
      const authorId = story.author?._id;
      if (!authorId) return groups;

      if (!groups[authorId]) {
        groups[authorId] = {
          author: story.author,
          stories: [],
        };
      }

      groups[authorId].stories.push(story);
      return groups;
    }, {})
  )
    .map((group) => ({
      ...group,
      stories: [...group.stories].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      ),
    }))
    .sort((a, b) => {
      const aIsCurrentUser = a.author?._id === user?._id;
      const bIsCurrentUser = b.author?._id === user?._id;

      if (aIsCurrentUser && !bIsCurrentUser) return -1;
      if (!aIsCurrentUser && bIsCurrentUser) return 1;

      const aLatest = a.stories[a.stories.length - 1]?.createdAt;
      const bLatest = b.stories[b.stories.length - 1]?.createdAt;
      return new Date(bLatest) - new Date(aLatest);
    });

  const openStoryGroup = (group) => {
    setActiveStory({
      group,
      index: 0,
    });
  };

  const showNextStory = () => {
    if (!activeStory) return;

    if (activeStory.index < activeStory.group.stories.length - 1) {
      setActiveStory((current) => ({
        ...current,
        index: current.index + 1,
      }));
    } else {
      setActiveStory(null);
    }
  };

  const showPreviousStory = () => {
    if (!activeStory || activeStory.index === 0) return;

    setActiveStory((current) => ({
      ...current,
      index: current.index - 1,
    }));
  };

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const [postsRes, reelsRes] = await Promise.all([
          axiosInstance.get("/post/getAllPosts"),
          axiosInstance.get("/reel/getAllReels"),
        ]);

        const posts = (postsRes.data.posts || []).map((post) => ({
          ...post,
          type: "post",
        }));

        dispatch(setPosts(posts))





        const reels = (reelsRes.data.reels || []).map((reel) => ({
          ...reel,
          type: "reel",
        }));

        const combined = [...posts, ...reels].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setFeedItems(combined);
      } catch (error) {
        console.error("Error fetching feed items:", error);
      } finally {
        setFetchingFeed(false);
      }
    };

    fetchFeed();
  }, []);

  const fetchStories = async () => {
    try {
      setStories(await getStories());
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setFetchingStories(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    getStories()
      .then((fetchedStories) => {
        if (mounted) setStories(fetchedStories);
      })
      .catch((error) => {
        console.error("Error fetching stories:", error);
      })
      .finally(() => {
        if (mounted) setFetchingStories(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (storyPreview) URL.revokeObjectURL(storyPreview);
    };
  }, [storyPreview]);

  const handleStoryFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStoryFile(file);
    setStoryPreview(URL.createObjectURL(file));
  };

  const closeStoryForm = () => {
    if (creatingStory) return;
    setStoryFormOpen(false);
    setStoryCaption("");
    setStoryFile(null);
    setStoryPreview("");
  };

  const handleCreateStory = async (event) => {
    event.preventDefault();

    if (!storyFile || !storyCaption.trim()) {
      alert("Please add an image and a caption.");
      return;
    }

    try {
      setCreatingStory(true);
      const formData = new FormData();
      formData.append("image", storyFile);
      formData.append("caption", storyCaption.trim());

      await axiosInstance.post("/story/createStory", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await fetchStories();
      setStoryFormOpen(false);
      setStoryCaption("");
      setStoryFile(null);
      setStoryPreview("");
    } catch (error) {
      console.error("Error creating story:", error);
      alert(error.response?.data?.message || "Failed to create story");
    } finally {
      setCreatingStory(false);
    }
  };

  const getItemKey = (type, id) => `${type}-${id}`;

  // Handle Like/Unlike with Optimistic UI updates
  const handleToggleLike = async (itemId, type) => {
    const previousItems = [...feedItems];

    setFeedItems((prevItems) =>
      prevItems.map((item) => {
        if (item._id === itemId) {
          const likesArray = item.likes || [];
          const isLiked = likesArray.includes(user?._id);
          const updatedLikes = isLiked
            ? likesArray.filter((id) => id !== user?._id)
            : [...likesArray, user?._id];

          return { ...item, likes: updatedLikes };
        }
        return item;
      })
    );

    try {
      const response = await axiosInstance.post(`/${type}/like/${itemId}`);
      const { likes, likesCount } = response.data;

      // Sync backend like data
      setFeedItems((prevItems) =>
        prevItems.map((item) => {
          if (item._id === itemId) {
            return {
              ...item,
              likes: Array.isArray(likes) ? likes : item.likes,
              likesCount: likesCount ?? (Array.isArray(likes) ? likes.length : item.likes?.length || 0),
            };
          }
          return item;
        })
      );
    } catch (error) {
      console.error("Error toggling like:", error);
      setFeedItems(previousItems); // Rollback on API error
    }
  };

  const handleToggleComments = async (type, id) => {
    const key = getItemKey(type, id);
    const willOpen = !openComments[key];

    setOpenComments((prev) => ({ ...prev, [key]: willOpen }));
    if (!willOpen || commentsByItem[key] !== undefined) return;

    try {
      setCommentLoading((prev) => ({ ...prev, [key]: true }));
      setInteractionError((prev) => ({ ...prev, [key]: "" }));
      const response = await axiosInstance.get(`/comment/${type}/${id}`);
      setCommentsByItem((prev) => ({
        ...prev,
        [key]: response.data.comments || [],
      }));
    } catch (error) {
      console.error("Error fetching comments:", error);
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
      const response = await axiosInstance.post(`/comment/${type}/${id}`, { text });
      setCommentsByItem((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), response.data.comment],
      }));
      setCommentInputs((prev) => ({ ...prev, [key]: "" }));
    } catch (error) {
      console.error("Error adding comment:", error);
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
      await axiosInstance.delete(`/comment/${commentId}`);
      setCommentsByItem((prev) => ({
        ...prev,
        [key]: (prev[key] || []).filter((comment) => comment._id !== commentId),
      }));
    } catch (error) {
      console.error("Error deleting comment:", error);
      setInteractionError((prev) => ({
        ...prev,
        [key]: error.response?.data?.message || "Unable to delete comment.",
      }));
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleContentTypeChange = (type) => {
    setContentType(type);
    setSelectedFile(null);
  };

  const handleCreateContent = async () => {
    if (!caption && !selectedFile) {
      alert(`Please provide a caption or select an ${contentType === "post" ? "image" : "video"}.`);
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("caption", caption);

      if (selectedFile) {
        const fieldName = contentType === "post" ? "image" : "file";
        formData.append(fieldName, selectedFile);
      }

      const endpoint = contentType === "post" ? "/post/createPost" : "/reel/create";

      const response = await axiosInstance.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newItem = response.data.post || response.data.reel;
      const createdType = contentType;

      setFeedItems((prev) => [{ ...newItem, type: createdType, likes: newItem.likes || [] }, ...prev]);

      setCaption("");
      setSelectedFile(null);
    } catch (error) {
      console.error("Error creating content:", error);
      alert(error.response?.data?.message || "Failed to create content");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <button onClick={() => navigate("/home")} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-black text-white shadow-sm">
              S
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-base font-black tracking-tight">SST Social</p>
              <p className="text-[11px] text-slate-500">Your circle, your feed.</p>
            </div>
          </button>

          <div className="hidden w-72 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500 md:flex">
            <span className="text-base">⌕</span>
            <span>Search people or posts</span>
          </div>

          <div className="flex items-center gap-2">
            <button className="rounded-full p-2.5 text-slate-500 transition hover:bg-slate-100" aria-label="Notifications">♡</button>
            <button
              onClick={() => navigate(`/profile/${user?.username}`)}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 transition hover:border-slate-300 hover:shadow-sm"
            >
              <Avatar initials={getInitials(user?.name)} tone="from-indigo-500 to-violet-500" size="h-8 w-8" />
              <span className="hidden text-sm font-semibold sm:block">{user?.name || user?.username || "You"}</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)_280px]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
              <button className="flex w-full items-center gap-3 rounded-2xl bg-indigo-50 px-4 py-3 text-left">
                <span className="text-lg">⌂</span>
                <span className="text-sm font-bold text-indigo-700">Home Feed</span>
              </button>
              <button
                onClick={() => navigate(`/profile/${user?.username}`)}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-slate-600 transition hover:bg-slate-50"
              >
                <span className="text-lg">◉</span>
                <span className="text-sm font-semibold">My Profile</span>
              </button>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <h1 className="text-xl font-black tracking-tight">Your Feed</h1>
                <p className="mt-1 text-xs text-slate-500">See what your circle is up to.</p>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto border-t border-slate-100 px-5 py-4 scrollbar-hide">
              <button
                type="button"
                onClick={() => setStoryFormOpen(true)}
                className="group flex w-[76px] shrink-0 flex-col items-center gap-2"
              >
                <div className="relative rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 p-[3px] transition group-hover:scale-105">
                  <div className="rounded-full bg-white p-[2px]">
                    <Avatar initials={getInitials(user?.name)} tone="from-indigo-500 to-violet-500" size="h-12 w-12" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-sm font-bold text-white">+</span>
                </div>
                <span className="w-full truncate text-center text-[11px] font-semibold text-slate-600">Your Story</span>
              </button>

              {fetchingStories ? (
                <div className="flex items-center px-3 text-xs text-slate-400">Loading stories...</div>
              ) : storyGroups.map((group) => {
                const latestStory = group.stories[group.stories.length - 1];
                const isCurrentUser = group.author?._id === user?._id;

                return (
                  <button
                    type="button"
                    key={group.author?._id}
                    onClick={() => openStoryGroup(group)}
                    className="group flex w-[76px] shrink-0 flex-col items-center gap-2"
                  >
                    <div className="relative rounded-full bg-gradient-to-br from-pink-500 via-violet-500 to-indigo-500 p-[3px] transition group-hover:scale-105">
                      <div className="rounded-full bg-white p-[2px]">
                        {group.author?.profileImage ? (
                          <img src={group.author.profileImage} alt="" className="h-12 w-12 rounded-full object-cover" />
                        ) : latestStory?.image ? (
                          <img src={latestStory.image} alt="" className="h-12 w-12 rounded-full object-cover" />
                        ) : (
                          <Avatar initials={getInitials(group.author?.username)} tone="from-pink-500 to-violet-500" size="h-12 w-12" />
                        )}
                      </div>
                      {group.stories.length > 1 && (
                        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-slate-900 px-1 text-[9px] font-bold text-white">
                          {group.stories.length}
                        </span>
                      )}
                    </div>
                    <span className="w-full truncate text-center text-[11px] font-semibold text-slate-600">
                      {isCurrentUser ? "You" : group.author?.username || "Story"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Avatar initials={getInitials(user?.name)} tone="from-indigo-500 to-violet-500" />
              <textarea
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                maxLength={500}
                rows={2}
                placeholder={`What's on your mind, ${user?.name?.split(" ")[0] || "there"}?`}
                className="flex-1 resize-none rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:bg-slate-100"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => handleContentTypeChange("post")}
                className={contentType === "post" ? "rounded-xl bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700" : "rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"}
              >
                ▧ Post
              </button>

              <button
                type="button"
                onClick={() => handleContentTypeChange("reel")}
                className={contentType === "reel" ? "rounded-xl bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700" : "rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"}
              >
                ▶ Reel
              </button>

              <label className="cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50">
                {contentType === "post" ? "Choose Image" : "Choose Video"}
                <input
                  type="file"
                  accept={contentType === "post" ? "image/*" : "video/*"}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                disabled={loading}
                onClick={handleCreateContent}
                className="ml-auto rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Posting..." : contentType === "post" ? "Create Post" : "Create Reel"}
              </button>
            </div>
            {selectedFile && <p className="mt-2 text-xs text-slate-500">Selected: {selectedFile.name}</p>}
          </div>

          <div className="space-y-5">
            {fetchingFeed ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                Loading feed...
              </div>
            ) : feedItems.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                No posts or reels to show yet. Be the first to share!
              </div>
            ) : (
              feedItems.map((item) => {
                const isLiked = item.likes?.includes(user?._id);
                const likesCount = item.likesCount ?? item.likes?.length ?? 0;

                return (
                  <article key={item._id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar initials={getInitials(item.author?.name)} tone="from-indigo-500 to-violet-500" />
                        <div>
                          <p className="text-sm font-bold">{item.author?.name || "User"}</p>
                          <p className="text-xs text-slate-400">
                            @{item.author?.username || "username"}
                            {item.createdAt && ` · ${new Date(item.createdAt).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                      {item.type === "reel" && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Reel</span>
                      )}
                    </div>

                    {item.type === "post" ? (
                      item.image && <img src={item.image} alt="Post content" className="w-full max-h-[520px] object-cover" />
                    ) : (
                      item.video && <video src={item.video} controls className="w-full max-h-[520px] object-cover bg-black" />
                    )}

                    <div className="px-5 pb-5 pt-4">
                      {item.caption && <p className="text-sm text-slate-700 mb-3">{item.caption}</p>}
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{likesCount} {likesCount === 1 ? "like" : "likes"}</span>
                        <span>
                          {commentsByItem[getItemKey(item.type, item._id)] !== undefined
                            ? `${commentsByItem[getItemKey(item.type, item._id)].length} comments`
                            : "Comments"}
                        </span>
                      </div>
                      <div className="mt-4 flex border-t border-slate-100 pt-3">
                        <button
                          onClick={() => handleToggleLike(item._id, item.type)}
                          className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                            isLiked
                              ? "text-rose-600 bg-rose-50"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {isLiked ? "♥ Liked" : "♡ Like"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleComments(item.type, item._id)}
                          className="flex-1 rounded-xl py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          ◌ {openComments[getItemKey(item.type, item._id)] ? "Hide Comments" : "Comment"}
                        </button>
                        <button className="flex-1 rounded-xl py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">↗ Share</button>
                      </div>

                      {interactionError[getItemKey(item.type, item._id)] && (
                        <p className="mt-2 text-xs text-red-500">
                          {interactionError[getItemKey(item.type, item._id)]}
                        </p>
                      )}

                      {openComments[getItemKey(item.type, item._id)] && (
                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <div className="space-y-3">
                            {(commentsByItem[getItemKey(item.type, item._id)] || []).map((comment) => (
                              <div key={comment._id} className="flex items-start gap-3">
                                <Avatar initials={getInitials(comment.user?.name)} tone="from-slate-500 to-slate-700" size="h-8 w-8" />
                                <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 px-3 py-2">
                                  <div className="flex items-start justify-between gap-3">
                                    <p className="text-xs font-bold text-slate-700">{comment.user?.name || "Unknown User"}</p>
                                    {comment.user?._id === user?._id && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteComment(comment._id, item.type, item._id)}
                                        className="text-[11px] font-semibold text-slate-400 hover:text-red-500"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                  <p className="mt-0.5 break-words text-sm text-slate-600">{comment.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <form
                            onSubmit={(event) => handleAddComment(event, item.type, item._id)}
                            className="mt-4 flex items-center gap-2"
                          >
                            <input
                              type="text"
                              value={commentInputs[getItemKey(item.type, item._id)] || ""}
                              onChange={(event) =>
                                setCommentInputs((prev) => ({
                                  ...prev,
                                  [getItemKey(item.type, item._id)]: event.target.value,
                                }))
                              }
                              maxLength={500}
                              placeholder="Write a comment..."
                              className="min-w-0 flex-1 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none"
                            />
                            <button
                              type="submit"
                              disabled={commentLoading[getItemKey(item.type, item._id)]}
                              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                            >
                              Post
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black">People to follow</h2>
                <button className="text-xs font-bold text-indigo-600">See all</button>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {storyFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" onMouseDown={closeStoryForm}>
          <form
            onSubmit={handleCreateStory}
            onMouseDown={(event) => event.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-black">Create a story</h2>
                <p className="text-xs text-slate-500">Share an image for the next 24 hours.</p>
              </div>
              <button type="button" onClick={closeStoryForm} className="rounded-full px-3 py-2 text-slate-500 hover:bg-slate-100" aria-label="Close">✕</button>
            </div>

            <div className="space-y-4 p-5">
              <label className="block cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-center transition hover:border-indigo-300">
                {storyPreview ? (
                  <img src={storyPreview} alt="Story preview" className="h-72 w-full object-cover" />
                ) : (
                  <span className="flex h-48 flex-col items-center justify-center gap-2 px-4 text-sm font-semibold text-slate-600">
                    <span className="text-3xl">▧</span>
                    Choose an image
                    <span className="text-xs font-normal text-slate-400">JPG, PNG, GIF or WebP · up to 5 MB</span>
                  </span>
                )}
                <input type="file" accept="image/*" required onChange={handleStoryFileChange} className="hidden" />
              </label>

              <div>
                <textarea
                  value={storyCaption}
                  onChange={(event) => setStoryCaption(event.target.value)}
                  maxLength={200}
                  required
                  rows={3}
                  placeholder="Write a caption..."
                  className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <p className="mt-1 text-right text-xs text-slate-400">{storyCaption.length}/200</p>
              </div>

              <button
                type="submit"
                disabled={creatingStory || !storyFile || !storyCaption.trim()}
                className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creatingStory ? "Posting story..." : "Post story"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeStory && (() => {
        const currentStory = activeStory.group.stories[activeStory.index];
        const author = activeStory.group.author;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4" onMouseDown={() => setActiveStory(null)}>
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-slate-900 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
              <div className="absolute inset-x-0 top-0 z-20 p-3">
                <div className="mb-3 flex gap-1">
                  {activeStory.group.stories.map((story, index) => (
                    <div key={story._id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                      <div className={`h-full bg-white ${index <= activeStory.index ? "w-full" : "w-0"}`} />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    {author?.profileImage ? (
                      <img src={author.profileImage} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-white/70" />
                    ) : (
                      <Avatar initials={getInitials(author?.username)} size="h-9 w-9" />
                    )}
                    <div>
                      <span className="text-sm font-bold">@{author?.username || "user"}</span>
                      <p className="text-[10px] text-white/70">
                        {activeStory.index + 1} / {activeStory.group.stories.length}
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setActiveStory(null)} className="rounded-full bg-black/20 px-3 py-2" aria-label="Close story">✕</button>
                </div>
              </div>

              {currentStory?.image && (
                <img src={currentStory.image} alt={currentStory.caption || "Story"} className="max-h-[80vh] min-h-[480px] w-full object-cover" />
              )}

              <button
                type="button"
                onClick={showPreviousStory}
                disabled={activeStory.index === 0}
                className="absolute bottom-0 left-0 top-20 z-10 w-1/3 cursor-pointer disabled:cursor-default"
                aria-label="Previous story"
              />
              <button
                type="button"
                onClick={showNextStory}
                className="absolute bottom-0 right-0 top-20 z-10 w-1/3 cursor-pointer"
                aria-label="Next story"
              />

              {currentStory?.caption && (
                <p className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 to-transparent px-6 pb-6 pt-16 text-center text-sm font-semibold text-white">
                  {currentStory.caption}
                </p>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default Home;