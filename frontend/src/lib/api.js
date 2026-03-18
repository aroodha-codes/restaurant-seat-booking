const envBackendUrl = (process.env.REACT_APP_BACKEND_URL || '').trim();

// Fall back to local backend so the app works without manual .env edits.
export const BACKEND_URL = (envBackendUrl || 'http://localhost:8001').replace(/\/+$/, '');
export const API = `${BACKEND_URL}/api`;
