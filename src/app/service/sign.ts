import { Injectable } from '@angular/core';
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


@Injectable({
  providedIn: 'root',
})
export class Sign{

  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  get client(): SupabaseClient {
    return this.supabase;
  }



  async signUp(data: SignUpData) {

    const firstname = data.firstname;
    const  lastname= data.lastname;
    const email = data.email;
    const profession = data.profession;
    const maritalstatus = data.maritalstatus;
    const kids = data.kids;
    const birthday = data.birthday;
    const salary = data.salary;
    const password = data.password;

    const id=(await this.supabase.auth.signUp({ email, password })).data.user?.id;
    return await this.supabase
  .from('user')
  .insert({ firstname: firstname, lastname:lastname , email: email, profession: profession, maritalstatus: maritalstatus, kids: kids, birthday: birthday, salary: salary, id:id })

  }

  async signIn(data: SignInData) {
    const email = data.email;
    const password = data.password;

    this.supabase.auth.signInWithPassword({email,password});

  }

  async signOut() {
    return this.supabase.auth.signOut();
  }

  getCurrentUser() {
    return this.supabase.auth.getUser();
  }



}
