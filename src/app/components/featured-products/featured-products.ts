import { Component, OnInit, Inject } from '@angular/core';
import { NgFor, CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { ProductCard } from '../product-card/product-card';

interface ApiProduct {
  id: number;
  tenSanPham: string;
  slug: string;
  giaThamKhao: string;
  hinhAnhDauTien: string | null;
  sanpham_bienthes?: {
    giaBan: string;
    giaKhuyenMai?: string;
    tonKho: number;
  }[];
}

@Component({
  selector: 'app-featured-products',
  standalone: true,
  imports: [NgFor, ProductCard, CommonModule, HttpClientModule],
  templateUrl: './featured-products.html',
})
export class FeaturedProducts implements OnInit {
  displayedProducts: any[] = [];

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.http
      .get<{
        success: boolean;
        data: { featuredProducts: ApiProduct[] };
      }>('http://localhost:3000/api/home')
      .subscribe((res) => {
        if (!res.success) return;

        this.displayedProducts = res.data.featuredProducts.map((p) => {
          const variant = p.sanpham_bienthes?.[0];

          return {
            id: p.id,
            name: p.tenSanPham,
            image: p.hinhAnhDauTien,
            price: variant?.giaKhuyenMai || variant?.giaBan || p.giaThamKhao,
            desc: '',
          };
        });
      });
  }
}
