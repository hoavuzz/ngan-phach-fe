import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './search.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent implements OnInit, OnDestroy {
  keyword: string = '';
  products: any[] = [];
  loading: boolean = false;
  error: string | null = null;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 12;
  totalItems: number = 0;
  totalPages: number = 0;

  // Filters
  sortBy: string = 'moi_nhat';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  categoryId: number | null = null;

  private subscription: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.subscription.add(
      this.route.queryParams.subscribe((params) => {
        this.keyword = params['q'] || '';
        this.currentPage = Number(params['page']) || 1;
        this.sortBy = params['sort'] || 'moi_nhat';
        this.minPrice = params['minPrice'] ? Number(params['minPrice']) : null;
        this.maxPrice = params['maxPrice'] ? Number(params['maxPrice']) : null;
        this.categoryId = params['category'] ? Number(params['category']) : null;

        if (this.keyword) {
          this.searchProducts();
        } else if (this.keyword === '' && this.products.length === 0) {
          this.products = [];
          this.totalItems = 0;
          this.totalPages = 0;
          this.cdr.detectChanges();
        }
      }),
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  searchProducts() {
    if (!this.keyword.trim()) {
      this.loading = false;
      this.products = [];
      this.totalItems = 0;
      this.totalPages = 0;
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    const searchParams: any = {
      keyword: this.keyword.trim(),
      page: this.currentPage,
      limit: this.pageSize,
      sortBy: this.sortBy,
    };

    if (this.minPrice !== null && this.minPrice > 0) {
      searchParams.minPrice = this.minPrice;
    }
    if (this.maxPrice !== null && this.maxPrice > 0) {
      searchParams.maxPrice = this.maxPrice;
    }
    if (this.categoryId !== null && this.categoryId > 0) {
      searchParams.categoryId = this.categoryId;
    }

    this.productService.searchProducts(searchParams).subscribe({
      next: (response) => {
        if (response.success) {
          this.products = response.data.products.map((product: any) => ({
            ...product,
            giaHienTai: product.giaHienTai || 0,
            hinhAnhDauTien: this.getImageUrl(product.hinhAnhDauTien),
            tonKho: product.tonKho || 0,
            coSanPham: product.tonKho > 0,
          }));

          this.totalItems = response.data.total;
          this.totalPages = response.data.totalPages;

          if (response.data.page) {
            this.currentPage = response.data.page;
          }
        } else {
          this.error = response.message;
          this.products = [];
          this.totalItems = 0;
          this.totalPages = 0;
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Search error:', err);
        this.error = 'Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại sau.';
        this.loading = false;
        this.products = [];
        this.totalItems = 0;
        this.totalPages = 0;
        this.cdr.detectChanges();
      },
    });
  }

  trackByProductId(index: number, product: any): number {
    return product.id;
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) return 'assets/images/placeholder.jpg';
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    return `http://localhost:3000/uploads/${imagePath}`;
  }

  // Xử lý lỗi ảnh
  onImageError(event: any) {
    const placeholderUrl = 'assets/images/placeholder.jpg';
    if (event.target.src !== placeholderUrl) {
      event.target.src = placeholderUrl;
    }
    event.target.onerror = null;
  }

  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updateQueryParams();
  }

  onSortChange(sortBy: string) {
    this.sortBy = sortBy;
    this.currentPage = 1;
    this.updateQueryParams();
  }

  onPriceFilter() {
    if (this.minPrice !== null && this.maxPrice !== null && this.minPrice > this.maxPrice) {
      this.error = 'Giá từ phải nhỏ hơn giá đến';
      return;
    }
    this.currentPage = 1;
    this.updateQueryParams();
  }

  clearFilters() {
    this.minPrice = null;
    this.maxPrice = null;
    this.categoryId = null;
    this.sortBy = 'moi_nhat';
    this.currentPage = 1;
    this.updateQueryParams();
  }

  private updateQueryParams() {
    const queryParams: any = {
      q: this.keyword,
      page: this.currentPage,
    };

    if (this.sortBy !== 'moi_nhat') {
      queryParams.sort = this.sortBy;
    }
    if (this.minPrice !== null && this.minPrice > 0) {
      queryParams.minPrice = this.minPrice;
    }
    if (this.maxPrice !== null && this.maxPrice > 0) {
      queryParams.maxPrice = this.maxPrice;
    }
    if (this.categoryId !== null && this.categoryId > 0) {
      queryParams.category = this.categoryId;
    }

    this.router.navigate(['/tim-kiem'], {
      queryParams,
      queryParamsHandling: 'merge',
    });
  }

  formatPrice(price: number): string {
    if (!price || price === 0) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  getCategoryName(product: any): string {
    return product.danhMuc?.tenDanhMuc || '';
  }

  getPaginationArray(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;

    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, this.currentPage - 2);
      let end = Math.min(this.totalPages, start + 4);

      if (end - start < 4) {
        start = Math.max(1, end - 4);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (start > 1) {
        pages.unshift(-1);
        pages.unshift(1);
      }

      if (end < this.totalPages) {
        pages.push(-1);
        pages.push(this.totalPages);
      }
    }

    return pages;
  }
}
