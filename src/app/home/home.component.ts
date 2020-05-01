import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { GithubService } from "../github.service";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnInit {
  formToken: any;
  loading = false;
  constructor(private router: Router, private githubService: GithubService) {
    console.log(localStorage.getItem("githubToken"));

    this.formToken = localStorage.getItem("githubToken") || "";
  }

  ngOnInit(): void {
    let githubToken = "";
    if (this.formToken) {
      console.log("Token exist in storage " + this.formToken);
      this.githubService.authenticate(this.formToken).subscribe((response) => {
        this.router.navigate(["/detail"]);
      });
    }
  }

  onSubmit() {
    this.loading = true;
    console.log(this.formToken);
    this.githubService.authenticate(this.formToken).subscribe(
      (data) => {
        if (data) {
          this.router.navigate(["/detail"]);
        }
      },
      (err) => {
        this.loading = false;
        console.log("HTTP Error", err);
      },
      () => {
        this.loading = false;
        console.log("done");
      }
    );
  }
}
