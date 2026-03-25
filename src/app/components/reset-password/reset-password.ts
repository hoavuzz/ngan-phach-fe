import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User } from '../../services/user';
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
  token = '';
  message = '';
  error = '';

  constructor(private route: ActivatedRoute, private userService: User) {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  reset() {
    this.userService.resetPassword({
      token: this.token,
      matKhauMoi: this.matKhauMoi
    }).subscribe((res:any) => {
      this.message = res.message;
      this.error = '';
    }, err => {
      this.error = err.error.message;
      this.message = '';
    });
    console.log("TOKEN FRONTEND:", this.token);
  }
}