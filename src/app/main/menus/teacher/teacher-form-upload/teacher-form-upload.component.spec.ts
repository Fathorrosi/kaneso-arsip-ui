import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherFormUploadComponent } from './teacher-form-upload.component';

describe('TeacherFormUploadComponent', () => {
  let component: TeacherFormUploadComponent;
  let fixture: ComponentFixture<TeacherFormUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TeacherFormUploadComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TeacherFormUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
