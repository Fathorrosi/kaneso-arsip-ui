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
  public nis: any;
  public name: any;
  public address: any;
  public entry_on_date: any;
  public graduate_on_date: any;
  public status: any;
  public graduated: any;
  public note: any;
  public major_id: any;
}

@Component({
  selector: 'app-student-form-upload',
  templateUrl: './student-form-upload.component.html',
  styleUrls: ['./student-form-upload.component.scss'],
})
export class StudentFormUploadComponent implements OnInit {
  public imagePreviewUrl: string;
  public title = 'Upload';
  public uploadable = false;
  public uploading = false;
  public uploadProgressShow = false;
  public uploadDuration = 3;
  public majors: { content: string; value: number }[] = [];

  @Input() files = new Set<FileItem>();

  @Output() dataSaved: EventEmitter<void> = new EventEmitter<void>();

  protected maxSize = 500000;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private notificationService: NotificationService,
    private dialogRef: MatDialogRef<StudentFormUploadComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.majors = this.data.data;
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
        csvRecord.nis = data[0].trim();
        csvRecord.name = data[1].trim();
        csvRecord.address = data[2].trim();
        csvRecord.entry_on_date = data[3].trim();
        csvRecord.graduate_on_date = data[4].trim();
        csvRecord.status = data[5].trim();
        csvRecord.graduated = data[6].trim() === 1;
        csvRecord.note = data[7].trim();
        csvRecord.major_id = this.getMajorId(data[8].trim());
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
            .post(environment.apiUrl + '/students/bulk-create', data, {
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

  getMajorId(majorName: string) {
    console.log(majorName);
    console.log(this.majors);
    const major = this.majors.find(
      (major) => major.content.toLowerCase() === majorName.toLowerCase()
    );
    return major.value;
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
}
