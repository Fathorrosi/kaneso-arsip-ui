import { Component, OnInit } from '@angular/core';
import { ColDef, GridOptions } from '@ag-grid-community/core';
import { InfiniteRowModelModule } from '@ag-grid-community/infinite-row-model';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'src/app/_services/auth.service';
import { environment } from 'src/environments/environment';
import {
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
} from '@angular/material/dialog';
import { TokenStorageService } from 'src/app/_services/token-storage.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../notification/notification.service';
import { ConfirmDeleteComponent } from '../../confirmation/confirm-delete/confirm-delete.component';
import { TeacherFormComponent } from './teacher-form/teacher-form.component';
import { TeacherFormUploadComponent } from './teacher-form-upload/teacher-form-upload.component';
import { forkJoin } from 'rxjs';

const createRowHelper = (
  id,
  name,
  nik,
  employment_status,
  position_name,
  subject_name,
  status,
  department_name,
  enrollment_year
) => {
  // Buat objek baris sesuai dengan kebutuhan Anda
  return {
    id: id,
    name: name,
    nik: nik,
    employment_status: employment_status,
    position_name: position_name,
    subject_name: subject_name,
    status: status,
    department_name: department_name,
    enrollment_year: enrollment_year,
  };
};

@Component({
  selector: 'app-teacher',
  templateUrl: './teacher.component.html',
  styleUrls: ['./teacher.component.scss']
})
export class TeacherComponent implements OnInit {
  public model = null;
  public searchModel;
  public size = 'md';
  public offset = { x: -9, y: 0 };
  public batchText = '';
  public selectedRows = [];
  private dialogRef: MatDialogRef<TeacherFormComponent>;
  private dialogUploadRef: MatDialogRef<TeacherFormUploadComponent>;
  private dialogRefConfirm: MatDialogRef<ConfirmDeleteComponent>;
  public positions = [];
  public subjects = [];
  public departments = [];
  public statuses = [];
  public employment_statuses = [
    { content: 'ASN', value: 'ASN' },
    { content: 'Non ASN', value: 'Non ASN' },
  ];

  private filterParams: { type: string; value: any }[] = [];

  cancelMethod() {}

  public modules = [InfiniteRowModelModule, ClientSideRowModelModule];
  public gridOptions: GridOptions = {};
  public loading: boolean = false;
  public defaultColDef = {};

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private dialog: MatDialog,
    private router: Router,
    private tokenStorage: TokenStorageService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.getPositions();
    this.getSubjects(); 
    this.getDepartments();
    this.statuses = [
      { content: 'Active', value: 'Active' },
      { content: 'Inactive', value: 'Inactive' },
    ];
    if (this.tokenStorage.getToken()) {
      this.createTable();
    } else {
      this.notificationService.showWarning(
        'Silahkan login terlebih dahulu',
        'Warning'
      );
      this.router.navigate(['/auth/signin/']);
    }
  }

  getPositions() {
    const headers = this.authService.getHeader();
    this.http
      .get(environment.apiUrl + '/positions', { headers })
      .subscribe((response: any) => {
        const data = response;
        this.positions = data.map((row) => ({
          content: row.name,
          value: row.id,
        }));
      });
  }

  getSubjects() {
    const headers = this.authService.getHeader();
    this.http
      .get(environment.apiUrl + '/subjects', { headers })
      .subscribe((response: any) => {
        const data = response;
        this.subjects = data.map((row) => ({
          content: row.name,
          value: row.id,
        }));
      });
  }

  getDepartments() {
    const headers = this.authService.getHeader();
    this.http
      .get(environment.apiUrl + '/departments', { headers })
      .subscribe((response: any) => {
        const data = response;
        this.departments = data.map((row) => ({
          content: row.name,
          value: row.id,
        }));
      });
  }

  createTable() {
    this.loading = true;
    const columnDefs: Array<ColDef> = [
      {
        headerName: 'Nama',
        field: 'name',
        cellClass: 'cell-flex-middle overflow-hidden font-bold',
        // cellRenderer: companyCellRenderer,
        pinned: true,
        checkboxSelection: true,
        headerCheckboxSelection: true,
        editable: false,
      },
      {
        headerName: 'NIK',
        field: 'nik',
        headerClass: 'cell-flex-left',
        cellClass: 'cell-flex-middle cell-flex-left',
      },
      {
        headerName: 'Status Kepegawaian',
        field: 'employment_status',
        headerClass: 'cell-flex-left',
        cellClass: 'cell-flex-middle cell-flex-left',
        cellRenderer: (params) => {
          const backgroundColor = params.value === 'ASN' ? '#008000' : '#FFA500'; // Ganti warna sesuai kebutuhan
          const textColor = '#fff'; // Ganti warna teks sesuai kebutuhan
          const padding = '8px 12px'; // Tambahkan padding sesuai kebutuhan
          const borderRadius = '20px'; // Tambahkan radius lengkung sesuai kebutuhan
        
          return `
            <div style="background-color: ${backgroundColor}; color: ${textColor}; padding: ${padding}; border-radius: ${borderRadius}" class="status-badge">
              ${params.value}
            </div>
          `;
        }             
      },
      {
        headerName: 'Jabatan',
        field: 'position_name',
        headerClass: 'cell-flex-left',
        cellClass: 'cell-flex-middle cell-flex-left',
      },
      {
        headerName: 'Mata Pelajaran',
        field: 'subject_name',
        headerClass: 'cell-flex-left',
        cellClass: 'cell-flex-middle cell-flex-left',
      },
      {
        headerName: 'Departemen',
        field: 'department_name',
        headerClass: 'cell-flex-left',
        cellClass: 'cell-flex-middle cell-flex-left',
      },
      {
        headerName: 'Tanggal Bergabung',
        field: 'enrollment_year',
        headerClass: 'cell-flex-left',
        cellClass: 'cell-flex-middle cell-flex-left',
      },
      {
        headerName: 'status',
        field: 'status',
        headerClass: 'cell-flex-left',
        cellClass: 'cell-flex-middle cell-flex-left',
        cellRenderer: (params) => {
          if (params.value === 'Active') {
            return `
            <div class="pr-3 pl-2 py-1 app-bg-success-o-30 app-color-success rounded-full flex items-center">
            <span class="w-2 h-2 app-bg-success rounded-full inline-block mr-1"></span>
            Active
          </div>
          `;
          } else {
            return ` <div class="pr-3 pl-2 py-1 app-bg-warning-o-30 app-color-warning rounded-full flex items-center">
            <span class="w-2 h-2 app-bg-warning rounded-full inline-block mr-1"></span>
            Inactive`;
          }
        },
      },
    ];

    const headers = this.authService.getHeader();
    this.http
      .get(environment.apiUrl + '/teachers', { headers })
      .subscribe((response: any) => {
        // if (response.length > 0) {
        const rowData = response.map((row) =>
          createRowHelper(
            row.id,
            row.name,
            row.nik,
            row.employment_status,
            this.positions.find((position) => position.value === row.position_id)?.content || '',
            this.subjects.find((subject) => subject.value === row.subject_id)?.content || '',
            row.status,
            this.departments.find((department) => department.value === row.department_id)?.content || '',
            row.enrollment_year
          )
        );
        this.gridOptions = {
          columnDefs: columnDefs,
          rowData: response.length > 0 ? rowData : [],
          rowHeight: 40,
          headerHeight: 40,
          rowSelection: 'multiple',
          defaultColDef: {
            editable: true,
            sortable: true,
            resizable: true,
          },
          pagination: true,
          paginationPageSize: 15,
          groupSelectsChildren: true,
          onSelectionChanged: this.onSelectionChanged.bind(this),
        };
       
        this.loading = false;
        setTimeout(() => {
          try {
            this.gridOptions.api.sizeColumnsToFit();
          } catch (error) {}
        }, 10);
        // }
      });
  }

  onSelectionChanged(event: any) {
    // this.dataTable = this.gridOptions.rowData
    this.selectedRows = this.gridOptions.api.getSelectedRows();
    // search data from gridOptions with selectedRows and update searchModel
  }

  // Fungsi untuk filter data dengan beberapa parameter
  filterData(filters: { type: string; value: any }) {
    const filterIndex = this.filterParams.findIndex(
      (param) => param.type === filters.type
    );
    // Jika filter sudah ada, update value-nya
    if (filterIndex >= 0) {
      this.filterParams[filterIndex].value = filters.value;
    }
    // Jika filter belum ada, tambahkan filter baru
    else {
      this.filterParams.push(filters);
    }

    const filteredData = this.gridOptions.rowData.filter((item) => {
      console.log(item)
      return this.filterParams.every((param) => {
        console.log(param)
        if (param.value === null) {
          return true;
        } else {
          if (param.type === 'search') {
            const nameMatch = item.name
              .toLowerCase()
              .includes(param.value.toLowerCase());
            const nikMatch = item.nik
              .toLowerCase()
              .includes(param.value.toLowerCase());
            return nameMatch || nikMatch;
          } else if (param.type === 'position') {
            console.log(item.position, param.value)  
            return item.position_name === param.value;
          } else if (param.type === 'subject') {
            return item.subject_name === param.value;
          } else if (param.type === 'department') {
            return item.department_name === param.value;
          } else if (param.type === 'employment_status') {
            return item.employment_status === param.value;
          } else if (param.type === 'status') {
            return item.status === param.value;
          }
        }
      });
    });

    this.gridOptions.api.setRowData(filteredData);
  }

  actionHandler(action: string) {
    if (action === 'delete') {
      this.deleteHandler(this.selectedRows);
    } else if (action === 'update') {
      this.updateHandler(this.selectedRows);
    } else if (action === 'detail') {
      this.detailHandler(this.selectedRows);
    }
  }

  deleteHandler(selectedRows: any) {
    this.openDialogConfirm(null);
    this.dialogRefConfirm.afterClosed().subscribe((result) => {
      if (result) {
        const headers = this.authService.getHeader();
        const deleteRequests = selectedRows.map((row) => {
          return this.http.delete(environment.apiUrl + '/teachers/' + row.id, {
            headers,
          });
        });
  
        forkJoin(deleteRequests).subscribe(() => {
          this.selectedRows = [];
          this.notificationService.showSuccess('Data berhasil dihapus', 'Success');
          this.createTable();
        });
      }
    });
  }

  updateHandler(selectedRows: any) {
    let data = selectedRows[0];
    data.isUpdate = true;
    data.isDetail = false;
    data.data = {
      positions: this.positions,
      subjects: this.subjects,
      departments: this.departments,
      statuses: this.statuses,
      employment_statuses: this.employment_statuses,
    }
    this.openDialog(data)
      .afterClosed()
      .subscribe(() => {});

    this.loadData(this.dialogRef);
  }

  detailHandler(selectedRows: any) {
    let data = selectedRows[0];
    data.isDetail = true;
    data.isUpdate = false;
    data.data = {
      positions: this.positions,
      subjects: this.subjects,
      departments: this.departments,
      statuses: this.statuses,
      employment_statuses: this.employment_statuses,
    }
    this.openDialog(data)
      .afterClosed()
      .subscribe(() => {});
  }

  createHandler() {
    const params = {
      data: {
        positions: this.positions,
        subjects: this.subjects,
        departments: this.departments,
        statuses: this.statuses,
        employment_statuses: this.employment_statuses,
      },
      method: 'create',
    };
    this.openDialog(params)
      .afterClosed()
      .subscribe(() => {});

    this.loadData(this.dialogRef);
  }

  uploadHandler() {
    const params = {
      data: {
        positions: this.positions,
        subjects: this.subjects,
        departments: this.departments,
        statuses: this.statuses,
        employment_statuses: this.employment_statuses,
      },
      method: 'upload',
    };
    this.openDialogUpload(params)
      .afterClosed()
      .subscribe(() => {});

    this.loadData(this.dialogUploadRef);
  }

  loadData(dialogRef: MatDialogRef<any>) {
    dialogRef.componentInstance.dataSaved.subscribe((newData) => {
      if (Array.isArray(newData)) {
        this.addMultipleRows(newData);
      } else {
        this.addOrUpdateRow(newData);
      }
    });
  }
  
  addMultipleRows(newDataArray) {
    const transactions = {
      add: [],
    };
  
    newDataArray.forEach((item) => {
      const newRowData = this.createRowData(item);
      transactions.add.push(newRowData);
    });
  
    this.gridOptions.api.applyTransaction(transactions);
    this.gridOptions.rowData.push(...transactions.add);
  }
  
  addOrUpdateRow(newData) {
    const idToFind = newData.id;
    const existingRow = this.gridOptions.rowData.find((row) => row.id === idToFind);
  
    const updatedRowData = this.createRowData(newData);
  
    if (existingRow) {
      Object.assign(existingRow, updatedRowData);
      const transaction = { update: [existingRow] };
      this.gridOptions.api.applyTransaction(transaction);
    } else {
      const transaction = { add: [updatedRowData] };
      this.gridOptions.api.applyTransaction(transaction);
      this.gridOptions.rowData.push(updatedRowData);
    }
  }
  
  createRowData(item) {
    return {
      id: item.id,
      name: item.name,
      nik: item.nik,
      employment_status: item.employment_status,
      position_name: this.positions.find((position) => position.value === item.position_id)?.content || '',
      subject_name: this.subjects.find((subject) => subject.value === item.subject_id)?.content || '',
      status: item.status,
      department_name: this.departments.find((department) => department.value === item.department_id)?.content || '',
      enrollment_year: item.enrollment_year,
    };
  }
  
  openDialog(params) {
    this.dialogRef = null;
    let config = new MatDialogConfig();

    config.viewContainerRef = null;
    config.disableClose = true;
    config.role = 'alertdialog';
    config.width = '1000px';

    config.data = {
      ...params,
    };

    this.dialogRef = this.dialog.open(TeacherFormComponent, config);

    return this.dialogRef;
  }

  openDialogUpload(params) {
    this.dialogUploadRef = null;
    let config = new MatDialogConfig();

    config.viewContainerRef = null;
    config.disableClose = true;
    config.role = 'alertdialog';
    config.width = '500px';

    config.data = {
      ...params,
    };

    this.dialogUploadRef = this.dialog.open(TeacherFormUploadComponent, config);
    return this.dialogUploadRef;
  }

  openDialogConfirm(params) {
    this.dialogRefConfirm = null;
    let config = new MatDialogConfig();

    config.viewContainerRef = null;
    config.disableClose = true;
    config.role = 'alertdialog';
    config.width = '400px';

    config.data = {
      ...params,
    };

    this.dialogRefConfirm = this.dialog.open(ConfirmDeleteComponent, config);
    return this.dialogRefConfirm;
  }
}
