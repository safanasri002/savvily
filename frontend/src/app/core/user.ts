/** Mirrors the `user` table. Profile fields stay null until onboarding is completed. */
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  birthday: string | null;
  salary: number | null;
  profession: string | null;
}

export type UserProfile = Pick<User, 'birthday' | 'salary' | 'profession'>;

export interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export function isProfileComplete(user: User): boolean {
  return user.birthday !== null && user.salary !== null && !!user.profession;
}
