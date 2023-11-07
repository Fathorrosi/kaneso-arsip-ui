import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentFormUploadComponent } from './student-form-upload.component';

describe('StudentFormUploadComponent', () => {
  let component: StudentFormUploadComponent;
  let fixture: ComponentFixture<StudentFormUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StudentFormUploadComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StudentFormUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
