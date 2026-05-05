import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-introduce',
  standalone: true,
    imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './introduce.html',
  styleUrl: './introduce.css',
})
export class Introduce {

}
