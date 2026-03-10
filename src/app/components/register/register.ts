import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../../services/user';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {

  user = {
    tenDangNhap:'',
    email:'',
    matKhau:'',
    hoTen:'',
    soDienThoai:''
  }

  constructor(private userService:User){}

  register(){

    this.userService.register(this.user).subscribe((res:any)=>{
      console.log(res) // kiểm tra dữ liệu trả về
      // lưu token
    localStorage.setItem("accessToken", res.accessToken);
    localStorage.setItem("refreshToken", res.refreshToken);

        // lưu user
    localStorage.setItem('user', JSON.stringify(res.nguoiDung))

    alert(res.message);


    },err=>{

      alert(err.error.message)

    })

  }

}