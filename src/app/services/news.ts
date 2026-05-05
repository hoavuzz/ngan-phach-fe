import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NewsService {

  private api = 'http://localhost:3000/api/tintuc';
  private apiDanhMuc = 'http://localhost:3000/api/danhmuc-tintuc';

  constructor(private http: HttpClient) {}

  // danh sách + lọc danh mục
getList(trang = 1, danhMucId?: number) {
  let url = `${this.api}?trang=${trang}`;

  if (danhMucId) {
    url += `&danhMucId=${danhMucId}`;
  }

  return this.http.get<any>(url);
}
  // chi tiết
  getDetail(slug: string) {
    return this.http.get<any>(`${this.api}/${slug}`);
  }

  // nổi bật
  getNoiBat() {
    return this.http.get<any>(`${this.api}/noi-bat`);
  }

  // home
  getHome() {
    return this.http.get<any>(`${this.api}/home`);
  }

  // danh mục
  getDanhMuc() {
    return this.http.get<any>(this.apiDanhMuc);
  }
}