import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, empty } from 'rxjs';
import { catchError, map, expand, reduce, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class GithubService {
  token: string;
  options: object;

  constructor(private http: HttpClient) {
    if (!this.token) {
      this.token = localStorage.getItem('githubToken');
      this.options = {
        headers: new HttpHeaders({
          Authorization: `token ${this.token}`,
        }),
        observe: 'response',
      };
    }
  }

  authenticate(token: string): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        Authorization: `token ${token}`,
      }),
    };
    return this.http.get('https://api.github.com/repos/getfyre/fyre-sync', httpOptions).pipe(
      tap(() => {
        localStorage.setItem('githubToken', token);
        this.token = token;
        this.updateOptions();
        return true;
      }),
      catchError(this.handleError)
    );
  }

  getSyncBranches() {
    const url = 'https://api.github.com/repos/getfyre/fyre-sync/branches';
    return this.getBranches(url);
  }

  getQueueBranches() {
    const url = 'https://api.github.com/repos/getfyre/fyre-queue/branches';
    return this.getBranches(url);
  }

  getScraperBranches() {
    const url = 'https://api.github.com/repos/getfyre/fyre-sync-scraper/branches';
    return this.getBranches(url);
  }
  getAdminToolsBranches() {
    const url = 'https://api.github.com/repos/getfyre/fyre-admin-tools/branches';
    return this.getBranches(url);
  }

  getBranches(url: string) {
    return this.http.get(url, this.options).pipe(
      expand((response) => {
        if (this.isLastPage(response)) {
          return empty();
        }
        const Link = this.parse_link_header(response['headers'].get('link'));
        return this.getNextPage(Link['next']);
      }),
      map((res) => res['body']),
      reduce((acc, val) => acc.concat(val), new Array<object>())
    );
  }

  private getNextPage(url: string) {
    return this.http.get(url, this.options);
  }

  private isLastPage(response) {
    const Link = this.parse_link_header(response.headers.get('link'));
    return Link ? !Link['next'] && !Link['last'] : true;
  }

  parse_link_header(header: string) {
    if (!header || header.length == 0) {
      return;
    }

    let parts = header.split(',');
    const links = {};
    parts.forEach((p) => {
      let section = p.split(';');
      const url = section[0].replace(/<(.*)>/, '$1').trim();
      const name = section[1].replace(/rel="(.*)"/, '$1').trim();
      links[name] = url;
    });
    return links;
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(`Backend returned code ${error.status}, ` + `body was: ${error.error}`);
    }
    // return an observable with a user-facing error message
    return throwError('Something bad happened; please try again later.');
  }

  private updateOptions() {
    this.options = {
      headers: new HttpHeaders({
        Authorization: `token ${this.token}`,
      }),
      observe: 'response',
    };
  }
}
