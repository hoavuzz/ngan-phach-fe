import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsDetail } from './news-detail';

describe('NewsDetail', () => {
  let component: NewsDetail;
  let fixture: ComponentFixture<NewsDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewsDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
