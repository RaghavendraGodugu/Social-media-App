import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearLiveToast } from '../redux/notificationsSlice';

export default function NotificationToast() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const liveToast = useSelector((state) => state.notifications.liveToast);

  useEffect(() => {
    if (!liveToast) return;
    const timer = setTimeout(() => {
      dispatch(clearLiveToast());
    }, 5000);
    return () => clearTimeout(timer);
  }, [liveToast, dispatch]);

  if (!liveToast) return null;

  const sender = liveToast.sender || {};
  const type = liveToast.type;

  const getIcon = () => {
    switch (type) {
      case 'like_post':
      case 'like_reel':
        return '❤️';
      case 'comment_post':
      case 'comment_reel':
        return '💬';
      case 'follow':
        return '👤';
      default:
        return '🔔';
    }
  };

  const getMessage = () => {
    switch (type) {
      case 'like_post':
        return 'liked your post';
      case 'like_reel':
        return 'liked your reel';
      case 'comment_post':
        return `commented: "${liveToast.text || '...'}"`;
      case 'comment_reel':
        return `commented on your reel`;
      case 'follow':
        return 'started following you';
      default:
        return 'interacted with your content';
    }
  };

  const handleClick = () => {
    dispatch(clearLiveToast());
    if (sender.username) {
      navigate(`/profile/${sender.username}`);
    }
  };

  return (
    <div className="fixed top-5 right-5 z-50 max-w-sm w-full animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        onClick={handleClick}
        className="cursor-pointer flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-900/90 text-white shadow-2xl backdrop-blur-md border border-slate-700 hover:bg-slate-900 transition"
      >
        <div className="relative shrink-0">
          <img
            src={
              sender.profileImage ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                sender.name || 'User'
              )}&background=6366f1&color=fff`
            }
            alt={sender.name || 'User'}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500"
          />
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-xs shadow">
            {getIcon()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-200">
            <span className="font-bold text-white">@{sender.username}</span>{' '}
            {getMessage()}
          </p>
          <span className="text-[10px] text-slate-400">Just now • Click to view</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            dispatch(clearLiveToast());
          }}
          className="text-slate-400 hover:text-white p-1 rounded-lg text-lg leading-none"
          aria-label="Dismiss notification"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
