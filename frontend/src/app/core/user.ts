/** A Savvily account. Profile fields stay null until onboarding is completed. */
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profession: string | null;
  maritalStatus: MaritalStatus | null;
  kids: number | null;
  birthday: string | null;
  salary: number | null;
}

export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';

export const MARITAL_STATUSES: { value: MaritalStatus; label: string }[] = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
];

export type UserProfile = Pick<User, 'profession' | 'maritalStatus' | 'kids' | 'birthday' | 'salary'>;

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
  return (
    !!user.profession &&
    user.maritalStatus !== null &&
    user.kids !== null &&
    user.birthday !== null &&
    user.salary !== null
  );
}
