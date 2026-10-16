import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  markAllAsRead,
  markSingleAsRead,
  deleteNotificationById
} from '../redux/notificationsSlice';

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

export default function NotificationsPanel({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const notifications = useSelector((state) => state.notifications.items);
  const unreadCount = useSelector((state) => state.notifications.unreadCount);
  const loading = useSelector((state) => state.notifications.loading);

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'

  if (!isOpen) return null;

  const filteredNotifications =
    activeTab === 'unread'
      ? notifications.filter((n) => !n.read)
      : notifications;

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      dispatch(markSingleAsRead(notification._id));
    }
    onClose();
    if (notification.sender?.username) {
      navigate(`/profile/${notification.sender.username}`);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like_post':
      case 'like_reel':
        return { emoji: '❤️', bg: 'bg-rose-50 text-rose-600 border-rose-200' };
      case 'comment_post':
      case 'comment_reel':
        return { emoji: '💬', bg: 'bg-blue-50 text-blue-600 border-blue-200' };
      case 'follow':
        return { emoji: '👤', bg: 'bg-indigo-50 text-indigo-600 border-indigo-200' };
      default:
        return { emoji: '🔔', bg: 'bg-amber-50 text-amber-600 border-amber-200' };
    }
  };

  const getNotificationText = (notification) => {
    const username = notification.sender?.username || 'Someone';
    switch (notification.type) {
      case 'like_post':
        return <span><strong className="text-slate-900 font-semibold">@{username}</strong> liked your post</span>;
      case 'like_reel':
        return <span><strong className="text-slate-900 font-semibold">@{username}</strong> liked your reel</span>;
      case 'comment_post':
        return (
          <span>
            <strong className="text-slate-900 font-semibold">@{username}</strong> commented: "
            <span className="italic text-slate-700">{notification.text}</span>"
          </span>
        );
      case 'comment_reel':
        return (
          <span>
            <strong className="text-slate-900 font-semibold">@{username}</strong> commented on your reel
          </span>
        );
      case 'follow':
        return <span><strong className="text-slate-900 font-semibold">@{username}</strong> started following you</span>;
      default:
        return <span><strong className="text-slate-900 font-semibold">@{username}</strong> sent a notification</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end sm:p-4 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer / Panel */}
      <div className="relative w-full max-w-md h-full sm:h-[88vh] sm:rounded-3xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              🔔
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white">
                    {unreadCount} new
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">Activity and updates</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => dispatch(markAllAsRead())}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition px-2.5 py-1.5 rounded-lg hover:bg-indigo-50"
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 text-xl leading-none"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="px-5 py-2.5 border-b border-slate-100 flex gap-2 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unread')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'unread'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {loading && notifications.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent"></div>
              <p className="mt-3 text-xs">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-20 text-center px-4">
              <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl">
                ✨
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p className="mt-1 text-xs text-slate-400 max-w-xs mx-auto">
                {activeTab === 'unread'
                  ? 'All caught up! Check back when friends interact with your content.'
                  : 'Likes, comments, and new followers will show up right here.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const iconMeta = getNotificationIcon(notification.type);
              const sender = notification.sender || {};

              return (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`group relative flex items-start gap-3.5 p-3.5 rounded-2xl transition cursor-pointer ${
                    notification.read
                      ? 'hover:bg-slate-50'
                      : 'bg-indigo-50/40 hover:bg-indigo-50/70 border-l-4 border-indigo-600'
                  }`}
                >
                  {/* Sender Avatar & Type Badge */}
                  <div className="relative shrink-0">
                    <img
                      src={
                        sender.profileImage ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          sender.name || 'User'
                        )}&background=6366f1&color=fff`
                      }
                      alt={sender.name || 'User'}
                      className="h-11 w-11 rounded-full object-cover border border-slate-200"
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] border ${iconMeta.bg}`}
                    >
                      {iconMeta.emoji}
                    </span>
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="text-xs text-slate-600 leading-snug">
                      {getNotificationText(notification)}
                    </p>
                    <span className="mt-1 block text-[11px] font-medium text-slate-400">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>

                  {/* Content Preview Thumbnail (if post or reel) */}
                  {notification.post?.image && (
                    <img
                      src={notification.post.image}
                      alt="Post preview"
                      className="h-10 w-10 shrink-0 rounded-lg object-cover border border-slate-200"
                    />
                  )}

                  {/* Actions (Delete) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(deleteNotificationById(notification._id));
                    }}
                    className="absolute top-3 right-3 text-slate-300 hover:text-slate-600 p-1 opacity-0 group-hover:opacity-100 transition"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
