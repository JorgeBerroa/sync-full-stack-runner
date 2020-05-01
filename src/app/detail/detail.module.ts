import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { DetailRoutingModule } from "./detail-routing.module";

import { DetailComponent } from "./detail.component";
import { SharedModule } from "../shared/shared.module";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { FormsModule } from "@angular/forms";

@NgModule({
  declarations: [DetailComponent],
  imports: [
    CommonModule,
    SharedModule,
    DetailRoutingModule,
    NgbModule,
    FormsModule,
  ],
})
export class DetailModule {}
