import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-gio-hang',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './gio-hang.html',
  styleUrls: ['./gio-hang.css'],
})
export class GioHang implements OnInit {

  cartItems:any[] = [];

  constructor(private cartService: CartService){}

  ngOnInit(){
    this.loadCart();
  }

  loadCart(){
    this.cartItems = this.cartService.getCart();
  }

  get subtotal(): number {
    return this.cartItems
      .filter(i => i.selected)
      .reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  get discount(): number {
    return 0;
  }

  increase(item:any){
    item.quantity++;
    this.cartService.updateCart(this.cartItems);
  }

  decrease(item:any){
    if(item.quantity > 1){
      item.quantity--;
      this.cartService.updateCart(this.cartItems);
    }
  }

  removeItem(id:number){
    this.cartService.removeItem(id);
    this.loadCart();
  }

}