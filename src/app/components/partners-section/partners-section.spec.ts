import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartnersSection } from './partners-section';

describe('PartnersSection', () => {
  let component: PartnersSection;
  let fixture: ComponentFixture<PartnersSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnersSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartnersSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
