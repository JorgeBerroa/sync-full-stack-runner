import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GithubService } from '../github.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  formToken: any;
  tokenValid: boolean;
  loading = false;
  constructor(private router: Router, private githubService: GithubService) {
    console.log(localStorage.getItem('githubToken'));
    this.formToken = localStorage.getItem('githubToken') || '';
  }

  ngOnInit(): void {
    if (this.formToken) {
      console.log('Token exist in storage ' + this.formToken);
      this.tokenValid = true;
    }
  }

  onSubmit() {
    this.loading = true;
    console.log(this.formToken);
    this.githubService.authenticate(this.formToken).subscribe(
      (data) => {
        if (data) {
          this.tokenValid = true;
          localStorage.setItem('githubToken', this.formToken);
          this.router.navigate(['/detail']);
        }
      },
      (err) => {
        this.loading = false;
        this.tokenValid = false;
        console.log('HTTP Error', err);
      },
      () => {
        this.loading = false;
        console.log('done');
      }
    );
  }

  removeToken() {
    localStorage.removeItem('githubToken');
    this.formToken = '';
    this.tokenValid = false;
  }
}
