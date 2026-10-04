import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { readJson } from './storage';

/** FastAPI backend (port 8000 is taken on the dev machine, hence 8001). */
export const API_URL = 'http://127.0.0.1:8001';

export const TOKEN_KEY = 'savvily.token';

/** Sends the JWT with every request to our API. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = readJson<string>(TOKEN_KEY);
  if (!token || !req.url.startsWith(API_URL)) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};

/** Turns an HTTP error into an Error whose message can be shown to the user. */
export function toUserError(error: unknown, fallback: string): Error {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return new Error('Cannot reach the server. Is the backend running?');
    const detail = error.error?.detail;
    // FastAPI sends a string for our own errors, an array for validation (422) errors.
    if (typeof detail === 'string') return new Error(detail);
  }
  return new Error(fallback);
}
