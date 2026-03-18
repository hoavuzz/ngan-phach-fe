import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, OrderResponse } from '../models/order';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private apiUrl = 'http://localhost:3000/api/users';

  constructor(private http: HttpClient) {}

  // Lấy danh sách đơn hàng
  getOrders(trang: number = 1, gioiHan: number = 5, trangThai?: string): Observable<OrderResponse> {
    let params = new HttpParams().set('trang', trang.toString()).set('gioiHan', gioiHan.toString());

    if (trangThai) {
      params = params.set('trangThai', trangThai);
    }

    return this.http.get<OrderResponse>(`${this.apiUrl}/don-hang`, { params });
  }

  // Lấy chi tiết đơn hàng (kèm địa chỉ)
  getOrderDetail(orderId: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/don-hang/${orderId}`);
  }

  // Hủy đơn hàng
  cancelOrder(orderId: number, lyDo: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/don-hang/${orderId}/huy`, { lyDoHuy: lyDo });
  }
}
