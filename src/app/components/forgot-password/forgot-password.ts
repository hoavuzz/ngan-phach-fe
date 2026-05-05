import { Component } from '@angular/core';
import { UserService } from '../../services/user';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {

  email = '';
  message = '';
  error = '';

  constructor(private userService: UserService) {}

  send() {
    this.userService.forgotPassword({ email: this.email })
      .subscribe((res:any) => {
        this.message = res.message;
        this.error = '';
      }, err => {
        this.error = err.error.message;
        this.message = '';
      });
  }
}
