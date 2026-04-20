'use client';

import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { roomsApi } from '../../../lib/api';

export default function JoinRoomPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return router.push('/login');
    if (!code.trim()) return;

    setLoading(true);
    setError('');
    try {
      await roomsApi.join(token, code.toUpperCase());
      router.push(`/room/${code.toUpperCase()}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2"><span className="material-symbols-outlined" style={{ fontSize: '32px' }}>meeting_room</span> Rejoindre une salle</h1>
          <p className="mt-2 text-gray-400">Entrez le code de la salle</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <input
            type="text"
            placeholder="CODE SALLE"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="w-full px-4 py-4 bg-gray-100 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-xl text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-pink-500 transition-colors uppercase"
          />

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full py-4 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-800 text-white rounded-xl font-semibold text-lg transition-colors"
          >
            {loading ? 'Connexion...' : 'Rejoindre'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
          >
            <span className="material-symbols-outlined mr-1 align-middle" style={{ fontSize: '20px' }}>arrow_back</span> Retour
          </button>
        </form>
      </div>
    </main>
  );
}
