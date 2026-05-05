// src/app/pages/checkout/checkout.ts
import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AddressModal } from '../../components/address-modal/address-modal';
import { UserService } from '../../services/user';
import { CartService } from '../../services/cart.service';

interface AppliedVoucher {
  id?: number;
  maCode?: string;
  code: string;
  type: 'fixed' | 'percent';
  value: number;
  minSubtotal: number;
  maxDiscount?: number;
  description: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AddressModal],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css'],
})
export class Checkout implements OnInit {
  checkoutForm!: FormGroup;
  isProcessing = false;
  selectedPaymentMethod = 'payos';

  // Địa chỉ
  showAddressModal = false;
  editingAddressId: number | null = null;
  editingAddressData: any = null;
  addresses: any[] = [];
  selectedAddress: any = null;
  isLoadingAddresses = false;

  orderData = {
    phiVanChuyen: 30000,
  };

  paymentMethods = [
    { value: 'payos', label: 'Chuyển khoản qua PayOS (VietQR, Internet Banking)' },
    { value: 'cod', label: 'Thanh toán khi nhận hàng (COD)' },
    { value: 'momo', label: 'Ví MoMo' },
    { value: 'vnpay', label: 'VNPay' },
  ];

  // Giỏ hàng
  cartItems: any[] = [];
  isLoadingCart = false;
  appliedVoucher: AppliedVoucher | null = null;
  voucherDiscount = 0;

  private apiUrl = 'http://localhost:3000/api/orders';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private cartService: CartService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadAddresses();
    this.loadCartFromCheckoutData();
  }

  initForm(): void {
    this.checkoutForm = this.fb.group({
      note: [''],
      paymentMethod: ['payos', Validators.required],
      agreeTerms: [false, Validators.requiredTrue],
    });
  }

  // Load giỏ hàng từ localStorage (đã lưu từ trang giỏ hàng)
  loadCartFromCheckoutData(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.isLoadingCart = true;
    this.cdr.markForCheck();

    // Lấy dữ liệu từ localStorage
    const checkoutDataStr = localStorage.getItem('checkoutData');

    if (checkoutDataStr) {
      try {
        const checkoutData = JSON.parse(checkoutDataStr);
        this.cartItems = checkoutData.items || [];
        this.appliedVoucher = checkoutData.voucher || null;
        this.voucherDiscount = Number(checkoutData.discount || 0);
        this.orderData.phiVanChuyen = Number(checkoutData.shippingFee || this.orderData.phiVanChuyen);
        this.orderData.phiVanChuyen = Math.max(
          0,
          this.orderData.phiVanChuyen - Number(checkoutData.shippingDiscount || 0),
        );
        console.log('✅ Đã lấy giỏ hàng từ localStorage:', this.cartItems);
      } catch (error) {
        console.error('❌ Lỗi parse checkoutData:', error);
        this.cartItems = [];
      }
    } else {
      // Fallback: thử lấy từ router state
      const navigation = this.router.getCurrentNavigation();
      const state = navigation?.extras.state as any;
      if (state?.cartItems) {
        this.cartItems = state.cartItems;
        console.log('✅ Đã lấy giỏ hàng từ router state:', this.cartItems);
      } else {
        console.warn('⚠️ Không tìm thấy dữ liệu giỏ hàng');
        this.cartItems = [];
      }
    }

    this.isLoadingCart = false;
    this.cdr.markForCheck();
  }

  // Load danh sách địa chỉ từ User service
  loadAddresses(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.isLoadingAddresses = true;
    this.cdr.markForCheck();

    this.userService.getAddresses().subscribe({
      next: (res: any) => {
        this.addresses = res || [];

        const defaultAddress = this.addresses.find((a) => a.macDinh === true);
        if (defaultAddress) {
          this.selectedAddress = defaultAddress;
        } else if (this.addresses.length > 0) {
          this.selectedAddress = this.addresses[0];
        }

        this.isLoadingAddresses = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('LỖI LẤY ĐỊA CHỈ:', err);
        this.isLoadingAddresses = false;
        this.cdr.markForCheck();
      },
    });
  }

  selectAddress(address: any): void {
    this.selectedAddress = address;
    this.cdr.markForCheck();
  }

  addAddress(): void {
    this.editingAddressId = null;
    this.editingAddressData = null;
    this.showAddressModal = true;
  }

  editAddress(addressId: number): void {
    const address = this.addresses.find((a) => a.id === addressId);
    if (address) {
      this.editingAddressId = addressId;
      this.editingAddressData = { ...address };
      this.showAddressModal = true;
    }
  }

  handleAddressModalClose(): void {
    this.showAddressModal = false;
    this.editingAddressId = null;
    this.editingAddressData = null;
    this.cdr.markForCheck();
  }

  handleAddressModalSave(addressData: any): void {
    if (this.editingAddressId) {
      this.userService.updateAddress(this.editingAddressId, addressData).subscribe({
        next: () => {
          alert('Cập nhật địa chỉ thành công!');
          this.showAddressModal = false;
          this.loadAddresses();
        },
        error: (err: any) => {
          console.error('Lỗi cập nhật địa chỉ:', err);
          alert(err.error?.message || 'Có lỗi xảy ra');
        },
      });
    } else {
      this.userService.addAddress(addressData).subscribe({
        next: () => {
          alert('Thêm địa chỉ thành công!');
          this.showAddressModal = false;
          this.loadAddresses();
        },
        error: (err: any) => {
          console.error('Lỗi thêm địa chỉ:', err);
          alert(err.error?.message || 'Có lỗi xảy ra');
        },
      });
    }
  }

  deleteAddress(addressId: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      this.userService.deleteAddress(addressId).subscribe({
        next: () => {
          alert('Xóa địa chỉ thành công');
          this.loadAddresses();
        },
        error: (err: any) => {
          console.error('Lỗi xóa địa chỉ:', err);
          alert(err.error?.message || 'Có lỗi xảy ra');
        },
      });
    }
  }

  getSubtotal(): number {
    return this.cartItems.reduce((total, item) => total + item.gia * item.soluong, 0);
  }

  getDiscount(): number {
    return Math.min(this.voucherDiscount, this.getSubtotal());
  }

  getTotal(): number {
    return this.getSubtotal() - this.getDiscount() + this.orderData.phiVanChuyen;
  }

  selectPaymentMethod(method: string): void {
    this.selectedPaymentMethod = method;
    this.checkoutForm.patchValue({ paymentMethod: method });
  }

  onSubmit(): void {
    if (this.checkoutForm.invalid) {
      alert('Vui lòng đồng ý với điều khoản');
      return;
    }

    if (!this.selectedAddress) {
      alert('Vui lòng chọn địa chỉ giao hàng');
      return;
    }

    if (this.cartItems.length === 0) {
      alert('Giỏ hàng trống');
      return;
    }

    this.isProcessing = true;

    const orderData = {
      diaChiId: this.selectedAddress.id,
      phiVanChuyen: this.orderData.phiVanChuyen,
      maGiamGiaId: this.appliedVoucher?.id || null,
      maGiamGiaCode: this.appliedVoucher?.maCode || this.appliedVoucher?.code || null,
      soTienGiam: this.getDiscount(),
      phuongThucThanhToan: this.selectedPaymentMethod,
      ghiChu: this.checkoutForm.value.note,
      items: this.cartItems.map((item) => ({
        bienTheId: item.id_bienthe, // 👈 Sửa: dùng id_bienthe
        soLuong: item.soluong, // 👈 Sửa: dùng soluong
        gia: item.gia, // 👈 Thêm giá để lưu
        tenSanPham: item.tenSanPham,
        tenBienThe: item.tenBienThe,
      })),
      xuatTuGioHang: true, // 👈 Set true để xóa khỏi giỏ hàng sau khi đặt
    };

    const token = localStorage.getItem('accessToken');
    console.log('🔑 Token before order:', token ? 'Có token' : 'Không token');
    console.log('📦 Order data:', orderData);

    // Tạo đơn hàng
    this.http
      .post(`${this.apiUrl}`, orderData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .subscribe({
        next: (res: any) => {
          console.log('✅ Đơn hàng tạo thành công:', res);

          if (this.selectedPaymentMethod === 'payos') {
            // Tạo link thanh toán PayOS
            const paymentData = {
              orderCode: res.id,
              amount: this.getTotal(),
              description: `Thanh toan don hang ${res.maDonHang}`,
              returnUrl: `${window.location.origin}/thanh-toan/thanh-cong`,
              cancelUrl: `${window.location.origin}/thanh-toan/that-bai`,
              buyerName: this.selectedAddress.hoTenNguoiNhan,
              buyerPhone: this.selectedAddress.soDienThoai,
              items: this.cartItems.map((item) => ({
                name: item.ten, // 👈 Đã có sẵn "Tên sản phẩm - Tên biến thể"
                quantity: item.soluong,
                price: item.gia,
              })),
            };

            console.log('📦 Creating PayOS payment:', paymentData);

            // Gọi API tạo payment link
            this.http
              .post(`http://localhost:3000/api/payment/create-payos`, paymentData)
              .subscribe({
                next: (paymentRes: any) => {
                  console.log('✅ PayOS response:', paymentRes);

                  if (paymentRes.success && paymentRes.data.checkoutUrl) {
                    // Chuyển hướng sang trang thanh toán PayOS
                    window.location.href = paymentRes.data.checkoutUrl;
                  } else {
                    alert('Lỗi tạo thanh toán: ' + (paymentRes.message || 'Vui lòng thử lại'));
                    this.isProcessing = false;
                  }
                },
                error: (err) => {
                  console.error('❌ Payment error:', err);
                  alert(err.error?.message || 'Không thể tạo thanh toán');
                  this.isProcessing = false;
                },
              });
          } else if (this.selectedPaymentMethod === 'cod') {
            this.cartService.finalizeCheckoutSuccess();
            alert('Đặt hàng thành công!');
            this.isProcessing = false;
            this.router.navigate(['/trang-ca-nhan/don-hang-cua-toi']);
          } else {
            alert('Phương thức thanh toán đang được phát triển');
            this.isProcessing = false;
          }
        },
        error: (err) => {
          console.error('❌ Order error:', err);
          alert(err.error?.message || 'Lỗi tạo đơn hàng');
          this.isProcessing = false;
        },
      });
  }

  get f() {
    return this.checkoutForm.controls;
  }

  formatPrice(price: number): string {
    if (!price || isNaN(price)) return '0₫';
    return price.toLocaleString('vi-VN') + '₫';
  }
}
