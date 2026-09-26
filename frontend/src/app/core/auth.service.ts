import { Injectable, computed, signal } from '@angular/core';
import { SignInData, SignUpData, User, UserProfile, isProfileComplete } from './user';

const SESSION_KEY = 'savvily.session';
const USERS_KEY = 'savvily.users';

/**
 * Single source of truth for the signed-in user.
 *
 * TEMPORARY: until the backend exists, accounts live in localStorage and
 * passwords are NOT checked or stored. Only the bodies of `signUp`, `signIn`,
 * `signOut` and `updateProfile` need to change to call the real API.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly user = signal<User | null>(readJson<User>(SESSION_KEY));

  readonly currentUser = this.user.asReadonly();
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly profileComplete = computed(() => {
    const user = this.user();
    return user !== null && isProfileComplete(user);
  });

  async signUp(data: SignUpData): Promise<User> {
    const email = normalizeEmail(data.email);
    const users = this.storedUsers();
    if (users[email]) {
      throw new Error('An account with this email already exists.');
    }

    const user: User = {
      id: crypto.randomUUID(),
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email,
      birthday: null,
      salary: null,
      profession: null,
    };
    this.saveUser(user);
    return user;
  }

  async signIn(data: SignInData): Promise<User> {
    const user = this.storedUsers()[normalizeEmail(data.email)];
    if (!user) {
      throw new Error('Invalid email or password.');
    }
    this.setSession(user);
    return user;
  }

  async signOut(): Promise<void> {
    this.setSession(null);
  }

  async updateProfile(profile: UserProfile): Promise<User> {
    const current = this.user();
    if (!current) {
      throw new Error('You are not signed in.');
    }
    const user = { ...current, ...profile };
    this.saveUser(user);
    return user;
  }

  private saveUser(user: User): void {
    writeJson(USERS_KEY, { ...this.storedUsers(), [user.email]: user });
    this.setSession(user);
  }

  private setSession(user: User | null): void {
    this.user.set(user);
    if (user) writeJson(SESSION_KEY, user);
    else removeKey(SESSION_KEY);
  }

  private storedUsers(): Record<string, User> {
    return readJson<Record<string, User>>(USERS_KEY) ?? {};
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode, quota): the session stays in memory only.
  }
}

function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore: nothing to clean up.
  }
}
