import { Injectable } from '@angular/core';
import { ElectronService } from '../electron/electron.service';
import { DockerArgs } from '../../../interface/dockerArgs';
import * as moment from 'moment';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DockerService {
  imageStatus = {
    sync: new Subject<string>(),
    scraper: new Subject<string>(),
    queue: new Subject<string>(),
  };

  buildingImages = new Subject<boolean>();
  constructor(private electronService: ElectronService) {}

  readonly spawnOptions = {
    encoding: 'utf8',
  };

  public async createContainers(repos: object) {
    this.buildingImages.next(true);
    // stop all sync containers that are running
    await this.stopRunningContainers();
    // remove all sync containers
    await this.removeContainers();
    // remove all sync images
    await this.removeImages();
    // build sync images
    await this.buildImages(repos);

    this.buildingImages.next(false);

    // run sync images
  }

  public async saveBranchesToFile(repos) {
    //create string for environment variables

    const githubToken = `GITHUB_TOKEN=${localStorage.getItem('githubToken')}`;
    const syncBranch = `SYNC_BRANCH=${repos['sync'].name}`;
    const queueBranch = `QUEUE_BRANCH=${repos['queue'].name}`;
    const scraperBranch = `SCRAPER_BRANCH=${repos['scraper'].name}`;

    const fileData = githubToken + '\r\n' + syncBranch + '\r\n' + queueBranch + '\r\n' + scraperBranch;
    const fsPromise = this.electronService.fs.promises;

    try {
      await fsPromise.mkdir('./environments');
      console.log('directory created');
    } catch (error) {}
    //save to file
    try {
      await fsPromise.writeFile('./.env', fileData);
      console.log('file is written');
    } catch (err) {
      console.log(err);
      alert(err);
    }
    //run docker-compose up
    const dockerProcess = this.electronService.childProcess.spawn('Powershell.exe', ['docker-compose up']);
    console.log('yoo');

    dockerProcess.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    dockerProcess.stderr.on('data', (data) => {
      console.warn(`stderr: ${data}`);
    });
    // add function to run docker-compose-down
  }

  private async stopRunningContainers() {
    return new Promise((resolve, reject) => {
      console.log('-----------Stopping Running Containers Start --------------');

      const dockerProcess = this.electronService.childProcess.spawn('Powershell.exe', [
        'docker container stop $(docker container ls --all --format "{{.Names}}" -f "name=sync" --filter "status=running")',
      ]);

      dockerProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
        console.log('-----------Stopping Running Containers Done --------------');
        resolve();
      });

      dockerProcess.stderr.on('data', (data) => {
        console.warn(`stderr: ${data}`);
        console.log('-----------Stopping Running Containers Done --------------');
        resolve();
      });
    });
  }

  private async removeContainers() {
    return new Promise((resolve, reject) => {
      console.log('-----------Remove Containers  --------------');

      const dockerProcess = this.electronService.childProcess.spawn('Powershell.exe', [
        'docker container rm $(docker container ls -a --format "{{.Names}}" -f "name=sync")',
      ]);

      dockerProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
        console.log('-----------Remove Containers Done--------------');
        resolve();
      });

      dockerProcess.stderr.on('data', (data) => {
        console.warn(`stderr: ${data}`);
        console.log('-----------Remove Containers Done--------------');
        resolve();
      });
    });
  }

  private async removeImages() {
    return new Promise((resolve, reject) => {
      console.log('-----------Remove Images--------------');
      const dockerProcess = this.electronService.childProcess.spawn('Powershell.exe', ['docker image rm -f $(docker images -aq -f "reference=sync*")']);

      dockerProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
        console.log('-----------Remove Images Done--------------');
        resolve();
      });

      dockerProcess.stderr.on('data', (data) => {
        console.warn(`stderr: ${data}`);
        console.log('-----------Remove Images Done--------------');
        resolve();
      });
    });
  }

  private async buildImages(repos) {
    return new Promise(async (resolve, reject) => {
      const elements = Object.keys(repos);
      for (const element of elements) {
        await this.buildSyncImage(repos[element]);
      }
      resolve();
    });
  }

  buildSyncImage(branchMeta: object) {
    return new Promise((resolve, reject) => {
      const repoName = this.getRepoName(branchMeta['commit'].url).split('-');
      console.log(`--------------Building ${repoName} Image ------------`);

      const dockerOptions = this.getBuildArgs(branchMeta);
      const dockerProcess = this.electronService.childProcess.spawn('docker', dockerOptions);

      dockerProcess.stdout.on('data', (data) => {
        const status = `stdout: ${data}`;
        this.imageStatus[repoName[repoName.length - 1]].next(status);
        console.log(status);
        console.log(`--------------Building ${repoName} Image Done------------`);
        resolve();
      });

      dockerProcess.stderr.on('data', (data) => {
        console.warn(`stderr: ${data}`);
        const status = `stderr: ${data}`;
        this.imageStatus[repoName[repoName.length - 1]].next(status);
        console.log(status);
        console.log(`--------------Building ${repoName} Image Done------------`);
        resolve();
      });
    });
  }

  private getBuildArgs(branch: object) {
    const date = moment().format('YYYY.M.DD');
    const repo = this.getRepoName(branch['commit'].url);
    const tag = `sync-${repo}:${date}`;
    const url = `https://github.com/getfyre/${repo}.git#${branch['name']}`;
    return ['build', url, '--tag', tag];
  }

  private getRepoName(url: string): string {
    return /getfyre\/(.*?)\//.exec(url)[1];
  }

  private runContainers(args: DockerArgs) {
    const dockerOptions = this.getRunArgs(args);
    const dockerProcess = this.electronService.childProcess.spawnSync('docker run --name sync-test sync-test:1', dockerOptions, {
      encoding: 'utf8',
    });
  }

  private getRunArgs(dockerArgs: DockerArgs): Array<string> {
    const args = [];
    dockerArgs.env.forEach((value) => {
      args.push('-e', value);
    });
    dockerArgs.port.forEach((port) => {
      args.push('-p', port);
    });
    return args;
  }
}
