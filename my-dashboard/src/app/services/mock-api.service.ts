import { Injectable, InjectionToken, inject } from '@angular/core';
import { Observable, map, of, throwError, delay, switchMap } from 'rxjs';

import { MonthKey, PerformanceResponse } from '../models/dashboard.models';
import september from '../data/mock-performance-2026-09.json';
import october from '../data/mock-performance-2026-10.json';


export interface MockApiOptions {

    getDelayMs: (month: MonthKey) => number;

    shouldFail: (month: MonthKey) => boolean;
}


export const DEFAULT_MOCK_API_OPTIONS: MockApiOptions = {
    getDelayMs: () => 300 + Math.floor(Math.random() * 2701),
    shouldFail: () => Math.random() < 0.1,
};

export const MOCK_API_OPTIONS = new InjectionToken<MockApiOptions>('MOCK_API_OPTIONS', {
    factory: () => DEFAULT_MOCK_API_OPTIONS,
});

const RESPONSES: Record<MonthKey, PerformanceResponse> = {
    '2026-09': september as unknown as PerformanceResponse,
    '2026-10': october as unknown as PerformanceResponse,
};


@Injectable({ providedIn: 'root' })
export class MockApiService {
    private readonly options = inject(MOCK_API_OPTIONS);

    getPerformance(month: MonthKey): Observable<PerformanceResponse> {
        const waitMs = this.options.getDelayMs(month);
        const fail = this.options.shouldFail(month);

        return of(month).pipe(
            delay(waitMs),
            switchMap((m) =>
                fail
                    ? throwError(() => new Error('Could not load performance data. Please try again.'))
                    : of(RESPONSES[m]),
            ),

            map((response) => structuredClone(response)),
        );
    }
}