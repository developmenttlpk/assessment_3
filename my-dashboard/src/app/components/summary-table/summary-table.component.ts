import { Component, Input } from '@angular/core';

import { SummaryRow } from '../../models/dashboard.models';
import { formatValue, formatVariance, formatVariancePercent } from '../../utils/format';

@Component({
  selector: 'app-summary-table',
  templateUrl: './summary-table.component.html',
  styleUrl: './summary-table.component.css',
})
export class SummaryTableComponent {
  @Input() rows: SummaryRow[] = [];
  @Input() caption = '';

  showValue(row: SummaryRow, value: number): string {
    return formatValue(value, row.format);
  }

  showVariance(row: SummaryRow): string {
    return formatVariance(row);
  }

  showVariancePercent(row: SummaryRow): string {
    return formatVariancePercent(row);
  }

  getPercentClass(row: SummaryRow): string {
    if (row.variancePercent === null) {
      return 'neutral';
    }
    return row.status;
  }
}
