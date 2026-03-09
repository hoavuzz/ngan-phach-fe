import { Component } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Categories } from '../../components/categories/categories';
import { Recommend } from '../../components/recommend/recommend';
import { NewProducts } from '../../components/new-products/new-products';
import { FeaturedProducts } from '../../components/featured-products/featured-products';
import { NewsSection } from '../../components/news-section/news-section';
import { PartnersSection } from '../../components/partners-section/partners-section';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    RouterLink,
    Categories,
    Recommend,
    NewProducts,
    FeaturedProducts,
    NewsSection,
    PartnersSection,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomePage {
  products: any[] = [];

  ngOnInit() {}
}
