import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class Register {
  user = {
    email: '',
    matKhau: '',
    hoTen: '',
    soDienThoai: '',
  };

  // 🔥 thông báo UI
  successMessage = '';
  errorMessage = '';
  loading = false;

  constructor(
    private userService: UserService,
    private router: Router,
  ) {}

  register(form: any) {
    if (form.invalid) {
      alert('Vui lòng nhập đúng thông tin');
      return;
    }

      this.loading = true;

    this.userService.register(this.user).subscribe(
    (res: any) => {

      this.loading = false;

      // 🔥 HIỂN THỊ ĐÚNG NGỮ CẢNH
      this.successMessage = "🎉 Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.";

      form.resetForm();

    },
    err => {
      this.loading = false;
      this.errorMessage = err.error?.message || "Đăng ký thất bại";
    }
  );
  }

  loginGoogle() {
    window.location.href = 'http://localhost:3000/api/users/google';
  }
}
