import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Recommend } from './recommend';

describe('Recommend', () => {
  let component: Recommend;
  let fixture: ComponentFixture<Recommend>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Recommend]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Recommend);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
