import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { UserService } from '../../services/user';
import { Subscription } from 'rxjs';
import { Category, CategoryService } from '../../services/category';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories implements OnInit, OnDestroy {
  @ViewChild('categoryTrack') categoryTrack?: ElementRef<HTMLDivElement>;

  categories: Category[] = [];
  isLoading = true;
  error: string | null = null;
  private userSubscription: Subscription = new Subscription();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private categoryService: CategoryService,
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.fetchCategories();

    this.userSubscription = this.userService.user$.subscribe(() => {
      console.log('User state changed, reloading categories...');
      this.fetchCategories();
    });
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  fetchCategories() {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        console.log(
          'Categories loaded:',
          this.categories.map((c) => c.tenDanhMuc),
        );
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Loi tai categories:', err);
        this.error = 'Khong the tai danh muc. Vui long thu lai sau.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  goToCategory(slug: string) {
    this.router.navigate(['/products'], {
      queryParams: { category: slug },
    });
  }

  prevCategories() {
    this.categoryTrack?.nativeElement.scrollBy({
      left: -320,
      behavior: 'smooth',
    });
  }

  nextCategories() {
    this.categoryTrack?.nativeElement.scrollBy({
      left: 320,
      behavior: 'smooth',
    });
  }

  getCategoryImageUrl(imagePath?: string | null): string {
    if (!imagePath) {
      return 'https://via.placeholder.com/600x400?text=Danh+muc';
    }

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    if (imagePath.startsWith('/uploads/')) {
      return `http://localhost:3000${imagePath}`;
    }

    return `http://localhost:3000/uploads/${imagePath}`;
  }

  onCategoryImageError(event: Event) {
    const target = event.target as HTMLImageElement | null;

    if (target) {
      target.src = 'https://via.placeholder.com/600x400?text=Danh+muc';
    }
  }

  getCategoryIcon(tenDanhMuc: string): string {
    if (!tenDanhMuc) return '??';

    const iconMap: { [key: string]: string } = {
      bau: '??',
      tranh: '??',
      nhi: '??',
      nguyet: '??',
      'ty ba': '??',
      day: '??',
      'tam thap luc': '??',
      sao: '??',
      trong: '??',
      ken: '??',
      khen: '??',
      'dan da': '??',
      'dan moi': '??',
      guitar: '??',
      piano: '??',
      violin: '??',
    };

    const lowerName = tenDanhMuc.toLowerCase();

    for (const [key, icon] of Object.entries(iconMap)) {
      if (lowerName.includes(key)) {
        return icon;
      }
    }

    return '??';
  }
}
