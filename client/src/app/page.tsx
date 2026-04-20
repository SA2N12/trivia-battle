'use client';

import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading, logout, refreshProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user) {
      refreshProfile();
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <span className="material-symbols-outlined text-purple-400" style={{ fontSize: '48px' }}>sports_esports</span> Trivia Battle
          </h1>
          <p className="mt-3 text-gray-400">
            Bon retour, <span className="text-purple-400 font-semibold">{user.username}</span> !
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => router.push('/lobby/create')}
            className="w-full py-4 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-lg transition-colors"
          >
            <span className="material-symbols-outlined mr-2 align-middle">target</span> Créer une salle
          </button>

          <button
            onClick={() => router.push('/lobby/join')}
            className="w-full py-4 px-6 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-semibold text-lg transition-colors"
          >
            <span className="material-symbols-outlined mr-2 align-middle">meeting_room</span> Rejoindre une salle
          </button>

          <button
            onClick={() => router.push('/leaderboard')}
            className="w-full py-4 px-6 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold text-lg transition-colors border border-gray-600"
          >
            <span className="material-symbols-outlined mr-2 align-middle">emoji_events</span> Classement
          </button>
        </div>

        <div className="pt-6 border-t border-gray-800">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Parties : {user.gamesPlayed ?? 0}</span>
            <span>Victoires : {user.gamesWon ?? 0}</span>
            <span>Score : {user.totalScore ?? 0}</span>
          </div>
          <button
            onClick={logout}
            className="mt-4 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </main>
  );
}
