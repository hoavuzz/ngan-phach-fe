import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword {

  matKhauMoi = '';
  confirmPassword = '';
  token = '';

  message = '';
  error = '';
  loading = false;

  constructor(
    private route: ActivatedRoute,
  private userService: UserService, // ✅ đúng
    private router: Router
  ) {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  reset(form: any) {

    this.message = '';
    this.error = '';

    // 🔥 VALIDATE
    if (!this.matKhauMoi || !this.confirmPassword) {
      this.error = 'Vui lòng nhập đầy đủ thông tin';
      return;
    }

    // regex giống backend
    const passRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!passRegex.test(this.matKhauMoi)) {
      this.error = 'Mật khẩu phải ít nhất 6 ký tự, gồm chữ và số';
      return;
    }

    if (this.matKhauMoi !== this.confirmPassword) {
      this.error = 'Mật khẩu xác nhận không khớp';
      return;
    }

    if (form.invalid) {
      this.error = 'Vui lòng nhập đúng thông tin';
      return;
    }

    this.loading = true;

    this.userService.resetPassword({
      token: this.token,
      matKhauMoi: this.matKhauMoi
    }).subscribe(
      (res: any) => {
        this.message = res.message || 'Đặt lại mật khẩu thành công';
        this.error = '';
        this.loading = false;

        form.resetForm();

        // 🔥 chuyển về login sau 3s
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 5000);
      },
      err => {
        this.error = err.error?.message || 'Đặt lại mật khẩu thất bại';
        this.message = '';
        this.loading = false;
      }
    );
  }
}