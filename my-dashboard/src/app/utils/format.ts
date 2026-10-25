import { SummaryRow, ValueFormat } from '../models/dashboard.models';

function toTwoDecimals(value: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatValue(value: number, format: ValueFormat): string {
  if (format == 'percent') {
    return toTwoDecimals(value) + '%';
  }
  if (format == 'money') {
    return toTwoDecimals(value);
  }
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function formatVariance(row: SummaryRow): string {
  let sign = '';
  if (row.variance > 0) {
    sign = '+';
  }

  if (row.format == 'percent') {
    return sign + toTwoDecimals(row.variance) + ' pp';
  }
  return sign + formatValue(row.variance, row.format);
}

export function formatVariancePercent(row: SummaryRow): string {
  if (row.variancePercent === null) {
    return 'N/A';
  }

  let sign = '';
  if (row.variancePercent > 0) {
    sign = '+';
  }
  return sign + toTwoDecimals(row.variancePercent) + '%';
}
