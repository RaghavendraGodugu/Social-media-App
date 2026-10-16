import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SearchModal from './SearchModal';

export default function MobileBottomNav({ onOpenCreate, onSelectReels }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const isHome = location.pathname === '/home';
  const isProfile = location.pathname.startsWith('/profile');

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex h-16 items-center justify-around px-2">
          {/* Home */}
          <button
            type="button"
            onClick={() => navigate('/home')}
            className={`flex flex-col items-center justify-center w-14 h-full transition ${
              isHome ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="text-xl">🏠</span>
            <span className="text-[10px] mt-0.5">Feed</span>
          </button>

          {/* Search */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="flex flex-col items-center justify-center w-14 h-full text-slate-500 hover:text-indigo-600 transition"
          >
            <span className="text-xl">🔍</span>
            <span className="text-[10px] mt-0.5">Search</span>
          </button>

          {/* Create Floating Action */}
          <button
            type="button"
            onClick={onOpenCreate}
            className="flex items-center justify-center -mt-5 h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white text-xl font-bold shadow-lg shadow-indigo-500/30 active:scale-95 transition"
            aria-label="Create content"
          >
            ➕
          </button>

          {/* Reels */}
          <button
            type="button"
            onClick={() => {
              if (onSelectReels) onSelectReels();
              else navigate('/home');
            }}
            className="flex flex-col items-center justify-center w-14 h-full text-slate-500 hover:text-indigo-600 transition"
          >
            <span className="text-xl">🎬</span>
            <span className="text-[10px] mt-0.5">Reels</span>
          </button>

          {/* Profile */}
          <button
            type="button"
            onClick={() => navigate(`/profile/${user?.username}`)}
            className={`flex flex-col items-center justify-center w-14 h-full transition ${
              isProfile ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name || 'Profile'}
                className={`h-6 w-6 rounded-full object-cover border ${
                  isProfile ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-slate-300'
                }`}
              />
            ) : (
              <span className="text-xl">👤</span>
            )}
            <span className="text-[10px] mt-0.5">Profile</span>
          </button>
        </div>
      </nav>

      {/* Global Search Modal for Mobile */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
