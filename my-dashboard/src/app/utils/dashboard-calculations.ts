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

const ALL_METRICS: MetricKey[] = [
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

const COST_METRICS: MetricKey[] = [
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
    let names: string[] = [];

    for (let detail of details) {
        if (!names.includes(detail.cost_center)) {
            names.push(detail.cost_center);
        }
        if (detail.merged_group_costcenters) {
            for (let member of detail.merged_group_costcenters) {
                if (!names.includes(member)) {
                    names.push(member);
                }
            }
        }
    }

    names.sort();
    return names;
}

function isMatch(detail: CostCenterDetail, name: string): boolean {
    if (detail.cost_center == name) {
        return true;
    }
    if (detail.merged_group_costcenters && detail.merged_group_costcenters.includes(name)) {
        return true;
    }
    return false;
}

export function resolveSelectedDetails(
    details: CostCenterDetail[],
    selectedNames: string[],
): CostCenterDetail[] {
    let result: CostCenterDetail[] = [];

    for (let detail of details) {
        for (let name of selectedNames) {
            if (isMatch(detail, name)) {
                result.push(detail);
                break;
            }
        }
    }

    if (result.length == 0) {
        return details;
    }
    return result;
}

function addTables(totals: Totals, tables: MetricTables | undefined) {
    if (!tables) {
        return;
    }
    for (let key of ALL_METRICS) {
        let table = tables[key];
        if (table && table.total) {
            totals[key].target += table.total.target;
            totals[key].actual += table.total.actual;
        }
    }
}

export function aggregateTotals(
    details: CostCenterDetail[],
    engagementTypes: EngagementType[],
): Totals {
    let totals = {} as Totals;
    for (let key of ALL_METRICS) {
        totals[key] = { target: 0, actual: 0 };
    }

    for (let detail of details) {
        if (engagementTypes.length == 0) {
            addTables(totals, detail.tables);
        } else {
            for (let type of engagementTypes) {
                addTables(totals, detail.engagement_tables[type]);
            }
        }
    }

    for (let key of ALL_METRICS) {
        totals[key].target = round2(totals[key].target);
        totals[key].actual = round2(totals[key].actual);
    }
    return totals;
}

export function adjustGp(gp: number, revenue: number): number {
    return gp - revenue * 1.15 * 0.07;
}

export function gpPercent(gp: number, revenue: number): number {
    if (revenue == 0) {
        return 0;
    }
    return (gp / revenue) * 100;
}

export function variancePercent(variance: number, target: number): number {
    if (target == 0) {
        return 0;
    }
    return (variance / target) * 100;
}

export function statusOf(variance: number): VarianceStatus {
    let value = round2(variance);
    if (value > 0) {
        return 'good';
    } else if (value < 0) {
        return 'bad';
    } else {
        return 'neutral';
    }
}

function makeRow(key: MetricKey, label: string, format: ValueFormat, value: TargetActual): SummaryRow {
    let variance = value.actual - value.target;
    if (COST_METRICS.includes(key)) {
        variance = value.target - value.actual;
    }

    return {
        key: key,
        label: label,
        format: format,
        target: value.target,
        actual: value.actual,
        variance: round2(variance),
        variancePercent: round2(variancePercent(variance, value.target)),
        status: statusOf(variance),
    };
}

export function buildSummaryRows(totals: Totals): SummaryRow[] {
    let revenue = totals.revenue;

    let gpTarget = adjustGp(totals.gp.target, revenue.target);
    let gpActual = adjustGp(totals.gp.actual, revenue.actual);
    let gpVariance = gpActual - gpTarget;

    let gpPctTarget = gpPercent(gpTarget, revenue.target);
    let gpPctActual = gpPercent(gpActual, revenue.actual);
    let gpPctVariance = gpPctActual - gpPctTarget;

    let gpRow: SummaryRow = {
        key: 'gp',
        label: 'Gross Profit',
        format: 'money',
        target: round2(gpTarget),
        actual: round2(gpActual),
        variance: round2(gpVariance),
        variancePercent: round2(variancePercent(gpVariance, gpTarget)),
        status: statusOf(gpVariance),
    };

    let gpPctRow: SummaryRow = {
        key: 'gp_percentage',
        label: 'GP %',
        format: 'percent',
        target: round2(gpPctTarget),
        actual: round2(gpPctActual),
        variance: round2(gpPctVariance),
        variancePercent: null,
        status: statusOf(gpPctVariance),
    };

    let rows: SummaryRow[] = [];
    rows.push(makeRow('revenue', 'Revenue', 'money', revenue));
    rows.push(gpRow);
    rows.push(gpPctRow);
    rows.push(makeRow('fuel_cost', 'Fuel Cost', 'money', totals.fuel_cost));
    rows.push(makeRow('toll_cost', 'Toll Cost', 'money', totals.toll_cost));
    rows.push(makeRow('other_costs', 'Other Costs', 'money', totals.other_costs));
    rows.push(makeRow('repair_cost', 'Repair Cost', 'money', totals.repair_cost));
    rows.push(makeRow('budgeted_km', 'Budgeted KMs', 'number', totals.budgeted_km));
    rows.push(makeRow('approved_km', 'Approved KMs', 'number', totals.approved_km));
    rows.push(makeRow('trips', 'Number of Trips', 'number', totals.trips));
    return rows;
}

export function calculateDashboard(
    details: CostCenterDetail[],
    selectedNames: string[],
    engagementTypes: EngagementType[],
): SummaryRow[] {
    let selected = resolveSelectedDetails(details, selectedNames);
    let totals = aggregateTotals(selected, engagementTypes);
    return buildSummaryRows(totals);
}
