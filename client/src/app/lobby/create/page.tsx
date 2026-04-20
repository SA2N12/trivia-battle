'use client';

import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { roomsApi } from '../../../lib/api';

export default function CreateRoomPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [category, setCategory] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!token) return router.push('/login');
    setLoading(true);
    setError('');
    try {
      const room = await roomsApi.create(token, {
        isPrivate,
        category: category || undefined,
      });
      router.push(`/room/${room.code}`);
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
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2"><span className="material-symbols-outlined" style={{ fontSize: '32px' }}>target</span> Créer une salle</h1>
          <p className="mt-2 text-gray-400">Configurez votre trivia battle</p>
        </div>

        {error && (
          <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Catégorie (optionnel)</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500"
            >
              <option value="">Toutes les catégories</option>
              <option value="Science">Science</option>
              <option value="Histoire">Histoire</option>
              <option value="Géographie">Géographie</option>
              <option value="Divertissement">Divertissement</option>
              <option value="Sports">Sports</option>
              <option value="Technologie">Technologie</option>
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-5 h-5 rounded bg-gray-800 border-gray-600 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-gray-300">Salle privée</span>
          </label>

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded-xl font-semibold text-lg transition-colors"
          >
            {loading ? 'Création...' : 'Créer la salle'}
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
          >
            <span className="material-symbols-outlined mr-1 align-middle" style={{ fontSize: '20px' }}>arrow_back</span> Retour
          </button>
        </div>
      </div>
    </main>
  );
}
