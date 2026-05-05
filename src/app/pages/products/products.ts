import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Category, CategoryService } from '../../services/category';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {
  private readonly uploadBaseUrl = 'http://localhost:3000/uploads/';
  private readonly fallbackImage =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='300' height='300' fill='%23f5f5f5'/><text x='50%25' y='50%25' fill='%23999999' font-size='18' text-anchor='middle' dominant-baseline='middle'>No Image</text></svg>";
  products: any[] = [];
  filteredProducts: any[] = [];
  pagedProducts: any[] = [];

  categories: Category[] = [];
  brands: any[] = [];

  selectedCategories: number[] = [];
  selectedBrands: number[] = [];
  selectedPriceRange = '';

  readonly priceRanges = [
    { key: 'under-1m', label: 'Dưới 1 triệu', min: 0, max: 1_000_000 },
    { key: '1m-5m', label: '1 - 5 triệu', min: 1_000_000, max: 5_000_000 },
    { key: '5m-10m', label: '5 - 10 triệu', min: 5_000_000, max: 10_000_000 },
    { key: 'over-10m', label: 'Trên 10 triệu', min: 10_000_000, max: null as number | null },
  ];

  currentPage = 1;
  itemsPerPage = 9;
  totalPages = 0;

  isFilterModalOpen = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.handleQueryParams();

    this.categoryService.getCategories().subscribe((categories) => {
      this.categories = categories;
      this.syncSelectionsFromQueryParams();
      if (this.products.length) {
        this.applyFilter(false);
      }
      this.cdr.markForCheck();
    });

    this.http.get<any>('http://localhost:3000/api/products').subscribe((res) => {
      this.products = res.data;

      if (!this.categories.length) {
        this.categories = this.getUnique(this.products, 'danhmuc_nhaccu');
      }

      this.brands = this.getUnique(this.products, 'thuong_hieu');
      this.applyFilter(false);
      this.cdr.markForCheck();
    });
  }

  getUnique(arr: any[], key: string) {
    const map = new Map();
    arr.forEach((p) => {
      if (p[key]) map.set(p[key].id, p[key]);
    });
    return Array.from(map.values());
  }

  handleQueryParams() {
    this.route.queryParams.subscribe(() => {
      this.syncSelectionsFromQueryParams();

      if (this.products.length) {
        this.applyFilter(false);
      }
      this.cdr.markForCheck();
    });
  }

  syncSelectionsFromQueryParams() {
    const params = this.route.snapshot.queryParams;
    this.selectedCategories = this.mapSlugToId(params['category'], this.categories);
    this.selectedBrands = this.mapSlugToId(params['brand'], this.brands);
    const priceParam = String(params['price'] || '').trim();
    this.selectedPriceRange = this.priceRanges.some((range) => range.key === priceParam)
      ? priceParam
      : '';
  }

  mapSlugToId(param: any, list: any[]) {
    if (!param) return [];

    const slugs = Array.isArray(param) ? param : [param];

    return list.filter((x) => slugs.includes(x.slug)).map((x) => x.id);
  }

  toggleSelection(list: number[], id: number, checked: boolean) {
    return checked ? [...list, id] : list.filter((x) => x !== id);
  }

  onCategoryChange(e: any, id: number) {
    this.selectedCategories = this.toggleSelection(this.selectedCategories, id, e.target.checked);
    this.applyFilter();
  }

  onBrandChange(e: any, id: number) {
    this.selectedBrands = this.toggleSelection(this.selectedBrands, id, e.target.checked);
    this.applyFilter();
  }

  onPriceRangeChange(key: string) {
    this.selectedPriceRange = this.selectedPriceRange === key ? '' : key;
    this.applyFilter();
  }

  applyFilter(updateUrl = true) {
    this.filteredProducts = this.products.filter((p) => {
      const cateId = p.danhMucId ?? p.danhmuc_nhaccu?.id;
      const brandId = p.thuong_hieu_id ?? p.thuong_hieu?.id;
      const price = this.getProductPrice(p);
      const selectedPrice = this.priceRanges.find((range) => range.key === this.selectedPriceRange);
      const inPriceRange = !selectedPrice || this.matchPriceRange(price, selectedPrice);

      return (
        (!this.selectedCategories.length || this.selectedCategories.includes(cateId)) &&
        (!this.selectedBrands.length || this.selectedBrands.includes(brandId)) &&
        inPriceRange
      );
    });

    this.currentPage = 1;
    this.updatePagination();

    if (updateUrl) this.updateUrl();
    this.cdr.markForCheck();
  }

  updatePagination() {
    const start = (this.currentPage - 1) * this.itemsPerPage;

    this.pagedProducts = this.filteredProducts.slice(start, start + this.itemsPerPage);
    this.totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;

    this.currentPage = page;
    this.updatePagination();
  }

  updateUrl() {
    const category = this.categories
      .filter((c) => this.selectedCategories.includes(c.id))
      .map((c) => c.slug);

    const brand = this.brands.filter((b) => this.selectedBrands.includes(b.id)).map((b) => b.slug);

    const price = this.selectedPriceRange || null;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: category.length || brand.length || price ? { category, brand, price } : {},
    });
  }

  addToCart(product: any): void {
    this.cartService.addToCart(product, 1).subscribe({
      error: () => {},
    });
  }

  getProductImage(product: any): string {
    const imagePath =
      product?.hinhAnhDauTien ||
      product?.hinhAnhDaiDien ||
      product?.sanpham_hinhanhs?.find((img: any) => img?.anhChinh)?.duongDan ||
      product?.sanpham_hinhanhs?.[0]?.duongDan ||
      '';

    return this.resolveImageUrl(imagePath);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (!img) return;

    if (img.dataset['fallbackApplied'] === 'true') return;
    img.dataset['fallbackApplied'] = 'true';
    img.src = this.fallbackImage;
  }

  private resolveImageUrl(path: string): string {
    const normalizedPath = String(path || '').trim();
    if (!normalizedPath) return this.fallbackImage;
    if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;
    return `${this.uploadBaseUrl}${normalizedPath.replace(/^\/+/, '')}`;
  }

  private getProductPrice(product: any): number {
    const directPrice = Number(product?.giaThamKhao || 0);
    if (directPrice > 0) return directPrice;

    const variantPrices = (product?.sanpham_bienthes || [])
      .map((variant: any) => Number(variant?.giaKhuyenMai || variant?.giaBan || 0))
      .filter((value: number) => value > 0);

    if (!variantPrices.length) return 0;
    return Math.min(...variantPrices);
  }

  private matchPriceRange(
    price: number,
    range: { key: string; label: string; min: number; max: number | null },
  ): boolean {
    if (price <= 0) return false;
    if (range.max === null) return price >= range.min;
    return price >= range.min && price < range.max;
  }

  openFilterModal() {
    this.isFilterModalOpen = true;
  }

  closeFilterModal() {
    this.isFilterModalOpen = false;
  }

  applyFiltersAndClose() {
    this.applyFilter();
    this.closeFilterModal();
    this.cdr.markForCheck();
  }
}
