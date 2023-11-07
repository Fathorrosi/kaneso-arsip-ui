import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthService } from 'src/app/_services/auth.service';
import { StudentFormComponent } from '../../student/student-form/student-form.component';
import { NotificationService } from 'src/app/main/notification/notification.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-position-form',
  templateUrl: './position-form.component.html',
  styleUrls: ['./position-form.component.scss']
})
export class PositionFormComponent implements OnInit {
  public formGroup: FormGroup;
  public isUpdate = false;
  public isCreate = false;
  public isDetail = false;
  public title = '';
  

  @Output() dataSaved: EventEmitter<void> = new EventEmitter<void>();
  
  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private dialogRef: MatDialogRef<StudentFormComponent>,
    protected formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    console.log(this.data);
    if (this.data.method === 'create') {
      this.initializeForAdd();
    } else {
      if (this.data.isDetail) {
        this.initializeForDetail();
      } else if (this.data.isUpdate) {
        this.initializeForUpdate();
      }
    }
  }

  initializeForDetail() {
    this.isDetail = true;
    this.isUpdate = false;
    this.title = 'Detail Jabatan';
    this.initializeForm();
  }

  initializeForUpdate() {
    this.isUpdate = true;
    this.isDetail = false;
    this.title = 'Update Jabatan';
    this.initializeForm();
  }

  initializeForAdd() {
    this.isDetail = false;
    this.isUpdate = false;
    this.title = 'Tambah Jabatan';
    this.formGroup = this.formBuilder.group({
      name: ['', Validators.required],
    });
  }

  initializeForm() {
    this.formGroup = this.formBuilder.group({
      name: [this.data.name, Validators.required],
    });
  }

  onCreate() {
    if (this.formGroup.invalid) {
      this.displayValidationErrorMessage();
      return;
    }

    const headers = this.authService.getHeader();
    const data = this.formGroup.value;

    this.http
      .post(environment.apiUrl + '/positions', data, { headers })
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

    this.http
      .put(environment.apiUrl + '/positions/' + this.data.id, data, { headers })
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
    console.log(error)
    const errorObject = error.error;
    let errorMessage = '';

    if (errorObject.message) {
      errorMessage = errorObject.message;
      if (errorMessage.toLowerCase().includes('duplicate')) {
        errorMessage = 'Nama jabatan sudah ada';
      }
    } else {
      errorMessage = errorObject.error;
    }

    this.notificationService.showError(errorMessage, 'Validasi gagal' + '\n\n');
  }

  isValid(name: string) {
    const instance = this.formGroup.get(name);
    return instance.invalid && (instance.dirty || instance.touched);
  }

  onClose() {
    this.dialogRef.close(false);
  }

}
