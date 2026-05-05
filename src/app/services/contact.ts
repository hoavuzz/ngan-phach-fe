import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ContactService {

  private api = 'http://localhost:3000/api/contact';

  constructor(private http: HttpClient) {}

  sendContact(data:any){
    return this.http.post(this.api, data);
  }

}