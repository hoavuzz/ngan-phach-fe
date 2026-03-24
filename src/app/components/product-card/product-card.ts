import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCard {

  @Input() product: any;
  @Input() badge: string | null = null;

  constructor(private cartService: CartService) {}

  addToCart() {
    this.cartService.addToCart(this.product);
    alert('Đã thêm vào giỏ hàng');
  }

}