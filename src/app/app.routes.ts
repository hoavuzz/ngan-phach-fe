import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home';
import { GioHang } from './pages/gio-hang/gio-hang';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
  },
  {
    path: 'gio-hang',
    component: GioHang,
  },
];
