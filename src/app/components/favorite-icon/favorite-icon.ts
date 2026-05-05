import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-favorite-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './favorite-icon.html',
  styleUrls: ['./favorite-icon.css'],
})
export class FavoriteIcon implements OnInit, OnDestroy {
  @Input() sanPhamId!: number;
  @Input() bienTheId: number | null = null;
  @Input() size: number = 24;

  isFavorite: boolean = false;
  isLoading: boolean = false;
  private yeuThichId: number | null = null;
  private subscriptions: Subscription = new Subscription();

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    if (!this.sanPhamId) {
      console.error('❌ LỖI: sanPhamId không được truyền vào component!');
      return;
    }
    this.checkFavoriteStatus();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  checkFavoriteStatus(): void {
    const user = this.userService.getUser();
    if (!user || !this.sanPhamId) return;

    const sub = this.userService.getFavorites().subscribe({
      next: (res: any) => {
        const favorites = res.data || res || [];
        const found = favorites.find((item: any) => item.sanPham?.id === this.sanPhamId);
        this.isFavorite = !!found;
        this.yeuThichId = found?.yeuThichId || null;
      },
      error: (err) => {
        console.error('Lỗi kiểm tra yêu thích:', err);
      },
    });
    this.subscriptions.add(sub);
  }

  toggleFavorite(event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    const user = this.userService.getUser();
    if (!user) {
      alert('Vui lòng đăng nhập để sử dụng tính năng yêu thích');
      return;
    }

    if (this.isLoading || !this.sanPhamId) return;
    this.isLoading = true;

    if (this.isFavorite) {
      // Xóa yêu thích
      if (this.yeuThichId) {
        const sub = this.userService.removeFavoriteById(this.yeuThichId).subscribe({
          next: () => {
            this.isFavorite = false;
            this.yeuThichId = null;
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Lỗi xóa yêu thích:', err);
            this.isLoading = false;
          },
        });
        this.subscriptions.add(sub);
      } else {
        this.isLoading = false;
      }
    } else {
      // Thêm yêu thích
      const sub = this.userService.addFavoriteByProduct(this.sanPhamId, this.bienTheId).subscribe({
        next: (res) => {
          this.isFavorite = true;
          this.yeuThichId = res.data?.yeuThichId || null;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Lỗi thêm yêu thích:', err);
          this.isLoading = false;
          // Nếu lỗi do đã tồn tại
          if (err.status === 400 && err.error?.message?.includes('đã có')) {
            this.isFavorite = true;
            this.checkFavoriteStatus();
          }
        },
      });
      this.subscriptions.add(sub);
    }
  }
}
