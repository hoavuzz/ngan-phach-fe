import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { Subscription } from 'rxjs';
import { VoucherInfo, VoucherService, VoucherValidationResult } from '../../services/voucher';

@Component({
  selector: 'app-gio-hang',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './gio-hang.html',
  styleUrl: './gio-hang.css',
})
export class GioHang implements OnInit, OnDestroy {
  private readonly fallbackImage =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'><rect width='150' height='150' fill='%23f5f5f5'/><text x='50%25' y='50%25' fill='%23999999' font-size='14' text-anchor='middle' dominant-baseline='middle'>No Image</text></svg>";
  cartItems: any[] = [];
  updatingItems = new Set<number>();
  isLoading = false;
  private cartSubscription: Subscription | null = null;
  voucherCode = '';
  appliedVoucher: VoucherInfo | null = null;
  availableVouchers: VoucherInfo[] = [];
  eligibleVouchers: VoucherInfo[] = [];
  isVoucherListOpen = false;
  voucherMessage = '';
  voucherError = '';
  voucherDiscount = 0;
  shippingDiscount = 0;
  readonly shippingFee = 30000;

  constructor(
    public cartService: CartService,
    private router: Router,
    private voucherService: VoucherService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.cartSubscription = this.cartService.cart$.subscribe((items) => {
      this.cartItems = items || [];
      this.revalidateVoucher();

      if (this.isLoading) {
        setTimeout(() => {
          this.isLoading = false;
        }, 500);
      }
    });

    this.restoreVoucher();
    this.loadAvailableVouchers();
    this.loadCartData();
  }

  ngOnDestroy() {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  trackById(index: number, item: any): number {
    return item.id || item.id_bienthe || index;
  }

  loadCartData() {
    this.isLoading = true;
    this.cartService.loadCart();
  }

  get subtotal(): number {
    return this.cartItems
      .filter((i) => i.selected !== false && !i.loading)
      .reduce((sum, i) => {
        const price = Number(i.gia || 0);
        const qty = Number(i.soluong || 1);
        const itemTotal = price * qty;
        return isNaN(itemTotal) ? sum : sum + itemTotal;
      }, 0);
  }

  get discount(): number {
    return Math.min(this.voucherDiscount, this.subtotal);
  }

  get total(): number {
    const totalAmount = this.subtotal - this.discount;
    return totalAmount < 0 ? 0 : totalAmount;
  }

  get totalItems(): number {
    return this.cartItems.reduce((sum, i) => {
      if (i.loading) return sum;
      return sum + (i.soluong || 1);
    }, 0);
  }

  get hasLoadingItems(): boolean {
    return this.cartItems.some((item) => item.loading === true);
  }

  get isEmpty(): boolean {
    return !this.cartItems.length || this.cartItems.every((item) => item.loading === true);
  }

  private loadAvailableVouchers() {
    this.voucherService.getAvailableVouchers().subscribe((vouchers) => {
      this.availableVouchers = vouchers;
      this.refreshEligibleVouchers();
    });
  }

  private restoreVoucher() {
    const storedVoucherData = localStorage.getItem('cartVoucherData');
    if (!storedVoucherData) return;

    try {
      const voucherData = JSON.parse(storedVoucherData);
      this.appliedVoucher = voucherData.voucher
        ? this.normalizeStoredVoucher(voucherData.voucher)
        : null;
      this.voucherDiscount = Number(voucherData.discount || 0);
      this.shippingDiscount = Number(voucherData.shippingDiscount || 0);
      this.voucherCode = this.appliedVoucher?.maCode || this.appliedVoucher?.code || '';
    } catch {
      localStorage.removeItem('cartVoucherData');
    }
  }

  private persistVoucher() {
    if (this.appliedVoucher) {
      localStorage.setItem(
        'cartVoucherData',
        JSON.stringify({
          voucher: this.appliedVoucher,
          discount: this.voucherDiscount,
          shippingDiscount: this.shippingDiscount,
        }),
      );
      return;
    }

    localStorage.removeItem('cartVoucherData');
  }

  private buildVoucherPayload(code: string) {
    return {
      maCode: code,
      tongTienHang: this.subtotal,
    };
  }

  private handleVoucherValidation(result: VoucherValidationResult, announce = false) {
    if (!result.valid || !result.voucher) {
      this.appliedVoucher = null;
      this.voucherDiscount = 0;
      this.shippingDiscount = 0;
      this.persistVoucher();
      this.voucherMessage = '';
      this.voucherError = announce ? result.message || 'Ma voucher khong hop le' : '';
      this.refreshEligibleVouchers();
      this.cdr.markForCheck();
      return;
    }

    this.appliedVoucher = result.voucher;
    this.voucherDiscount = Number(result.discountAmount || 0);
    this.shippingDiscount = Number(result.shippingDiscount || 0);
    this.voucherCode = result.voucher.code;
    this.voucherError = '';
    this.voucherMessage = result.message;
    this.persistVoucher();
    this.refreshEligibleVouchers();
    this.cdr.markForCheck();
  }

  private revalidateVoucher() {
    this.refreshEligibleVouchers();

    if (!this.appliedVoucher?.code) return;

    this.voucherService
      .validateVoucher(this.buildVoucherPayload(this.appliedVoucher.code), this.appliedVoucher)
      .subscribe((result) => this.handleVoucherValidation(result, false));
  }

  applyVoucher() {
    this.voucherError = '';
    this.voucherMessage = '';

    if (this.subtotal <= 0) {
      this.voucherError = 'Hay chon san pham truoc khi ap ma';
      return;
    }

    this.voucherService
      .validateVoucher(
        this.buildVoucherPayload(this.voucherCode),
        this.findVoucherByCode(this.voucherCode),
      )
      .subscribe((result) => this.handleVoucherValidation(result, true));
  }

  selectVoucher(voucher: VoucherInfo) {
    this.voucherCode = voucher.maCode;
    this.isVoucherListOpen = false;
    this.voucherError = '';
    this.voucherMessage = '';
    this.applyVoucher();
  }

  removeVoucher() {
    this.appliedVoucher = null;
    this.voucherCode = '';
    this.isVoucherListOpen = false;
    this.voucherMessage = '';
    this.voucherError = '';
    this.voucherDiscount = 0;
    this.shippingDiscount = 0;
    this.persistVoucher();
    this.refreshEligibleVouchers();
    this.cdr.markForCheck();
  }

  toggleVoucherList() {
    if (this.subtotal <= 0 || this.eligibleVouchers.length === 0) {
      return;
    }

    this.isVoucherListOpen = !this.isVoucherListOpen;
  }

  private refreshEligibleVouchers() {
    const now = new Date();

    this.eligibleVouchers = this.availableVouchers
      .filter((voucher) => {
        const expiresAt = voucher.ngayHetHan ? new Date(voucher.ngayHetHan) : null;
        const isNotExpired = !expiresAt || expiresAt.getTime() >= now.getTime();
        const meetsMinOrder = this.subtotal >= Number(voucher.donHangToiThieu || 0);
        return isNotExpired && meetsMinOrder;
      })
      .sort((a, b) => {
        const discountDiff = this.estimateVoucherDiscount(b) - this.estimateVoucherDiscount(a);
        if (discountDiff !== 0) return discountDiff;

        const minOrderDiff = Number(a.donHangToiThieu || 0) - Number(b.donHangToiThieu || 0);
        if (minOrderDiff !== 0) return minOrderDiff;

        return a.maCode.localeCompare(b.maCode);
      });

    if (
      this.appliedVoucher &&
      !this.eligibleVouchers.some((voucher) => voucher.maCode === this.appliedVoucher?.maCode)
    ) {
      this.eligibleVouchers = [this.appliedVoucher, ...this.eligibleVouchers];
    }
  }

  private findVoucherByCode(code: string): VoucherInfo | null {
    const normalizedCode = String(code || '')
      .trim()
      .toUpperCase();
    return (
      this.availableVouchers.find((voucher) => voucher.maCode === normalizedCode) ||
      this.eligibleVouchers.find((voucher) => voucher.maCode === normalizedCode) ||
      null
    );
  }

  private normalizeStoredVoucher(voucher: any): VoucherInfo {
    const maCode = String(voucher?.maCode || voucher?.code || '').toUpperCase();
    const discountType =
      voucher?.discountType ||
      (String(voucher?.loaiGiam || '')
        .toLowerCase()
        .includes('phan_tram')
        ? 'percent'
        : 'fixed');

    return {
      id: Number(voucher?.id || 0),
      maCode,
      loaiGiam: voucher?.loaiGiam || discountType,
      giaTriGiam: Number(
        voucher?.giaTriGiam || (discountType === 'fixed' ? voucher?.discountValue : 0) || 0,
      ),
      phanTramGiam: Number(
        voucher?.phanTramGiam || (discountType === 'percent' ? voucher?.discountValue : 0) || 0,
      ),
      giaTriGiamToiDa: Number(voucher?.giaTriGiamToiDa || voucher?.maxDiscount || 0),
      donHangToiThieu: Number(voucher?.donHangToiThieu || voucher?.minSubtotal || 0),
      ngayHetHan: voucher?.ngayHetHan || voucher?.endsAt || null,
      moTa: voucher?.moTa || voucher?.description || '',
      code: maCode,
      description: voucher?.description || voucher?.moTa || '',
      discountType,
      discountValue: Number(
        voucher?.discountValue || voucher?.giaTriGiam || voucher?.phanTramGiam || 0,
      ),
      minSubtotal: Number(voucher?.minSubtotal || voucher?.donHangToiThieu || 0),
      maxDiscount: Number(voucher?.maxDiscount || voucher?.giaTriGiamToiDa || 0) || undefined,
      endsAt: voucher?.endsAt || voucher?.ngayHetHan || null,
      isActive: voucher?.isActive ?? true,
    };
  }

  isVoucherSelected(voucher: VoucherInfo): boolean {
    return this.appliedVoucher?.maCode === voucher.maCode;
  }

  getVoucherSummary(voucher: VoucherInfo): string {
    if (voucher.discountType === 'percent') {
      const maxDiscount = voucher.giaTriGiamToiDa
        ? `, toi da ${this.formatPrice(voucher.giaTriGiamToiDa)}`
        : '';
      return `Giam ${voucher.phanTramGiam}%${maxDiscount}`;
    }

    return `Giam ${this.formatPrice(voucher.giaTriGiam)}`;
  }

  private estimateVoucherDiscount(voucher: VoucherInfo): number {
    if (voucher.discountType === 'percent') {
      const rawDiscount = (this.subtotal * Number(voucher.phanTramGiam || 0)) / 100;
      const maxDiscount = Number(voucher.giaTriGiamToiDa || 0);
      return maxDiscount > 0 ? Math.min(rawDiscount, maxDiscount) : rawDiscount;
    }

    return Number(voucher.giaTriGiam || 0);
  }

  formatVoucherExpiry(date?: string | null): string {
    if (!date) return '';

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return '';

    return parsedDate.toLocaleDateString('vi-VN');
  }

  increase(item: any) {
    this.updatingItems.add(item.id_bienthe);
    if (item.loading) {
      alert('Đang tải thông tin sản phẩm, vui long thu lai sau');
      return;
    }

    const currentQty = item.soluong || 1;
    const newQty = currentQty + 1;

    if (item.tonKho && newQty > item.tonKho) {
      alert(`Chỉ còn ${item.tonKho} sản phẩm trong kho`);
      return;
    }

    this.cartService.updateQuantity(item, newQty).subscribe({
      next: () => {
        this.updatingItems.delete(item.id_bienthe);
      },
      error: (err) => {
        this.updatingItems.delete(item.id_bienthe);
        alert(err.message || 'Có lỗi xảy ra');
      },
    });
  }

  decrease(item: any) {
    this.updatingItems.add(item.id_bienthe);
    if (item.loading) {
      alert('Đang tải thông tin sản phẩm, vui long thu lai sau');
      return;
    }

    const currentQty = item.soluong || 1;

    if (currentQty <= 1) {
      if (confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?')) {
        this.remove(item);
      }
      return;
    }

    this.cartService.updateQuantity(item, currentQty - 1).subscribe({
      next: () => {
        this.updatingItems.delete(item.id_bienthe);
      },
      error: (err) => {
        this.updatingItems.delete(item.id_bienthe);
        alert(err.message || 'Có lỗi xảy ra');
      },
    });
  }

  remove(item: any) {
    if (item.loading) {
      alert('Đang tải thông tin sản phẩm, vui long thu lai sau');
      return;
    }

    if (confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?')) {
      this.cartService.removeItem(item).subscribe({
        error: (err) => {
          alert(err.message || 'Có lỗi xảy ra');
        },
      });
    }
  }

  toggleSelect(item: any) {
    if (item.loading) return;

    item.selected = !item.selected;
    this.revalidateVoucher();

    if (!this.cartService.isLoggedIn()) {
      this.cartService.saveLocalCart(this.cartItems);
    }
  }

  toggleSelectAll(event: any) {
    const checked = event.target.checked;
    this.cartItems.forEach((item) => {
      if (!item.loading) {
        item.selected = checked;
      }
    });

    this.revalidateVoucher();

    if (!this.cartService.isLoggedIn()) {
      this.cartService.saveLocalCart(this.cartItems);
    }
  }

  isAllSelected(): boolean {
    const selectableItems = this.cartItems.filter((item) => !item.loading);
    return selectableItems.length > 0 && selectableItems.every((item) => item.selected === true);
  }

  hasSelectedItems(): boolean {
    return this.cartItems.some((item) => item.selected === true && !item.loading);
  }

  removeSelected() {
    const selectedItems = this.cartItems.filter((item) => item.selected === true && !item.loading);

    if (selectedItems.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm để xóa');
      return;
    }

    if (confirm(`Bạn có chắc muốn xóa ${selectedItems.length} sản phẩm đã chọn?`)) {
      selectedItems.forEach((item) => {
        this.cartService.removeItem(item).subscribe();
      });
    }
  }

  clearCart() {
    if (this.cartItems.length === 0) {
      alert('Giỏ hàng đã trống');
      return;
    }

    if (confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
      this.cartService.clearCart().subscribe();
      this.removeVoucher();
    }
  }

  checkout() {
    if (this.hasLoadingItems) {
      alert('Đang tải thông tin sản phẩm, vui lòng đợi trong giây lát');
      return;
    }

    const selectedItems = this.cartItems.filter((item) => item.selected === true && !item.loading);

    if (selectedItems.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm để thanh toán');
      return;
    }

    const outOfStock = selectedItems.filter((item) => item.tonKho < item.soluong);
    if (outOfStock.length > 0) {
      const productNames = outOfStock.map((item) => item.ten).join(', ');
      alert(`Sản phẩm ${productNames} không đủ số lượng trong kho`);
      return;
    }

    if (this.subtotal === 0) {
      alert('Không thể thanh toán với đơn hàng có giá trị 0');
      return;
    }

    if (!this.cartService.isLoggedIn()) {
      this.cartService.saveLocalCart(this.cartItems);
      alert('Vui lòng đăng nhập để tiếp tục thanh toán');
      this.router.navigate(['/login'], {
        queryParams: {
          returnUrl: '/thanh-toan',
        },
      });
      return;
    }

    const checkoutData = {
      items: selectedItems.map((item) => ({
        id: item.id,
        id_bienthe: item.id_bienthe,
        ten: item.ten,
        tenSanPham: item.tenSanPham,
        tenBienThe: item.tenBienThe,
        soluong: item.soluong,
        gia: item.gia,
        hinh: item.hinh,
        maBienThe: item.maBienThe,
        selected: item.selected,
      })),
      subtotal: this.subtotal,
      discount: this.discount,
      total: this.total,
      voucher: this.appliedVoucher,
      shippingFee: this.shippingFee,
      shippingDiscount: this.shippingDiscount,
      totalItems: selectedItems.reduce((sum, item) => sum + item.soluong, 0),
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem('checkoutData', JSON.stringify(checkoutData));
    this.router.navigate(['/thanh-toan'], {
      state: { cartItems: selectedItems },
    });
  }

  refreshCart() {
    this.loadCartData();
  }

  getRemainingStock(item: any): number {
    const stock = Number(item?.tonKho || 0);
    const quantity = Number(item?.soluong || 0);
    return Math.max(stock - quantity, 0);
  }

  onCartQuantityChange(item: any) {
    if (item.loading) {
      return;
    }

    const normalizedQty = Math.floor(Number(item.soluong) || 1);

    if (normalizedQty < 1) {
      this.remove(item);
      return;
    }

    if (item.tonKho && normalizedQty > item.tonKho) {
      item.soluong = item.tonKho;
      alert(`Chỉ còn ${item.tonKho} sản phẩm trong kho`);
      return;
    }

    item.soluong = normalizedQty;
    this.updateQuantity(item, normalizedQty);
  }

  updateQuantity(item: any, newQty: number) {
    this.updatingItems.add(item.id_bienthe);
    if (item.loading) {
      alert('Đang tải thông tin sản phẩm, vui lòng thử lại sau');
      return;
    }

    if (newQty < 1) {
      this.remove(item);
      return;
    }

    if (item.tonKho && newQty > item.tonKho) {
      alert(`Chỉ còn ${item.tonKho} sản phẩm trong kho`);
      return;
    }

    this.cartService.updateQuantity(item, newQty).subscribe({
      next: () => {
        this.updatingItems.delete(item.id_bienthe);
      },
      error: (err) => {
        this.updatingItems.delete(item.id_bienthe);
        alert(err.message || 'Có lỗi xảy ra');
      },
    });
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement | null;
    if (!img) return;

    // Avoid re-triggering error loops if fallback cannot be rendered.
    if (img.dataset['fallbackApplied'] === 'true') return;
    img.dataset['fallbackApplied'] = 'true';
    img.src = this.fallbackImage;
  }

  isValidPrice(price: any): boolean {
    return !isNaN(Number(price)) && Number(price) > 0;
  }

  formatPrice(price: number): string {
    if (isNaN(price) || price === 0) return '';
    return price.toLocaleString('vi-VN') + '₫';
  }
}
