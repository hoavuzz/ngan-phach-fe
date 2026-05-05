import { Component } from '@angular/core';
import { ContactService } from '../../services/contact';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './contact.html',
  styleUrls: ['./contact.css']
})
export class ContactComponent {

  formData = {
    hoTen: '',
    email: '',
    phone: '',
    noiDung: ''
  };

  isLoading = false;
  message = '';

  constructor(private contactService: ContactService) {}

  onSubmit(form: any) {

    if (form.invalid) {
      this.message = "Vui lòng nhập đúng và đầy đủ thông tin";
      return;
    }

    // trim dữ liệu
    const data = {
      hoTen: this.formData.hoTen.trim(),
      email: this.formData.email.trim(),
      phone: this.formData.phone.trim(),
      noiDung: this.formData.noiDung.trim()
    };

    this.isLoading = true;
    this.message = '';

    this.contactService.sendContact(data).subscribe({
      next: (res: any) => {

        this.message = res.message;

        this.formData = {
          hoTen: '',
          email: '',
          phone: '',
          noiDung: ''
        };

        form.resetForm();

        this.isLoading = false;

        // auto clear message
        setTimeout(() => {
          this.message = '';
        }, 4000);

        // scroll lên đầu
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },

      error: () => {
        this.message = "Gửi liên hệ thất bại";
        this.isLoading = false;

        setTimeout(() => {
          this.message = '';
        }, 4000);
      }
    });
  }
}