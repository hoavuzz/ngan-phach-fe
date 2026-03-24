import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  apiUrl = "http://localhost:3000/api/giohang";
  isBrowser:boolean;

  constructor(
    private http:HttpClient,
    @Inject(PLATFORM_ID) private platformId:object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }
addToDatabase(data:any){

  return this.http.post("http://localhost:3000/api/giohang",data);

}
  // lấy cart từ localStorage
  getCart(){

    if(!this.isBrowser) return [];

    return JSON.parse(localStorage.getItem("cart") || "[]");

  }

  // lưu cart
  saveCart(cart:any){

    if(!this.isBrowser) return;

    localStorage.setItem("cart",JSON.stringify(cart));

  }

  // thêm sản phẩm
  addToCart(product:any){

    let cart = this.getCart();

    let index = cart.findIndex((p:any)=>p.id === product.id);

    if(index !== -1){

      cart[index].quantity += 1;

    }else{

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

  // cập nhật giỏ hàng
  updateCart(cart:any){
    this.saveCart(cart);
  }

  // xoá sản phẩm
  removeItem(id:number){

    let cart = this.getCart();

    cart = cart.filter((item:any)=>item.id !== id);

    this.saveCart(cart);

  }

  // gửi giỏ hàng lên database sau khi login
  syncCart(userId:number){

    const cart = this.getCart();

    cart.forEach((item:any)=>{

      const body = {
        userId:userId,
        productId:item.id,
        quantity:item.quantity
      }

      this.http.post(this.apiUrl,body).subscribe();

    });

  }

}