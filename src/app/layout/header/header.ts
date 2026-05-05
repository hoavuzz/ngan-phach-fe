import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  HostListener,
  ChangeDetectorRef,
} from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { NgIf, NgFor, CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user';
import { ProductService } from '../../services/product';
import { CartService } from '../../services/cart.service';
import { Category, CategoryService } from '../../services/category';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, NgIf, FormsModule, NgFor, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, OnDestroy {
  user: any = null;
  searchKeyword: string = '';
  suggestions: any[] = [];
  showSuggestions: boolean = false;
  isLoadingSuggestions: boolean = false;
  cartCount: number = 0;
  categories: Category[] = [];
  isMenuOpen = false;

  private cartSubscription: Subscription | null = null;
  private userSubscription: Subscription | null = null;
  private searchSubject = new Subject<string>();

  constructor(
    private userService: UserService,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef, // 👈 Thêm ChangeDetectorRef
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit() {
    console.log('🔄 Header init - subscribing to user$');

    // 👈 Subscribe vào user$ để nhận cập nhật real-time
    this.userSubscription = this.userService.user$.subscribe((userData) => {
      console.log('👤 Header received user update:', userData);
      this.user = userData;
      this.cdr.detectChanges(); // 👈 Force cập nhật UI
    });

    // 👈 Khôi phục user từ localStorage nếu có (khi refresh trang)
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = this.userService.getUser();
      if (storedUser) {
        console.log('📦 Loaded user from localStorage:', storedUser);
        this.user = storedUser;
        this.cdr.detectChanges();
      }

      this.loadCategories();
    }

    // Subscribe để lấy số lượng giỏ hàng
    this.cartSubscription = this.cartService.cart$.subscribe((items) => {
      if (items && items.length > 0) {
        this.cartCount = items.reduce((total, item) => {
          if (!item.loading) {
            return total + (item.soluong || 1);
          }
          return total;
        }, 0);
      } else {
        this.cartCount = 0;
      }
      console.log('🛒 Cart count updated:', this.cartCount);
      this.cdr.detectChanges();
    });

    // Xử lý gợi ý tìm kiếm real-time
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((keyword: string) => {
          if (keyword.trim().length > 0) {
            this.isLoadingSuggestions = true;
            return this.productService.getSearchSuggestions(keyword, 5);
          }
          this.isLoadingSuggestions = false;
          return [];
        }),
      )
      .subscribe({
        next: (response: any) => {
          this.isLoadingSuggestions = false;
          if (response && response.success && response.data) {
            this.suggestions = response.data;
            this.showSuggestions =
              this.suggestions.length > 0 && this.searchKeyword.trim().length > 0;
          } else {
            this.suggestions = [];
            this.showSuggestions = false;
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Lỗi lấy gợi ý:', error);
          this.isLoadingSuggestions = false;
          this.suggestions = [];
          this.showSuggestions = false;
          this.cdr.detectChanges();
        },
      });
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    this.searchSubject.complete();
  }

  onSearchInput() {
    const keyword = this.searchKeyword.trim();
    if (keyword.length > 0) {
      this.searchSubject.next(keyword);
    } else {
      this.suggestions = [];
      this.showSuggestions = false;
    }
  }

  onSearch(event?: Event) {
    if (event) {
      event.preventDefault();
    }

    if (this.searchKeyword.trim()) {
      this.showSuggestions = false;
      this.router.navigate(['/tim-kiem'], {
        queryParams: { q: this.searchKeyword.trim() },
      });
    }
  }

  selectSuggestion(suggestion: any) {
    this.searchKeyword = suggestion.tenSanPham;
    this.showSuggestions = false;

    if (suggestion.slug) {
      this.router.navigate(['/products', suggestion.slug]);
      return;
    }

    this.router.navigate(['/tim-kiem'], {
      queryParams: { q: suggestion.tenSanPham },
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-container')) {
      this.showSuggestions = false;
    }
  }

  onFocus() {
    if (this.searchKeyword.trim().length > 0 && this.suggestions.length > 0) {
      this.showSuggestions = true;
    }
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Loi tai danh muc tren header:', error);
        this.categories = [];
        this.cdr.detectChanges();
      },
    });
  }

  trackByCategory(index: number, category: Category): number {
    return category.id || index;
  }
}
