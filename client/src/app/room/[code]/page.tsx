'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { getSocket, disconnectSocket } from '../../../lib/socket';
import { Socket } from 'socket.io-client';

interface Player {
  userId: string;
  username: string;
}

interface QuestionData {
  gameId: string;
  questionIndex: number;
  totalQuestions: number;
  question: {
    id: string;
    text: string;
    options: string | string[];
    category: string;
    difficulty: string;
  };
  timeLimit: number;
}

interface ScoreEntry {
  userId: string;
  username: string;
  points?: number;
  totalPoints?: number;
  correctAnswers?: number;
  rank?: number;
  user?: { username: string };
}

type GamePhase = 'lobby' | 'countdown' | 'question' | 'results' | 'finished';

export default function RoomPage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  const { user, token } = useAuth();
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [players, setPlayers] = useState<Player[]>([]);
  const [hostId, setHostId] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');

  // Game state
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<{
    isCorrect: boolean;
    correctAnswer: number;
    points: number;
  } | null>(null);
  const [liveScores, setLiveScores] = useState<ScoreEntry[]>([]);
  const [finalScores, setFinalScores] = useState<ScoreEntry[]>([]);
  const [timeLeft, setTimeLeft] = useState(10);
  const [questionStartTime, setQuestionStartTime] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    setTimeLeft(10);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (!token || !user) {
      router.push('/login');
      return;
    }

    const socket = getSocket(token);
    socketRef.current = socket;

    socket.emit('joinRoom', { code });

    socket.on('roomState', (data: any) => {
      setPlayers(data.players);
      setHostId(data.room.hostId);
      setRoomId(data.room.id);
      if (data.room.status === 'IN_GAME') {
        setPhase('question');
      }
    });

    socket.on('playerJoined', (data: any) => {
      setPlayers(data.players);
    });

    socket.on('playerLeft', (data: any) => {
      setPlayers((prev) => prev.filter((p) => p.userId !== data.userId));
    });

    socket.on('gameStarted', () => {
      setPhase('countdown');
      setTimeout(() => setPhase('question'), 3000);
    });

    socket.on('newQuestion', (data: QuestionData) => {
      setCurrentQuestion(data);
      setSelectedAnswer(null);
      setAnswerResult(null);
      setQuestionStartTime(Date.now());
      setPhase('question');
      startTimer();
    });

    socket.on('answerResult', (data: any) => {
      setAnswerResult(data);
    });

    socket.on('liveScores', (scores: ScoreEntry[]) => {
      setLiveScores(scores);
    });

    socket.on('questionTimeout', (data: any) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeLeft(0);
      if (data.liveScores) setLiveScores(data.liveScores);
      setPhase('results');
    });

    socket.on('gameFinished', (data: any) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setFinalScores(data.scores);
      setPhase('finished');
    });

    socket.on('error', (data: any) => {
      console.error('Socket error:', data.message);
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      disconnectSocket();
    };
  }, [token, user, code, router, startTimer]);

  const handleStartGame = () => {
    socketRef.current?.emit('startGame', { roomId });
  };

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null || !currentQuestion) return;
    setSelectedAnswer(answerIndex);
    const timeMs = Date.now() - questionStartTime;

    socketRef.current?.emit('submitAnswer', {
      gameId: currentQuestion.gameId,
      questionId: currentQuestion.question.id,
      answer: answerIndex,
      timeMs,
    });
  };

  const getOptions = (q: QuestionData): string[] => {
    if (Array.isArray(q.question.options)) return q.question.options;
    try {
      return JSON.parse(q.question.options as string);
    } catch {
      return [];
    }
  };

  // ─── Render ─────────────────────────────────────────

  if (phase === 'lobby') {
    return (
      <main className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div>
            <h1 className="text-3xl font-bold">Salle d&apos;attente</h1>
            <p className="mt-2 text-gray-400">
              Code de la salle :{' '}
              <span className="font-mono text-2xl text-purple-400 tracking-widest">{code}</span>
            </p>
          </div>

          <div className="bg-gray-900 rounded-xl p-4 space-y-2">
            <h2 className="text-sm text-gray-400 uppercase tracking-wide">
              Joueurs ({players.length})
            </h2>
            {players.map((p) => (
              <div
                key={p.userId}
                className="flex items-center justify-between p-2 bg-gray-800 rounded-lg"
              >
                <span className="text-white">{p.username}</span>
                {p.userId === hostId && (
                  <span className="text-xs bg-purple-600 px-2 py-0.5 rounded">HÔTE</span>
                )}
              </div>
            ))}
          </div>

          {user?.id === hostId && (
            <button
              onClick={handleStartGame}
              disabled={players.length < 1}
              className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded-xl font-semibold text-lg transition-colors"
            >
              <span className="material-symbols-outlined mr-2 align-middle">rocket_launch</span> Lancer la partie
            </button>
          )}

          {user?.id !== hostId && (
            <p className="text-gray-400">En attente du lancement par l&apos;hôte...</p>
          )}

          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
          >
            Quitter la salle
          </button>
        </div>
      </main>
    );
  }

  if (phase === 'countdown') {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold animate-pulse">Préparez-vous !</h1>
          <p className="text-2xl text-gray-400">La partie commence...</p>
        </div>
      </main>
    );
  }

  if (phase === 'question' && currentQuestion) {
    const options = getOptions(currentQuestion);
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-lg w-full space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">
              Question {currentQuestion.questionIndex + 1}/{currentQuestion.totalQuestions}
            </span>
            <span className="text-sm px-2 py-1 bg-gray-800 rounded text-white">
              {currentQuestion.question.category}
            </span>
            <div
              className={`text-2xl font-bold ${timeLeft <= 3 ? 'text-red-400 animate-pulse' : 'text-white'}`}
            >
              {timeLeft}s
            </div>
          </div>

          {/* Question */}
          <div className="bg-gray-900 rounded-xl p-6 text-center">
            <h2 className="text-xl font-semibold text-white">{currentQuestion.question.text}</h2>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3">
            {options.map((option, idx) => {
              let btnClass = 'bg-gray-800 hover:bg-gray-700 border-gray-700';
              if (selectedAnswer === idx) {
                if (answerResult) {
                  btnClass = answerResult.isCorrect
                    ? 'bg-green-700 border-green-500'
                    : 'bg-red-700 border-red-500';
                } else {
                  btnClass = 'bg-purple-700 border-purple-500';
                }
              } else if (answerResult && idx === answerResult.correctAnswer) {
                btnClass = 'bg-green-700/50 border-green-500';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={selectedAnswer !== null}
                  className={`p-4 rounded-xl border text-left font-medium text-white transition-all ${btnClass} disabled:cursor-default`}
                >
                  <span className="mr-3 text-gray-400">{String.fromCharCode(65 + idx)}.</span>
                  {option}
                </button>
              );
            })}
          </div>

          {/* Points feedback */}
          {answerResult && (
            <div className="text-center">
              <p className={answerResult.isCorrect ? 'text-green-400' : 'text-red-400'}>
                {answerResult.isCorrect
                  ? <><span className="material-symbols-outlined text-green-400 align-middle mr-1">check_circle</span> Correct ! +{answerResult.points} pts</>
                  : <><span className="material-symbols-outlined text-red-400 align-middle mr-1">cancel</span> Mauvaise réponse !</>}
              </p>
            </div>
          )}
        </div>
      </main>
    );
  }

  if (phase === 'results') {
    return (
      <main className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <h2 className="text-2xl font-bold">Scores en direct</h2>
          <div className="space-y-2">
            {liveScores.map((s, i) => (
              <div
                key={s.userId}
                className="flex justify-between items-center p-3 bg-gray-900 rounded-lg"
              >
                <span className="text-white">
                  {i === 0 ? <span className="material-symbols-outlined text-yellow-400">trophy</span> : i === 1 ? <span className="material-symbols-outlined text-gray-300">military_tech</span> : i === 2 ? <span className="material-symbols-outlined text-orange-400">military_tech</span> : `#${i + 1}`}{' '}
                  {s.username}
                </span>
                <span className="font-mono text-purple-400">{s.points} pts</span>
              </div>
            ))}
          </div>
          <p className="text-gray-400 animate-pulse">Question suivante...</p>
        </div>
      </main>
    );
  }

  if (phase === 'finished') {
    return (
      <main className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-2"><span className="material-symbols-outlined" style={{ fontSize: '40px' }}>flag</span> Fin de partie !</h1>
          <div className="space-y-2">
            {finalScores.map((s, i) => (
              <div
                key={s.userId}
                className="flex justify-between items-center p-4 bg-gray-900 rounded-xl"
              >
                <span className="font-semibold text-white">
                  {i === 0 ? <span className="material-symbols-outlined text-yellow-400 mr-1">trophy</span> : i === 1 ? <span className="material-symbols-outlined text-gray-300 mr-1">military_tech</span> : i === 2 ? <span className="material-symbols-outlined text-orange-400 mr-1">military_tech</span> : `#${i + 1} `}
                  {s.user?.username ?? s.username}
                </span>
                <div className="text-right">
                  <div className="font-mono text-purple-400">
                    {s.totalPoints ?? s.points} pts
                  </div>
                  {s.correctAnswers !== undefined && (
                    <div className="text-xs text-gray-400">
                      {s.correctAnswers} bonne{s.correctAnswers > 1 ? 's' : ''} réponse{s.correctAnswers > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-lg transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
    </div>
  );
}
