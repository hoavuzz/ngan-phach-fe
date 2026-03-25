import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../../services/user';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule,CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  user = {
    email: '',
    matKhau: ''
  }

  constructor(private userService: User, private router: Router) { }

  errorMessage: string = '';

login() {
  this.errorMessage = ''; // reset lỗi

  this.userService.login(this.user).subscribe(
    (res: any) => {
      localStorage.setItem('accessToken', res.accessToken);
      localStorage.setItem('refreshToken', res.refreshToken);
      localStorage.setItem('user', JSON.stringify(res.nguoiDung));

      this.router.navigate(['/']);
    },
    (err) => {
      console.log(err);

      // 🔥 lấy lỗi từ backend
      this.errorMessage = err.error?.message || 'Đăng nhập thất bại';
    }
  );
}

}