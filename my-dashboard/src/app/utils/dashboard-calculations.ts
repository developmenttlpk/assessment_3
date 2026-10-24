
import {
    CostCenterDetail,
    EngagementType,
    MetricKey,
    MetricTables,
    SummaryRow,
    ValueFormat,
    VarianceStatus,
} from '../models/dashboard.models';

export interface TargetActual {
    target: number;
    actual: number;
}

export type Totals = Record<MetricKey, TargetActual>;

const ALL_METRIC_KEYS: MetricKey[] = [
    'revenue',
    'gp',
    'fuel_cost',
    'toll_cost',
    'freight_charges',
    'loading_unloading_charges',
    'other_costs',
    'repair_cost',
    'rental_cost',
    'transportation_income',
    'budgeted_km',
    'approved_km',
    'trips',
    'gp_percentage',
];

const LOWER_IS_BETTER: MetricKey[] = [
    'fuel_cost',
    'toll_cost',
    'freight_charges',
    'loading_unloading_charges',
    'other_costs',
    'repair_cost',
    'rental_cost',
];


export function round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function getCostCenterOptions(details: CostCenterDetail[]): string[] {
    const names = new Set<string>();
    for (const detail of details) {
        names.add(detail.cost_center);
        for (const member of detail.merged_group_costcenters ?? []) {
            names.add(member);
        }
    }
    return [...names].sort();
}


function detailMatchesName(detail: CostCenterDetail, name: string): boolean {
    return detail.cost_center === name || (detail.merged_group_costcenters ?? []).includes(name);
}


export function resolveSelectedDetails(
    details: CostCenterDetail[],
    selectedNames: string[],
): CostCenterDetail[] {
    const matched = details.filter((detail) =>
        selectedNames.some((name) => detailMatchesName(detail, name)),
    );
    return matched.length > 0 ? matched : details;
}


function emptyTotals(): Totals {
    const totals = {} as Totals;
    for (const key of ALL_METRIC_KEYS) {
        totals[key] = { target: 0, actual: 0 };
    }
    return totals;
}


function addTables(totals: Totals, tables: MetricTables | undefined): void {
    if (!tables) return;
    for (const key of ALL_METRIC_KEYS) {
        const total = tables[key]?.total;
        if (total) {
            totals[key].target += total.target;
            totals[key].actual += total.actual;
        }
    }
}



export function aggregateTotals(
    details: CostCenterDetail[],
    engagementTypes: EngagementType[],
): Totals {
    const totals = emptyTotals();

    for (const detail of details) {
        if (engagementTypes.length === 0) {
            addTables(totals, detail.tables);
        } else {
            for (const type of engagementTypes) {
                addTables(totals, detail.engagement_tables[type]);
            }
        }
    }


    for (const key of ALL_METRIC_KEYS) {
        totals[key] = { target: round2(totals[key].target), actual: round2(totals[key].actual) };
    }
    return totals;
}


export function adjustGp(rawGp: number, revenue: number): number {
    return rawGp - revenue * 1.15 * 0.07;
}


export function gpPercent(adjustedGp: number, revenue: number): number {
    return revenue === 0 ? 0 : (adjustedGp / revenue) * 100;
}


export function variancePercent(variance: number, target: number): number {
    return target === 0 ? 0 : (variance / target) * 100;
}


export function statusOf(variance: number): VarianceStatus {
    const rounded = round2(variance);
    if (rounded > 0) return 'good';
    if (rounded < 0) return 'bad';
    return 'neutral';
}

function makeRow(key: MetricKey, label: string, format: ValueFormat, value: TargetActual): SummaryRow {
    const variance = LOWER_IS_BETTER.includes(key)
        ? value.target - value.actual
        : value.actual - value.target;

    return {
        key,
        label,
        format,
        target: value.target,
        actual: value.actual,
        variance: round2(variance),
        variancePercent: round2(variancePercent(variance, value.target)),
        status: statusOf(variance),
    };
}


export function buildSummaryRows(totals: Totals): SummaryRow[] {
    const revenue = totals.revenue;


    const gpTarget = adjustGp(totals.gp.target, revenue.target);
    const gpActual = adjustGp(totals.gp.actual, revenue.actual);
    const gpVariance = gpActual - gpTarget;
    const gpPctTarget = gpPercent(gpTarget, revenue.target);
    const gpPctActual = gpPercent(gpActual, revenue.actual);
    const gpPctVariance = gpPctActual - gpPctTarget;

    return [
        makeRow('revenue', 'Revenue', 'money', revenue),
        {
            key: 'gp',
            label: 'Gross Profit',
            format: 'money',
            target: round2(gpTarget),
            actual: round2(gpActual),
            variance: round2(gpVariance),
            variancePercent: round2(variancePercent(gpVariance, gpTarget)),
            status: statusOf(gpVariance),
        },
        {
            key: 'gp_percentage',
            label: 'GP %',
            format: 'percent',
            target: round2(gpPctTarget),
            actual: round2(gpPctActual),
            variance: round2(gpPctVariance),
            variancePercent: null, // shown as N/A
            status: statusOf(gpPctVariance),
        },
        makeRow('fuel_cost', 'Fuel Cost', 'money', totals.fuel_cost),
        makeRow('toll_cost', 'Toll Cost', 'money', totals.toll_cost),
        makeRow('other_costs', 'Other Costs', 'money', totals.other_costs),
        makeRow('repair_cost', 'Repair Cost', 'money', totals.repair_cost),
        makeRow('budgeted_km', 'Budgeted KMs', 'number', totals.budgeted_km),
        makeRow('approved_km', 'Approved KMs', 'number', totals.approved_km),
        makeRow('trips', 'Number of Trips', 'number', totals.trips),
    ];
}


export function calculateDashboard(
    details: CostCenterDetail[],
    selectedNames: string[],
    engagementTypes: EngagementType[],
): SummaryRow[] {
    const selected = resolveSelectedDetails(details, selectedNames);
    const totals = aggregateTotals(selected, engagementTypes);
    return buildSummaryRows(totals);
}