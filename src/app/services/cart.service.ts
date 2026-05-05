import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  apiUrl = 'http://localhost:3000/api/giohang';
  apiBienThe = 'http://localhost:3000/api/products';
  isBrowser: boolean;
  private readonly fallbackImage =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'><rect width='150' height='150' fill='%23f5f5f5'/><text x='50%25' y='50%25' fill='%23999999' font-size='14' text-anchor='middle' dominant-baseline='middle'>No Image</text></svg>";

  private cartSubject = new BehaviorSubject<any[]>([]);
  cart$ = this.cartSubject.asObservable();

  private toastSubject = new BehaviorSubject<ToastMessage | null>(null);
  toast$ = this.toastSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.loadCart();
  }

  private showToast(message: string, type: ToastMessage['type'] = 'info', duration = 3000) {
    this.toastSubject.next({ message, type, duration });
    setTimeout(() => this.toastSubject.next(null), duration);
  }

  isLoggedIn(): boolean {
    if (!this.isBrowser) return false;
    return !!localStorage.getItem('accessToken');
  }

  getLocalCart(): any[] {
    if (!this.isBrowser) return [];
    return JSON.parse(localStorage.getItem('cart') || '[]');
  }

  saveLocalCart(cart: any[]): void {
    if (!this.isBrowser) return;

    const minimalCart = cart.map((item) => ({
      id_bienthe: item.id_bienthe,
      soluong: item.soluong,
    }));

    localStorage.setItem('cart', JSON.stringify(minimalCart));
  }

  private getImageUrl(path: string): string {
    if (!path) return this.fallbackImage;
    if (path.startsWith('http')) return path;
    return `http://localhost:3000/uploads/${path}`;
  }

  private buildCartItem(item: any, bienThe: any, sanPham: any) {
    const tenSanPham = sanPham?.tenSanPham || '';
    const tenBienThe = bienThe?.tenBienThe || bienThe?.ten || '';
    const imagePath =
      sanPham?.hinhAnhDaiDien ||
      sanPham?.sanpham_hinhanhs?.find((img: any) => img?.anhChinh)?.duongDan ||
      sanPham?.sanpham_hinhanhs?.[0]?.duongDan ||
      bienThe?.hinhAnh ||
      bienThe?.hinh;

    return {
      id: item.id,
      id_bienthe: item.id_bienthe ?? bienThe?.id,
      ten: tenBienThe ? `${tenSanPham} - ${tenBienThe}` : tenSanPham,
      tenSanPham,
      tenBienThe,
      maBienThe: bienThe?.maBienThe || bienThe?.sku || '',
      gia: Number(bienThe?.giaKhuyenMai || bienThe?.giaBan || 0),
      soluong: item.soluong,
      hinh: this.getImageUrl(imagePath),
      tonKho: bienThe?.tonKho || 0,
      selected: true,
      loading: false,
    };
  }

  loadCart(): void {
    if (!this.isBrowser) return;

    if (this.isLoggedIn()) {
      this.http.get<any>(this.apiUrl).subscribe({
        next: (res) => {
          const items = res.items || res.data || res || [];

          const mapped = items.map((i: any) => {
            const bienThe = i.sanpham_bienthe || {};
            const sanPham = bienThe?.sanpham || {};
            return this.buildCartItem(i, bienThe, sanPham);
          });

          this.cartSubject.next(mapped);
        },
        error: () => this.cartSubject.next([]),
      });

      return;
    }

    const cart = this.getLocalCart();

    if (!cart.length) {
      this.cartSubject.next([]);
      return;
    }

    const mapped = cart.map((item: any, index: number) => ({
      id: index + 1,
      id_bienthe: item.id_bienthe,
      soluong: item.soluong,
      ten: 'Đang tải...',
      gia: 0,
      hinh: this.fallbackImage,
      selected: true,
      tonKho: 0,
      loading: true,
    }));

    this.cartSubject.next(mapped);
    this.fetchProductDetails(mapped);
  }

  private fetchProductDetails(items: any[]): void {
    items.forEach((item) => {
      this.http.get<any>(`${this.apiBienThe}/bienthe/${item.id_bienthe}`).subscribe({
        next: (res) => {
          const cart = this.cartSubject.getValue();
          const index = cart.findIndex((c) => c.id_bienthe === item.id_bienthe);

          if (index === -1) return;

          const builtItem = this.buildCartItem(item, res, res?.sanpham || {});
          cart[index] = {
            ...cart[index],
            ...builtItem,
          };

          this.cartSubject.next([...cart]);

          if (builtItem.hinh === this.fallbackImage && res?.sanpham?.slug) {
            this.http.get<any>(`${this.apiBienThe}/${res.sanpham.slug}`).subscribe({
              next: (productRes) => {
                const imagePath =
                  productRes?.hinhAnhDaiDien ||
                  productRes?.sanpham_hinhanhs?.find((img: any) => img?.anhChinh)?.duongDan ||
                  productRes?.sanpham_hinhanhs?.[0]?.duongDan;

                if (!imagePath) return;

                const latestCart = this.cartSubject.getValue();
                const latestIndex = latestCart.findIndex((c) => c.id_bienthe === item.id_bienthe);

                if (latestIndex === -1) return;

                latestCart[latestIndex] = {
                  ...latestCart[latestIndex],
                  hinh: this.getImageUrl(imagePath),
                };

                this.cartSubject.next([...latestCart]);
              },
              error: () => {},
            });
          }
        },
        error: () => {},
      });
    });
  }

  private getVariantDetail(id_bienthe: number): Observable<any> {
    return this.http.get<any>(`${this.apiBienThe}/bienthe/${id_bienthe}`);
  }

  private getCurrentCartQuantity(id_bienthe: number): number {
    if (this.isLoggedIn()) {
      return Number(
        this.cartSubject.getValue().find((item) => item.id_bienthe === id_bienthe)?.soluong || 0,
      );
    }

    return Number(this.getLocalCart().find((item) => item.id_bienthe === id_bienthe)?.soluong || 0);
  }

  private resolveVariantId(product: any): number | null {
    if (!product) return null;

    const directVariantId =
      product.id_bienthe ?? product.idBienThe ?? product.variantId ?? product.bienTheId;

    if (directVariantId && Number(directVariantId) > 0) {
      return Number(directVariantId);
    }

    if (
      product.id &&
      !product.sanpham_bienthes?.length &&
      !product.SanPhamBienThes?.length &&
      !product.sanpham_bienthe
    ) {
      return Number(product.id);
    }

    const variants = product.sanpham_bienthes || product.SanPhamBienThes || [];
    const firstVariant = variants.find(
      (v: any) =>
        Number(v?.id_bienthe ?? v?.id ?? v?.bienTheId ?? v?.variantId ?? v?.sanpham_bienthe?.id) >
        0,
    );

    return firstVariant
      ? Number(
          firstVariant.id_bienthe ??
            firstVariant.id ??
            firstVariant.bienTheId ??
            firstVariant.variantId ??
            firstVariant.sanpham_bienthe?.id,
        )
      : null;
  }

  private resolveVariantIdFromProduct(product: any): Observable<number> {
    const directVariantId = this.resolveVariantId(product);

    if (directVariantId && directVariantId > 0) {
      return of(directVariantId);
    }

    const productSlug = product?.slug;

    if (!productSlug) {
      return throwError(() => new Error('Không tìm thấy biến thể hợp lệ'));
    }

    return this.http.get<any>(`${this.apiBienThe}/${productSlug}`).pipe(
      switchMap((res) => {
        const variantId = this.resolveVariantId(res);

        if (!variantId || variantId <= 0) {
          return throwError(() => new Error('Không tìm thấy biến thể hợp lệ'));
        }

        return of(variantId);
      }),
    );
  }

  addToCart(product: any, soluong = 1): Observable<any> {
    return this.resolveVariantIdFromProduct(product).pipe(
      switchMap((variantId) =>
        this.getVariantDetail(variantId).pipe(
          switchMap((variantDetail) => {
            const tonKho = Number(variantDetail?.tonKho || 0);

            if (tonKho <= 0) {
              this.showToast('Sản phẩm đã hết hàng', 'warning');
              return throwError(() => new Error('Sản phẩm đã hết hàng'));
            }

            const localCart = this.getLocalCart();
            const currentQty = this.getCurrentCartQuantity(variantId);
            const nextQty = currentQty + soluong;

            if (nextQty > tonKho) {
              this.showToast(`Chỉ còn ${tonKho} sản phẩm trong kho`, 'warning');
              return throwError(() => new Error(`Chỉ còn ${tonKho} sản phẩm trong kho`));
            }

            if (this.isLoggedIn()) {
              return this.http
                .post(this.apiUrl, {
                  id_bienthe: variantId,
                  soluong,
                })
                .pipe(
                  tap(() => {
                    this.loadCart();
                    this.showToast('Đã thêm sản phẩm', 'success');
                  }),
                );
            }

            const cart = localCart;
            const found = cart.find((p) => p.id_bienthe === variantId);

            if (found) {
              found.soluong += soluong;
            } else {
              cart.push({
                id_bienthe: variantId,
                soluong,
              });
            }

            this.saveLocalCart(cart);
            this.loadCart();
            this.showToast('Đã thêm sản phẩm', 'success');

            return of(true);
          }),
        ),
      ),
    );
  }

  updateQuantity(item: any, soluong: number): Observable<any> {
    if (item?.tonKho && soluong > Number(item.tonKho)) {
      this.showToast(`Chỉ còn ${item.tonKho} sản phẩm trong kho`, 'warning');
      return throwError(() => new Error(`Chỉ còn ${item.tonKho} sản phẩm trong kho`));
    }

    if (this.isLoggedIn()) {
      // Optimistic update
      const currentCart = this.cartSubject.getValue();
      const itemIndex = currentCart.findIndex((i) => i.id_bienthe === item.id_bienthe);
      if (itemIndex !== -1) {
        currentCart[itemIndex] = { ...currentCart[itemIndex], soluong };
        this.cartSubject.next([...currentCart]);
      }

      const itemId = Number(item?.id || item?.id_bienthe);
      return this.http
        .put(`${this.apiUrl}/${itemId}`, {
          soluong,
          id_bienthe: item?.id_bienthe,
        })
        .pipe(
          tap(() => this.loadCart()),
          catchError((error) => {
            // Revert on error
            this.loadCart();
            return throwError(() => error);
          }),
        );
    }

    const cart = this.getLocalCart();
    const currentItem = cart.find((p) => p.id_bienthe === item.id_bienthe);
    if (currentItem) currentItem.soluong = soluong;

    this.saveLocalCart(cart);
    this.loadCart();

    return of(true);
  }

  removeItem(item: any): Observable<any> {
    if (this.isLoggedIn()) {
      const itemId = Number(item?.id || item?.id_bienthe);
      return this.http.delete(`${this.apiUrl}/${itemId}`).pipe(tap(() => this.loadCart()));
    }

    const cart = this.getLocalCart().filter((p) => p.id_bienthe !== item.id_bienthe);

    this.saveLocalCart(cart);
    this.loadCart();

    return of(true);
  }

  clearCart(): Observable<any> {
    if (this.isLoggedIn()) {
      return this.http.delete(this.apiUrl).pipe(tap(() => this.loadCart()));
    }

    localStorage.removeItem('cart');
    this.cartSubject.next([]);

    return of(true);
  }

  handleAfterLogin(): void {
    if (!this.isBrowser) return;

    const localCart = this.getLocalCart();

    if (!localCart.length) {
      this.loadCart();
      return;
    }

    const items = localCart.map((item: any) => ({
      id_bienthe: item.id_bienthe,
      soluong: item.soluong,
    }));

    this.http.post(`${this.apiUrl}/sync`, { items }).subscribe({
      next: () => {
        localStorage.removeItem('cart');
        this.loadCart();
        this.showToast('Đồng bộ giỏ hàng thành công', 'success');
      },
      error: () => {
        this.loadCart();
        this.showToast('Đồng bộ giỏ hàng thất bại', 'error');
      },
    });
  }

  finalizeCheckoutSuccess(): void {
    if (!this.isBrowser) return;

    localStorage.removeItem('checkoutData');
    localStorage.removeItem('cartVoucherData');
    this.loadCart();
  }
}
