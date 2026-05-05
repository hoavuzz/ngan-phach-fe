import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GioHang } from './gio-hang';

describe('GioHang', () => {
  let component: GioHang;
  let fixture: ComponentFixture<GioHang>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GioHang]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GioHang);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
