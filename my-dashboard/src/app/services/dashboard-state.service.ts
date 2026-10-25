import { Injectable } from '@angular/core';
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
    private cache = new Map<MonthKey, PerformanceResponse>();

    private filters$ = new BehaviorSubject<DashboardFilters>(loadFilters());
    private refresh$ = new Subject<void>();

    request$: Observable<RequestState>;
    viewModel$: Observable<DashboardViewModel>;

    constructor(private api: MockApiService) {
        let monthChanged$ = this.filters$.pipe(
            map((filters) => filters.month),
            distinctUntilChanged(),
            map((month) => {
                return { month: month, forceReload: false };
            }),
        );

        let refreshClicked$ = this.refresh$.pipe(
            map(() => {
                return { month: this.filters$.value.month, forceReload: true };
            }),
        );

        this.request$ = merge(monthChanged$, refreshClicked$).pipe(
            switchMap((x) => this.loadMonth(x.month, x.forceReload)),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        this.viewModel$ = combineLatest([this.filters$, this.request$]).pipe(
            map(([filters, request]) => this.buildViewModel(filters, request)),
        );
    }

    selectMonth(month: MonthKey) {
        this.updateFilters({ month: month });
    }

    refresh() {
        this.refresh$.next();
    }

    selectAllCostCenters() {
        this.updateFilters({ costCenters: [] });
    }

    toggleCostCenter(name: string) {
        let list = [...this.filters$.value.costCenters];
        let index = list.indexOf(name);
        if (index >= 0) {
            list.splice(index, 1);
        } else {
            list.push(name);
        }
        this.updateFilters({ costCenters: list });
    }

    toggleEngagementType(type: EngagementType) {
        let list = [...this.filters$.value.engagementTypes];
        let index = list.indexOf(type);
        if (index >= 0) {
            list.splice(index, 1);
        } else {
            list.push(type);
        }
        this.updateFilters({ engagementTypes: list });
    }

    resetFilters() {
        this.updateFilters({ costCenters: [], engagementTypes: [] });
    }

    private updateFilters(change: Partial<DashboardFilters>) {
        let newFilters = { ...this.filters$.value, ...change };
        saveFilters(newFilters);
        this.filters$.next(newFilters);
    }

    private buildViewModel(filters: DashboardFilters, request: RequestState): DashboardViewModel {
        let details = request.response ? request.response.data.details : [];
        let options = getCostCenterOptions(details);

        let selected: string[] = [];
        for (let name of filters.costCenters) {
            if (options.includes(name)) {
                selected.push(name);
            }
        }

        let rows: SummaryRow[] = [];
        if (details.length > 0) {
            rows = calculateDashboard(details, filters.costCenters, filters.engagementTypes);
        }

        let dateRange = null;
        if (request.response) {
            dateRange = request.response.data.report.date;
        }

        return {
            filters: filters,
            request: request,
            costCenterOptions: options,
            selectedCostCenters: selected,
            dateRange: dateRange,
            rows: rows,
        };
    }

    private loadMonth(month: MonthKey, forceReload: boolean): Observable<RequestState> {
        let oldData = this.cache.get(month) || null;

        if (oldData && !forceReload) {
            let state: RequestState = { month: month, status: 'success', response: oldData, error: null };
            return of(state);
        }

        let loadingState: RequestState = { month: month, status: 'loading', response: oldData, error: null };

        return this.api.getPerformance(month).pipe(
            tap((response) => {
                this.cache.set(month, response);
            }),
            map((response) => {
                let state: RequestState = { month: month, status: 'success', response: response, error: null };
                return state;
            }),
            catchError((err) => {
                let message = 'Something went wrong.';
                if (err instanceof Error) {
                    message = err.message;
                }
                let state: RequestState = { month: month, status: 'error', response: oldData, error: message };
                return of(state);
            }),
            startWith(loadingState),
        );
    }
}

function getDefaultFilters(): DashboardFilters {
    return {
        month: '2026-10',
        costCenters: [],
        engagementTypes: [],
    };
}

export function loadFilters(): DashboardFilters {
    let filters = getDefaultFilters();

    try {
        let text = localStorage.getItem(STORAGE_KEY);
        if (!text) {
            return filters;
        }
        let saved = JSON.parse(text);

        for (let m of MONTHS) {
            if (m.key == saved.month) {
                filters.month = saved.month;
            }
        }

        if (Array.isArray(saved.costCenters)) {
            for (let name of saved.costCenters) {
                if (typeof name == 'string') {
                    filters.costCenters.push(name);
                }
            }
        }

        if (Array.isArray(saved.engagementTypes)) {
            for (let type of saved.engagementTypes) {
                if (type == 'Own' || type == 'Rented' || type == 'Hired') {
                    filters.engagementTypes.push(type);
                }
            }
        }
    } catch (e) {
        console.log('could not read saved filters', e);
        return getDefaultFilters();
    }

    return filters;
}

function saveFilters(filters: DashboardFilters) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch (e) {
        console.log('could not save filters', e);
    }
}
