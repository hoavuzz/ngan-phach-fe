import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-address-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './address-modal.html',
  styleUrl: './address-modal.css',
})
export class AddressModal implements OnInit {
  @Input() addressId: number | null = null;
  @Input() addressData: any = null;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  private apiUrl = '/api-vn';
  // private apiUrl = 'https://provinces.open-api.vn/api';

  provinces: any[] = [];
  districts: any[] = [];
  wards: any[] = [];

  selectedProvince: any = null;
  selectedDistrict: any = null;
  selectedWard: any = null;

  loadingProvinces = false;
  loadingDistricts = false;
  loadingWards = false;

  formData: any = {
    hoTenNguoiNhan: '',
    soDienThoai: '',
    diaChiChiTiet: '',
    phuongXa: '',
    quanHuyen: '',
    thanhPho: '',
    macDinh: false,
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    if (this.addressData) {
      this.formData = { ...this.addressData };
    }

    this.loadProvinces();
  }

  // load tỉnh
  loadProvinces() {
    this.loadingProvinces = true;

    this.http.get<any[]>(`${this.apiUrl}/p/`).subscribe({
      next: (data) => {
        this.provinces = data;

        if (this.formData.thanhPho) {
          const province = this.provinces.find((p) => p.name === this.formData.thanhPho);

          if (province) {
            this.selectedProvince = province;
            this.onProvinceChange(province);
          }
        }

        this.loadingProvinces = false;
      },
      error: () => {
        this.loadingProvinces = false;
      },
    });
  }

  // chọn tỉnh
  onProvinceChange(province: any) {
    this.selectedProvince = province;
    this.formData.thanhPho = province?.name || '';

    this.districts = [];
    this.wards = [];
    this.selectedDistrict = null;
    this.selectedWard = null;

    this.formData.quanHuyen = '';
    this.formData.phuongXa = '';

    if (!province) return;

    this.loadingDistricts = true;

    this.http.get<any>(`${this.apiUrl}/p/${province.code}?depth=2`).subscribe({
      next: (data) => {
        this.districts = data.districts || [];

        if (this.formData.quanHuyen) {
          const district = this.districts.find((d) => d.name === this.formData.quanHuyen);

          if (district) {
            this.selectedDistrict = district;
            this.onDistrictChange(district);
          }
        }

        this.loadingDistricts = false;
      },
      error: () => {
        this.loadingDistricts = false;
      },
    });
  }

  // chọn huyện
  onDistrictChange(district: any) {
    this.selectedDistrict = district;
    this.formData.quanHuyen = district?.name || '';

    this.wards = [];
    this.selectedWard = null;

    this.formData.phuongXa = '';

    if (!district) return;

    this.loadingWards = true;

    this.http.get<any>(`${this.apiUrl}/d/${district.code}?depth=2`).subscribe({
      next: (data) => {
        this.wards = data.wards || [];

        if (this.formData.phuongXa) {
          const ward = this.wards.find((w) => w.name === this.formData.phuongXa);

          if (ward) {
            this.selectedWard = ward;
            this.onWardChange(ward);
          }
        }

        this.loadingWards = false;
      },
      error: () => {
        this.loadingWards = false;
      },
    });
  }

  // chọn xã
  onWardChange(ward: any) {
    this.selectedWard = ward;
    this.formData.phuongXa = ward?.name || '';
  }

  isValidForm(): boolean {
    return !!(
      this.formData.hoTenNguoiNhan?.trim() &&
      this.formData.soDienThoai?.trim() &&
      this.formData.diaChiChiTiet?.trim() &&
      this.formData.thanhPho?.trim()
    );
  }

  onSubmit() {
    if (this.isValidForm()) {
      this.save.emit(this.formData);
    }
  }

  onClose() {
    this.close.emit();
  }
}
