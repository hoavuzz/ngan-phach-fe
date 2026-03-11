import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../../services/user'; // Đảm bảo path đúng với service của bạn

@Component({
  selector: 'app-profile-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-info.html',
  styleUrl: './profile-info.css',
})
export class ProfileInfo implements OnInit {
  editing = false;

  hoTen: string = '';
  soDienThoai: string = '';
  email: string = '';
  diem: number = 0;

  avatarPreview: string = ''; // Để trống hoặc set default avatar nếu muốn
  isLoading: boolean = true; // Để hiển thị loading nếu cần (tùy chọn)
  errorMessage: string = ''; // Để hiển thị lỗi nếu API fail

  constructor(
    private userService: User, // Đổi tên biến cho rõ nghĩa (không dùng User chữ hoa)
    private cdr: ChangeDetectorRef, // Để force change detection trong zoneless
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck(); // Cập nhật UI ngay (loading state)

    this.userService.getProfile().subscribe({
      next: (res: any) => {
        console.log('PROFILE RESPONSE:', res);

        // Gán giá trị an toàn, tránh undefined/null crash
        this.hoTen = res?.hoTen || '';
        this.soDienThoai = res?.soDienThoai || '';
        this.email = res?.email || '';
        this.diem = res?.diem || 0; // Nếu backend có trường diem, nếu không thì để 0

        // Avatar
        this.avatarPreview = res?.anhDaiDien || ''; // Nếu không có thì để trống hoặc default

        this.isLoading = false;
        this.cdr.markForCheck(); // Force Angular check lại view (rất quan trọng trong zoneless)
      },
      error: (err) => {
        console.error('LỖI LẤY PROFILE:', err);
        this.errorMessage = 'Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.';
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  toggleEdit(): void {
    this.editing = !this.editing;
    this.cdr.markForCheck(); // Đảm bảo nút edit/update UI
  }

  saveProfile(): void {
    // TODO: Thêm logic gọi API update profile ở đây (nếu đã implement backend)
    // Ví dụ: this.userService.updateProfile({ hoTen: this.hoTen, soDienThoai: this.soDienThoai }).subscribe(...)

    this.editing = false;
    alert('Đã lưu thông tin'); // Thay bằng toast/notification đẹp hơn sau
    this.cdr.markForCheck();
  }

  onAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.avatarPreview = e.target?.result as string;
        this.cdr.markForCheck(); // Cập nhật preview ngay
      };

      reader.readAsDataURL(file);
    }
  }
}
