import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

    {

        path: 'dashboard',
        title: 'MTD Performance Dashboard',

        loadComponent: () =>
            import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    },
    { path: '**', redirectTo: 'dashboard' },
];