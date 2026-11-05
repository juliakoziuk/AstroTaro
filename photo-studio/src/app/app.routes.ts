import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Зали',
    loadComponent: () => import('./features/halls/halls-page').then((m) => m.HallsPage),
  },
  {
    path: 'booking/:hallId',
    title: 'Бронювання',
    loadComponent: () => import('./features/booking/booking-page').then((m) => m.BookingPage),
  },
  {
    path: 'admin',
    title: 'Адмінка',
    loadComponent: () => import('./features/admin/admin-page').then((m) => m.AdminPage),
  },
  { path: '**', redirectTo: '' },
];
