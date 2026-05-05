import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-verify-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './verify-success.html',
  styleUrl: './verify-success.css',
})
export class VerifySuccess {}
