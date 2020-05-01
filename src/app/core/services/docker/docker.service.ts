import { Injectable } from "@angular/core";
import { ElectronService } from "../electron/electron.service";
import * as moment from "moment";

@Injectable({
  providedIn: "root",
})
export class DockerService {
  constructor(private electronService: ElectronService) {}

  buildSyncContainer(syncBranch: string) {
    const date = moment().format("YYYY.M.DD");
    const tag = `sync-${syncBranch}:${date}`;
    const url = `https://github.com/getfyre/fyre-sync.git#${syncBranch}`;
    const options = ["build", url, "--tag", tag];
    const dockerProcess = this.electronService.childProcess.spawn(
      "docker",
      options
    );

    dockerProcess.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    dockerProcess.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    dockerProcess.on("close", (code) => {
      console.log(`child process exited with code ${code}`);
    });
  }
}
