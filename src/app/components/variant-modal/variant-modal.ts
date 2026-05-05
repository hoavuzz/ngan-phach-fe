import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-variant-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './variant-modal.html',
  styleUrl: './variant-modal.css',
})
export class VariantModal implements OnInit {
  @Input() product: any;
  @Input() isOpen: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() selectVariant = new EventEmitter<any>();

  selectedVariant: any = null;

  ngOnInit() {
    if (this.product?.sanpham_bienthes?.length > 0) {
      this.selectedVariant = this.product.sanpham_bienthes[0];
    }
  }

  onClose() {
    this.close.emit();
  }

  onSelect() {
    if (this.selectedVariant) {
      this.selectVariant.emit(this.selectedVariant);
      this.close.emit();
    }
  }

  compareVariants(v1: any, v2: any): boolean {
    return v1 && v2 ? v1.id === v2.id || v1.id_bienthe === v2.id_bienthe : v1 === v2;
  }
}