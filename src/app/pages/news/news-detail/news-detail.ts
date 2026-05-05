import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NewsService } from '../../../services/news';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './news-detail.html',
  styleUrls: ['./news-detail.css']
})
export class NewsDetail implements OnInit {

  data: any;

  constructor(
    private route: ActivatedRoute,
    private newsService: NewsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');

      if (slug) {
        this.loadDetail(slug);
      }
    });
  }

  loadDetail(slug: string) {
    this.newsService.getDetail(slug).subscribe({
      next: (res) => {
        this.data = res;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('LOAD NEWS DETAIL ERROR:', err);
        this.data = null;
        this.cdr.detectChanges();
      },
    });
  }

  onImageError(event: any) {
    event.target.src = 'assets/no-image.jpg';
  }
}
