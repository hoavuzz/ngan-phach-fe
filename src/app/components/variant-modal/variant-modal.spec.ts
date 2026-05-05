import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VariantModal } from './variant-modal';

describe('VariantModal', () => {
  let component: VariantModal;
  let fixture: ComponentFixture<VariantModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VariantModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VariantModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});