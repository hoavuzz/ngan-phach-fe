import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface Category {
  id: number;
  tenDanhMuc: string;
  slug: string;
  moTa?: string;
  hinhanh?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiUrl = 'http://localhost:3000/api/categories';

  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map((response) => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.categories)) return response.categories;
        if (Array.isArray(response?.data?.categories)) return response.data.categories;
        if (Array.isArray(response?.data)) return response.data;
        return [];
      }),
    );
  }
}
