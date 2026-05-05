import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-payment-failed',
  standalone: true,
  templateUrl: './payment-failed.html',
  styleUrls: ['./payment-failed.css'],
  imports: [CommonModule, RouterModule],
})
export class PaymentFailed implements OnInit {
  errorMessage: string = '';
  orderCode: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.orderCode = params['orderCode'] || '';
      this.errorMessage = params['message'] || 'Có lỗi xảy ra trong quá trình thanh toán';
    });
  }

  tryAgain() {
    this.router.navigate(['/thanh-toan'], {
      queryParams: { orderCode: this.orderCode },
    });
  }

  continueShopping() {
    this.router.navigate(['/']);
  }

  viewCart() {
    this.router.navigate(['/gio-hang']);
  }
}
