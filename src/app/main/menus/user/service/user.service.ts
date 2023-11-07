
import {Injectable} from '@angular/core'
import {MatDialog, MatDialogConfig, MatDialogRef} from '@angular/material/dialog'
import {UserFormComponent} from "../user-form/user-form.component"

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private dialogRef: MatDialogRef<UserFormComponent>

  constructor(private dialog: MatDialog,) {
  }

  open(params) {
    this.dialogRef = null
    let config = new MatDialogConfig()

    config.viewContainerRef = null
    config.disableClose = true
    config.role = 'alertdialog'
    config.width = '800px'

    config.data = {
      ...params
    }

    this.dialogRef = this.dialog.open(UserFormComponent, config)
    return this.dialogRef
  }
}
