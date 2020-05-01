import { Component, OnInit } from "@angular/core";
import { GithubService } from "../github.service";
import { NgbTypeahead } from "@ng-bootstrap/ng-bootstrap";
import { Subject, merge, forkJoin, fromEvent, of } from "rxjs";
import { DockerService } from "../core/services/docker/docker.service";
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
} from "rxjs/operators";
import { NgForm } from "@angular/forms";

@Component({
  selector: "app-detail",
  templateUrl: "./detail.component.html",
  styleUrls: ["./detail.component.scss"],
})
export class DetailComponent implements OnInit {
  model: any;
  model2: any;
  response: any;

  index = 0;
  focus$ = new Subject<string>();
  click$ = new Subject<string>();
  branches: { sync: object[]; queue: object[]; scraper: object[] };

  constructor(
    private githubService: GithubService,
    private dockerService: DockerService
  ) {}

  ngOnInit(): void {
    forkJoin({
      sync: this.githubService.getSyncBranches(),
      queue: this.githubService.getQueueBranches(),
      scraper: this.githubService.getScraperBranches(),
    }).subscribe((val) => {
      console.log(val);

      this.branches = val;
      console.log("done");
    });
  }

  getSyncBranches() {
    console.log(this.model.name);
    this.dockerService.buildSyncContainer(this.model.name);
  }

  search = (instance: NgbTypeahead, element: HTMLInputElement, key) => (
    text$
  ) => {
    console.log(element);
    const debouncedText$ = text$.pipe(
      debounceTime(200),
      distinctUntilChanged()
    );
    const clickEvent$ = fromEvent(element, "click").pipe(
      map((event) => (<HTMLInputElement>event.target).value)
    );
    const focusEvent$ = fromEvent(element, "focus").pipe(
      map((event) => (<HTMLInputElement>event.target).value)
    );
    const clicksWithClosedPopup$ = clickEvent$.pipe(
      filter(() => !instance.isPopupOpen())
    );

    const inputFocus$ = focusEvent$;

    return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
      map((term: string) =>
        (term === ""
          ? this.branches[key]
          : this.branches[key].filter(
              (v) => v.name.toLowerCase().indexOf(term.toLowerCase()) > -1
            )
        ).slice(0, 10)
      )
    );
  };

  formatter = (x: { name: string }) => x.name;
  // Preserve original property order
  originalOrder = () => {};
  onSubmit(f: NgForm) {
    console.log(f.value); // { first: '', last: '' }
    // console.log(f.valid); // false
  }
}
