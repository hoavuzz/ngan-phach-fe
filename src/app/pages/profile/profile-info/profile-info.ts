import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../../services/user';

interface UserProfile {
  hoTen: string;
  soDienThoai: string;
  email: string;
  diem: number;
  anhDaiDien?: string;
}

interface Address {
  id: number;
  tenNguoiNhan: string;
  soDienThoai: string;
  diaChiChiTiet: string;
  macDinh: boolean;
}

@Component({
  selector: 'app-profile-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-info.html',
  styleUrl: './profile-info.css',
})
export class ProfileInfo implements OnInit {
  @ViewChild('avatarInput') avatarInput!: ElementRef;

  editing = false;

  originalData = {
    hoTen: '',
    soDienThoai: '',
    anhDaiDien: '',
  };

  hoTen: string = '';
  soDienThoai: string = '';
  email: string = '';
  diem: number = 0;

  avatarPreview: string = 'assets/default-avatar.png';
  isLoading: boolean = true;
  errorMessage: string = '';

  addresses: Address[] = [];
  isLoadingAddresses: boolean = false;

  constructor(
    private userService: User,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.loadAddresses();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.userService.getProfile().subscribe({
      next: (res: any) => {
        console.log('PROFILE RESPONSE:', res);

        this.originalData = {
          hoTen: res?.hoTen || '',
          soDienThoai: res?.soDienThoai || '',
          anhDaiDien: res?.anhDaiDien || '',
        };

        this.hoTen = res?.hoTen || '';
        this.soDienThoai = res?.soDienThoai || '';
        this.email = res?.email || '';
        this.diem = res?.diemTichLuy || 0;

        this.avatarPreview = res?.anhDaiDien || 'assets/default-avatar.png';

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('LỖI LẤY PROFILE:', err);
        this.errorMessage = 'Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.';
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadAddresses(): void {
    this.isLoadingAddresses = true;

    this.userService.getAddresses().subscribe({
      next: (res: any) => {
        this.addresses = res || [];
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

  toggleEdit(): void {
    if (this.editing) {
      this.cancelEdit();
    }
    this.editing = !this.editing;
    this.cdr.markForCheck();
  }

  cancelEdit(): void {
    this.hoTen = this.originalData.hoTen;
    this.soDienThoai = this.originalData.soDienThoai;
    this.avatarPreview = this.originalData.anhDaiDien || 'assets/default-avatar.png';
  }

  saveProfile(): void {
    if (!this.hoTen.trim()) {
      alert('Vui lòng nhập họ tên');
      return;
    }

    if (!this.soDienThoai.trim()) {
      alert('Vui lòng nhập số điện thoại');
      return;
    }

    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(this.soDienThoai)) {
      alert('Số điện thoại không hợp lệ');
      return;
    }

    const updateData = {
      hoTen: this.hoTen,
      soDienThoai: this.soDienThoai,
      anhDaiDien: this.avatarPreview !== 'assets/default-avatar.png' ? this.avatarPreview : null,
    };

    this.userService.updateProfile(updateData).subscribe({
      next: (res: any) => {
        alert('Cập nhật thông tin thành công!');
        this.editing = false;

        this.originalData = {
          hoTen: this.hoTen,
          soDienThoai: this.soDienThoai,
          anhDaiDien: this.avatarPreview,
        };

        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('LỖI CẬP NHẬT:', err);
        alert(err.error?.message || 'Có lỗi xảy ra khi cập nhật thông tin');
      },
    });
  }

  onAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File ảnh không được vượt quá 5MB');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Chỉ chấp nhận file ảnh định dạng JPG, PNG, GIF, WEBP');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.avatarPreview = e.target?.result as string;
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);

      this.uploadAvatar(file);
    }
  }

  uploadAvatar(file: File): void {
    const formData = new FormData();
    // QUAN TRỌNG: Phải dùng field name 'image' vì backend dùng upload.single('image')
    formData.append('image', file); // <-- Sửa từ 'avatar' thành 'image'

    console.log('Uploading file:', file.name, 'size:', file.size);

    // Log form data để kiểm tra
    formData.forEach((value, key) => {
      console.log('FormData:', key, value);
    });

    this.userService.uploadAvatar(formData).subscribe({
      next: (res: any) => {
        console.log('Upload avatar thành công:', res);
        if (res?.url) {
          // Backend trả về url dạng: /uploads/users/filename.jpg
          // Cần tạo full URL
          const fullUrl = `http://localhost:3000${res.url}`;
          this.avatarPreview = fullUrl;
          this.saveProfileAfterAvatar(fullUrl);
        }
      },
      error: (err: any) => {
        console.error('Lỗi upload avatar:', err);
        console.error('Error details:', err.error);

        alert(err.error?.message || 'Không thể upload ảnh đại diện');

        this.avatarPreview = this.originalData.anhDaiDien || 'assets/default-avatar.png';
        this.cdr.markForCheck();
      },
    });
  }

  saveProfileAfterAvatar(avatarUrl: string): void {
    const updateData = {
      hoTen: this.hoTen,
      soDienThoai: this.soDienThoai,
      anhDaiDien: avatarUrl, // Lưu full URL vào database
    };

    this.userService.updateProfile(updateData).subscribe({
      next: () => {
        console.log('Cập nhật avatar thành công');
        this.originalData.anhDaiDien = avatarUrl;

        // Cập nhật user trong localStorage
        const currentUser = this.userService.getUser();
        if (currentUser) {
          currentUser.anhDaiDien = avatarUrl;
          localStorage.setItem('user', JSON.stringify(currentUser));
        }

        alert('Cập nhật ảnh đại diện thành công!');
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('Lỗi cập nhật avatar trong profile:', err);
        alert('Upload ảnh thành công nhưng không thể cập nhật profile. Vui lòng thử lại sau.');
      },
    });
  }

  hasChanges(): boolean {
    return (
      this.hoTen !== this.originalData.hoTen ||
      this.soDienThoai !== this.originalData.soDienThoai ||
      this.avatarPreview !== this.originalData.anhDaiDien
    );
  }

  addAddress(): void {
    console.log('Thêm địa chỉ mới');
    // TODO: Implement add address modal
  }

  editAddress(addressId: number): void {
    console.log('Sửa địa chỉ:', addressId);
    // TODO: Implement edit address modal
  }

  setDefaultAddress(addressId: number): void {
    this.userService.setDefaultAddress(addressId).subscribe({
      next: () => {
        alert('Đặt địa chỉ mặc định thành công');
        this.loadAddresses();
      },
      error: (err: any) => {
        console.error('Lỗi đặt địa chỉ mặc định:', err);
        alert(err.error?.message || 'Có lỗi xảy ra');
      },
    });
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
}
