import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../../services/user';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {

  user = {
    email: '',
    matKhau: '',
    hoTen: '',
    soDienThoai: ''
  }

  confirmPassword = '';

  constructor(private userService: User, private router: Router) {}

  // 📱 format số điện thoại +84
  // formatPhone() {

  //   if(this.user.soDienThoai.startsWith("0")){
  //     this.user.soDienThoai = "+84" + this.user.soDienThoai.substring(1);
  //   }

  // }

  register(form:any){

    if(form.invalid){
      alert("Vui lòng nhập đúng thông tin");
      return;
    }

    // if(this.user.matKhau !== this.confirmPassword){
    //   alert("Mật khẩu xác nhận không khớp");
    //   return;
    // }

    // this.formatPhone();

    this.userService.register(this.user).subscribe((res:any)=>{

      alert(res.message);

      // chuyển sang login
      this.router.navigate(['/'])

    }, err=>{

      alert(err.error.message)

    })

  }

}