import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-verify-fail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './verify-fail.html',
  styleUrl: './verify-fail.css',
})
export class VerifyFail {}
