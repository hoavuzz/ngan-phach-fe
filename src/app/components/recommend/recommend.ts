import {
  Component,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef,
} from '@angular/core';
import { ProductCard } from '../product-card/product-card';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { timeout } from 'rxjs/operators';

interface RecommendProduct {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  price: number;
  salePrice?: number;
}

@Component({
  selector: 'app-recommend',
  standalone: true,
  imports: [ProductCard, CommonModule, HttpClientModule],
  templateUrl: './recommend.html',
  styleUrl: './recommend.css',
})
export class Recommend implements OnInit, OnDestroy {
  @ViewChild('carouselTrack') carouselTrack!: ElementRef;

  recommendedProducts: RecommendProduct[] = [];
  isLoading = true;
  error: string | null = null;

  private currentTranslate = 0;
  private slideWidth = 0;
  private autoSlideInterval: any;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.http
      .get<any>('http://localhost:3000/api/home')
      .pipe(timeout(10000))
      .subscribe({
        next: (response) => {
          if (response?.success && response?.data?.recommend?.length) {
            this.recommendedProducts = response.data.recommend.map((p: any) => {
              const bienthe = p.sanpham_bienthes?.[0];

              const price = Number(p.giaThamKhao || bienthe?.giaBan || 0);
              const sale = Number(bienthe?.giaKhuyenMai || 0);

              return {
                id: p.id,
                name: p.tenSanPham,
                slug: p.slug,
                image: p.hinhAnhDauTien
                  ? `http://localhost:3000/uploads/${p.hinhAnhDauTien}`
                  : null,
                price: price,
                salePrice: sale > 0 ? sale : undefined,
              };
            });
          }

          this.isLoading = false;
          this.cdr.detectChanges();

          setTimeout(() => {
            this.setupCarousel();
          }, 200);
        },
        error: (err) => {
          console.error(err);
          this.error = 'Không thể tải sản phẩm gợi ý';
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  private setupCarousel() {
    const track = this.carouselTrack?.nativeElement;
    if (!track) return;

    const container = track.parentElement;
    if (!container) return;

    const width = window.innerWidth;

    let visibleCards = 1;
    if (width >= 1280) visibleCards = 5;
    else if (width >= 1024) visibleCards = 4;
    else if (width >= 768) visibleCards = 3;
    else if (width >= 640) visibleCards = 2;

    this.slideWidth = container.offsetWidth / visibleCards;

    track.style.transition = 'transform 500ms ease-in-out';

    this.startAutoSlide();
  }

  private setTranslate(x: number) {
    this.currentTranslate = x;
    this.carouselTrack.nativeElement.style.transform = `translateX(${x}px)`;
  }

  next() {
    if (!this.slideWidth || this.recommendedProducts.length === 0) return;

    const container = this.carouselTrack.nativeElement.parentElement;
    const maxTranslate = -(
      this.slideWidth * this.recommendedProducts.length -
      container.offsetWidth
    );

    const newTranslate = this.currentTranslate - this.slideWidth;

    if (newTranslate < maxTranslate) {
      // nếu tới cuối → quay lại đầu
      this.setTranslate(0);
      return;
    }

    this.setTranslate(newTranslate);
  }

  prev() {
    if (!this.slideWidth) return;

    const container = this.carouselTrack.nativeElement.parentElement;
    const maxTranslate = -(
      this.slideWidth * this.recommendedProducts.length -
      container.offsetWidth
    );

    const newTranslate = this.currentTranslate + this.slideWidth;

    if (newTranslate > 0) {
      // nếu đang ở đầu → nhảy tới cuối
      this.setTranslate(maxTranslate);
      return;
    }

    this.setTranslate(newTranslate);
  }

  startAutoSlide() {
    this.autoSlideInterval = setInterval(() => this.next(), 4000);
  }

  ngOnDestroy() {
    if (this.autoSlideInterval) clearInterval(this.autoSlideInterval);
  }

  trackById(_index: number, product: RecommendProduct) {
    return product.id;
  }
}
