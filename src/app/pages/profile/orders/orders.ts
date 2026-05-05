import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderService } from '../../../services/order';
import { Order, OrderDetail, OrderResponse } from '../../../models/order';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements OnInit, OnDestroy {
  readonly apiBaseUrl: string = 'http://localhost:3000';
  activeFilter: string = 'all';
  orders: Order[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  // Store counts for each status (cache)
  orderCounts: { [key: string]: number } = {
    all: 0,
    pending: 0,
    shipping: 0,
    done: 0,
    cancel: 0,
  };

  // Filter configuration
  filters = [
    { value: 'all', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ xác nhận' },
    { value: 'shipping', label: 'Đang giao' },
    { value: 'done', label: 'Hoàn thành' },
    { value: 'cancel', label: 'Đã hủy' },
  ];

  // Phân trang
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 1;

  // Modal hủy đơn
  showCancelModal: boolean = false;
  selectedOrder: Order | null = null;
  cancelReason: string = '';
  isCancelling: boolean = false;

  // Modal chi tiết
  showDetailModal: boolean = false;
  selectedOrderDetail: Order | null = null;
  isLoadingDetail: boolean = false;

  // Modal đánh giá
  showReviewModal: boolean = false;
  selectedReviewItem: OrderDetail | null = null;
  reviewStars: number = 5;
  reviewComment: string = '';
  reviewError: string | null = null;
  isSubmittingReview: boolean = false;

  // Cache for order details
  orderDetailsCache: Map<number, Order> = new Map();

  // Flag to prevent multiple simultaneous loads
  private isLoadingCounts: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private orderService: OrderService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadOrderCounts(); // Load counts immediately
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== FILTER METHODS ====================

  setFilter(filter: string): void {
    if (this.activeFilter === filter) return;

    console.log('Changing filter from', this.activeFilter, 'to', filter);
    this.activeFilter = filter;
    this.currentPage = 1;
    this.loadOrders(); // Direct call, no debounce
  }

  getFilterLabel(filter: string): string {
    const found = this.filters.find((f) => f.value === filter);
    return found ? found.label : filter;
  }

  getFilterCount(filter: string): number {
    const count = this.orderCounts[filter] || 0;
    console.log(`getFilterCount(${filter}) = ${count}`);
    return count;
  }

  getBackendStatus(filter: string): string | undefined {
    const statusMap: { [key: string]: string | undefined } = {
      all: undefined,
      pending: 'cho_xac_nhan',
      shipping: 'dang_giao',
      done: 'da_giao',
      cancel: 'da_huy',
    };
    return statusMap[filter];
  }

  // ==================== ORDER DISPLAY METHODS ====================

  getOrderItemCount(order: Order): number {
    return order.chiTiet?.length || 0;
  }

  getOrderItemsPreview(order: Order): OrderDetail[] {
    return (order.chiTiet || []).slice(0, 2);
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      cho_xac_nhan: 'Chờ xác nhận',
      da_xac_nhan: 'Đã xác nhận',
      dang_dong_goi: 'Đang đóng gói',
      dang_giao: 'Đang giao',
      da_giao: 'Hoàn thành',
      da_huy: 'Đã hủy',
      hoan_tra: 'Hoàn trả',
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      cho_xac_nhan: 'text-yellow-600',
      da_xac_nhan: 'text-blue-600',
      dang_dong_goi: 'text-purple-600',
      dang_giao: 'text-[#9A3F0F]',
      da_giao: 'text-green-600',
      da_huy: 'text-red-600',
      hoan_tra: 'text-orange-600',
    };
    return classMap[status] || 'text-gray-600';
  }

  getStatusBadgeClass(status: string): string {
    const classMap: { [key: string]: string } = {
      cho_xac_nhan: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      da_xac_nhan: 'bg-blue-100 text-blue-800 border-blue-300',
      dang_dong_goi: 'bg-purple-100 text-purple-800 border-purple-300',
      dang_giao: 'bg-orange-100 text-orange-800 border-orange-300',
      da_giao: 'bg-green-100 text-green-800 border-green-300',
      da_huy: 'bg-red-100 text-red-800 border-red-300',
      hoan_tra: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return classMap[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  }

  // ==================== API METHODS ====================

  loadOrders(): void {
    this.isLoading = true;
    this.error = null;
    this.cdr.detectChanges();

    const trangThai = this.getBackendStatus(this.activeFilter);

    console.log('Loading orders with params:', {
      page: this.currentPage,
      limit: this.pageSize,
      status: trangThai || 'all',
    });

    this.orderService.getOrders(this.currentPage, this.pageSize, trangThai).subscribe({
      next: (response: OrderResponse) => {
        console.log('Orders loaded:', response.data.length, 'total:', response.total);
        this.orders = [...response.data];
        this.totalItems = response.total;
        this.totalPages = Math.ceil(response.total / this.pageSize);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('API Error:', err);
        this.error = 'Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadOrderCounts(): void {
    if (this.isLoadingCounts) return;
    this.isLoadingCounts = true;

    console.log('Loading order counts...');

    // Define the statuses to query
    const statusConfigs = [
      { key: 'pending', status: 'cho_xac_nhan' },
      { key: 'shipping', status: 'dang_giao' },
      { key: 'done', status: 'da_giao' },
      { key: 'cancel', status: 'da_huy' },
    ];

    let completedRequests = 0;
    const totalRequests = statusConfigs.length;

    statusConfigs.forEach((config) => {
      this.orderService.getOrders(1, 1, config.status).subscribe({
        next: (response: OrderResponse) => {
          console.log(`Count for ${config.key} (${config.status}):`, response.total);
          this.orderCounts[config.key] = response.total;
          completedRequests++;

          // Update all count after each request
          this.orderCounts['all'] =
            this.orderCounts['pending'] +
            this.orderCounts['shipping'] +
            this.orderCounts['done'] +
            this.orderCounts['cancel'];

          console.log('Updated orderCounts:', this.orderCounts);
          this.cdr.detectChanges();

          if (completedRequests === totalRequests) {
            this.isLoadingCounts = false;
            console.log('All counts loaded');
          }
        },
        error: (err) => {
          console.error(`Error loading count for ${config.status}:`, err);
          this.orderCounts[config.key] = 0;
          completedRequests++;

          if (completedRequests === totalRequests) {
            this.isLoadingCounts = false;
            this.cdr.detectChanges();
          }
        },
      });
    });
  }

  refreshCounts(): void {
    console.log('Refreshing counts...');
    this.loadOrderCounts();
  }

  // ==================== PAGINATION METHODS ====================

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadOrders();
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;

    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (this.currentPage >= this.totalPages - 2) {
        for (let i = this.totalPages - 4; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = this.currentPage - 2; i <= this.currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }

    return pages;
  }

  // ==================== IMAGE METHODS ====================

  getImageUrl(path?: string | null): string {
    if (!path) return 'https://via.placeholder.com/80?text=No+Image';
    if (path.startsWith('http')) return path;
    if (path.startsWith('/uploads/')) return `${this.apiBaseUrl}${path}`;
    if (path.startsWith('uploads/')) return `${this.apiBaseUrl}/${path}`;
    return `${this.apiBaseUrl}/uploads/${path}`;
  }

  getOrderItemImage(item: OrderDetail | null | undefined): string {
    if (!item) return 'https://via.placeholder.com/80?text=No+Image';

    const sanPham = item.bienThe?.sanPham;
    const imagePath =
      sanPham?.hinhAnhDaiDien ||
      sanPham?.hinhAnhDauTien ||
      sanPham?.hinhAnh ||
      sanPham?.sanpham_hinhanhs?.find((image) => image?.anhChinh)?.duongDan ||
      sanPham?.sanpham_hinhanhs?.[0]?.duongDan ||
      item.bienThe?.hinhAnh;

    return this.getImageUrl(imagePath);
  }

  // ==================== REVIEW METHODS ====================

  hasReviewed(item: OrderDetail | null | undefined): boolean {
    return !!item?.daDanhGia;
  }

  canReview(order: Order | null | undefined, item: OrderDetail | null | undefined): boolean {
    return !!order && order.trangThai === 'da_giao' && !!item && !this.hasReviewed(item);
  }

  openReviewModal(item: OrderDetail): void {
    this.selectedReviewItem = item;
    this.reviewStars = 5;
    this.reviewComment = '';
    this.reviewError = null;
    this.isSubmittingReview = false;
    this.showReviewModal = true;
    this.cdr.detectChanges();
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
    this.selectedReviewItem = null;
    this.reviewStars = 5;
    this.reviewComment = '';
    this.reviewError = null;
    this.isSubmittingReview = false;
    this.cdr.detectChanges();
  }

  submitReview(): void {
    if (!this.selectedReviewItem) return;

    if (this.reviewStars < 1 || this.reviewStars > 5) {
      this.reviewError = 'Vui lòng chọn số sao hợp lệ.';
      return;
    }

    this.isSubmittingReview = true;
    this.reviewError = null;
    this.cdr.detectChanges();

    this.orderService
      .submitReview({
        chitietdonhang_id: this.selectedReviewItem.id,
        soSao: this.reviewStars,
        nhanXet: this.reviewComment.trim(),
      })
      .subscribe({
        next: (response: any) => {
          // Update in order detail
          if (this.selectedOrderDetail?.chiTiet) {
            this.selectedOrderDetail.chiTiet = this.selectedOrderDetail.chiTiet.map((item) =>
              item.id === this.selectedReviewItem?.id ? { ...item, daDanhGia: true } : item,
            );
          }

          // Update in orders list
          this.orders = this.orders.map((order) => ({
            ...order,
            chiTiet: order.chiTiet?.map((item) =>
              item.id === this.selectedReviewItem?.id ? { ...item, daDanhGia: true } : item,
            ),
          }));

          // Update cache if exists
          if (this.selectedOrderDetail) {
            this.orderDetailsCache.set(this.selectedOrderDetail.id, this.selectedOrderDetail);
          }

          this.isSubmittingReview = false;
          alert(response?.message || 'Đánh giá thành công! Cảm ơn bạn đã đóng góp ý kiến.');
          this.closeReviewModal();
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          this.isSubmittingReview = false;
          this.reviewError = err?.error?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.';
          this.cdr.detectChanges();
        },
      });
  }

  // ==================== CANCEL ORDER METHODS ====================

  openCancelModal(order: Order): void {
    this.selectedOrder = order;
    this.cancelReason = '';
    this.showCancelModal = true;
    this.cdr.detectChanges();
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.selectedOrder = null;
    this.cancelReason = '';
    this.cdr.detectChanges();
  }

  confirmCancel(): void {
    if (!this.cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy đơn');
      return;
    }

    if (!this.selectedOrder) return;

    this.isCancelling = true;
    this.cdr.detectChanges();

    this.orderService.cancelOrder(this.selectedOrder.id, this.cancelReason).subscribe({
      next: (response: any) => {
        console.log('Cancel order success:', response);
        this.isCancelling = false;
        this.closeCancelModal();

        // Clear cache for this order
        this.orderDetailsCache.delete(this.selectedOrder!.id);

        // Reload orders and refresh counts
        this.loadOrders();
        this.refreshCounts();
        alert('Hủy đơn hàng thành công!');
      },
      error: (err: any) => {
        this.isCancelling = false;
        console.error('Cancel order error:', err);
        this.cdr.detectChanges();

        const errorMessage = err.error?.message || err.message || 'Có lỗi xảy ra khi hủy đơn hàng';
        alert(`Không thể hủy đơn hàng: ${errorMessage}`);
      },
    });
  }

  // ==================== ORDER DETAIL METHODS ====================

  openDetailModal(order: Order): void {
    // Check cache first
    if (this.orderDetailsCache.has(order.id)) {
      this.selectedOrderDetail = this.orderDetailsCache.get(order.id)!;
      this.showDetailModal = true;
      this.isLoadingDetail = false;
      this.cdr.detectChanges();
      return;
    }

    this.isLoadingDetail = true;
    this.showDetailModal = true;
    this.selectedOrderDetail = null;
    this.cdr.detectChanges();

    this.orderService.getOrderDetail(order.id).subscribe({
      next: (orderDetail: Order) => {
        this.selectedOrderDetail = {
          ...orderDetail,
          chiTiet: (orderDetail.chiTiet || []).map((item) => ({
            ...item,
            daDanhGia: item.daDanhGia ?? false,
          })),
        };

        // Cache the result
        this.orderDetailsCache.set(order.id, this.selectedOrderDetail);

        this.isLoadingDetail = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Load order detail error:', err);
        alert('Không thể tải chi tiết đơn hàng. Vui lòng thử lại sau.');
        this.isLoadingDetail = false;
        this.showDetailModal = false;
        this.cdr.detectChanges();
      },
    });
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedOrderDetail = null;
    this.isLoadingDetail = false;
    this.cdr.detectChanges();
  }

  // ==================== UTILITY METHODS ====================

  getOrderSubtotal(order: Order | null | undefined): number {
    if (!order?.chiTiet?.length) return 0;

    return order.chiTiet.reduce((sum, item) => sum + Number(item?.thanhTien || 0), 0);
  }

  getOrderDiscount(order: Order | null | undefined): number {
    if (!order) return 0;

    const subtotal = this.getOrderSubtotal(order);
    const shippingFee = Number(order.phiVanChuyen || 0);
    const total = Number(order.tongTien || 0);

    return Math.max(0, subtotal + shippingFee - total);
  }

  formatCurrency(amount: number): string {
    if (!amount && amount !== 0) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  retryLoad(): void {
    this.loadOrders();
    this.refreshCounts();
  }
}
