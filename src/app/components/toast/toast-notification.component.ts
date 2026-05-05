import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService, ToastMessage } from '../../services/cart.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-5 right-5 z-50 space-y-2">
      <div
        *ngFor="let toast of toasts"
        class="min-w-[280px] max-w-[400px] bg-white rounded-lg shadow-lg overflow-hidden animate-slide-in-right"
      >
        <div class="flex items-center p-4" [class]="getToastClass(toast.type)">
          <div class="flex-shrink-0 mr-3">
            <span *ngIf="toast.type === 'success'" class="text-xl">✅</span>
            <span *ngIf="toast.type === 'error'" class="text-xl">❌</span>
            <span *ngIf="toast.type === 'warning'" class="text-xl">⚠️</span>
            <span *ngIf="toast.type === 'info'" class="text-xl">ℹ️</span>
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-800">{{ toast.message }}</p>
          </div>
          <button (click)="removeToast(toast)" class="ml-3 text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        <div class="h-1 bg-gray-200">
          <div
            class="h-full transition-all duration-300"
            [class]="getProgressBarClass(toast.type)"
            [style.width]="getProgressWidth(toast)"
          ></div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      .animate-slide-in-right {
        animation: slideInRight 0.3s ease-out;
      }
    `,
  ],
})
export class ToastNotificationComponent implements OnInit, OnDestroy {
  toasts: (ToastMessage & { id: number; progress: number })[] = [];
  private subscription: Subscription | null = null;
  private nextId = 0;
  private intervals: Map<number, any> = new Map();

  constructor(private cartService: CartService) {}

  ngOnInit() {
    this.subscription = this.cartService.toast$.subscribe((toast) => {
      if (toast) {
        this.addToast(toast);
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.intervals.forEach((interval) => clearInterval(interval));
  }

  private addToast(toast: ToastMessage) {
    const id = this.nextId++;
    const newToast = { ...toast, id, progress: 100 };
    this.toasts.push(newToast);

    const duration = toast.duration || 3000;
    const stepTime = 50;
    const steps = duration / stepTime;
    const decrement = 100 / steps;
    let currentProgress = 100;

    const interval = setInterval(() => {
      currentProgress -= decrement;
      const toastItem = this.toasts.find((t) => t.id === id);
      if (toastItem) {
        toastItem.progress = Math.max(0, currentProgress);
      }
      if (currentProgress <= 0) {
        clearInterval(interval);
        this.removeToastById(id);
      }
    }, stepTime);

    this.intervals.set(id, interval);
  }

  removeToast(toast: any) {
    this.removeToastById(toast.id);
  }

  private removeToastById(id: number) {
    const interval = this.intervals.get(id);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(id);
    }
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  getToastClass(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-l-4 border-green-500';
      case 'error':
        return 'bg-red-50 border-l-4 border-red-500';
      case 'warning':
        return 'bg-yellow-50 border-l-4 border-yellow-500';
      default:
        return 'bg-blue-50 border-l-4 border-blue-500';
    }
  }

  getProgressBarClass(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  }

  getProgressWidth(toast: any): string {
    return `${toast.progress}%`;
  }
}
