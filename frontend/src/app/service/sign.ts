import { computed, Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environement/environement';

export interface SignInData {
  email: string;
  password: string;
}

export interface SignUpData {
  firstname : string;
  lastname : string;
  email: string;
  password: string;
  profession: string;
  maritalstatus: string;
  kids: number;
  birthday: string;
  salary: number | null;
}

export interface UserProfile {
  profession?: string;
  maritalstatus?: string;
  kids?: number;
  birthday?: string;
  salary?: number | null;
}

export interface AuthenticatedUser extends UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}


@Injectable({
  providedIn: 'root',
})
export class Sign{

  private supabase: SupabaseClient;
  private readonly userState = signal<AuthenticatedUser | null>(null);
  readonly currentUser = this.userState.asReadonly();
  readonly profileComplete = computed(() => {
    const user = this.userState();
    return Boolean(user?.profession && user.salary !== null && user.salary !== undefined);
  });

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
    void this.loadCurrentUser();
    this.supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void this.loadProfile(session.user.id, session.user.email ?? '');
      } else {
        this.userState.set(null);
      }
    });
  }

  get client(): SupabaseClient {
    return this.supabase;
  }



  async signUp(signUpData: SignUpData) {

    const firstname = signUpData.firstname;
    const lastname = signUpData.lastname;
    const email = signUpData.email;
    const profession = signUpData.profession;
    const maritalstatus = signUpData.maritalstatus;
    const kids = signUpData.kids;
    const birthday = signUpData.birthday;
    const salary = signUpData.salary;
    const password = signUpData.password;

    const { data: authData, error: signUpError } = await this.supabase.auth.signUp({ email, password });
    if (signUpError) throw signUpError;
    if (!authData.user) throw new Error('Signup did not return a user.');

    const { error: profileError } = await this.supabase
      .from('user')
      .insert({
        firstname,
        lastname,
        email,
        profession,
        maritalstatus,
        kids,
        birthday,
        salary,
        id: authData.user.id,
      });
    if (profileError) throw profileError;

  }

  async signIn(data: SignInData) {
    const { data: authData, error } = await this.supabase.auth.signInWithPassword(data);
    if (error) throw error;
    if (authData.user) await this.loadProfile(authData.user.id, authData.user.email ?? data.email);

  }

  async signOut() {
    const result = await this.supabase.auth.signOut();
    if (!result.error) this.userState.set(null);
    return result;
  }

  getCurrentUser() {
    return this.supabase.auth.getUser();
  }

  async updateProfile(profile: UserProfile): Promise<void> {
    const user = this.userState();
    if (!user) throw new Error('You must be signed in to update your profile.');

    const { error } = await this.supabase.from('user').update(profile).eq('id', user.id);
    if (error) throw error;
    this.userState.update((current) => current ? { ...current, ...profile } : current);
  }

  private async loadCurrentUser(): Promise<void> {
    const { data, error } = await this.getCurrentUser();
    if (error || !data.user) {
      this.userState.set(null);
      return;
    }
    await this.loadProfile(data.user.id, data.user.email ?? '');
  }

  private async loadProfile(id: string, email: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('user')
      .select('id, firstname, lastname, email, profession, maritalstatus, kids, birthday, salary')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) {
      this.userState.set(null);
      return;
    }

    this.userState.set({
      id,
      firstName: data.firstname ?? '',
      lastName: data.lastname ?? '',
      email: data.email ?? email,
      profession: data.profession ?? '',
      maritalstatus: data.maritalstatus ?? '',
      kids: data.kids ?? 0,
      birthday: data.birthday ?? '',
      salary: data.salary ?? null,
    });
  }



}
