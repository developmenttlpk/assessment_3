import { Injectable, inject } from '@angular/core';
import {
    BehaviorSubject,
    Observable,
    Subject,
    catchError,
    combineLatest,
    distinctUntilChanged,
    map,
    merge,
    of,
    shareReplay,
    startWith,
    switchMap,
    tap,
} from 'rxjs';

import {
    DashboardFilters,
    EngagementType,
    MonthKey,
    MONTHS,
    PerformanceResponse,
    RequestState,
    SummaryRow,
} from '../models/dashboard.models';
import { calculateDashboard, getCostCenterOptions } from '../utils/dashboard-calculations';
import { MockApiService } from './mock-api.service';

const STORAGE_KEY = 'mtd-dashboard-filters';

export interface DashboardViewModel {
    filters: DashboardFilters;
    request: RequestState;
    costCenterOptions: string[];
    selectedCostCenters: string[];
    dateRange: string | null;
    rows: SummaryRow[];
}

@Injectable({ providedIn: 'root' })
export class DashboardStateService {
    private readonly api = inject(MockApiService);

    private readonly cache = new Map<MonthKey, PerformanceResponse>();

    private readonly filters$ = new BehaviorSubject<DashboardFilters>(loadFilters());
    private readonly refresh$ = new Subject<void>();

    readonly request$: Observable<RequestState> = merge(
        this.filters$.pipe(
            map((filters) => filters.month),
            distinctUntilChanged(),
            map((month) => ({ month, forceReload: false })),
        ),
        this.refresh$.pipe(map(() => ({ month: this.filters$.value.month, forceReload: true }))),
    ).pipe(
        switchMap(({ month, forceReload }) => this.loadMonth(month, forceReload)),
        shareReplay({ bufferSize: 1, refCount: true }),
    );

    readonly viewModel$: Observable<DashboardViewModel> = combineLatest([
        this.filters$,
        this.request$,
    ]).pipe(
        map(([filters, request]) => {
            const details = request.response?.data.details ?? [];
            const costCenterOptions = getCostCenterOptions(details);
            return {
                filters,
                request,
                costCenterOptions,
                selectedCostCenters: filters.costCenters.filter((n) => costCenterOptions.includes(n)),
                dateRange: request.response?.data.report.date ?? null,
                rows: details.length
                    ? calculateDashboard(details, filters.costCenters, filters.engagementTypes)
                    : [],
            };
        }),
    );

    selectMonth(month: MonthKey): void {
        this.update({ month });
    }

    refresh(): void {
        this.refresh$.next();
    }

    selectAllCostCenters(): void {
        this.update({ costCenters: [] });
    }

    toggleCostCenter(name: string): void {
        const current = this.filters$.value.costCenters;
        const costCenters = current.includes(name)
            ? current.filter((n) => n !== name)
            : [...current, name];
        this.update({ costCenters });
    }

    toggleEngagementType(type: EngagementType): void {
        const current = this.filters$.value.engagementTypes;
        const engagementTypes = current.includes(type)
            ? current.filter((t) => t !== type)
            : [...current, type];
        this.update({ engagementTypes });
    }

    resetFilters(): void {
        this.update({ costCenters: [], engagementTypes: [] });
    }

    private update(change: Partial<DashboardFilters>): void {
        const next = { ...this.filters$.value, ...change };
        saveFilters(next);
        this.filters$.next(next);
    }

    private loadMonth(month: MonthKey, forceReload: boolean): Observable<RequestState> {
        const cached = this.cache.get(month) ?? null;

        if (cached && !forceReload) {
            return of({ month, status: 'success', response: cached, error: null });
        }

        return this.api.getPerformance(month).pipe(
            tap((response) => this.cache.set(month, response)),
            map((response): RequestState => ({ month, status: 'success', response, error: null })),
            
            catchError((err: unknown) =>
                of<RequestState>({
                    month,
                    status: 'error',
                    response: cached,
                    error: err instanceof Error ? err.message : 'Something went wrong.',
                }),
            ),
            startWith<RequestState>({ month, status: 'loading', response: cached, error: null }),
        );
    }
}


const DEFAULT_FILTERS: DashboardFilters = {
    month: '2026-10',
    costCenters: [],
    engagementTypes: [],
};


export function loadFilters(): DashboardFilters {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULT_FILTERS };
        const saved = JSON.parse(raw) as Partial<DashboardFilters>;

        const validMonth = MONTHS.some((m) => m.key === saved.month);
        return {
            month: validMonth ? (saved.month as MonthKey) : DEFAULT_FILTERS.month,
            costCenters: Array.isArray(saved.costCenters)
                ? saved.costCenters.filter((n) => typeof n === 'string')
                : [],
            engagementTypes: Array.isArray(saved.engagementTypes)
                ? saved.engagementTypes.filter((t) => t === 'Own' || t === 'Rented' || t === 'Hired')
                : [],
        };
    } catch {
        return { ...DEFAULT_FILTERS };
    }
}

function saveFilters(filters: DashboardFilters): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch {

    }
}