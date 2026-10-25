import { Component, Input } from '@angular/core';

import { SummaryRow } from '../../models/dashboard.models';
import { formatValue, formatVariance, formatVariancePercent } from '../../utils/format';

@Component({
  selector: 'app-summary-table',
  templateUrl: './summary-table.component.html',
  styleUrl: './summary-table.component.css',
})
export class SummaryTableComponent {
  @Input({ required: true }) rows: SummaryRow[] = [];
  @Input() caption = 'Month-to-date summary';

  readonly formatValue = formatValue;
  readonly formatVariance = formatVariance;
  readonly formatVariancePercent = formatVariancePercent;
}