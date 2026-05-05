import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';

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

  private provinceApiCandidates = ['/api-vn', 'https://provinces.open-api.vn/api'];

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
      this.formData.thanhPho = this.addressData.thanhPho || this.addressData.tinhThanh || '';
    }

    this.loadProvinces();
  }

  // load tỉnh
  loadProvinces() {
    this.loadingProvinces = true;

    this.fetchProvinceData<any[]>('/p/').subscribe({
      next: (data: any[]) => {
        this.provinces = Array.isArray(data) ? data : [];

        if (this.formData.thanhPho) {
          const province = this.findByName(this.provinces, this.formData.thanhPho);

          if (province) {
            this.selectedProvince = province;
            this.onProvinceChange(province, true);
          }
        }

        this.loadingProvinces = false;
      },
      error: () => {
        this.provinces = [];
        this.loadingProvinces = false;
      },
    });
  }

  // chọn tỉnh
  onProvinceChange(province: any, preserveSelection = false) {
    this.selectedProvince = province;
    this.formData.thanhPho = province?.name || '';
    const currentDistrictName = preserveSelection ? this.formData.quanHuyen : '';
    const currentWardName = preserveSelection ? this.formData.phuongXa : '';

    this.districts = [];
    this.wards = [];
    this.selectedDistrict = null;
    this.selectedWard = null;

    this.formData.quanHuyen = currentDistrictName;
    this.formData.phuongXa = currentWardName;

    if (!province) return;

    this.loadingDistricts = true;

    this.fetchProvinceData<any>(`/p/${province.code}?depth=2`).subscribe({
      next: (data: any) => {
        this.districts = data.districts || [];

        if (this.formData.quanHuyen) {
          const district = this.findByName(this.districts, this.formData.quanHuyen);

          if (district) {
            this.selectedDistrict = district;
            this.onDistrictChange(district, preserveSelection);
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
  onDistrictChange(district: any, preserveSelection = false) {
    this.selectedDistrict = district;
    this.formData.quanHuyen = district?.name || '';
    const currentWardName = preserveSelection ? this.formData.phuongXa : '';

    this.wards = [];
    this.selectedWard = null;

    this.formData.phuongXa = currentWardName;

    if (!district) return;

    this.loadingWards = true;

    this.fetchProvinceData<any>(`/d/${district.code}?depth=2`).subscribe({
      next: (data: any) => {
        this.wards = data.wards || [];

        if (this.formData.phuongXa) {
          const ward = this.findByName(this.wards, this.formData.phuongXa);

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

  private fetchProvinceData<T>(path: string, index = 0): Observable<T> {
    const baseUrl = this.provinceApiCandidates[index];

    return this.http.get<T>(`${baseUrl}${path}`).pipe(
      catchError((error) => {
        if (index < this.provinceApiCandidates.length - 1) {
          return this.fetchProvinceData<T>(path, index + 1);
        }

        return throwError(() => error);
      }),
    );
  }

  private findByName(items: any[], targetName: string) {
    const normalizedTarget = this.normalizeName(targetName);
    return items.find((item) => this.normalizeName(item?.name) === normalizedTarget) || null;
  }

  private normalizeName(value: string | null | undefined): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .trim()
      .toLowerCase();
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
