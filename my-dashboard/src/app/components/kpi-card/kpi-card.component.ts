import { Component, Input } from '@angular/core';

import { SummaryRow } from '../../models/dashboard.models';
import { formatValue, formatVariance, formatVariancePercent } from '../../utils/format';

@Component({
  selector: 'app-kpi-card',
  template: `
    <div class="card h-100 border-0 shadow-sm">
      <div class="card-body">
        <div class="text-muted small">{{ row.label }}</div>
        <h4 class="my-2 fw-semibold">{{ showValue(row.actual) }}</h4>
        <div class="small text-muted">Target: {{ showValue(row.target) }}</div>
        <div class="small">
          <span [class]="row.status">
            {{ showVariance() }}
            @if (row.variancePercent !== null) {
              ({{ showVariancePercent() }})
            }
          </span>
        </div>
      </div>
    </div>
  `,
  styles: `
    .card {
      border-top: 3px solid #0d6efd !important;
    }
  `,
})
export class KpiCardComponent {
  @Input() row!: SummaryRow;

  showValue(value: number): string {
    return formatValue(value, this.row.format);
  }

  showVariance(): string {
    return formatVariance(this.row);
  }

  showVariancePercent(): string {
    return formatVariancePercent(this.row);
  }
}
