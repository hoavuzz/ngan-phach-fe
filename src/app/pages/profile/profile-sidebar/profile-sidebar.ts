import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { UserService } from '../../../services/user';

@Component({
  selector: 'app-profile-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './profile-sidebar.html',
})
export class ProfileSidebar implements OnInit {
  @Input() mobile = false;
  private readonly adminTransferKey = 'admin-auth-transfer';
  user: any = {};
  readonly adminAppUrl: string;

  constructor(
    private userService: UserService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.adminAppUrl = this.getAdminUrl();
  }

  private getAdminUrl(): string {
    if (isPlatformBrowser(this.platformId)) {
      const hostname = window.location.hostname;
      if (hostname === 'localhost') {
        return 'http://localhost:4300/admin';
      } else {
        // For production, assume subdomain admin.
        const protocol = window.location.protocol;
        const port = window.location.port ? ':' + window.location.port : '';
        return `${protocol}//admin.${hostname}${port}/admin`;
      }
    }
    return 'http://localhost:4300/admin'; // fallback
  }

  ngOnInit() {
    this.loadUser();
  }

  loadUser() {
    const user = localStorage.getItem('user');
    this.user = user ? JSON.parse(user) : {};
  }

  get isAdmin(): boolean {
    return this.user?.vaiTro === 'quan_tri';
  }

  getRoleDisplay(): string {
    if (this.user?.vaiTro === 'quan_tri') {
      return 'Quản trị';
    }
    return 'Khách hàng';
  }

  goToAdmin() {
    if (isPlatformBrowser(this.platformId)) {
      window.name = JSON.stringify({
        key: this.adminTransferKey,
        user: this.user,
        accessToken: localStorage.getItem('accessToken') || '',
        refreshToken: localStorage.getItem('refreshToken') || '',
      });
      window.location.href = this.adminAppUrl;
    }
  }

  logout() {
    this.userService.logout();
    this.router.navigate(['/']);
  }
}
