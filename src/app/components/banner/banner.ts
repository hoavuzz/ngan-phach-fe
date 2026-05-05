import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  HostListener,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BannerService } from '../../services/banner.service';

@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './banner.html',
  styleUrls: ['./banner.css'],
})
export class BannerComponent implements OnInit, OnDestroy {
  @Input() viTri: string = 'trang_chu';
  @Input() autoPlay: boolean = true;
  @Input() interval: number = 5000;
  @Input() swipeThreshold: number = 50;

  banners: any[] = [];
  currentIndex: number = 0;
  loading: boolean = true;
  isMobile: boolean = false;
  imageError: Set<string> = new Set(); // Track lỗi ảnh

  private apiBaseUrl = 'http://localhost:3000';
  private autoPlayInterval: any = null;
  private touchStartX: number = 0;
  private touchEndX: number = 0;
  private hasLoaded = false; // Tránh gọi API nhiều lần

  constructor(
    private bannerService: BannerService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit(): void {
    this.checkMobile();
    this.loadBanners();
  }

  ngOnDestroy(): void {
    this.clearAutoPlay();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkMobile();
  }

  // ================= LOAD BANNERS =================

  private loadBanners(): void {
    if (this.hasLoaded) return;
    this.hasLoaded = true;

    this.loading = true;
    console.log(`🔄 [BannerComponent] Loading banners for: ${this.viTri}`);

    this.bannerService.layTheoViTri(this.viTri).subscribe({
      next: (response) => {
        if (response?.success && response?.data?.length > 0) {
          this.banners = response.data;
          console.log(
            `✅ [BannerComponent] Loaded ${this.banners.length} banners for: ${this.viTri}`,
          );
        } else {
          console.log(`⚠️ [BannerComponent] No banners for: ${this.viTri}`);
          this.banners = [];
        }
        this.loading = false;
        this.startAutoPlay();
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error(`❌ [BannerComponent] Error loading ${this.viTri}:`, error);
        this.banners = [];
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // ================= IMAGE HANDLER =================

  getImageUrl(url: string): string {
    if (!url) return '';

    // Nếu URL đã có http:// hoặc https:// thì giữ nguyên
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Lấy tên file từ đường dẫn
    const filename = url.split('/').pop();

    // Đường dẫn đúng: uploads/images/banner/ten-file.jpg
    return `${this.apiBaseUrl}/uploads/images/banner/${filename}`;
  }

  onImageError(event: any, banner: any): void {
    const key = `${banner.id}-${banner.url}`;
    if (this.imageError.has(key)) return;

    this.imageError.add(key);
    console.error(`❌ [BannerComponent] Image error: ${banner.url}`);

    // Thử fallback
    const filename = banner.url.split('/').pop();
    const fallbackUrl = `${this.apiBaseUrl}/uploads/${filename}`;

    if (event.target.src !== fallbackUrl) {
      event.target.src = fallbackUrl;
      event.target.onerror = () => {
        event.target.src = 'https://placehold.co/1200x400/f0f0f0/cccccc?text=No+Image';
      };
    } else {
      event.target.src = 'https://placehold.co/1200x400/f0f0f0/cccccc?text=No+Image';
    }
  }

  // ================= AUTO PLAY =================

  private startAutoPlay(): void {
    if (this.autoPlay && this.banners.length > 1 && isPlatformBrowser(this.platformId)) {
      this.clearAutoPlay();
      this.autoPlayInterval = setInterval(() => {
        this.nextSlide();
      }, this.interval);
    }
  }

  private clearAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  private resetAutoPlay(): void {
    if (this.autoPlay && this.banners.length > 1) {
      this.clearAutoPlay();
      this.startAutoPlay();
    }
  }

  // ================= SLIDE CONTROLS =================

  prevSlide(): void {
    if (this.banners.length === 0) return;
    this.currentIndex = (this.currentIndex - 1 + this.banners.length) % this.banners.length;
    this.resetAutoPlay();
    this.cdr.markForCheck();
  }

  nextSlide(): void {
    if (this.banners.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.banners.length;
    this.resetAutoPlay();
    this.cdr.markForCheck();
  }

  goToSlide(index: number): void {
    if (index >= 0 && index < this.banners.length && index !== this.currentIndex) {
      this.currentIndex = index;
      this.resetAutoPlay();
      this.cdr.markForCheck();
    }
  }

  // ================= SWIPE SUPPORT =================

  onTouchStart(event: TouchEvent): void {
    if (!this.isMobile) return;
    this.touchStartX = event.touches[0].clientX;
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isMobile) return;
    this.touchEndX = event.touches[0].clientX;
  }

  onTouchEnd(): void {
    if (!this.isMobile || this.banners.length <= 1) return;

    const deltaX = this.touchEndX - this.touchStartX;

    if (Math.abs(deltaX) > this.swipeThreshold) {
      if (deltaX > 0) {
        this.prevSlide();
      } else {
        this.nextSlide();
      }
    }

    this.touchStartX = 0;
    this.touchEndX = 0;
  }

  // ================= CHECK MOBILE =================

  private checkMobile(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth < 640;
      this.cdr.markForCheck();
    }
  }

  trackByFn(index: number, item: any): number {
    return item.id;
  }
}
