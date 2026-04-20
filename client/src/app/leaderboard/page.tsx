'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { leaderboardApi } from '../../lib/api';

interface LeaderboardEntry {
  id: string;
  username: string;
  totalScore: number;
  gamesPlayed: number;
  gamesWon: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leaderboardApi
      .get(50)
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="flex flex-col items-center min-h-screen p-4 pt-12">
      <div className="max-w-lg w-full space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-2"><span className="material-symbols-outlined" style={{ fontSize: '32px' }}>emoji_events</span> Classement</h1>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined mr-1 align-middle" style={{ fontSize: '18px' }}>arrow_back</span> Accueil
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-center text-gray-400 py-12">Aucun joueur pour l&apos;instant. Soyez le premier !</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-4 rounded-xl ${
                  i === 0
                    ? 'bg-yellow-900/30 border border-yellow-700/50'
                    : i === 1
                      ? 'bg-gray-700/30 border border-gray-600/50'
                      : i === 2
                        ? 'bg-orange-900/20 border border-orange-800/50'
                        : 'bg-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 text-center font-bold">
                    {i === 0 ? <span className="material-symbols-outlined text-yellow-400">trophy</span> : i === 1 ? <span className="material-symbols-outlined text-gray-300">military_tech</span> : i === 2 ? <span className="material-symbols-outlined text-orange-400">military_tech</span> : `${i + 1}`}
                  </span>
                  <span className="font-semibold">{entry.username}</span>
                </div>
                <div className="text-right">
                  <div className="font-mono text-purple-400">{entry.totalScore.toLocaleString()} pts</div>
                  <div className="text-xs text-gray-400">
                    {entry.gamesWon}V / {entry.gamesPlayed}P
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
