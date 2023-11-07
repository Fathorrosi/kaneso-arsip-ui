import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AuthService } from 'src/app/_services/auth.service';
import { Router } from '@angular/router';
import { TokenStorageService } from 'src/app/_services/token-storage.service';
import {
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
} from '@angular/material/dialog';
import { ConfirmLogoutComponent } from 'src/app/main/confirmation/confirm-logout/confirm-logout.component';
import { NotificationService } from 'src/app/main/notification/notification.service';

@Component({
  selector: 'app-layout-mini-sidebar',
  templateUrl: './layout-mini-sidebar.component.html',
  styleUrls: ['./layout-mini-sidebar.component.scss'],
})
export class LayoutMiniSidebarComponent implements OnInit {
  public username: string;
  private dialogLogout: MatDialogRef<ConfirmLogoutComponent>;

  @Output() itemClick: EventEmitter<any> = new EventEmitter();

  public notifications = [
    {
      level: 'bug',
      text: 'Failed to get shared datastores in kubernetes cluster',
      date: '20m',
    },
    {
      level: 'bug',
      text: 'Update storage nodeAffinity check to use node object ',
      date: '3h',
    },
    {
      level: 'feature',
      text: 'Ability to provide OIDC authentication token to kubectl without leaking the token to the process table ',
      date: '5h',
    },
    {
      level: 'accept',
      text: 'vSphere does not detaches volumes from a node if "VM not found" error',
      date: '12h',
    },
    {
      level: 'default',
      text: 'Kubectl wait for multiple conditions ',
      date: '12h',
    },
    {
      level: 'bug',
      text: 'apiserver bound to 0.0.0.0 fails when applying kernel parameter disable_ipv6 at runtime ',
      date: '3h',
    },
    {
      level: 'accept',
      text: 'Validation type error when creating / updating CRDs that use scale subresource',
      date: '12h',
    },
    {
      level: 'accept',
      text: 'Allow passing parameters as part of probe requests',
      date: '12h',
    },
  ];
  public messages = [
    {
      avatar: 'assets/img/avatar/avatar2.jpg',
      name: 'John Belinda',
      text: 'Cannot start service web: error while creating mount source path ',
      date: '5 mins ago',
      read: false,
    },
    {
      avatar: 'assets/img/avatar/avatar3.jpg',
      name: 'Reta Collen',
      text: 'Automate the update of compose spec from docker-compose ',
      date: '1 hour ago',
      read: false,
    },
    {
      avatar: 'assets/img/avatar/avatar6.jpg',
      name: 'Elizabeth Mozelle',
      text: 'Add an option to config: entries to name the config by content hash',
      date: '5 hours ago',
      read: true,
    },
    {
      avatar: 'assets/img/avatar/avatar7.jpg',
      name: 'Marys Rob',
      text: 'Breaking Changes: Internal/External Secrets and Name/Label Problems with External Secrets',
      date: '1 day ago',
      read: true,
    },
    {
      avatar: 'assets/img/avatar/avatar8.jpg',
      name: 'Adoree Morgan',
      text: 'cpus value type in output of config command is not consistent in version 1.27.3 ',
      date: '3 days ago',
      read: true,
    },
  ];

  public loading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private tokenStorage: TokenStorageService,
    private dialog: MatDialog,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.username = this.tokenStorage.getUser().name;
  }

  onItemClick(event) {
    this.itemClick.next(event);
  }

  onFakeLoading() {}

  onLogout() {
    this.openDialogConfirm(null);
    this.dialogLogout.afterClosed().subscribe((result) => {
      if (result) {
        this.authService.logout();
        this.loading = true;
        setTimeout(() => {
          this.loading = false;
          this.router.navigate(['/auth/signin']);
        }, 1000);
        this.notificationService.showSuccess('Anda berhasil logout', 'Success');
      }
    });
  }

  openDialogConfirm(params) {
    this.dialogLogout = null;
    let config = new MatDialogConfig();

    config.viewContainerRef = null;
    config.disableClose = true;
    config.role = 'alertdialog';
    config.width = '400px';

    config.data = {
      ...params,
    };

    this.dialogLogout = this.dialog.open(ConfirmLogoutComponent, config);
    return this.dialogLogout;
  }
}
