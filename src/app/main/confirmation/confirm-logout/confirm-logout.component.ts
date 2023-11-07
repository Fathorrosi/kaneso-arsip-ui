import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UserFormComponent } from '../../menus/user/user-form/user-form.component';

@Component({
  selector: 'app-confirm-logout',
  templateUrl: './confirm-logout.component.html',
  styleUrls: ['./confirm-logout.component.scss']
})
export class ConfirmLogoutComponent implements OnInit {
  

  constructor(
    private dialogRef: MatDialogRef<UserFormComponent>,
  ) { }

  ngOnInit(): void {
  }

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(true);
  }


}
