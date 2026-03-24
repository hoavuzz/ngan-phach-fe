import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../../services/user';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css']
})
export class ForgotPassword {

  email = '';

  constructor(private userService:User){}

  send(){

    this.userService.forgotPassword({email:this.email})
    .subscribe((res:any)=>{

      alert(res.message)

    },err=>{
      alert(err.error.message)
    })

  }

}