import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Subscription } from 'rxjs';

import { MonthKey } from '../models/dashboard.models';
import { DashboardStateService, DashboardViewModel } from './dashboard-state.service';
import { MOCK_API_OPTIONS, MockApiOptions, MockApiService } from './mock-api.service';

describe('DashboardStateService', () => {
 
  let delays: Record<MonthKey, number>;
  let failNext: boolean;

  let service: DashboardStateService;
  let api: MockApiService;
  let latest: DashboardViewModel;
  let sub: Subscription;

  beforeEach(() => {
    localStorage.clear();
    delays = { '2026-09': 100, '2026-10': 100 };
    failNext = false;

    const options: MockApiOptions = {
      getDelayMs: (month) => delays[month],
      shouldFail: () => failNext,
    };

    TestBed.configureTestingModule({
      providers: [{ provide: MOCK_API_OPTIONS, useValue: options }],
    });
    service = TestBed.inject(DashboardStateService);
    api = TestBed.inject(MockApiService);
    spyOn(api, 'getPerformance').and.callThrough();
  });

  afterEach(() => sub?.unsubscribe());

  function start(): void {
    sub = service.viewModel$.subscribe((vm) => (latest = vm));
  }

  it('ignores a slow September response after switching to October', fakeAsync(() => {
    delays = { '2026-09': 2000, '2026-10': 100 };
    service.selectMonth('2026-09');
    start();
    expect(latest.request.status).toBe('loading');

    tick(50);
    service.selectMonth('2026-10');
    tick(100);

    expect(latest.request.month).toBe('2026-10');
    expect(latest.request.status).toBe('success');
    expect(latest.dateRange).toContain('2026-10');

    tick(3000); 
    expect(latest.request.month).toBe('2026-10');
    expect(latest.request.status).toBe('success');
    expect(latest.dateRange).toContain('2026-10');
  }));

  it('caches each month and only calls the API again on Refresh', fakeAsync(() => {
    start(); 
    tick(100);
    service.selectMonth('2026-09');
    tick(100);
    service.selectMonth('2026-10'); 
    expect(latest.request.status).toBe('success');
    expect(api.getPerformance).toHaveBeenCalledTimes(2);

    service.refresh(); 
    expect(latest.request.status).toBe('loading');
    tick(100);
    expect(api.getPerformance).toHaveBeenCalledTimes(3);
  }));

  it('keeps the last good data when a refresh fails', fakeAsync(() => {
    start();
    tick(100);
    const goodRows = latest.rows;

    failNext = true;
    service.refresh();
    tick(100);

    expect(latest.request.status).toBe('error');
    expect(latest.request.error).toBeTruthy();
    expect(latest.rows).toEqual(goodRows);
  }));

  it('shows an error state when the first request fails', fakeAsync(() => {
    failNext = true;
    start();
    tick(100);
    expect(latest.request.status).toBe('error');
    expect(latest.rows).toEqual([]);
  }));

  it('applies filters without new API calls and returns to All after the last removal', fakeAsync(() => {
    start();
    tick(100);
    const allRevenue = latest.rows[0].target;

    service.toggleCostCenter('CITY PARCEL HUB');
    service.toggleEngagementType('Own');
    expect(latest.selectedCostCenters).toEqual(['CITY PARCEL HUB']);
    expect(latest.rows[0].target).toBeLessThan(allRevenue);

    service.toggleEngagementType('Own');
    service.toggleCostCenter('CITY PARCEL HUB'); 
    expect(latest.selectedCostCenters).toEqual([]);
    expect(latest.rows[0].target).toBe(allRevenue);

    service.toggleCostCenter('NORTHLINE CONTRACT');
    service.selectAllCostCenters();
    expect(latest.selectedCostCenters).toEqual([]);

    expect(api.getPerformance).toHaveBeenCalledTimes(1);
  }));

  it('saves the filters in localStorage', () => {
    service.selectMonth('2026-09');
    service.toggleCostCenter('CITY PARCEL HUB');
    service.toggleEngagementType('Hired');

    const saved = JSON.parse(localStorage.getItem('mtd-dashboard-filters') ?? '{}');
    expect(saved).toEqual({
      month: '2026-09',
      costCenters: ['CITY PARCEL HUB'],
      engagementTypes: ['Hired'],
    });
  });
});