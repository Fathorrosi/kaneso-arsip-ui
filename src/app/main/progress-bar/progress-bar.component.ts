import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.scss']
})
export class ProgressBarComponent implements OnInit {
  @Input() animationDuration: number = 2; 
  progressText: string = 'Uploading';
  uploadInProgress: boolean = false;
  uploadCompleted: boolean = false;

  startAnimation() {
    if (!isNaN(this.animationDuration)) {
      this.uploadInProgress = true;
      this.progressText = 'Uploading';
      const progressBar = document.querySelector('.progress-bar') as HTMLElement;
      progressBar.style.animation = `fill ${this.animationDuration}s ease-in-out forwards`;
    } else {
      alert('Please enter a valid duration (in seconds).');
    }
  }

  animationEnded() {
    console.log('Animation ended');
    this.progressText = 'Selesai';
    this.uploadCompleted = true;
  }

  ngOnInit() {
  }
}
