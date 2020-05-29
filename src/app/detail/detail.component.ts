import { Component, OnInit } from '@angular/core';
import { GithubService } from '../github.service';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { Subject, merge, forkJoin, fromEvent, of } from 'rxjs';
import { DockerService } from '../core/services/docker/docker.service';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { NgForm } from '@angular/forms';
import { ElectronService } from '../core/services';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
})
export class DetailComponent implements OnInit {
  model: any;
  syncStatus = [];
  queueStatus = [];
  scraperStatus = [];
  buildingImages = false;
  focus$ = new Subject<string>();
  click$ = new Subject<string>();
  branches: { sync: object[]; queue: object[]; scraper: object[] };

  constructor(private githubService: GithubService, private dockerService: DockerService, private electronService: ElectronService) {}

  ngOnInit(): void {
    forkJoin({
      sync: this.githubService.getSyncBranches(),
      queue: this.githubService.getQueueBranches(),
      scraper: this.githubService.getScraperBranches(),
    }).subscribe((val) => {
      this.branches = val;
    });

    this.dockerService.imageStatus.sync.subscribe((value) => this.syncStatus.push(value));
    this.dockerService.imageStatus.queue.subscribe((value) => this.queueStatus.push(value));
    this.dockerService.imageStatus.scraper.subscribe((value) => this.scraperStatus.push(value));
    this.dockerService.buildingImages.subscribe((value) => (this.buildingImages = value));
  }

  getStatus(imageStatus) {
    return imageStatus.join('\r\n');
  }

  search = (instance: NgbTypeahead, element: HTMLInputElement, key) => (text$) => {
    const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
    const clickEvent$ = fromEvent(element, 'click').pipe(map((event) => (<HTMLInputElement>event.target).value));
    const focusEvent$ = fromEvent(element, 'focus').pipe(map((event) => (<HTMLInputElement>event.target).value));
    const clicksWithClosedPopup$ = clickEvent$.pipe(filter(() => !instance.isPopupOpen()));

    const inputFocus$ = focusEvent$;

    return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
      map((term: string) =>
        (term === '' ? this.branches[key] : this.branches[key].filter((v) => v.name.toLowerCase().indexOf(term.toLowerCase()) > -1)).slice(0, 10)
      )
    );
  };

  formatter = (x: { name: string }) => x.name;
  // Preserve original property order
  originalOrder = () => {};
  async onSubmit(f: NgForm) {
    console.log(f.value);

    if (!this.objectIsEmpty(f.value)) {
      this.buildingImages = true;
      await this.dockerService.saveBranchesToFile(f.value);
      this.buildingImages = false;
    }
  }

  private objectIsEmpty(obj) {
    let empty = false;
    Object.keys(obj).forEach((val) => {
      if (typeof obj[val] !== 'object') {
        empty = true;
      }
    });
    return empty;
  }
}
