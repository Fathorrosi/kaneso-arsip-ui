import { Component, OnInit } from '@angular/core';
import { TokenStorageService } from 'src/app/_services/token-storage.service';
import { NotificationService } from '../../notification/notification.service';
import { InfiniteRowModelModule } from '@ag-grid-community/infinite-row-model';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { HttpClient } from '@angular/common/http';
import {
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/_services/auth.service';
import { ColDef, GridOptions } from '@ag-grid-community/core';
import { environment } from 'src/environments/environment';
import { ConfirmDeleteComponent } from '../../confirmation/confirm-delete/confirm-delete.component';
import { MajorFormComponent } from './major-form/major-form.component';
import { forkJoin } from 'rxjs';

const createRowHelper = (id, name) => {
  // Buat objek baris sesuai dengan kebutuhan Anda
  return {
    id: id,
    name: name,
  };
};

@Component({
  selector: 'app-major',
  templateUrl: './major.component.html',
  styleUrls: ['./major.component.scss'],
})
export class MajorComponent implements OnInit {
  public loading: boolean = false;
  public gridOptions: GridOptions = {};
  public selectedRows = [];
  public modules = [InfiniteRowModelModule, ClientSideRowModelModule];

  private filterParams: { type: string; value: any }[] = [];
  private dialogRefConfirm: MatDialogRef<ConfirmDeleteComponent>;
  private dialogRef: MatDialogRef<MajorFormComponent>;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
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
        headerName: 'Id',
        field: 'id',
        cellClass: 'cell-flex-middle overflow-hidden font-bold',
        // cellRenderer: companyCellRenderer,
        pinned: true,
        checkboxSelection: true,
        headerCheckboxSelection: true,
        editable: false,
        width: 15,
      },
      {
        headerName: 'Nama Jurusan',
        field: 'name',
        headerClass: 'cell-flex-center',
        cellClass: 'cell-flex-middle cell-flex-center',
      },
    ];

    const headers = this.authService.getHeader();
    this.http
      .get(environment.apiUrl + '/majors', { headers })
      .subscribe((response: any) => {
        const rowData = response.map((row) =>
          createRowHelper(row.id, row.name)
        );
        this.gridOptions = {
          columnDefs: columnDefs,
          rowData: rowData,
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

  onSelectionChanged() {
  if (this.gridOptions.api) {
    this.selectedRows = this.gridOptions.api.getSelectedRows();
  }
}


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
        if (param.value === null) {
          return true;
        } else {
          if (param.type === 'search') {
            const nameMatch = item.name
              .toLowerCase()
              .includes(param.value.toLowerCase());
            return nameMatch;
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

    this.dialogRef = this.dialog.open(MajorFormComponent, config);

    return this.dialogRef;
  }

  deleteHandler(selectedRows: any) {
    this.openDialogConfirm(null);
    this.dialogRefConfirm.afterClosed().subscribe((result) => {
      if (result) {
        const headers = this.authService.getHeader();
        const deleteRequests = selectedRows.map((row) => {
          return this.http.delete(environment.apiUrl + '/majors/' + row.id, {
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
    this.openDialog(data)
      .afterClosed()
      .subscribe(() => {});

    this.loadData(this.dialogRef);
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
    const params = {
      method: 'create',
    };
    this.openDialog(params)
      .afterClosed()
      .subscribe(() => {});

    this.loadData(this.dialogRef);
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

  createRowData(item) {
    return {
      id: item.id,
      name: item.name,
    };
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
}
