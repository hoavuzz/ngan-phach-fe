import { Component } from '@angular/core';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-partners-section',
  standalone: true,
  imports: [NgFor],
  templateUrl: './partners-section.html',
})
export class PartnersSection {
  partners = [
    { name: 'Nghệ nhân Trần Văn A' },
    { name: 'Xưởng đàn Bình Minh' },
    { name: 'Nhạc cụ truyền thống Huế' },
    { name: 'Thương hiệu Yamaha VN' },
  ];
}
