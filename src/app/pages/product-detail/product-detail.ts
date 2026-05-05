import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';

interface DanhGiaItem {
  id: number;
  soSao: number;
  nhanXet?: string | null;
  ngayTao?: string;
  nguoidung?: {
    id?: number;
    hoTen?: string;
    anhDaiDien?: string | null;
  };
}

interface DanhGiaResponse {
  total: number;
  trang: number;
  gioiHan: number;
  trungBinh: string;
  tongSoLuong: number;
  data: DanhGiaItem[];
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetail implements OnInit {
  product: any;
  soLuong = 1;
  allProducts: any[] = [];
  relatedProducts: any[] = [];
  galleryImages: string[] = [];
  activeImage = '';
  gia = 0;
  tonKho = 0;
  selectedBienThe: any = null;
  selected: any = {};
  danhGias: DanhGiaItem[] = [];
  danhGiaTrang = 1;
  danhGiaGioiHan = 5;
  tongDanhGia = 0;
  tongTrangDanhGia = 0;
  trungBinhDanhGia = 0;
  dangTaiDanhGia = false;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cd: ChangeDetectorRef,
    private cartService: CartService,
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const slug = params['slug'];

      this.http.get<any>('http://localhost:3000/api/products/' + slug).subscribe((res) => {
        this.product = res;
        this.setupGallery(this.product);

        if (this.product.sanpham_bienthes?.length > 0) {
          this.selectedBienThe = this.product.sanpham_bienthes[0];
          this.gia = Number(this.selectedBienThe.giaBan || this.selectedBienThe.giaKhuyenMai || 0);
          this.tonKho = this.selectedBienThe.tonKho;
          this.loadDanhGias();
        } else {
          this.gia = Number(this.product.giaThamKhao);
          this.tonKho = 0;
          this.resetDanhGias();
        }

        this.http.get<any>('http://localhost:3000/api/products').subscribe((list) => {
          this.allProducts = list.data;
          this.relatedProducts = this.allProducts
            .filter((p) => p.id !== this.product.id && p.danhMucId === this.product.danhMucId)
            .slice(0, 4);

          this.cd.detectChanges();
        });
      });
    });
  }

  tang() {
    if (this.soLuong < this.tonKho) {
      this.soLuong++;
    }
  }

  giam() {
    if (this.soLuong > 1) {
      this.soLuong--;
    }
  }

  onQuantityChange() {
    const normalizedQty = Math.floor(Number(this.soLuong) || 1);

    if (normalizedQty < 1) {
      this.soLuong = 1;
      return;
    }

    if (this.tonKho > 0 && normalizedQty > this.tonKho) {
      this.soLuong = this.tonKho;
      return;
    }

    this.soLuong = normalizedQty;
  }

  chonBienThe(bt: any) {
    this.selectedBienThe = bt;
    this.gia = Number(bt.giaBan || bt.giaKhuyenMai || 0);
    this.tonKho = bt.tonKho;
    this.loadDanhGias();

    if (this.soLuong > this.tonKho) {
      this.soLuong = 1;
    }
  }

  addToCart() {
    if (!this.selectedBienThe?.id) {
      return;
    }

    this.cartService
      .addToCart({ id_bienthe: Number(this.selectedBienThe.id) }, this.soLuong)
      .subscribe();
  }

  chonThuocTinh(ten: string, value: string) {
    this.selected[ten] = value;

    const key = Object.values(this.selected).join('-');
    const bienThe = this.product.bienTheMap?.[key];

    if (bienThe) {
      this.selectedBienThe = bienThe;
      this.gia = bienThe.giaBan;
      this.tonKho = bienThe.tonKho;
      this.loadDanhGias();
    }
  }

  getRemainingStock(): number {
    return Math.max(Number(this.tonKho || 0) - Number(this.soLuong || 0), 0);
  }

  getImageUrl(imagePath?: string | null): string {
    if (!imagePath) {
      return 'https://via.placeholder.com/500';
    }

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    if (imagePath.startsWith('/uploads/')) {
      return `http://localhost:3000${imagePath}`;
    }

    return `http://localhost:3000/uploads/${imagePath}`;
  }

  getProductImage(product: any): string {
    const imagePath =
      product?.hinhAnhDaiDien ||
      product?.sanpham_hinhanhs?.find((img: any) => img?.anhChinh)?.duongDan ||
      product?.sanPhamHinhAnhs?.find((img: any) => img?.anhChinh)?.duongDan ||
      product?.hinhAnhDauTien ||
      product?.hinhAnh ||
      product?.sanpham_hinhanhs?.[0]?.duongDan ||
      product?.sanPhamHinhAnhs?.[0]?.duongDan;

    return this.getImageUrl(imagePath);
  }

  getDisplayedImage(): string {
    return this.activeImage || this.getProductImage(this.product);
  }

  selectImage(image: string) {
    this.activeImage = image;
  }

  onImageError(event: Event) {
    const target = event.target as HTMLImageElement | null;

    if (target) {
      target.src = 'https://via.placeholder.com/500';
    }
  }

  loadDanhGias(trang: number = 1) {
    if (!this.selectedBienThe?.id) {
      this.resetDanhGias();
      return;
    }

    this.dangTaiDanhGia = true;

    const params = new HttpParams()
      .set('trang', trang.toString())
      .set('gioiHan', this.danhGiaGioiHan.toString());

    this.http
      .get<DanhGiaResponse>(`http://localhost:3000/api/danhgia/${this.selectedBienThe.id}`, {
        params,
      })
      .subscribe({
        next: (res) => {
          this.danhGias = res.data || [];
          this.danhGiaTrang = Number(res.trang || trang);
          this.tongDanhGia = Number(res.total || 0);
          this.trungBinhDanhGia = Number(res.trungBinh || 0);
          this.tongTrangDanhGia = Math.max(
            1,
            Math.ceil(this.tongDanhGia / Number(res.gioiHan || this.danhGiaGioiHan)),
          );
          this.dangTaiDanhGia = false;
        },
        error: () => {
          this.resetDanhGias();
          this.dangTaiDanhGia = false;
        },
      });
  }

  changeDanhGiaPage(trang: number) {
    if (trang < 1 || trang > this.tongTrangDanhGia || trang === this.danhGiaTrang) {
      return;
    }

    this.loadDanhGias(trang);
  }

  getDanhGiaPages(): number[] {
    return Array.from({ length: this.tongTrangDanhGia }, (_, index) => index + 1);
  }

  getStarArray(soSao: number): boolean[] {
    return Array.from({ length: 5 }, (_, index) => index < Number(soSao || 0));
  }

  getRoundedAverageDanhGia(): number {
    return Math.round(this.trungBinhDanhGia || 0);
  }

  private resetDanhGias() {
    this.danhGias = [];
    this.danhGiaTrang = 1;
    this.tongDanhGia = 0;
    this.tongTrangDanhGia = 0;
    this.trungBinhDanhGia = 0;
  }

  private setupGallery(product: any) {
    const imagePaths = [
      product?.hinhAnhDaiDien,
      product?.hinhAnhDauTien,
      product?.hinhAnh,
      ...(product?.sanpham_hinhanhs?.map((image: any) => image?.duongDan) || []),
      ...(product?.sanPhamHinhAnhs?.map((image: any) => image?.duongDan) || []),
    ]
      .filter((path): path is string => !!path)
      .map((path) => this.getImageUrl(path));

    this.galleryImages = Array.from(new Set(imagePaths));

    if (this.galleryImages.length === 0) {
      this.galleryImages = [this.getProductImage(product)];
    }

    this.activeImage = this.galleryImages[0];
  }

  getDiscountPercentage(): number {
    if (!this.product?.giaThamKhao || !this.gia || this.product.giaThamKhao <= this.gia) {
      return 0;
    }
    return Math.round(((this.product.giaThamKhao - this.gia) / this.product.giaThamKhao) * 100);
  }

  getRatingPercentage(rating: number): number {
    if (this.tongDanhGia === 0) {
      return 0;
    }
    // This is a simplified calculation - in a real app you'd track rating distribution
    // For now, we'll approximate based on average rating
    const avgRating = this.trungBinhDanhGia;
    if (rating <= avgRating) {
      return Math.round((rating / 5) * 100);
    }
    return Math.round((avgRating / 5) * 100);
  }

  addRelatedToCart(product: any) {
    // Find the first available variant or use default pricing
    const variant = product.sanpham_bienthes?.[0];
    if (variant) {
      this.cartService.addToCart({ id_bienthe: Number(variant.id) }, 1).subscribe();
    } else {
      // If no variants, we might need a different approach
      // For now, just show that it would add to cart
      console.log('Adding related product to cart:', product.tenSanPham);
    }
  }

  // SEO and Meta Methods
  getMetaDescription(): string {
    const description = this.product?.moTaNgan || this.product?.moTaChiTiet?.slice(0, 100) || '';
    const price = this.gia ? `Giá: ${this.gia.toLocaleString('vi-VN')}đ. ` : '';
    const brand = this.product?.thuongHieu?.tenThuongHieu
      ? `Thương hiệu: ${this.product.thuongHieu.tenThuongHieu}. `
      : '';
    return `${price}${brand}${description} Mua ngay tại Nhạc cụ truyền thống Việt Nam.`.slice(
      0,
      160,
    );
  }

  getMetaKeywords(): string {
    const keywords = [
      this.product?.tenSanPham,
      this.product?.thuongHieu?.tenThuongHieu,
      this.product?.danhMucNhacCu?.tenDanhMuc,
      'nhạc cụ',
      'truyền thống',
      'Việt Nam',
      'mua bán nhạc cụ',
    ].filter(Boolean);
    return keywords.join(', ');
  }

  getCanonicalUrl(): string {
    return `${this.getBaseUrl()}/products/${this.product?.slug || this.product?.id}`;
  }

  getBaseUrl(): string {
    return window.location.origin;
  }

  getPriceValidUntil(): string {
    // Return a date 30 days from now for price validity
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  }

  // Touch Gesture Methods for Mobile Gallery
  private touchStartX = 0;
  private touchStartY = 0;
  private touchEndX = 0;
  private touchEndY = 0;

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
    this.touchStartY = event.changedTouches[0].screenY;
  }

  onTouchMove(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].screenX;
    this.touchEndY = event.changedTouches[0].screenY;
  }

  onTouchEnd(event: TouchEvent) {
    const deltaX = this.touchStartX - this.touchEndX;
    const deltaY = this.touchStartY - this.touchEndY;
    const minSwipeDistance = 50;

    // Check if it's a horizontal swipe (more significant than vertical)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe left - next image
        this.nextImage();
      } else {
        // Swipe right - previous image
        this.previousImage();
      }
    }

    // Reset touch coordinates
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.touchStartY = 0;
    this.touchEndY = 0;
  }

  nextImage() {
    const currentIndex = this.galleryImages.indexOf(this.activeImage);
    const nextIndex = (currentIndex + 1) % this.galleryImages.length;
    this.selectImage(this.galleryImages[nextIndex]);
  }

  previousImage() {
    const currentIndex = this.galleryImages.indexOf(this.activeImage);
    const prevIndex = currentIndex === 0 ? this.galleryImages.length - 1 : currentIndex - 1;
    this.selectImage(this.galleryImages[prevIndex]);
  }

  // Thumbnail Scroll Methods
  canScrollLeft(): boolean {
    const container = document.querySelector('.thumbnail-container') as HTMLElement;
    return container ? container.scrollLeft > 0 : false;
  }

  canScrollRight(): boolean {
    const container = document.querySelector('.thumbnail-container') as HTMLElement;
    if (!container) return false;
    return container.scrollLeft < container.scrollWidth - container.clientWidth;
  }

  scrollThumbnails(direction: 'left' | 'right') {
    const container = document.querySelector('.thumbnail-container') as HTMLElement;
    if (!container) return;

    const scrollAmount = 120; // Width of one thumbnail + gap
    const newScrollLeft =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    });
  }
}
