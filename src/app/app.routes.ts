import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home';
import { GioHang } from './pages/gio-hang/gio-hang';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { ForgotPassword } from './components/forgot-password/forgot-password';
import { ResetPassword } from './components//reset-password/reset-password';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
  },
  {
    path: 'gio-hang',
    component: GioHang,
  },
  {
    path: 'login',
    component: Login,
  },
    {
    path: 'register',
    component: Register,
  },
  {
    path: 'forgot-password',
    component: ForgotPassword,
  },
  {
    path: 'reset-password',
    component: ResetPassword,
  }
];
