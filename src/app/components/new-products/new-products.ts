import { NgFor, CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef,
} from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { ProductCard } from '../product-card/product-card';
import { HomeService } from '../../services/home.service';

interface ApiProduct {
  id: number;
  tenSanPham: string;
  slug: string;
  giaThamKhao: string;
  moTaNgan?: string;
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
export class NewProducts implements OnInit, OnDestroy {
  newProducts: any[] = [];
  expanded = false;
  isLoading = true;
  error: string | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private homeService: HomeService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.fetchNewProducts();
  }

  ngOnDestroy() {}

  fetchNewProducts() {
    this.isLoading = true;
    this.error = null;
    this.cdr.detectChanges();

    this.homeService.getHomeData().subscribe({
      next: (res) => {
        if (!res.success) {
          this.error = 'Khong the tai san pham moi';
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }

        let products: ApiProduct[] = [];

        if (res.data?.newProducts) {
          products = res.data.newProducts;
        } else if (res.data?.recommend) {
          products = res.data.recommend;
        } else {
          this.error = 'Khong co san pham nao de hien thi';
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }

        this.newProducts = products.slice(0, 8).map((p) => {
          const variants = (p.sanpham_bienthes || []).map((v: any, idx: number) => ({
            ...v,
            id: v.id || v.id_bienthe,
            id_bienthe: v.id_bienthe || v.id,
            maBienThe: v.maBienThe || v.sku || `${p.id}-${idx}`,
            productId: p.id,
            variantIndex: idx,
          }));

          const variant = variants[0];
          const imageUrl = p.hinhAnhDauTien
            ? `http://localhost:3000/uploads/${p.hinhAnhDauTien}`
            : null;

          return {
            id: p.id,
            name: p.tenSanPham,
            slug: p.slug,
            image: imageUrl,
            price: variant?.giaKhuyenMai || variant?.giaBan || p.giaThamKhao,
            salePrice: variant?.giaKhuyenMai ? variant.giaKhuyenMai : undefined,
            desc: p.moTaNgan || '',
            sanpham_bienthes: variants,
          };
        });

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Loi load New Products:', err);
        this.error = 'Khong the tai san pham moi. Vui long thu lai sau.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  get visibleProducts() {
    return this.expanded ? this.newProducts : this.newProducts.slice(0, 4);
  }

  get hasMoreProducts() {
    return this.newProducts.length > 4;
  }

  toggleExpanded() {
    this.expanded = !this.expanded;
  }
}
