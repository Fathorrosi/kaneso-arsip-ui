import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'src/app/_services/auth.service';
import { environment } from 'src/environments/environment';
import {
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { NotificationService } from 'src/app/main/notification/notification.service';

export interface RoleName {
  content: string;
  id: number;
  selected?: boolean;
}

export interface userStatus {
  content: string;
  selected?: boolean;
}

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
})
export class UserFormComponent implements OnInit {
  public roleNames: RoleName[] = [];
  public roles = [];
  public formGroup: FormGroup;
  public isUpdate = false;
  public isCreate = false;
  public isDetail = false;
  public selectedRole = null;
  public title = '';
  public userStatus: userStatus[] = [];

  @Output() dataSaved: EventEmitter<void> = new EventEmitter<void>();

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private dialogRef: MatDialogRef<UserFormComponent>,
    protected formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.userStatus = [
      {
        content: 'Active',
      },
      {
        content: 'Inactive',
      },
    ];
    if (this.data && Object.keys(this.data).length > 0) {
      if (this.data.isDetail) {
        this.initializeForDetail();
      } else if (this.data.isUpdate) {
        this.initializeForUpdate();
      }
    } else {
      this.initializeForAdd();
    }
  }

  initializeForDetail() {
    this.isDetail = true;
    this.isUpdate = false;
    this.title = 'Detail User';
    this.initializeForm();
    this.getRoles();
  }

  initializeForUpdate() {
    this.isUpdate = true;
    this.isDetail = false;
    this.title = 'Update User';
    this.initializeForm();
    this.getRoles();
  }

  initializeForAdd() {
    this.isDetail = false;
    this.isUpdate = false;
    this.title = 'Tambah User';
    this.getRoles();
    this.formGroup = this.formBuilder.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.email, Validators.required]],
      password: ['', [Validators.required]],
      role_id: [[], [Validators.required]],
      status: [1, [Validators.required]],
    });
  }

  initializeForm() {
    this.formGroup = this.formBuilder.group({
      first_name: [this.data.first_name],
      last_name: [this.data.last_name],
      email: [this.data.email],
      password: [''],
      role_id: [null],
      status: [this.data.status],
    });
  }

  getRoles() {
    const headers = this.authService.getHeader();
    this.http
      .get(environment.apiUrl + '/users/roles', { headers })
      .subscribe((response: any) => {
        if (response.length > 0) {
          this.roles = response;
          this.roleNames = response.map((row) => ({
            content: row.name,
            id: row.id,
          }));

          if (this.isDetail || this.isUpdate) {
            this.selectedRole = this.roles.find(
              (row) => row.name === this.data.role_name
            );

            this.userStatus.forEach((row) => {
              if (row.content === this.data.status) {
                row.selected = true;
                this.formGroup.get('status').patchValue(row.content);
              }
            });

            if (this.isUpdate) {
              this.roleNames.forEach((row) => {
                if (row.content === this.selectedRole.name) {
                  row.selected = true;
                }
                this.formGroup.get('role_id').patchValue(row);
              });
            } else {
              this.formGroup.get('role_id').setValue(this.selectedRole.name);
            }
          }
        }
      });
  }

  onClose() {
    this.dialogRef.close(false);
  }

  onCreate() {
    if (this.formGroup.invalid) {
      this.displayValidationErrorMessage();
      return;
    }

    const headers = this.authService.getHeader();
    const data = this.formGroup.value;

    this.http.post(environment.apiUrl + '/users', data, { headers }).subscribe(
      (response: any) => {
        if (response) {
          this.handleSuccessResponse();
          const newData = {
            ...response,
            role_name: this.getRoleFromId(response.role_id).name,
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

    if (data.password === '') {
      delete data.password;
    }

    this.http
      .put(environment.apiUrl + '/users/' + this.data.id, data, { headers })
      .subscribe(
        (response: any) => {
          if (response) {
            this.handleSuccessResponse();
            const newData = {
              ...response,
              role_name: this.getRoleFromId(response.role_id).name,
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

  isValid(name) {
    if (this.isUpdate) {
      return false;
    }
    const instance = this.formGroup.get(name);
    if (name === 'role_id') {
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

  getRoleFromId(id) {
    if (typeof id === 'object') {
      id = id.id;
    }
    return this.roles.find((row) => row.id === id);
  }
}
