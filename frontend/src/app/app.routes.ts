import { Routes } from '@angular/router';
import { Auth } from './auth/auth';
import { authGuard, guestGuard } from './core/auth.guards';
import { AppShell } from './layout/app-shell';
import { Onboarding } from './onboarding/onboarding';
import { Dashboard } from './pages/dashboard/dashboard';
import { Goals } from './pages/goals/goals';
import { Profile } from './pages/profile/profile';
import { Spendings } from './pages/spendings/spendings';

export const routes: Routes = [
  { path: 'auth', component: Auth, canActivate: [guestGuard], title: 'Sign in · Savvily' },
  {
    path: 'onboarding',
    component: Onboarding,
    canActivate: [authGuard],
    title: 'Complete your profile · Savvily',
  },
  {
    path: '',
    component: AppShell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: Dashboard, title: 'Dashboard · Savvily' },
      { path: 'spendings', component: Spendings, title: 'Spendings · Savvily' },
      { path: 'goals', component: Goals, title: 'Goals & Wishlist · Savvily' },
      { path: 'profile', component: Profile, title: 'Profile · Savvily' },
    ],
  },
  { path: '**', redirectTo: '' },
];
