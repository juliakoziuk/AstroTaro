import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Booking, Hall, NewBooking } from './models';

const API = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class StudioService {
  private readonly http = inject(HttpClient);

  getHalls(): Observable<Hall[]> {
    return this.http.get<Hall[]>(`${API}/halls`);
  }

  getHall(id: number): Observable<Hall> {
    return this.http.get<Hall>(`${API}/halls/${id}`);
  }

  getBookings(hallId: number, date: string): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${API}/bookings`, { params: { hallId, date } });
  }

  createBooking(booking: NewBooking): Observable<Booking> {
    return this.http.post<Booking>(`${API}/bookings`, { ...booking, status: 'pending' });
  }
}
