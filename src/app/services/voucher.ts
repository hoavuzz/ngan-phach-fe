import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface VoucherValidationPayload {
  maCode: string;
  tongTienHang: number;
}

export interface VoucherInfo {
  id: number;
  maCode: string;
  loaiGiam: 'fixed' | 'percent' | string;
  giaTriGiam: number;
  phanTramGiam: number;
  giaTriGiamToiDa: number;
  donHangToiThieu: number;
  ngayHetHan?: string | null;
  moTa: string;
  code: string;
  description: string;
  discountType: 'fixed' | 'percent';
  discountValue: number;
  minSubtotal: number;
  maxDiscount?: number;
  shippingDiscount?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  usageLimit?: number | null;
  usedCount?: number;
  isActive?: boolean;
}

export interface VoucherValidationResult {
  valid: boolean;
  voucher: VoucherInfo | null;
  message: string;
  discountAmount: number;
  shippingDiscount: number;
  finalTotal: number;
}

@Injectable({
  providedIn: 'root',
})
export class VoucherService {
  private apiUrl = 'http://localhost:3000/api/vouchers';

  constructor(private http: HttpClient) {}

  getAvailableVouchers(): Observable<VoucherInfo[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map((res) => {
        const items = res?.data || res || [];
        return Array.isArray(items) ? items.map((item) => this.mapVoucher(item)) : [];
      }),
      catchError(() => of([])),
    );
  }

  validateVoucher(
    payload: VoucherValidationPayload,
    voucher?: VoucherInfo | null,
  ): Observable<VoucherValidationResult> {
    const normalizedPayload = {
      maCode: payload.maCode.trim().toUpperCase(),
      tongTienHang: Number(payload.tongTienHang || 0),
    };

    return this.http.post<any>(`${this.apiUrl}/kiem-tra`, normalizedPayload).pipe(
      map((res) => this.mapServerValidation(res, voucher || null, normalizedPayload)),
      catchError(() => of(this.invalidResult('Khong the kiem tra voucher luc nay'))),
    );
  }

  private mapVoucher(item: any): VoucherInfo {
    const loaiGiam = String(item?.loaiGiam || '').toLowerCase();
    const discountType: 'fixed' | 'percent' =
      loaiGiam.includes('phan_tram') ||
      loaiGiam.includes('percent') ||
      loaiGiam.includes('percentage')
        ? 'percent'
        : 'fixed';
    const discountValue =
      discountType === 'percent' ? Number(item?.phanTramGiam || 0) : Number(item?.giaTriGiam || 0);

    return {
      id: Number(item?.id || 0),
      maCode: String(item?.maCode || '').toUpperCase(),
      loaiGiam: item?.loaiGiam || 'fixed',
      giaTriGiam: Number(item?.giaTriGiam || 0),
      phanTramGiam: Number(item?.phanTramGiam || 0),
      giaTriGiamToiDa: Number(item?.giaTriGiamToiDa || 0),
      donHangToiThieu: Number(item?.donHangToiThieu || 0),
      ngayHetHan: item?.ngayHetHan || null,
      moTa: item?.moTa || '',
      code: String(item?.maCode || '').toUpperCase(),
      description: item?.moTa || '',
      discountType,
      discountValue,
      minSubtotal: Number(item?.donHangToiThieu || 0),
      maxDiscount: Number(item?.giaTriGiamToiDa || 0) || undefined,
      endsAt: item?.ngayHetHan || null,
      isActive: true,
    };
  }

  private mapServerValidation(
    res: any,
    voucher: VoucherInfo | null,
    payload: VoucherValidationPayload,
  ): VoucherValidationResult {
    const data = res?.data || res;
    const valid = !!data?.hopLe;
    const discountAmount = Number(data?.soTienGiam || 0);
    const finalTotal = Number(data?.tongTienSauGiam || 0);

    return {
      valid,
      voucher: valid ? voucher : null,
      message: valid
        ? `Đã áp dụng ${voucher?.maCode || normalizedCode(payload.maCode)}`
        : 'Voucher không hợp lệ hoặc không đủ điều kiện',
      discountAmount,
      shippingDiscount: 0,
      finalTotal,
    };
  }

  private invalidResult(message: string): VoucherValidationResult {
    return {
      valid: false,
      voucher: null,
      message,
      discountAmount: 0,
      shippingDiscount: 0,
      finalTotal: 0,
    };
  }
}

function normalizedCode(code: string): string {
  return String(code || '')
    .trim()
    .toUpperCase();
}
