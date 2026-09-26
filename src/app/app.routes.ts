import { Routes } from '@angular/router';
import { Onboarding } from './onboarding/onboarding';
import { Auth } from './auth/auth';


export const routes: Routes = [

  {
    path: 'onboarding',
    component:Onboarding
  },
  {
    path:'',
    component:Auth
  }
];
