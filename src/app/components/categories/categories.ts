import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

interface Category {
  id: number;
  tenDanhMuc: string;
  slug: string;
  moTa: string;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule, // ← đã đúng, giữ nguyên để cung cấp HttpClient cho component này
  ],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories implements OnInit {
  categories: Category[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit() {
    this.fetchCategories();
  }

  fetchCategories() {
    this.http
      .get<{ success: boolean; data: { categories: Category[] } }>('http://localhost:3000/api/home')
      .subscribe({
        next: (response) => {
          if (response.success && response.data?.categories) {
            this.categories = response.data.categories;
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Lỗi tải categories:', err);
          this.error = 'Không thể tải danh mục. Vui lòng thử lại sau.';
          this.isLoading = false;
        },
      });
  }

  goToCategory(slug: string) {
    this.router.navigate(['/danh-muc', slug]);
  }
}
