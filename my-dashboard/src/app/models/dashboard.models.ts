export interface VehicleRow {
    vehicle_no: string;
    category: string;
    target: number;
    actual: number;
    variance: number;
}


export interface MetricTotal {
    target: number;
    actual: number;
    variance?: number;
    variance_percentage?: number;
}

export interface MetricTable {
    label: string;
    rows: VehicleRow[];
    total: MetricTotal;
}




export type MetricKey =
    | 'revenue'
    | 'gp'
    | 'fuel_cost'
    | 'toll_cost'
    | 'freight_charges'
    | 'loading_unloading_charges'
    | 'other_costs'
    | 'repair_cost'
    | 'rental_cost'
    | 'transportation_income'
    | 'budgeted_km'
    | 'approved_km'
    | 'trips'
    | 'gp_percentage';




export type MetricTables = Partial<Record<MetricKey, MetricTable>>;

export type EngagementType = 'Own' | 'Rented' | 'Hired';
export const ENGAGEMENT_TYPES: EngagementType[] = ['Own', 'Rented', 'Hired'];



export interface CostCenterDetail {
    cost_center: string;
    cost_code: string;
    tables: MetricTables;
    engagement_tables: Partial<Record<EngagementType, MetricTables>>;
    merged_group_costcenters?: string[];
    merge_group_id?: number;
}
export interface ReportKpi {
    target: number;
    actual: number;
    variance: number;
    variance_pct: number;
    status: string;
}

export interface PerformanceReport {
    date: string;
    total_month_days: number;
    total_daays_passed: number;
    [metric: string]: ReportKpi | string | number;
}

export interface PerformanceResponse {
    status: number;
    message: string;
    data: {
        report: PerformanceReport;
        details: CostCenterDetail[];
    };
}

export type MonthKey = '2026-09' | '2026-10';

export const MONTHS: { key: MonthKey; label: string }[] = [
    { key: '2026-09', label: 'September 2026' },
    { key: '2026-10', label: 'October 2026' },
];

export interface DashboardFilters {
    month: MonthKey;
    costCenters: string[];
    engagementTypes: EngagementType[];
}


export type VarianceStatus = 'good' | 'bad' | 'neutral';
export type ValueFormat = 'money' | 'percent' | 'number';


export interface SummaryRow {
    key: string;
    label: string;
    format: ValueFormat;
    target: number;
    actual: number;
    variance: number;

    variancePercent: number | null;
    status: VarianceStatus;
}


export interface RequestState {
    month: MonthKey;
    status: 'loading' | 'success' | 'error';
    response: PerformanceResponse | null;
    error: string | null;
}