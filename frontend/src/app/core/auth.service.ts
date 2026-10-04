import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL, TOKEN_KEY, toUserError } from './api';
import { readJson, removeKey, writeJson } from './storage';
import { SignInData, SignUpData, User, UserProfile, isProfileComplete } from './user';

const SESSION_KEY = 'savvily.session';

interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: User;
}

/**
 * Single source of truth for the signed-in user.
 *
 * The JWT and a copy of the user are kept in localStorage so the guards can
 * answer synchronously on reload; the user is then refreshed from the API.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly user = signal<User | null>(readJson<string>(TOKEN_KEY) ? readJson<User>(SESSION_KEY) : null);

  readonly currentUser = this.user.asReadonly();
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly profileComplete = computed(() => {
    const user = this.user();
    return user !== null && isProfileComplete(user);
  });

  constructor() {
    if (this.user()) void this.refreshUser();
  }

  async signUp(data: SignUpData): Promise<User> {
    try {
      const response = await firstValueFrom(this.http.post<AuthResponse>(`${API_URL}/auth/signup`, data));
      return this.startSession(response);
    } catch (error) {
      throw toUserError(error, 'Could not create your account.');
    }
  }

  async signIn(data: SignInData): Promise<User> {
    try {
      const response = await firstValueFrom(this.http.post<AuthResponse>(`${API_URL}/auth/login`, data));
      return this.startSession(response);
    } catch (error) {
      throw toUserError(error, 'Invalid email or password.');
    }
  }

  async signOut(): Promise<void> {
    this.clearSession();
  }

  async updateProfile(profile: UserProfile): Promise<User> {
    try {
      const user = await firstValueFrom(this.http.put<User>(`${API_URL}/users/me`, profile));
      this.setUser(user);
      return user;
    } catch (error) {
      throw toUserError(error, 'Could not save your profile.');
    }
  }

  /** Re-reads the user from the API; an expired or invalid token signs the user out. */
  private async refreshUser(): Promise<void> {
    try {
      this.setUser(await firstValueFrom(this.http.get<User>(`${API_URL}/users/me`)));
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.clearSession();
        location.assign('/auth');
      }
      // Other errors (server down): keep the cached user.
    }
  }

  private startSession({ accessToken, user }: AuthResponse): User {
    writeJson(TOKEN_KEY, accessToken);
    this.setUser(user);
    return user;
  }

  private setUser(user: User): void {
    this.user.set(user);
    writeJson(SESSION_KEY, user);
  }

  private clearSession(): void {
    this.user.set(null);
    removeKey(TOKEN_KEY);
    removeKey(SESSION_KEY);
  }
}
