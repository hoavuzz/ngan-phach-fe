import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef,
} from '@angular/core';
import { NgFor, DatePipe, CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { HomeService } from '../../services/home.service';

@Component({
  selector: 'app-news-section',
  standalone: true,
  imports: [NgFor, DatePipe, CommonModule, HttpClientModule, RouterLink],
  templateUrl: './news-section.html',
})
export class NewsSection implements OnInit, OnDestroy {
  newsList: any[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private homeService: HomeService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loadNews();
  }

  ngOnDestroy() {}

  loadNews() {
    this.isLoading = true;
    this.error = null;
    this.cdr.detectChanges();

    this.homeService.getHomeData().subscribe({
      next: (res) => {
        if (res?.data?.news) {
          this.newsList = res.data.news;
        } else {
          this.error = 'Khong co tin tuc nao de hien thi';
          this.newsList = [];
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Loi load News:', err);
        this.error = 'Khong the tai tin tuc. Vui long thu lai sau.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
