import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../services/user';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-favorite',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './favorite.html',
  styleUrls: ['./favorite.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoriteComponent implements OnInit, OnDestroy {
  favorites: any[] = [];
  isLoading: boolean = true;
  total: number = 0;
  currentPage: number = 1;
  pageSize: number = 8;

  private subscription: Subscription = new Subscription();
  // Cache để tránh reload ảnh - lưu trạng thái ảnh đã load
  private imageLoadedMap = new Map<number, boolean>();
  // Cache URL ảnh để so sánh
  private imageUrlMap = new Map<number, string>();

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadFavorites();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.imageLoadedMap.clear();
    this.imageUrlMap.clear();
  }

  loadFavorites(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    const sub = this.userService.getFavorites().subscribe({
      next: (res: any) => {
        const favoritesData = res.data || res || [];

        // Xử lý dữ liệu - giữ lại trạng thái ảnh đã load cho sản phẩm cũ
        const oldFavoritesMap = new Map<number, any>();
        this.favorites.forEach((item) => {
          if (item.sanPham) {
            oldFavoritesMap.set(item.sanPham.id, {
              imageLoaded: this.imageLoadedMap.get(item.sanPham.id) || false,
              imageUrl: this.getImageUrl(item.sanPham.hinhAnh),
            });
          }
        });

        this.favorites = favoritesData.map((item: any) => {
          if (!item.sanPham) return item;

          const productId = item.sanPham.id;
          const imageUrl = this.getImageUrl(item.sanPham.hinhAnh) || '/images/placeholder.jpg';

          // Lấy trạng thái từ cache
          const oldState = oldFavoritesMap.get(productId);
          let imageLoaded = false;

          if (oldState) {
            if (oldState.imageUrl === imageUrl && oldState.imageLoaded) {
              imageLoaded = true;
            }
          }

          // Cập nhật cache
          this.imageUrlMap.set(productId, imageUrl);
          if (!this.imageLoadedMap.has(productId)) {
            this.imageLoadedMap.set(productId, imageLoaded);
          }

          return {
            ...item,
            sanPham: {
              ...item.sanPham,
              hinhAnh: imageUrl,
              imageLoading: !imageLoaded,
            },
          };
        });

        this.total = this.favorites.length;
        this.ensureValidPage();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi tải danh sách yêu thích:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });

    this.subscription.add(sub);
  }

  removeFavorite(yeuThichId: number, index: number): void {
    const sub = this.userService.removeFavoriteById(yeuThichId).subscribe({
      next: () => {
        const removedItem = this.favorites[index];
        if (removedItem?.sanPham) {
          this.imageLoadedMap.delete(removedItem.sanPham.id);
          this.imageUrlMap.delete(removedItem.sanPham.id);
        }
        this.favorites.splice(index, 1);
        this.total = this.favorites.length;
        this.ensureValidPage();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi xóa yêu thích:', err);
      },
    });

    this.subscription.add(sub);
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

  getImageUrl(imagePath: string): string {
    console.log('🔍 Đường dẫn ảnh gốc:', imagePath);

    if (imagePath.startsWith('http')) {
      console.log('✅ Ảnh mạng:', imagePath);
      return imagePath;
    }
    // Ảnh nội bộ (từ backend)
    const fullUrl = `http://localhost:3000/uploads/${imagePath}`;
    console.log('✅ Ảnh nội bộ sau xử lý:', fullUrl);
    return fullUrl;
  }

  // Xử lý khi ảnh load xong
  onImageLoad(productId: number) {
    if (!this.imageLoadedMap.get(productId)) {
      this.imageLoadedMap.set(productId, true);

      const favorite = this.favorites.find((f) => f.sanPham?.id === productId);
      if (favorite?.sanPham && favorite.sanPham.imageLoading) {
        favorite.sanPham.imageLoading = false;
        this.cdr.detectChanges();
      }
    }
  }

  // Xử lý lỗi ảnh
  onImageError(event: any, product: any) {
    const placeholderUrl = '/images/placeholder.jpg';
    event.target.src = placeholderUrl;

    if (product) {
      product.imageLoading = false;
      this.imageLoadedMap.set(product.id, true);
      this.imageUrlMap.set(product.id, placeholderUrl);
    }
  }

  get paginatedFavorites(): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.favorites.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.cdr.detectChanges();
  }

  private ensureValidPage(): void {
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }
}
