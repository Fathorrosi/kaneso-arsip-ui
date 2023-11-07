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
import { StudentFormComponent } from './student-form/student-form.component';
import { StudentFormUploadComponent } from './student-form-upload/student-form-upload.component';
import { forkJoin } from 'rxjs';

const createRowHelper = (
  id,
  nis,
  name,
  address,
  photo,
  entry_on_date,
  graduate_on_date,
  created_date,
  updated_date,
  status,
  graduated,
  note,
  major_name
) => {
  // Buat objek baris sesuai dengan kebutuhan Anda
  return {
    id: id,
    nis: nis,
    name: name,
    address: address,
    photo: photo,
    entry_on_date: entry_on_date,
    graduate_on_date: graduate_on_date,
    created_date: created_date,
    updated_date: updated_date,
    status: status,
    graduated: graduated,
    note: note,
    major_name: major_name,
    class_of: entry_on_date ? entry_on_date.split('-')[0] : '',
  };
};

@Component({
  selector: 'app-student',
  templateUrl: './student.component.html',
  styleUrls: ['./student.component.scss'],
})
export class StudentComponent implements OnInit {
  public model = null;
  public searchModel;
  public size = 'md';
  public offset = { x: -9, y: 0 };
  public batchText = '';
  public selectedRows = [];
  private dialogRef: MatDialogRef<StudentFormComponent>;
  private dialogUploadRef: MatDialogRef<StudentFormUploadComponent>;
  private dialogRefConfirm: MatDialogRef<ConfirmDeleteComponent>;
  public classes = [];
  public majors = [];
  public statuses = [];
  public students = [];

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

  async getMajors() {
    const headers = this.authService.getHeader();
    this.http
      .get(environment.apiUrl + '/majors', { headers })
      .subscribe((response: any) => {
        const data = response;
        this.majors = data.map((row) => ({
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
        headerName: 'NIS',
        field: 'nis',
        headerClass: 'cell-flex-center',
        cellClass: 'cell-flex-middle cell-flex-center',
      },
      // {
      //   headerName: 'Alamat',
      //   field: 'address',
      //   headerClass: 'cell-flex-center',
      //   cellClass: 'cell-flex-middle cell-flex-center',
      //   editable: false,
      // },
      // {
      //   headerName: 'Foto',
      //   field: 'photo',
      //   headerClass: 'cell-flex-center',
      //   cellClass: 'cell-flex-middle cell-flex-center',
      //   editable: false,
      // },
      // {
      //   headerName: 'Tanggal Masuk',
      //   field: 'entry_on_date',
      //   headerClass: 'cell-flex-center',
      //   cellClass: 'cell-flex-middle cell-flex-center',
      //   editable: false,
      // },
      // {
      //   headerName: 'tanggal Lulus',
      //   field: 'graduate_on_date',
      //   headerClass: 'cell-flex-center',
      //   cellClass: 'cell-flex-middle cell-flex-center',
      //   editable: false,
      // },
      // {
      //   headerName: 'Tanggal Dibuat',
      //   field: 'created_date',
      //   headerClass: 'cell-flex-center',
      //   cellClass: 'cell-flex-middle cell-flex-center',
      //   editable: false,
      // },
      // {
      //   headerName: 'Tanggal Diupdate',
      //   field: 'updated_date',
      //   headerClass: 'cell-flex-center',
      //   cellClass: 'cell-flex-middle cell-flex-center',
      //   editable: false,
      // },
      // {
      //   headerName: 'Lulus',
      //   field: 'graduated',
      //   headerClass: 'cell-flex-center',
      //   cellClass: 'cell-flex-middle cell-flex-center',
      //   editable: false,
      // },
      // {
      //   headerName: 'Catatan',
      //   field: 'note',
      //   headerClass: 'cell-flex-center',
      //   cellClass: 'cell-flex-middle cell-flex-center',
      //   editable: false,
      // },

      {
        headerName: 'Jurusan',
        field: 'major_name',
        headerClass: 'cell-flex-center',
        cellClass: 'cell-flex-middle cell-flex-center',
      },
      {
        headerName: 'Angkatan',
        field: 'class_of',
        headerClass: 'cell-flex-center',
        cellClass: 'cell-flex-middle cell-flex-center',
      },
      {
        headerName: 'status',
        field: 'status',
        headerClass: 'cell-flex-center',
        cellClass: 'cell-flex-middle cell-flex-center',
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
      .get(environment.apiUrl + '/students', { headers })
      .subscribe((response: any) => {
        // if (response.length > 0) {

        // Menghasilkan data unik dari kolom entry_on_date
        this.classes = [
          ...new Set(response.map((row) => row.entry_on_date.split('-')[0])),
        ]
          .map((uniqueYear) => parseInt(uniqueYear as string, 10)) // Type assertion
          .sort((a, b) => a - b)
          .map((uniqueYear) => ({
            content: uniqueYear.toString(),
            value: uniqueYear.toString(),
          }));

        const rowData = response.map((row) =>
          createRowHelper(
            row.id,
            row.nis,
            row.name,
            row.address,
            row.photo,
            row.entry_on_date,
            row.graduate_on_date,
            row.created_date,
            row.updated_date,
            row.status,
            row.graduated,
            row.note,
            row.major_name
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
        this.getMajors();
        // if (this.gridOptions.rowData.length === 0) {

        // } else {
        // // Menghasilkan data unik dari kolom major_name
        // this.majors = [...new Set(rowData.map((row) => row.major_name))]
        //   .sort()
        //   .map((uniqueMajor) => ({
        //     content: uniqueMajor,
        //     value: uniqueMajor,
        //   }));
        // }

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
      return this.filterParams.every((param) => {
        console.log(param);
        if (param.value === null) {
          return true;
        } else {
          if (param.type === 'search') {
            const nameMatch = item.name
              .toLowerCase()
              .includes(param.value.toLowerCase());
            const nisMatch = item.nis
              .toLowerCase()
              .includes(param.value.toLowerCase());
            return nameMatch || nisMatch;
          } else if (param.type === 'major_name') {
            return item.major_name === param.value;
          } else if (param.type === 'class_of') {
            return item.class_of === param.value;
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
          return this.http.delete(environment.apiUrl + '/students/' + row.id, {
            headers,
          });
        });
  
        // Tunggu hingga semua proses penghapusan selesai
        forkJoin(deleteRequests).subscribe(() => {
          this.selectedRows = [];
          this.notificationService.showSuccess('Data berhasil dihapus', 'Success');
          this.createTable();
  
          // Setelah semua proses selesai, lanjutkan dengan refreshDashboard
          this.refreshDashboard();
        });
      }
    });
  }

  updateHandler(selectedRows: any) {
    let data = selectedRows[0];
    data.isUpdate = true;
    data.isDetail = false;
    data.data = this.majors;
    this.openDialog(data)
      .afterClosed()
      .subscribe(() => {});

    this.loadData(this.dialogRef);
  }

  detailHandler(selectedRows: any) {
    let data = selectedRows[0];
    data.isDetail = true;
    data.isUpdate = false;
    data.data = this.majors;
    this.openDialog(data)
      .afterClosed()
      .subscribe(() => {});
  }

  createHandler() {
    const params = {
      data: this.majors,
      method: 'create',
    };
    this.openDialog(params)
      .afterClosed()
      .subscribe(() => {});

    this.loadData(this.dialogRef);
  }

  uploadHandler() {
    const params = {
      data: this.majors,
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
  
      // Tunggu hingga semua proses selesai
      forkJoin(this.refreshDashboard()).subscribe(() => {
        // Semua proses sudah selesai, lanjutkan ke refreshDashboard
        this.refreshDashboard();
      });
    });
  }

  refreshDashboard() {
    const headers = this.authService.getHeader();

    let students = [];
    let majors = [];

    // Observables for HTTP requests
    const studentsRequest = this.http.get(environment.apiUrl + '/students', {
      headers,
    });
    const majorsRequest = this.http.get(environment.apiUrl + '/majors', {
      headers,
    });

    forkJoin([studentsRequest, majorsRequest]).subscribe(
      ([studentsResponse, majorsResponse]) => {
        for (const key in studentsResponse) {
          if (Object.prototype.hasOwnProperty.call(studentsResponse, key)) {
            const element = studentsResponse[key];
            students.push(element);
          }
        }

        // this.students = studentsResponse;

        // Langkah 1: Membuat array tahun unik dari entry_on_date di students
        const uniqueYears = [
          ...new Set(
            students.map((student) =>
              new Date(student.entry_on_date).getFullYear()
            )
          ),
        ];

        // Langkah 3: Mengurutkan tahun-tahun secara menaik
        uniqueYears.sort((a, b) => a - b);

        // Menghasilkan data xAxis.data berdasarkan tahun yang telah diurutkan
        const xAxisData = uniqueYears.map((year) => year.toString());

        sessionStorage.setItem('xAxisData', JSON.stringify(xAxisData));

        for (const key in majorsResponse) {
          if (Object.prototype.hasOwnProperty.call(majorsResponse, key)) {
            const element = majorsResponse[key];
            majors.push(element);
          }
        }

        // Langkah 2 dan 4: Menghasilkan data series berdasarkan tahun dan majors_id
        const seriesData = majors.map((major) => {
          const dataForMajor = uniqueYears.map((year) => {
            const studentsInMajorForYear = students.filter((student) => {
              const studentYear = new Date(student.entry_on_date).getFullYear();
              return studentYear === year && student.major_id === major.id;
            });
            return studentsInMajorForYear.length;
          });

          return {
            name: major.name,
            type: 'line',
            stack: 'staccck',
            areaStyle: {},
            data: dataForMajor,
          };
        });

        // Ambil tahun terakhir dari xAxisData
        const lastYear = parseInt(xAxisData[xAxisData.length - 1]);

        // Filter siswa yang masuk dalam 3 tahun terakhir (termasuk tahun ini)
        const studentsInLast3Years = students.filter((student) => {
          const studentYear = new Date(student.entry_on_date).getFullYear();
          return lastYear - studentYear <= 2; // Mengambil 3 tahun terakhir
        });

        // Kelompokkan siswa berdasarkan jurusan
        const studentsByMajor = {};
        studentsInLast3Years.forEach((student) => {
          const majorId = student.major_id; // Pastikan ini adalah properti yang benar
          if (!studentsByMajor[majorId]) {
            studentsByMajor[majorId] = [];
          }
          studentsByMajor[majorId].push(student);
        });

        // Hitung jumlah siswa per jurusan
        const studentsCountByMajor = [];
        for (const majorId in studentsByMajor) {
          const majorName = majors.find(
            (major) => major.id == majorId
          )?.name;
          const studentsCount = studentsByMajor[majorId].length;
          studentsCountByMajor.push({
            majorId,
            majorName,
            studentsCount,
          });
        }

        // Simpan data ke sessionStorage
        sessionStorage.setItem(
          'studentsCountByMajor',
          JSON.stringify(studentsCountByMajor)
        );

        sessionStorage.setItem('seriesData', JSON.stringify(seriesData));
      }
    );
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
    const existingRow = this.gridOptions.rowData.find(
      (row) => row.id === idToFind
    );

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
      nis: item.nis,
      name: item.name,
      address: item.address,
      photo: item.photo,
      entry_on_date: item.entry_on_date,
      graduate_on_date: item.graduate_on_date,
      created_date: item.created_date,
      updated_date: item.updated_date,
      status: item.status,
      graduated: item.graduated,
      note: item.note,
      major_name:
        this.majors.find((major) => major.value === item.major_id)?.content ||
        '',
      class_of: item.entry_on_date ? item.entry_on_date.split('-')[0] : '',
      major_id: item.major_id,
      // Tambahkan properti lain sesuai dengan struktur data Anda
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

    this.dialogRef = this.dialog.open(StudentFormComponent, config);

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

    this.dialogUploadRef = this.dialog.open(StudentFormUploadComponent, config);
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
