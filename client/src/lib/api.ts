const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined'
    ? `http://${window.location.hostname}:3001/api`
    : 'http://localhost:3001/api');

type FetchOptions = RequestInit & { token?: string };

async function apiFetch<T = any>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { token, headers, ...rest } = options;

  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...rest,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `API error: ${res.status}`);
  }

  return res.json();
}

// Auth
export const authApi = {
  register: (data: { email: string; username: string; password: string }) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  getProfile: (token: string) =>
    apiFetch('/auth/profile', { token }),
};

// Rooms
export const roomsApi = {
  create: (token: string, data?: { isPrivate?: boolean; category?: string }) =>
    apiFetch('/rooms', { method: 'POST', body: JSON.stringify(data || {}), token }),

  join: (token: string, code: string) =>
    apiFetch(`/rooms/${code}/join`, { method: 'POST', token }),

  getByCode: (token: string, code: string) =>
    apiFetch(`/rooms/${code}`, { token }),

  leave: (token: string, code: string) =>
    apiFetch(`/rooms/${code}/leave`, { method: 'POST', token }),
};

// Questions
export const questionsApi = {
  getCategories: () => apiFetch('/questions/categories'),
  seed: () => apiFetch('/questions/seed', { method: 'POST' }),
};

// Leaderboard
export const leaderboardApi = {
  get: (limit?: number) =>
    apiFetch(`/leaderboard${limit ? `?limit=${limit}` : ''}`),
};
