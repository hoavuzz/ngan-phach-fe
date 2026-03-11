import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-gio-hang',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './gio-hang.html',
  styleUrl: './gio-hang.css',
})
export class GioHang {

  cartItems:any[]=[];

  constructor(private cartService:CartService){}

  ngOnInit(){
    this.cartItems = this.cartService.getCart();
  }

  increase(item:any){
    item.quantity++;
    this.cartService.updateCart(this.cartItems);
  }

  decrease(item:any){
    if(item.quantity>1){
      item.quantity--;
      this.cartService.updateCart(this.cartItems);
    }
  }

  remove(item:any){
    this.cartService.removeItem(item.id);
    this.cartItems = this.cartService.getCart();
  }

  get subtotal():number{
    return this.cartItems.reduce((sum,i)=>sum+i.price*i.quantity,0);
  }

}