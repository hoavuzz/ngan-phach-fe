import { NgFor, CommonModule } from '@angular/common';
import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
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
  selector: 'app-new-products',
  standalone: true,
  imports: [ProductCard, NgFor, CommonModule, HttpClientModule],
  templateUrl: './new-products.html',
  styleUrl: './new-products.css',
})
export class NewProducts implements OnInit {
  newProducts: any[] = [];

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.http
      .get<{
        success: boolean;
        data: { newProducts: ApiProduct[] };
      }>('http://localhost:3000/api/home')
      .subscribe((res) => {
        if (!res.success) return;

        this.newProducts = res.data.newProducts.map((p) => {
          const variant = p.sanpham_bienthes?.[0];

          return {
            id: p.id,
            name: p.tenSanPham,
            slug: p.slug,
            image: p.hinhAnhDauTien,
            price: p.giaThamKhao,
            salePrice: variant?.giaKhuyenMai || variant?.giaBan,
          };
        });
      });
  }
}
