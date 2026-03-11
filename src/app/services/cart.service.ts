import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  apiUrl = 'http://localhost:3000/cart';

  constructor(private http: HttpClient) {}

  getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  }

  saveCart(cart: any) {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  addToCart(product: any) {

    let cart = this.getCart();

    let index = cart.findIndex((p: any) => p.id === product.id);

    if (index !== -1) {
      cart[index].quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: 1,
        selected: true
      });
    }

    this.saveCart(cart);
  }

  removeItem(id: number) {
    let cart = this.getCart();
    cart = cart.filter((p: any) => p.id !== id);
    this.saveCart(cart);
  }

  updateCart(cart:any){
    this.saveCart(cart);
  }

  syncCart(userId:number){

    const cart = this.getCart();

    const body = {
      userId:userId,
      products:cart.map((p:any)=>({
        productId:p.id,
        quantity:p.quantity
      }))
    }

    return this.http.post(this.apiUrl,body);
  }

}