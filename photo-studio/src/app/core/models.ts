export interface Hall {
  id: number;
  name: string;
  description: string;
  pricePerHour: number;
  capacity: number;
  area: number;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Booking {
  id: number;
  hallId: number;
  /** YYYY-MM-DD */
  date: string;
  /** Початок оренди, година 0–23 */
  startHour: number;
  hours: number;
  clientName: string;
  phone: string;
  status: BookingStatus;
}

export type NewBooking = Omit<Booking, 'id' | 'status'>;
