import { HttpClient } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotificationService } from 'src/app/main/notification/notification.service';
import { AuthService } from 'src/app/_services/auth.service';
import { environment } from 'src/environments/environment';
import { FileItem } from 'carbon-components-angular';

@Component({
  selector: 'app-teacher-form',
  templateUrl: './teacher-form.component.html',
  styleUrls: ['./teacher-form.component.scss']
})
export class TeacherFormComponent implements OnInit {
  public status: { content: string; selected?: boolean }[] = [];
  public formGroup: FormGroup;
  public isUpdate = false;
  public isCreate = false;
  public isDetail = false;
  public title = '';
  public uploadable = true;
  public imagePreviewUrl: string;
  public positions = [];
  public subjects = [];
  public departments = [];
  public employment_statuses = [];

  @Input() files = new Set<FileItem>();

  protected maxSize = 500000;

  @Output() filesChange: EventEmitter<File> = new EventEmitter<File>();

  @Output() dataSaved: EventEmitter<void> = new EventEmitter<void>();

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private dialogRef: MatDialogRef<TeacherFormComponent>,
    protected formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public params: any,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.status = [{ content: 'Active' }, { content: 'Inactive' }];
    this.positions = this.params.data.positions;
    this.subjects = this.params.data.subjects;
    this.departments = this.params.data.departments;
    this.employment_statuses = this.params.data.employment_statuses;

    // console.log(this.params.da)

    if (this.params.method === 'create') {
      this.initializeForAdd();
    } else {
      if (this.params.isDetail) {
        this.initializeForDetail();
      } else if (this.params.isUpdate) {
        this.initializeForUpdate();
      }
    }
  }

  initializeForDetail() {
    this.isDetail = true;
    this.isUpdate = false;
    this.title = 'Detail Guru';
    this.initializeForm();
  }

  initializeForUpdate() {
    this.isUpdate = true;
    this.isDetail = false;
    this.title = 'Update Guru';
    this.initializeForm();
  }

  initializeForAdd() {
    this.isDetail = false;
    this.isUpdate = false;
    this.title = 'Tambah Guru';
    this.formGroup = this.formBuilder.group({
      name: ['', Validators.required],
      nik: ['', Validators.required],
      employment_status: ['', [Validators.required]],
      position_id: ['', [Validators.required]],
      subject_id: [''],
      status: ['', [Validators.required]],
      department_id: [false, [Validators.required]],
      enrollment_year: [''],
    });
  }

  initializeForm() {
    console.log(this.params, this.positions);
    this.formGroup = this.formBuilder.group({
      name: [this.params.name, Validators.required],
      nik: [this.params.nik, Validators.required],
      employment_status: [this.getEmployementStatusesId(this.params.employment_status), [Validators.required]],
      position_id: [this.getPositionsId(this.params.position_name), [Validators.required]],
      subject_id: [this.getSubjectsId(this.params.subject_name)],
      status: [this.params.status, [Validators.required]],
      department_id: [this.getDepartmentsId(this.params.department_name), [Validators.required]],
      enrollment_year: [new Date(this.params.enrollment_year)],
    });
  }

  onCreate() {
    if (this.formGroup.invalid) {
      this.displayValidationErrorMessage();
      return;
    }

    const headers = this.authService.getHeader();
    const data = this.formGroup.value;

    // Mengubah entry_on_date ke format yyyy-mm-dd
    data.enrollment_year = this.formatDate(new Date(data.enrollment_year));

    this.http
      .post(environment.apiUrl + '/teachers', data, { headers })
      .subscribe(
        (response: any) => {
          if (response) {
            this.handleSuccessResponse();
            const newData = {
              ...response,
            };
            this.dataSaved.emit(newData);
          }
        },
        (error) => {
          this.handleErrorResponse(error);
        }
      );
  }

  onUpdate() {
    if (this.formGroup.invalid) {
      this.displayValidationErrorMessage();
      return;
    }

    const headers = this.authService.getHeader();
    let data = this.formGroup.value;

    data.enrollment_year = this.formatDate(new Date(data.enrollment_year));

    this.http
      .put(environment.apiUrl + '/teachers/' + this.params.id, data, { headers })
      .subscribe(
        (response: any) => {
          if (response) {
            this.handleSuccessResponse();
            const newData = {
              ...response,
            };
            this.dataSaved.emit(newData);
          }
        },
        (error) => {
          this.handleErrorResponse(error);
        }
      );
  }

  private displayValidationErrorMessage() {
    this.notificationService.showWarning(
      'Silakan isi semua bagian yang wajib diisi',
      'Validasi Gagal' + '\n\n'
    );
  }

  private handleSuccessResponse() {
    this.notificationService.showSuccess('', 'Data berhasil disimpan');
    this.dialogRef.close(true);
  }

  private handleErrorResponse(error) {
    const errorObject = error.error.errors;
    let errorMessage = '';

    for (const field in errorObject) {
      if (errorObject.hasOwnProperty(field)) {
        const fieldErrors = errorObject[field];
        for (const errorKey in fieldErrors) {
          if (fieldErrors.hasOwnProperty(errorKey)) {
            errorMessage = `${field}: ${fieldErrors[errorKey]}\n`;
          }
        }
      }
    }

    this.notificationService.showError(errorMessage, 'Validasi gagal' + '\n\n');
  }

  isValid(name: string) {
    if (!this.isDetail) {
      const instance = this.formGroup.get(name);
      if (name === 'position_id') {
        if (instance.value === null) {
          return instance.touched;
        }
      }
      if (name === 'subject_id') {
        if (instance.value === null) {
          return instance.touched;
        }
      }
      if (name === 'department_id') {
        if (instance.value === null) {
          return instance.touched;
        }
      }
      if (name === 'employment_status') {
        if (instance.value === null) {
          return instance.touched;
        }
      }
      if (name === 'status') {
        if (instance.value === null) {
          return instance.touched;
        }
      }
      return instance.invalid && (instance.dirty || instance.touched);
    }

  }

  onClose() {
    this.dialogRef.close(false);
  }

  onUpload() {
    this.files.forEach((fileItem) => {
      if (!fileItem.uploaded) {
        if (fileItem.file.size < this.maxSize) {
          fileItem.state = 'upload';
          setTimeout(() => {
            fileItem.state = 'complete';
            fileItem.uploaded = true;
            this.imagePreviewUrl = URL.createObjectURL(fileItem.file); // Menambahkan ini
            console.log(this.imagePreviewUrl);
          }, 1500);
        }

        if (fileItem.file.size > this.maxSize) {
          fileItem.state = 'upload';
          setTimeout(() => {
            fileItem.state = 'edit';
            fileItem.invalid = true;
            fileItem.invalidText =
              '500kb max file size. Select a new file and try again.';
          }, 1500);
        }
      }
    });
  }

  validateInput(event) {
    const input = event.target;
    const inputValue = input.value;
    const numericValue = inputValue.replace(/[^0-9]/g, ''); // Hapus semua karakter selain angka
    input.value = numericValue; // Setel kembali nilai input hanya dengan angka
  }

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getEmployementStatusesId(data: string) {
    if(this.isUpdate){
      const employment_status = this.employment_statuses.find(
        (employment_status) => employment_status.content === data
      );
      return employment_status.value;
    } else {
      return data;
    }
  }

  getPositionsId(data: string) {
    if(this.isUpdate) {
      const position = this.positions.find(
        (position) => position.content === data
      );
      return position.value;
    } else {
      return data;
    }
  }

  getSubjectsId(data: string) {
    if(this.isUpdate) {
      const subject = this.subjects.find(
        (subject) => subject.content === data
      );
      return subject.value;
    } else {
      return data;
    }
  }

  getDepartmentsId(data: string) {
    if(this.isUpdate) {
      const department = this.departments.find(
        (department) => department.content === data
      );
      return department.value;
    } else {
      return data;
    }
  }

}
