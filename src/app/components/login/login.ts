import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../../services/user';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  user = {
    email: '',
    matKhau: '',
  };

  constructor(
    private userService: User,
    private router: Router,
  ) {}

  login() {
    this.userService.login(this.user).subscribe(
      (res: any) => {
        alert(res.message);
        this.router.navigate(['/']);
      },
      (err) => {
        alert(err?.error?.message || 'Đăng nhập thất bại');
      },
    );
  }
}
