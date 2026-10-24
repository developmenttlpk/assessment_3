import {
  CostCenterDetail,
  EngagementType,
  MetricKey,
  MetricTables,
  PerformanceResponse,
  SummaryRow,
} from '../models/dashboard.models';
import {
  aggregateTotals,
  calculateDashboard,
  getCostCenterOptions,
  resolveSelectedDetails,
} from './dashboard-calculations';
import september from '../data/mock-performance-2026-09.json';
type Values = Partial<Record<MetricKey, [target: number, actual: number]>>;

function tables(values: Values): MetricTables {
  const result: MetricTables = {};
  for (const [key, [target, actual]] of Object.entries(values) as [MetricKey, [number, number]][]) {
    result[key] = { label: key, rows: [], total: { target, actual } };
  }
  return result;
}

function detail(
  name: string,
  combined: Values,
  engagement: Partial<Record<EngagementType, Values>> = {},
  members?: string[],
): CostCenterDetail {
  const engagement_tables: CostCenterDetail['engagement_tables'] = {};
  for (const [type, values] of Object.entries(engagement) as [EngagementType, Values][]) {
    engagement_tables[type] = tables(values);
  }
  return {
    cost_center: name,
    cost_code: name.slice(0, 3),
    tables: tables(combined),
    engagement_tables,
    ...(members ? { merged_group_costcenters: members, merge_group_id: 1 } : {}),
  };
}

function row(rows: SummaryRow[], key: string): SummaryRow {
  const found = rows.find((r) => r.key === key);
  if (!found) throw new Error(`row ${key} not found`);
  return found;
}

const realDetails = (september as unknown as PerformanceResponse).data.details;

// ---------------------------------------------------------------------------

describe('dashboard calculations', () => {
  it('adds up target and actual across several cost centers, then recomputes variance', () => {
    const details = [
      detail('A', { revenue: [100, 120], fuel_cost: [50, 40] }),
      detail('B', { revenue: [200, 150], fuel_cost: [50, 70] }),
      detail('C', { revenue: [999, 999] }),
    ];

    const rows = calculateDashboard(details, ['A', 'B'], []);

    const revenue = row(rows, 'revenue');
    expect(revenue.target).toBe(300);
    expect(revenue.actual).toBe(270);
    expect(revenue.variance).toBe(-30); 
    expect(revenue.variancePercent).toBe(-10);
    expect(revenue.status).toBe('bad');

    const fuel = row(rows, 'fuel_cost');
    expect(fuel.target).toBe(100);
    expect(fuel.actual).toBe(110);
    expect(fuel.variance).toBe(-10); 
    expect(fuel.status).toBe('bad');
  });

  it('treats a lower cost as favourable', () => {
    const rows = calculateDashboard([detail('A', { toll_cost: [100, 80] })], [], []);
    expect(row(rows, 'toll_cost').variance).toBe(20);
    expect(row(rows, 'toll_cost').status).toBe('good');
  });

  it('shows 0% when target is zero but keeps the absolute variance', () => {
    const rows = calculateDashboard(
      [detail('A', { revenue: [0, 0], fuel_cost: [0, 50], trips: [0, 7], repair_cost: [10, 10] })],
      [],
      [],
    );

    expect(row(rows, 'fuel_cost').variance).toBe(-50);
    expect(row(rows, 'fuel_cost').variancePercent).toBe(0);
    expect(row(rows, 'trips').variance).toBe(7);
    expect(row(rows, 'trips').variancePercent).toBe(0);
    expect(row(rows, 'trips').status).toBe('good');
    expect(row(rows, 'repair_cost').status).toBe('neutral');
    expect(row(rows, 'gp_percentage').target).toBe(0);
    expect(row(rows, 'gp_percentage').actual).toBe(0);
  });

  it('derives adjusted GP and GP% separately for target and actual', () => {
    const rows = calculateDashboard(
      [detail('A', { revenue: [1000, 2000], gp: [300, 500], gp_percentage: [99, 99] })],
      [],
      [],
    );

    const gp = row(rows, 'gp');
    expect(gp.target).toBe(219.5);
    expect(gp.actual).toBe(339);
    expect(gp.variance).toBe(119.5);
    expect(gp.variancePercent).toBe(54.44); 
    expect(gp.status).toBe('good');

    const gpPct = row(rows, 'gp_percentage');
    expect(gpPct.target).toBe(21.95); 
    expect(gpPct.actual).toBe(16.95);
    expect(gpPct.variance).toBe(-5); 
    expect(gpPct.variancePercent).toBeNull(); 
    expect(gpPct.status).toBe('bad');
  });

  it('counts a merged cost center only once, even when several member names are picked', () => {
    const merged = detail('GROUP', { revenue: [500, 600] }, {}, ['EAST', 'WEST']);
    const details = [detail('A', { revenue: [100, 100] }), merged];

    expect(resolveSelectedDetails(details, ['EAST'])).toEqual([merged]);
    expect(resolveSelectedDetails(details, ['EAST', 'WEST', 'GROUP'])).toEqual([merged]);

    const rows = calculateDashboard(details, ['EAST', 'WEST', 'A'], []);
    expect(row(rows, 'revenue').target).toBe(600); 
  });

  it('resolves real member names to the merged CENTRAL NETWORK GROUP row once', () => {
    const options = getCostCenterOptions(realDetails);
    expect(options).toContain('CENTRAL FLEET EAST');
    expect(options).toContain('CENTRAL FLEET WEST');

    const both = calculateDashboard(realDetails, ['CENTRAL FLEET EAST', 'CENTRAL FLEET WEST'], []);
    const group = calculateDashboard(realDetails, ['CENTRAL NETWORK GROUP'], []);
    expect(both).toEqual(group);
    expect(row(both, 'revenue').target).toBe(978397);
  });

  it('All + Own adds up Own tables across every center (not data.report)', () => {
    const own = aggregateTotals(realDetails, ['Own']);
    const expected = realDetails.reduce(
      (sum, d) => sum + (d.engagement_tables.Own?.revenue?.total.target ?? 0),
      0,
    );
    expect(own.revenue.target).toBeCloseTo(expected, 2);
    expect(own.revenue.target).not.toBe(realDetails[0].tables.revenue!.total.target);
  });

  it('combines several engagement types with several cost centers, in any order', () => {
    const details = [
      detail('A', { revenue: [999, 999] }, { Own: { revenue: [10, 11] }, Hired: { revenue: [1, 2] }, Rented: { revenue: [100, 100] } }),
      detail('B', { revenue: [999, 999] }, { Own: { revenue: [20, 22] }, Hired: { revenue: [3, 4] }, Rented: { revenue: [100, 100] } }),
      detail('C', { revenue: [999, 999] }, { Own: { revenue: [500, 500] } }),
    ];

    const first = calculateDashboard(details, ['A', 'B'], ['Own', 'Hired']);
    const second = calculateDashboard(details, ['B', 'A'], ['Hired', 'Own']);

    expect(row(first, 'revenue').target).toBe(34); 
    expect(row(first, 'revenue').actual).toBe(39);
    expect(second).toEqual(first);
  });

  it('never changes the data it is given', () => {
    const details = structuredClone(realDetails);
    const before = JSON.stringify(details);

    calculateDashboard(details, ['CENTRAL FLEET EAST', 'CITY PARCEL HUB'], ['Own', 'Rented']);
    calculateDashboard(details, [], []);

    expect(JSON.stringify(details)).toBe(before);
  });
});