import { SummaryRow, ValueFormat } from '../models/dashboard.models';

function twoDecimals(value: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}



export function formatValue(value: number, format: ValueFormat): string {
  if (format === 'percent') return `${twoDecimals(value)}%`;
  if (format === 'money') return twoDecimals(value);
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function formatVariance(row: SummaryRow): string {
  const sign = row.variance > 0 ? '+' : '';
  if (row.format === 'percent') return `${sign}${twoDecimals(row.variance)} pp`;
  return sign + formatValue(row.variance, row.format);
}



export function formatVariancePercent(row: SummaryRow): string {
  if (row.variancePercent === null) return 'N/A';
  const sign = row.variancePercent > 0 ? '+' : '';
  return `${sign}${twoDecimals(row.variancePercent)}%`;
}