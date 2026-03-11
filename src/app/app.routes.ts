import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home';
import { GioHang } from './pages/gio-hang/gio-hang';
import { Login } from './components/login/login';
import { Register } from './components/register/register';

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
  path:'forgot-password',
  loadComponent:()=>import('./components/forgot-password/forgot-password')
  .then(m=>m.ForgotPassword)
},

{
  path:'reset-password/:token',
  loadComponent:()=>import('./components/reset-password/reset-password')
  .then(m=>m.ResetPassword)
}
];
