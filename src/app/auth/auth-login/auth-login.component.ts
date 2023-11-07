import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../_services/auth.service';
import { TokenStorageService } from '../../_services/token-storage.service';
import { environment } from 'src/environments/environment';

import { NotificationService } from '../../main/notification/notification.service';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
@Component({
  selector: 'app-auth-login',
  templateUrl: './auth-login.component.html',
  styleUrls: ['./auth-login.component.scss'],
})
export class AuthLoginComponent implements OnInit {
  public formGroup: FormGroup;
  isLoggedIn = false;
  isLoginFailed = false;
  errorMessage = '';
  students = [];
  majors = [];

  constructor(
    protected formBuilder: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private tokenStorage: TokenStorageService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    if (this.tokenStorage.getToken()) {
      console.log('Token akses ditemukan.');
      this.router.navigate(['/app/dashboard/default/']);
    }

    this.formGroup = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }
  getDataSekolah() {
    const headers = this.authService.getHeader();

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
            this.students.push(element);
          }
        }

        console.log(this.students, typeof this.students);
        // this.students = studentsResponse;

        // Langkah 1: Membuat array tahun unik dari entry_on_date di students
        const uniqueYears = [
          ...new Set(
            this.students.map((student) =>
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
            this.majors.push(element);
          }
        }

        // Langkah 2 dan 4: Menghasilkan data series berdasarkan tahun dan majors_id
        const seriesData = this.majors.map((major) => {
          const dataForMajor = uniqueYears.map((year) => {
            const studentsInMajorForYear = this.students.filter((student) => {
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
        const studentsInLast3Years = this.students.filter((student) => {
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
          const majorName = this.majors.find(
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

        // Akhirnya, navigasi ke dashboard setelah semua proses selesai
        this.router.navigate(['/app/dashboard']);
      }
    );
  }

  onSubmit() {
    this.formGroup.markAllAsTouched();

    const email = this.formGroup.get('email').value;
    const password = this.formGroup.get('password').value;

    if (this.formGroup.valid) {
      this.authService.login(email, password).subscribe(
        (data) => {
          this.tokenStorage.saveToken(data.access_token);
          this.tokenStorage.saveUser(data.user);

          this.notificationService.showSuccess(
            'Welcome ' + data.user.name + '!',
            'Login Success'
          );

          this.isLoginFailed = false;
          this.isLoggedIn = true;
          // this.roles = this.tokenStorage.getUser().roles;

          this.getDataSekolah();

          // setTimeout(() => {
          //   this.router.navigate(['/app/dashboard']);
          // }, 3000);
        },
        (err) => {
          this.errorMessage = err.error.message;
          this.isLoginFailed = true;
          this.notificationService.showError(this.errorMessage, 'Login Failed');
        }
      );
    }
  }

  isValid(name) {
    const instance = this.formGroup.get(name);
    return instance.invalid && (instance.dirty || instance.touched);
  }

  reloadPage(): void {
    window.location.reload();
  }
}
