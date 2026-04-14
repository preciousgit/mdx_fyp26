const API_BASE = import.meta.env.DEV
  ? ((import.meta.env.VITE_API_URL as string) || '/api')
  : '/api';

function getToken(): string | null {
  return localStorage.getItem('authToken');
}

export function setToken(token: string) {
  localStorage.setItem('authToken', token);
}

export function clearToken() {
  localStorage.removeItem('authToken');
}

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...headers, ...(options.headers as any) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data as T;
}

// Auth
export const api = {
  auth: {
    register: (body: object) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (email: string, password: string) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    me: () => request('/auth/me'),
    updateProfile: (body: object) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
  },
  products: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/products${qs}`);
    },
    get: (id: string) => request(`/products/${id}`),
    create: (body: object) => request('/products', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: object) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  },
  events: {
    list: (productId: string) => request(`/events?productId=${productId}`),
    latestHash: (productId: string) => request(`/events/latest?productId=${productId}`),
    create: (body: object) => request('/events', { method: 'POST', body: JSON.stringify(body) }),
  },
  reviews: {
    list: (productId: string) => request(`/reviews?productId=${productId}`),
    create: (body: object) => request('/reviews', { method: 'POST', body: JSON.stringify(body) }),
    like: (reviewId: string) => request(`/reviews/${reviewId}/like`, { method: 'POST' }),
    dislike: (reviewId: string) => request(`/reviews/${reviewId}/dislike`, { method: 'POST' }),
    addReply: (reviewId: string, comment: string) => request(`/reviews/${reviewId}/replies`, { method: 'POST', body: JSON.stringify({ comment }) }),
    likeReply: (reviewId: string, replyId: string) => request(`/reviews/${reviewId}/replies/${replyId}/like`, { method: 'POST' }),
    dislikeReply: (reviewId: string, replyId: string) => request(`/reviews/${reviewId}/replies/${replyId}/dislike`, { method: 'POST' }),
  },
  notifications: {
    list: () => request('/notifications'),
    reviewCounts: () => request('/notifications/review-counts'),
    create: (body: object) => request('/notifications', { method: 'POST', body: JSON.stringify(body) }),
    markRead: (id: string) => request(`/notifications/${id}`, { method: 'PUT', body: JSON.stringify({ read: true }) }),
  },
  contact: (body: object) => request('/contact', { method: 'POST', body: JSON.stringify(body) }),
  analytics: {
    forecast: (productId: string) => request(`/analytics/forecast/${productId}`),
    portfolio: () => request('/analytics/portfolio'),
    rows: () => request('/analytics/rows'),
    recallSimulation: (body: object) => request('/analytics/recall-simulation', { method: 'POST', body: JSON.stringify(body) }),
  },
  upload: async (files: File[]): Promise<string[]> => {
    const token = getToken();
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));
    const res = await fetch('/api/upload', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as any).message || `Upload failed (${res.status})`);
    return (data as any).urls as string[];
  },
};
