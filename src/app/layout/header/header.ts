import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { User } from '../../services/user'; // import service
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, NgIf],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  user: any = null;
  private subscription!: Subscription;

  constructor(
    private userService: User,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit() {
    // subscribe để nhận giá trị realtime
    this.subscription = this.userService.user$.subscribe((userData) => {
      this.user = userData;
      // console.log('Header received user:', this.user); // debug nếu cần
    });

    // Optional: nếu muốn chắc chắn có dữ liệu ban đầu (trường hợp reload trang)
    if (isPlatformBrowser(this.platformId)) {
      this.user = this.userService.getUser();
    }
  }

  ngOnDestroy() {
    // tránh memory leak
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
