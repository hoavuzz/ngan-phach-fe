import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-gio-hang',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './gio-hang.html',
  styleUrl: './gio-hang.css',
})
export class GioHang {
  cartItems = [
    {
      id: 1,
      name: 'Đàn Tranh 16 Dây Gỗ Hương Cao Cấp',
      variant: 'Loại gỗ: Gỗ Hương | Kích thước: 1.6m',
      price: 12500000,
      originalPrice: 15000000,
      quantity: 1,
      selected: true,
      imageUrl: 'https://via.placeholder.com/150',
    },
    {
      id: 2,
      name: 'Đàn Nguyệt Truyền Thống',
      variant: 'Loại gỗ: Gỗ Gụ',
      price: 8200000,
      originalPrice: null,
      quantity: 1,
      selected: true,
      imageUrl: 'https://via.placeholder.com/150',
    },
    {
      id: 3,
      name: 'Sáo Trúc Mường Hòa Cao Cấp',
      variant: 'Tone: Đô (C)',
      price: 450000,
      originalPrice: null,
      quantity: 2,
      selected: true,
      imageUrl: 'https://via.placeholder.com/150',
    },
  ];

  get subtotal(): number {
    return this.cartItems
      .filter((i) => i.selected)
      .reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  get discount(): number {
    return 2500000;
  }

  increase(item: any) {
    item.quantity++;
  }
  decrease(item: any) {
    if (item.quantity > 1) item.quantity--;
  }
}
