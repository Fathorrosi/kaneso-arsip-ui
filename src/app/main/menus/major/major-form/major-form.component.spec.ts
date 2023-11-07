import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MajorFormComponent } from './major-form.component';

describe('MajorFormComponent', () => {
  let component: MajorFormComponent;
  let fixture: ComponentFixture<MajorFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MajorFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MajorFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
