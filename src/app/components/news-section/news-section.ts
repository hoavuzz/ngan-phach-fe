import { Component, OnInit } from '@angular/core';
import { NgFor, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-news-section',
  standalone: true,
  imports: [NgFor, DatePipe],
  templateUrl: './news-section.html',
})
export class NewsSection implements OnInit {
  newsList: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadNews();
  }

  loadNews() {
    this.http.get<any>('http://localhost:3000/api/home').subscribe((res) => {
      this.newsList = res.data.news;
    });
  }
}
