import { Component, OnInit } from '@angular/core';
import { ColDef, GridOptions } from '@ag-grid-community/core';
import { InfiniteRowModelModule } from '@ag-grid-community/infinite-row-model';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'src/app/_services/auth.service';
import { environment } from 'src/environments/environment';
import { UserService } from './service/user.service';
import {
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
} from '@angular/material/dialog';
import { UserFormComponent } from './user-form/user-form.component';
import { TokenStorageService } from 'src/app/_services/token-storage.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../notification/notification.service';
import { ConfirmDeleteComponent } from '../../confirmation/confirm-delete/confirm-delete.component';

const createRowHelper = (id, firstName, lastName, email, roleName, status) => {
  // Buat objek baris sesuai dengan kebutuhan Anda
  return {
    id: id,
    first_name: firstName,
    last_name: lastName,
    email: email,
    role_name: roleName,
    full_name: firstName + ' ' + lastName,
    status,
  };
};


@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
})
export class UserComponent implements OnInit {
  public model = null;
  public searchModel;
  public size = 'md';
  public offset = { x: -9, y: 0 };
  public batchText = '';
  public selectedRows = [];
  public dataTable = [];
  private dialogRef: MatDialogRef<UserFormComponent>;
  private dialogRefConfirm: MatDialogRef<ConfirmDeleteComponent>;

  cancelMethod() {}

  public modules = [InfiniteRowModelModule, ClientSideRowModelModule];
  public gridOptions: GridOptions = {};
  public loading: boolean = false;
  public defaultColDef = {};

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private userService: UserService,
    private dialog: MatDialog,
    private router: Router,
    private tokenStorage: TokenStorageService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
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

  createTable() {
    this.loading = true;
    const columnDefs: Array<ColDef> = [
      {
        headerName: 'Nama',
        field: 'full_name',
        cellClass: 'cell-flex-middle overflow-hidden font-bold',
        // cellRenderer: companyCellRenderer,
        pinned: true,
        checkboxSelection: true,
        headerCheckboxSelection: true,
      },
      {
        headerName: 'Email',
        field: 'email',
        headerClass: 'cell-flex-center',
        cellClass: 'cell-flex-middle cell-flex-center',
      },
      {
        headerName: 'Role',
        field: 'role_name',
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
        // cellRenderer: numberCellRenderer,
      },
    ];

    const headers = this.authService.getHeader();
    this.http
      .get(environment.apiUrl + '/users', { headers })
      .subscribe((response: any) => {
        if (response.length > 0) {
          const rowData = response.map((row) =>
            createRowHelper(
              row.id,
              row.first_name,
              row.last_name,
              row.email,
              row.role_name,
              row.status
            )
          );
          this.gridOptions = {
            columnDefs: columnDefs,
            rowData: rowData,
            rowHeight: 40,
            headerHeight: 40,
            rowSelection: 'multiple',
            defaultColDef: {
              editable: false,
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
        }
      });
  }

  onSelectionChanged(event: any) {
    // this.dataTable = this.gridOptions.rowData
    this.selectedRows = this.gridOptions.api.getSelectedRows();
    // search data from gridOptions with selectedRows and update searchModel
  }

  onSearchChange(searchValue: string) {
    console.log(this.gridOptions.rowData.length);
    if (searchValue) {
      const filteredData = this.gridOptions.rowData.filter((item) => {
        return item.full_name.toLowerCase().includes(searchValue.toLowerCase());
      });
      this.gridOptions.api.setRowData(filteredData);
    } else {
      this.gridOptions.api.setRowData(this.gridOptions.rowData);
    }
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
        selectedRows.forEach((row) => {
          this.http
            .delete(environment.apiUrl + '/users/' + row.id, {
              headers,
            })
            .subscribe((response: any) => {
              this.createTable();
            });
        });
        this.notificationService.showSuccess(
          'Data berhasil dihapus',
          'Success'
        );
      } 
    });
  }

  updateHandler(selectedRows: any) {
    let data = selectedRows[0];
    data.isUpdate = true;
    data.isDetail = false;
    this.openDialog(data)
      .afterClosed()
      .subscribe(() => {});

    this.loadData();
  }

  detailHandler(selectedRows: any) {
    let data = selectedRows[0];
    data.isDetail = true;
    data.isUpdate = false;
    this.openDialog(data)
      .afterClosed()
      .subscribe(() => {});
  }

  createHandler() {
    this.openDialog(null)
      .afterClosed()
      .subscribe(() => {});

    this.loadData();
  }

  loadData() {
    this.dialogRef.componentInstance.dataSaved.subscribe((newData) => {
      // Cari baris yang sesuai dengan data berdasarkan id
      const idToFind = newData.id;
      const rowIndex = this.gridOptions.api.getDisplayedRowCount(); // Jumlah baris yang ditampilkan dalam grid
      let found = false; // Flag untuk menandakan apakah baris yang sesuai ditemukan

      for (let i = 0; i < rowIndex; i++) {
        const rowNode = this.gridOptions.api.getDisplayedRowAtIndex(i);
        const rowData = rowNode.data;

        // Cek apakah id dalam rowData sesuai dengan id yang diterima
        if (rowData.id === idToFind) {
          // Update data di dalam rowData dengan data yang diterima
          rowData.full_name = newData.first_name + ' ' + newData.last_name;
          rowData.email = newData.email;
          rowData.role_name = newData.role_name;
          rowData.first_name = newData.first_name;
          rowData.last_name = newData.last_name;
          rowData.status = newData.status;

          // Buat transaksi untuk mengupdate baris
          const transaction = {
            update: [rowData], // Data yang akan diupdate
          };

          // Terapkan transaksi ke grid menggunakan applyTransaction
          this.gridOptions.api.applyTransaction(transaction);

          found = true; // Set flag menjadi true karena baris yang sesuai ditemukan
          break; // Keluar dari loop setelah menemukan baris yang sesuai
        }
      }

      // Jika tidak ada baris yang sesuai, tambahkan data baru ke grid
      if (!found) {
        const newRowData = {
          id: newData.id,
          full_name: newData.first_name + ' ' + newData.last_name,
          first_name: newData.first_name,
          last_name: newData.last_name,
          email: newData.email,
          role_name: newData.role_name,
          status: newData.status,
          // Tambahkan properti lain sesuai dengan struktur data Anda
        };

        // Buat transaksi untuk menambahkan baris baru
        const transaction = {
          add: [newRowData], // Data yang akan ditambahkan
        };

        // Terapkan transaksi ke grid menggunakan applyTransaction
        this.gridOptions.api.applyTransaction(transaction);
        this.gridOptions.rowData.push(newRowData);
      }
    });
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

    this.dialogRef = this.dialog.open(UserFormComponent, config);
    return this.dialogRef;
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
