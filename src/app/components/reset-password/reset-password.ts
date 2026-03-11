import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '../../services/user';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reset-password.html'
})
export class ResetPassword {

  matKhauMoi = '';
  token = '';

  constructor(
    private route:ActivatedRoute,
    private userService:User,
    private router:Router
  ){}

  ngOnInit(){

    this.token = this.route.snapshot.paramMap.get('token')!

  }

  reset(){

    this.userService.resetPassword({
      token:this.token,
      matKhauMoi:this.matKhauMoi
    }).subscribe((res:any)=>{

      alert(res.message)

      this.router.navigate(['/login'])

    },err=>{
      alert(err.error.message)
    })

  }

}