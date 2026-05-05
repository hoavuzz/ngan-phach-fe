import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly adminAppUrl = 'http://localhost:4300/admin';
  private readonly adminTransferKey = 'admin-auth-transfer';

  user = {
    email: '',
    matKhau: '',
  };

  constructor(
    private userService: UserService,
    private router: Router,
    private cartService: CartService,
    private route: ActivatedRoute,
  ) {}

  errorMessage: string = '';

  login() {
    this.errorMessage = ''; // reset lỗi

    this.userService.login(this.user).subscribe(
      (res: any) => {
        localStorage.setItem('accessToken', res.accessToken);
        localStorage.setItem('refreshToken', res.refreshToken);
        localStorage.setItem('user', JSON.stringify(res.nguoiDung));

        // Sync cart after login
        this.cartService.handleAfterLogin();

        if (res?.nguoiDung?.vaiTro === 'quan_tri') {
          window.name = JSON.stringify({
            key: this.adminTransferKey,
            user: res.nguoiDung,
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
          });
          window.location.href = this.adminAppUrl;
          return;
        }

        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
        this.router.navigateByUrl(returnUrl);
      },
      (err) => {
        console.log(err);

        // 🔥 lấy lỗi từ backend
        this.errorMessage = err.error?.message || 'Đăng nhập thất bại';
      },
    );
  }

  loginGoogle() {
    window.location.href = 'http://localhost:3000/api/users/google';
  }
}
