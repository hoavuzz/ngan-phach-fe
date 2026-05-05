// src/app/app.routes.ts
import { Routes } from '@angular/router';

// ===== PAGES =====
import { HomePage } from './pages/home/home';
import { GioHang } from './pages/gio-hang/gio-hang';
import { Checkout } from './pages/checkout/checkout';
import { PaymentSuccess } from './pages/payment-success/payment-success';
import { PaymentFailed } from './pages/payment-failed/payment-failed';

// ===== AUTH =====
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { ForgotPassword } from './components/forgot-password/forgot-password';
import { ResetPassword } from './components/reset-password/reset-password';
import { LoginSuccess } from './components/login-success/login-success';
import { VerifySuccess } from './components/verify-success/verify-success';
import { VerifyFail } from './components/verify-fail/verify-fail';

// ===== PROFILE =====
import { ProfileLayout } from './pages/profile/profile-layout/profile-layout';
import { ProfileInfo } from './pages/profile/profile-info/profile-info';
import { Orders } from './pages/profile/orders/orders';

// ===== PRODUCT =====
import { Products } from './pages/products/products';
import { ProductDetail } from './pages/product-detail/product-detail';

// ===== NEWS =====
import { NewsDetail } from './pages/news/news-detail/news-detail';
import { NewsList } from './pages/news/news-list/news-list';

// ===== OTHER =====
import { SearchComponent } from './components/search/search';
import { FavoriteComponent } from './pages/favorite/favorite';
import { checkoutAuthGuard } from './guards/checkout-auth.guard';

// ===== CONTACT =====
import { ContactComponent } from './pages/contact/contact';
import { Introduce } from './pages/introduce/introduce';

export const routes: Routes = [
  // ===== HOME =====
  {
    path: '',
    component: HomePage,
  },

  // ===== SEARCH =====
  {
    path: 'tim-kiem',
    component: SearchComponent,
  },

  // ===== PRODUCT =====
  {
    path: 'products',
    component: Products,
  },
  {
    path: 'products/:slug',
    component: ProductDetail,
  },

  // ===== CART =====
  {
    path: 'gio-hang',
    component: GioHang,
  },

  // ===== CHECKOUT =====
  {
    path: 'thanh-toan',
    component: Checkout,
    canActivate: [checkoutAuthGuard],
  },
  {
    path: 'thanh-toan/thanh-cong',
    component: PaymentSuccess,
  },
  {
    path: 'thanh-toan/that-bai',
    component: PaymentFailed,
  },

  // ===== FAVORITE =====
  {
    path: 'yeu-thich',
    component: FavoriteComponent,
  },

  // ===== AUTH =====
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
  },
  {
    path: 'login-success',
    component: LoginSuccess,
  },
  {
    path: 'verify-success',
    component: VerifySuccess,
  },
  {
    path: 'verify-fail',
    component: VerifyFail,
  },

  // ===== PROFILE =====
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

  // ===== NEWS =====
  {
    path: 'tin-tuc',
    component: NewsList,
  },
  {
    path: 'tin-tuc/:slug',
    component: NewsDetail,
  },

  // ===== CONTACT =====

  {
    path: 'lien-he',
    component: ContactComponent,
  },
  // ===== INTRODUCE =====

  {
    path: 'gioi-thieu',
    component: Introduce,
  },

  // ===== FALLBACK =====
  {
    path: '**',
    redirectTo: '',
  },
];
