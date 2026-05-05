import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  templateUrl: './payment-success.html',
  styleUrls: ['./payment-success.css'],
  imports: [CommonModule, RouterModule],
})
export class PaymentSuccess implements OnInit {
  orderCode: string = '';
  amount: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService,
  ) {}

  ngOnInit() {
    this.cartService.finalizeCheckoutSuccess();

    this.route.queryParams.subscribe((params) => {
      this.orderCode = params['orderCode'] || '';
      this.amount = params['amount'] || 0;
    });
  }

  continueShopping() {
    this.router.navigate(['/']);
  }

  viewOrder() {
    this.router.navigate(['/trang-ca-nhan/don-hang-cua-toi']);
  }
}
