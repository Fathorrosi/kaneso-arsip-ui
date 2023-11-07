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
  selector: 'app-student-form',
  templateUrl: './student-form.component.html',
  styleUrls: ['./student-form.component.scss'],
})
export class StudentFormComponent implements OnInit {
  public studentStatus: { content: string; selected?: boolean }[] = [];
  public majors: { content: string; value: number; selected?: boolean }[] = [];
  public formGroup: FormGroup;
  public isUpdate = false;
  public isCreate = false;
  public isDetail = false;
  public selectedMajor = null;
  public title = '';
  public uploadable = true;
  public imagePreviewUrl: string;

  @Input() files = new Set<FileItem>();

  protected maxSize = 500000;

  @Output() filesChange: EventEmitter<File> = new EventEmitter<File>();

  @Output() dataSaved: EventEmitter<void> = new EventEmitter<void>();

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private dialogRef: MatDialogRef<StudentFormComponent>,
    protected formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.studentStatus = [{ content: 'Active' }, { content: 'Inactive' }];
    this.majors = this.data.data;
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
    this.title = 'Detail Siswa';
    this.initializeForm();
  }

  initializeForUpdate() {
    this.isUpdate = true;
    this.isDetail = false;
    this.title = 'Update Siswa';
    this.initializeForm();
  }

  initializeForAdd() {
    this.isDetail = false;
    this.isUpdate = false;
    this.title = 'Tambah Siswa';
    this.formGroup = this.formBuilder.group({
      nis: ['', Validators.required],
      name: ['', Validators.required],
      address: ['', [Validators.required]],
      entry_on_date: ['', [Validators.required]],
      graduate_on_date: [''],
      status: ['', [Validators.required]],
      graduated: [false, [Validators.required]],
      note: [''],
      major_id: ['', [Validators.required]],
      photo: [''],
    });
  }

  initializeForm() {
    this.formGroup = this.formBuilder.group({
      nis: [this.data.nis, Validators.required],
      name: [this.data.name, Validators.required],
      address: [this.data.address, [Validators.required]],
      entry_on_date: [new Date(this.data.entry_on_date), [Validators.required]],
      graduate_on_date: [new Date(this.data.graduate_on_date)],
      status: [this.data.status, [Validators.required]],
      graduated: [this.data.graduated, [Validators.required]],
      note: [this.data.note],
      major_id: [this.getMajorId(this.data.major_name), [Validators.required]],
      photo: [''],
    });
  }

  onCreate() {
    if (this.formGroup.invalid) {
      this.displayValidationErrorMessage();
      return;
    }

    console.log(this.formGroup.value);

    const headers = this.authService.getHeader();
    const data = this.formGroup.value;

    // Mengubah entry_on_date ke format yyyy-mm-dd
    data.entry_on_date = this.formatDate(new Date(data.entry_on_date));

    // Mengubah graduate_on_date ke format yyyy-mm-dd
    data.graduate_on_date = this.formatDate(new Date(data.graduate_on_date));

    this.http
      .post(environment.apiUrl + '/students', data, { headers })
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

    // Mengubah entry_on_date ke format yyyy-mm-dd
    data.entry_on_date = this.formatDate(new Date(data.entry_on_date));

    // Mengubah graduate_on_date ke format yyyy-mm-dd
    data.graduate_on_date = this.formatDate(new Date(data.graduate_on_date));

    this.http
      .put(environment.apiUrl + '/students/' + this.data.id, data, { headers })
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
    // if (this.isUpdate) {
    //   return false;
    // }
    const instance = this.formGroup.get(name);
    if (name === 'major_id') {
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

  getMajorId(majorName: string) {
    if (this.isUpdate) {
      const matchingMajor = this.majors.find(
        (major) => major.content.toLowerCase() === majorName.toLowerCase()
      );
      return matchingMajor ? matchingMajor.value : null;
    } else {
      return majorName;
    }
  }
}
