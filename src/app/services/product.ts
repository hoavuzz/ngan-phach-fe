// product.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'http://localhost:3000/api'; // Thay đổi port theo BE của bạn

  constructor(private http: HttpClient) {}

  searchProducts(params: any): Observable<any> {
    let httpParams = new HttpParams();

    // Thêm các tham số vào request
    Object.keys(params).forEach((key) => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== 'null') {
        httpParams = httpParams.set(key, params[key].toString());
      }
    });

    return this.http.get(`${this.apiUrl}/search`, { params: httpParams });
  }

  getSearchSuggestions(keyword: string, limit: number = 5): Observable<any> {
    const params = new HttpParams().set('keyword', keyword).set('limit', limit.toString());

    return this.http.get(`${this.apiUrl}/search/suggestions`, { params });
  }

  // Thêm method trackBy để tối ưu performance
  trackByProductId(index: number, product: any): number {
    return product.id;
  }
}
