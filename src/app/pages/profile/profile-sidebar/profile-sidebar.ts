import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { User } from '../../../services/user';

@Component({
  selector: 'app-profile-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './profile-sidebar.html',
})
export class ProfileSidebar implements OnInit {
  user: any;

  constructor(
    private userService: User,
    private router: Router,
  ) {}

  ngOnInit() {
    this.userService.user$.subscribe((data) => {
      this.user = data;
    });
  }

  logout() {
    this.userService.logout();
    this.router.navigate(['/']);
  }
}
