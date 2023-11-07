import { HttpClient } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FileItem } from 'carbon-components-angular';
import { AuthService } from 'src/app/_services/auth.service';
import { NotificationService } from 'src/app/main/notification/notification.service';
import { environment } from 'src/environments/environment';

export class CSVRecord {
  public name: any;
  public nik: any;
  public employment_status: any;
  public position_id: any;
  public department_id: any;
  public subject_id: any;
  public status: any;
  public enrollment_year: any;
}

@Component({
  selector: 'app-teacher-form-upload',
  templateUrl: './teacher-form-upload.component.html',
  styleUrls: ['./teacher-form-upload.component.scss']
})
export class TeacherFormUploadComponent implements OnInit {
  public imagePreviewUrl: string;
  public title = 'Upload';
  public uploadable = false;
  public uploading = false;
  public uploadProgressShow = false;
  public uploadDuration = 3;
  public positions = [];
  public subjects = [];
  public departments = [];
  public employment_statuses = [];


  @Input() files = new Set<FileItem>();

  @Output() dataSaved: EventEmitter<void> = new EventEmitter<void>();

  protected maxSize = 500000;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private notificationService: NotificationService,
    private dialogRef: MatDialogRef<TeacherFormUploadComponent>,
    @Inject(MAT_DIALOG_DATA) public params: any
  ) {}

  ngOnInit(): void {
    this.positions = this.params.data.positions;
    this.subjects = this.params.data.subjects;
    this.departments = this.params.data.departments;
    this.employment_statuses = this.params.data.employment_statuses;
  }

  onSelectedFile() {
    this.files.forEach((fileItem) => {
      if (!fileItem.uploaded) {
        if (fileItem.file.size < this.maxSize) {
          fileItem.state = 'upload';
          setTimeout(() => {
            fileItem.state = 'complete';
            fileItem.uploaded = true;
            // this.imagePreviewUrl = URL.createObjectURL(fileItem.file); // Menambahkan ini
            this.files.forEach((fileItem) => {});
            this.uploadable = true;
          }, 1500);
        }

        // if (fileItem.file.size > this.maxSize) {
        //   fileItem.state = 'upload';
        //   setTimeout(() => {
        //     fileItem.state = 'edit';
        //     fileItem.invalid = true;
        //     fileItem.invalidText =
        //       '500kb max file size. Select a new file and try again.';
        //   }, 1500);
        // }
      }
    });
  }

  getHeaderArray(csvRecordsArr: any) {
    const headers = csvRecordsArr[0].split(',');
    const headerArray = [];
    for (let j = 0; j < headers.length; j++) {
      headerArray.push(headers[j]);
    }
    return headerArray;
  }

  getDataRecordsArrayFromCSVFile(csvRecordsArray: any, headerLength: any) {
    const dataArr = [];
    for (let i = 1; i < csvRecordsArray.length; i++) {
      const data = csvRecordsArray[i].split(',');
      if (data.length === headerLength) {
        const csvRecord: CSVRecord = new CSVRecord();
        csvRecord.name = data[0].trim();
        csvRecord.nik = data[1].trim();
        csvRecord.employment_status = this.getEmploymentStatusId(data[2].trim());
        csvRecord.position_id = this.getPositionId(data[3].trim());
        csvRecord.department_id = this.getDepartmentId(data[4].trim());
        csvRecord.subject_id = this.getSubjectId(data[5].trim());
        csvRecord.status = data[6].trim();
        csvRecord.enrollment_year = data[7].trim();
        dataArr.push(csvRecord);
      }
    }
    return dataArr;
  }

  onUpload() {
    this.uploadProgressShow = true;
    this.uploading = true;

    // ubah data file csv ke json
    this.files.forEach((fileItem) => {
      if (fileItem.uploaded) {
        const reader = new FileReader();
        reader.readAsText(fileItem.file);
        reader.onload = () => {
          const csvData = reader.result;
          const csvRecordsArray = (<string>csvData).split(/\r\n|\n/);
          const headersRow = this.getHeaderArray(csvRecordsArray);
          const json = this.getDataRecordsArrayFromCSVFile(
            csvRecordsArray,
            headersRow.length
          );

          const headers = this.authService.getHeader();
          const data = json;
          this.http
            .post(environment.apiUrl + '/teachers/bulk-create', data, {
              headers,
            })
            .subscribe(
              (response: any) => {
                if (response) {
                  const newData = response;
                  this.dataSaved.emit(newData);
                  setTimeout(() => {
                    this.uploading = false;
                    this.handleSuccessResponse();
                  }, this.uploadDuration * 1000 + 5);
                }
              },
              (error) => {
                this.handleErrorResponse(error);
              }
            );
          // console.log(json);
        };
      }
    });

    // setTimeout(() => {
    //   // this.dialogRef.close(true);
    // }, this.uploadDuration * 1000);
  }

  onClose() {
    this.dialogRef.close(false);
  }

  private handleSuccessResponse() {
    this.notificationService.showSuccess('', 'Data berhasil diupload');
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
  }

  private getPositionId(positionName: string) {
    const position = this.positions.find(
      (position) => position.content.toLowerCase() === positionName.toLowerCase()
    );
    return position.value;
  }

  private getSubjectId(subjectName: string) {
    const subject = this.subjects.find(
      (subject) => subject.content.toLowerCase() === subjectName.toLowerCase()
    );
    return subject.value;
  }

  private getDepartmentId(departmentName: string) {
    const department = this.departments.find(
      (department) =>
        department.content.toLowerCase() === departmentName.toLowerCase()
    );
    return department.value;
  }

  private getEmploymentStatusId(employmentStatusName: string) {
    const employmentStatus = this.employment_statuses.find(
      (employmentStatus) =>
        employmentStatus.content.toLowerCase() ===
        employmentStatusName.toLowerCase()
    );
    return employmentStatus.value;
  }
  
}
