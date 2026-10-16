import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import SearchModal from './SearchModal';
import NotificationsPanel from './NotificationsPanel';

export default function Navbar({ onOpenCreate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const unreadCount = useSelector((state) => state.notifications.unreadCount);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const getInitials = (name) =>
    name
      ?.split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo & Brand */}
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-3 group text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-sm font-black text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition">
              S
            </div>
            <div>
              <p className="text-base font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition">
                SST Social
              </p>
              <p className="hidden sm:block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Connect • Share • Create
              </p>
            </div>
          </button>

          {/* Desktop Search Trigger */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="hidden md:flex w-72 lg:w-96 items-center justify-between rounded-full border border-slate-200/90 bg-slate-50/90 px-4 py-2.5 text-xs text-slate-500 hover:border-indigo-300 hover:bg-white hover:shadow-sm transition"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-sm text-slate-400">🔍</span>
              <span className="font-medium text-slate-500">Search users, posts, or tags...</span>
            </div>
            <kbd className="hidden lg:inline-block rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-400 shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Action Icons & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Search Icon */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex md:hidden h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition"
              aria-label="Search"
            >
              🔍
            </button>

            {/* Notifications Button */}
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition"
              aria-label="Notifications"
            >
              <span className="text-lg">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Create Action Button (Desktop) */}
            {onOpenCreate && (
              <button
                type="button"
                onClick={onOpenCreate}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-indigo-500/25 hover:from-indigo-700 hover:to-violet-700 active:scale-95 transition"
              >
                <span>➕</span>
                <span>Create</span>
              </button>
            )}

            {/* Profile Avatar Pill */}
            <button
              onClick={() => navigate(`/profile/${user?.username}`)}
              className={`flex items-center gap-2 rounded-full border p-1 pr-3 transition ${
                location.pathname.startsWith('/profile')
                  ? 'border-indigo-400 bg-indigo-50/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.name || 'User'}
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-white"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-bold text-white ring-2 ring-white">
                  {getInitials(user?.name)}
                </div>
              )}
              <span className="hidden sm:block text-xs font-bold text-slate-800 truncate max-w-[100px]">
                {user?.name?.split(' ')[0] || 'You'}
              </span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="hidden sm:flex h-9 items-center justify-center rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Global Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <NotificationsPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </>
  );
}
