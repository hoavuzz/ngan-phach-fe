import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../../services/user';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {

  user = {
    tenDangNhap:'',
    email: '',
    matKhau: '',
    hoTen: '',
    soDienThoai: ''
  }

  constructor(private userService: User) { }

  register() {

    this.userService.register(this.user).subscribe((res: any) => {

      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);
      localStorage.setItem('user', JSON.stringify(res.nguoiDung))

      alert(res.message);

    }, err => {

      alert(err.error.message)

    })

  }

}