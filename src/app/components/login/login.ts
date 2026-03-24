import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../../services/user';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  user = {
    email: '',
    matKhau: ''
  }

  constructor(private userService: User, private router: Router) { }

  login() {
    console.log(this.user)   // xem dữ liệu gửi đi
    this.userService.login(this.user).subscribe((res: any) => {

      localStorage.setItem('accessToken', res.accessToken);
      localStorage.setItem('refreshToken', res.refreshToken);
      localStorage.setItem('user', JSON.stringify(res.nguoiDung));
      
      alert(res.message)

      this.router.navigate(['/'])

    }, err => {
      console.log(err)
      alert(err.error.message)

    })

  }

}