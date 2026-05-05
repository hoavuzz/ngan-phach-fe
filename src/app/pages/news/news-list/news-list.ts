import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NewsService } from '../../../services/news';

@Component({
  selector: 'app-news-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './news-list.html',
  styleUrls: ['./news-list.css'],
})
export class NewsList implements OnInit {
  @ViewChild('categoryBar') categoryBar!: ElementRef;

  list: any[] = [];
  noiBat: any[] = [];
  danhMucList: any[] = [];
  currentDanhMucId: any = null;

  maxVisibleCategories = 8;

  constructor(
    private newsService: NewsService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.currentDanhMucId = params['danhMucId'] || null;
      this.loadData();
    });

    this.loadNoiBat();
    this.loadDanhMuc();
  }

  loadData() {
    this.newsService.getList(1, this.currentDanhMucId).subscribe({
      next: (res: any) => {
        this.list = res?.data ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('LOAD NEWS ERROR:', err);
        this.list = [];
        this.cdr.detectChanges();
      },
    });
  }

  loadNoiBat() {
    this.newsService.getNoiBat().subscribe({
      next: (res: any) => {
        this.noiBat = res ?? [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.noiBat = [];
        this.cdr.detectChanges();
      },
    });
  }

  loadDanhMuc() {
    this.newsService.getDanhMuc().subscribe({
      next: (res: any) => {
        this.danhMucList = res ?? [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.danhMucList = [];
        this.cdr.detectChanges();
      },
    });
  }

  scrollLeft() {
    this.categoryBar?.nativeElement.scrollBy({
      left: -200,
      behavior: 'smooth',
    });
  }

  scrollRight() {
    this.categoryBar?.nativeElement.scrollBy({
      left: 200,
      behavior: 'smooth',
    });
  }

  isScrollable(): boolean {
    return this.danhMucList.length > this.maxVisibleCategories;
  }

  getImage(img: string): string {
    if (!img) return 'assets/no-image.jpg';
    if (img.startsWith('http')) return img;
    return 'http://localhost:3000/uploads/' + img;
  }

  onImageError(event: any) {
    event.target.src = 'assets/no-image.jpg';
  }
}
