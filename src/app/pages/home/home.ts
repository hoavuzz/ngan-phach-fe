import { Component } from '@angular/core';
import { Categories } from '../../components/categories/categories';
import { Recommend } from '../../components/recommend/recommend';
import { NewProducts } from '../../components/new-products/new-products';
import { FeaturedProducts } from '../../components/featured-products/featured-products';
import { NewsSection } from '../../components/news-section/news-section';
import { BannerComponent } from '../../components/banner/banner';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Categories, Recommend, NewProducts, FeaturedProducts, NewsSection, BannerComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomePage {
  products: any[] = [];

  ngOnInit() {}
}
