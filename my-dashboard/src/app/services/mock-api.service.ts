import { Inject, Injectable, InjectionToken } from '@angular/core';
import { Observable, of, throwError, delay, switchMap } from 'rxjs';

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

@Injectable({ providedIn: 'root' })
export class MockApiService {
    constructor(@Inject(MOCK_API_OPTIONS) private options: MockApiOptions) {}

    getPerformance(month: MonthKey): Observable<PerformanceResponse> {
        let waitTime = this.options.getDelayMs(month);
        let fail = this.options.shouldFail(month);

        return of(month).pipe(
            delay(waitTime),
            switchMap((m) => {
                if (fail) {
                    return throwError(() => new Error('Could not load performance data. Please try again.'));
                }
                let data: PerformanceResponse;
                if (m == '2026-09') {
                    data = september as any;
                } else {
                    data = october as any;
                }
                return of(structuredClone(data));
            }),
        );
    }
}
