import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { StudioService } from '../../core/studio.service';

@Component({
  selector: 'app-halls-page',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './halls-page.html',
  styleUrl: './halls-page.scss',
})
export class HallsPage {
  private readonly studio = inject(StudioService);

  // Observable -> signal. До відповіді сервера значення undefined.
  protected readonly halls = toSignal(this.studio.getHalls());
}
