import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { GithubService } from '../github.service';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { Subject, merge, forkJoin, fromEvent, of, BehaviorSubject } from 'rxjs';
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
  dockerOutput = '';
  buildingImages = false;
  branches: { sync: object[]; queue: object[]; scraper: object[]; adminTools: object[]; submittals: object[] };
  testEmitter$ = new BehaviorSubject<string>(this.dockerOutput);

  constructor(
    private githubService: GithubService,
    private dockerService: DockerService,
    private electronService: ElectronService,
    private ref: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    forkJoin({
      sync: this.githubService.getSyncBranches(),
      queue: this.githubService.getQueueBranches(),
      scraper: this.githubService.getScraperBranches(),
      adminTools: this.githubService.getAdminToolsBranches(),
      submittals: this.githubService.getSubmittalsBranches(),
    }).subscribe((val) => {
      this.branches = val;
    });

    this.dockerService.containerOutput.subscribe((value) => {
      console.log('im here');

      this.dockerOutput += value + '\r\n';
      this.ref.detectChanges();
    });
  }

  getStatus(imageStatus) {
    return imageStatus.join('\r\n');
  }

  private stopApplications() {
    this.dockerService.stopAllApplications();
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
  async onSubmit(form: NgForm) {
    console.log(form.value);

    if (!this.objectIsEmpty(form.value)) {
      this.buildingImages = true;
      try {
        await this.dockerService.saveBranchesToFile(form.value);
        await this.dockerService.buildImages();
        await this.dockerService.runDockerCompose();
      } catch (err) {
        alert(err);
      } finally {
        this.buildingImages = false;
      }
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
