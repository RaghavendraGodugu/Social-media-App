import React from 'react'
import { Link } from 'react-router-dom'

function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Navigation */}
      <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-black text-white shadow-sm">
              S
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">SST Social</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.99]"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-16 sm:py-24 flex flex-col items-center text-center justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-3.5 py-1 text-xs font-semibold text-indigo-700 mb-8">
          ✨ Welcome to the future of social connection
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 max-w-3xl leading-tight">
          Connect, share, and build your circle on{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
            SST Social
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl leading-relaxed">
          Express your ideas, share authentic moments with 24-hour stories, watch short-form reels, and stay connected with friends.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            to="/signup"
            className="w-full sm:w-auto rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-indigo-700 active:scale-[0.99]"
          >
            Create an Account
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Sign In to Account
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-left">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 text-xl font-bold mb-4">
              📸
            </div>
            <h2 className="text-base font-bold text-slate-900">Feed & Stories</h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Post high-resolution photos and upload 24-hour disappearing stories with ease.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 text-xl font-bold mb-4">
              🎬
            </div>
            <h2 className="text-base font-bold text-slate-900">Short Video Reels</h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Engage your followers with immersive video reels and interactive comments.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-50 text-pink-600 text-xl font-bold mb-4">
              👥
            </div>
            <h2 className="text-base font-bold text-slate-900">Community & Social</h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Follow people, like posts, participate in discussions, and customize your profile.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>&copy; {new Date().getFullYear()} SST Social. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/login" className="hover:underline">Login</Link>
            <Link to="/signup" className="hover:underline">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing