import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderService } from '../../../services/order';
import { Order, OrderResponse } from '../../../models/order';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements OnInit {
  activeFilter: string = 'all';
  orders: Order[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  // Phân trang
  currentPage: number = 1;
  pageSize: number = 5;
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

  constructor(
    private orderService: OrderService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  // Đổi filter
  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.currentPage = 1;
    this.loadOrders();
  }

  // Load đơn hàng từ API
  loadOrders(): void {
    this.isLoading = true;
    this.error = null;
    this.cdr.detectChanges(); // Ép cập nhật UI ngay lập tức

    const trangThai = this.getBackendStatus(this.activeFilter);

    console.log('1. Bắt đầu gọi API với params:', {
      page: this.currentPage,
      limit: this.pageSize,
      trangThai: trangThai,
    });

    this.orderService.getOrders(this.currentPage, this.pageSize, trangThai).subscribe({
      next: (response: OrderResponse) => {
        console.log('2. API response thành công:', response);
        console.log('3. Số lượng đơn hàng:', response.data.length);

        // Tạo mảng mới để trigger change detection
        this.orders = [...response.data];
        this.totalItems = response.total;
        this.totalPages = Math.ceil(response.total / this.pageSize);

        console.log('4. Cập nhật orders:', this.orders);
        console.log('5. Tắt loading...');

        this.isLoading = false;
        this.cdr.detectChanges(); // Ép Angular cập nhật UI
      },
      error: (err: any) => {
        console.error('6. API lỗi:', err);
        this.error = 'Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.';
        this.isLoading = false;
        this.cdr.detectChanges(); // Ép Angular cập nhật UI ngay cả khi lỗi
      },
      complete: () => {
        console.log('7. Subscribe hoàn tất');
      },
    });
  }

  // Chuyển đổi filter từ UI sang backend status
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

  // Lấy tên trạng thái hiển thị
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

  // Lấy màu sắc cho trạng thái
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

  // Định dạng tiền
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  // Định dạng ngày
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  // Mở modal hủy đơn
  openCancelModal(order: Order): void {
    this.selectedOrder = order;
    this.cancelReason = '';
    this.showCancelModal = true;
    this.cdr.detectChanges();
  }

  // Đóng modal hủy đơn
  closeCancelModal(): void {
    this.showCancelModal = false;
    this.selectedOrder = null;
    this.cancelReason = '';
    this.cdr.detectChanges();
  }

  // Xác nhận hủy đơn
  // Xác nhận hủy đơn
  confirmCancel(): void {
    if (!this.cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy đơn');
      return;
    }

    if (!this.selectedOrder) return;

    this.isCancelling = true;

    console.log('Đang hủy đơn hàng:', this.selectedOrder.id, 'Lý do:', this.cancelReason);

    this.orderService.cancelOrder(this.selectedOrder.id, this.cancelReason).subscribe({
      next: (response: any) => {
        console.log('Hủy đơn thành công:', response);
        this.isCancelling = false;
        this.closeCancelModal();
        this.loadOrders();
        alert('Hủy đơn hàng thành công!');
      },
      error: (err: any) => {
        this.isCancelling = false;
        console.error('❌ Lỗi khi hủy đơn - chi tiết:', err);

        // Log chi tiết lỗi
        if (err.error) {
          console.error('Error details:', err.error);
        }
        if (err.status) {
          console.error('Status:', err.status);
        }
        if (err.message) {
          console.error('Message:', err.message);
        }

        // Hiển thị thông báo lỗi cụ thể
        const errorMessage = err.error?.message || err.message || 'Có lỗi xảy ra khi hủy đơn hàng';
        alert(`❌ ${errorMessage}`);
      },
    });
  }

  // Mở chi tiết đơn hàng
  openDetailModal(order: Order): void {
    this.isLoadingDetail = true;
    this.showDetailModal = true;
    this.selectedOrderDetail = null;
    this.cdr.detectChanges();

    console.log('Đang tải chi tiết đơn hàng ID:', order.id);

    this.orderService.getOrderDetail(order.id).subscribe({
      next: (orderDetail: Order) => {
        console.log('Chi tiết đơn hàng:', orderDetail);
        this.selectedOrderDetail = orderDetail;
        this.isLoadingDetail = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Lỗi khi tải chi tiết đơn hàng:', err);
        alert('Không thể tải chi tiết đơn hàng. Vui lòng thử lại sau.');
        this.isLoadingDetail = false;
        this.showDetailModal = false;
        this.cdr.detectChanges();
      },
    });
  }

  // Đóng modal chi tiết
  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedOrderDetail = null;
    this.isLoadingDetail = false;
    this.cdr.detectChanges();
  }

  // Chuyển trang
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadOrders();
    }
  }
}
