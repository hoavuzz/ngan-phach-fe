// Thêm interface cho địa chỉ
export interface DiaChi {
  id: number;
  hoTen: string;
  soDienThoai: string;
  diaChiChiTiet: string;
  phuongXa: string;
  quanHuyen: string;
  tinhThanh: string;
  quocGia: string;
  macDinh?: boolean;
}

// Chi tiết sản phẩm trong đơn hàng
export interface OrderDetail {
  id: number;
  donHangId: number;
  bienTheId: number;
  soLuong: number;
  giaBanLucMua: number;
  giaKhuyenMaiLucMua?: number;
  thanhTien: number;
  bienThe?: {
    id: number;
    tenBienThe: string;
    sanPham?: {
      id: number;
      tenSanPham: string;
      hinhAnh?: string;
    };
  };
}

// Đơn hàng
export interface Order {
  id: number;
  maDonHang: string;
  tongTien: number;
  trangThai: string;
  trangThaiThanhToan: string;
  ngayDatHang: string;
  diaChiId?: number;
  phiVanChuyen?: number;
  ghiChu?: string;
  diaChi?: DiaChi; // Thêm trường này
  chiTiet?: OrderDetail[];
}

// Response từ API
export interface OrderResponse {
  total: number;
  trang: number;
  gioiHan: number;
  data: Order[];
}
