import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { FavoriteIcon } from '../favorite-icon/favorite-icon';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, FavoriteIcon],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCard {
  @Input() product: any;
  @Input() badge: string | null = null;

  constructor(
    private cartService: CartService,
    private router: Router,
  ) {}

  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    if (imagePath.startsWith('/uploads/')) {
      return `http://localhost:3000${imagePath}`;
    }

    return `http://localhost:3000/uploads/${imagePath}`;
  }

  onImageError(event: any) {
    event.target.src =
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3C/svg%3E';
  }

  formatPrice(price: number | string): string {
    if (!price) return '0';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toLocaleString('vi-VN');
  }

  private getVariantId(variant: any): number {
    return Number(variant?.id_bienthe || variant?.id || 0);
  }

  addToCart(bienThe?: any) {
    const selectedVariantId = this.getVariantId(bienThe);

    if (selectedVariantId > 0) {
      this.cartService.addToCart({ id_bienthe: selectedVariantId }).subscribe();
      return;
    }

    const variants = this.product?.sanpham_bienthes || this.product?.SanPhamBienThes || [];
    const firstVariant = variants.find((v: any) => this.getVariantId(v) > 0);

    this.cartService
      .addToCart(
        firstVariant
          ? { id_bienthe: this.getVariantId(firstVariant) }
          : this.product,
      )
      .subscribe({
        error: (err) => console.error('Them gio hang loi:', err),
      });
  }

  buyNow(product: any) {
    const variants = product?.sanpham_bienthes || product?.SanPhamBienThes || [];
    const firstVariant = variants.find((v: any) => this.getVariantId(v) > 0);

    if (!firstVariant) {
      console.error('Khong co bien the hop le de mua:', product);
      return;
    }

    this.router.navigate(['/thanh-toan'], {
      state: {
        product: {
          id: this.getVariantId(firstVariant),
        },
      },
    });
  }

  onVariantSelected() {}
  closeModal() {}
}
