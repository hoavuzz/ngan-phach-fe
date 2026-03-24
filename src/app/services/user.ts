import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class User {

  apiUrl = "http://localhost:3000/api/users";

  constructor(private http: HttpClient) { }

  register(data: any) {
    return this.http.post<any>(this.apiUrl + "/register", data).pipe(
      tap(res => {

        // lưu token
        localStorage.setItem('accessToken', res.accessToken);
        localStorage.setItem('refreshToken', res.refreshToken);

        // lưu user
        localStorage.setItem('user', JSON.stringify(res.nguoiDung));

      })
    );
  }

  login(data: any) {
    return this.http.post<any>(this.apiUrl + "/login", data).pipe(
      tap(res => {

        localStorage.setItem('accessToken', res.accessToken);
        localStorage.setItem('refreshToken', res.refreshToken);
        localStorage.setItem('user', JSON.stringify(res.nguoiDung));

      })
    );
  }

forgotPassword(data:any){
  return this.http.post("http://localhost:3000/api/users/forgot-password", data)
}

resetPassword(data:any){
  return this.http.post("http://localhost:3000/api/users/reset-password", data)
}


}