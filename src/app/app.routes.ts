import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home';
import { GioHang } from './pages/gio-hang/gio-hang';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Orders } from './pages/profile/orders/orders';
import { ProfileInfo } from './pages/profile/profile-info/profile-info';
import { ProfileLayout } from './pages/profile/profile-layout/profile-layout';

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
    path: 'trang-ca-nhan',
    component: ProfileLayout,
    children: [
      {
        path: '',
        component: ProfileInfo,
      },

      {
        path: 'don-hang-cua-toi',
        component: Orders,
      },
    ],
  },
];
