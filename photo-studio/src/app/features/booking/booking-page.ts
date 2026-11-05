import { Component, input } from '@angular/core';

@Component({
  selector: 'app-booking-page',
  template: `
    <h1>Бронювання залу #{{ hallId() }}</h1>
    <p>TODO (етап 2): форма вибору дати та часу, перевірка вільних слотів.</p>
  `,
})
export class BookingPage {
  // :hallId з URL приходить сюди завдяки withComponentInputBinding()
  readonly hallId = input.required<string>();
}
