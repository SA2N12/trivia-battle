'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, username, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <span className="material-symbols-outlined text-purple-400" style={{ fontSize: '40px' }}>sports_esports</span> Trivia Battle
          </h1>
          <p className="mt-2 text-gray-400">Créez votre compte</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-100 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
          />

          <input
            type="text"
            placeholder="Nom d'utilisateur (3-20 car.)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={20}
            className="w-full px-4 py-3 bg-gray-100 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
          />

          <input
            type="password"
            placeholder="Mot de passe (min 6 car.)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 bg-gray-100 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded-xl font-semibold transition-colors"
          >
            {loading ? 'Création...' : 'Créer un compte'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-purple-400 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
