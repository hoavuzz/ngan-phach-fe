import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user';

@Component({
  selector: 'app-login-success',
  standalone: true,
  templateUrl: './login-success.html',
  styleUrls: ['./login-success.css'],
})
export class LoginSuccess implements OnInit {
  private readonly adminAppUrl = 'http://localhost:4300/admin';
  private readonly adminTransferKey = 'admin-auth-transfer';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const accessToken = params['accessToken'];
      const refreshToken = params['refreshToken'];

      if (!isPlatformBrowser(this.platformId)) {
        return;
      }

      if (!accessToken) {
        alert('Đăng nhập Google thất bại');
        this.router.navigate(['/login']);
        return;
      }

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      this.userService.getProfile().subscribe({
        next: (user: any) => {
          localStorage.setItem('user', JSON.stringify(user));
          this.userService.updateLocalUser(user);

          if (user?.vaiTro === 'quan_tri') {
            window.name = JSON.stringify({
              key: this.adminTransferKey,
              user,
              accessToken,
              refreshToken,
            });
            window.location.href = this.adminAppUrl;
            return;
          }

          this.router.navigate(['/']);
        },
        error: () => {
          this.router.navigate(['/']);
        },
      });
    });
  }
}
