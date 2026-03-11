import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders {
  activeFilter = 'all';

  setFilter(filter: string) {
    this.activeFilter = filter;
  }
}
