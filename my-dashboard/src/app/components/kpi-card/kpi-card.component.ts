import { Component, Input } from '@angular/core';

import { SummaryRow } from '../../models/dashboard.models';
import { formatValue, formatVariance, formatVariancePercent } from '../../utils/format';

@Component({
  selector: 'app-kpi-card',
  template: `
    <article class="kpi" [class]="row.status">
      <p class="label">{{ row.label }}</p>
      <p class="value">{{ formatValue(row.actual, row.format) }}</p>
      <div class="foot">
        <span class="pill" [class]="row.status">{{ formatVariance(row) }}</span>
        @if (row.variancePercent !== null) {
          <span class="pct">{{ formatVariancePercent(row) }}</span>
        }
      </div>
      <p class="target">Target {{ formatValue(row.target, row.format) }}</p>
    </article>
  `,
  styles: `
    .kpi {
      position: relative;
      height: 100%;
      padding: 16px 18px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      overflow: hidden;
    }
    .kpi::before {
      content: '';
      position: absolute;
      inset: 0 auto 0 0;
      width: 4px;
      background: var(--border);
    }
    .kpi.good::before { background: var(--good); }
    .kpi.bad::before { background: var(--bad); }

    p { margin: 0; }
    .label {
      font-size: 0.78rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
    }
    .value {
      margin: 8px 0 10px;
      font-size: 1.55rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.02em;
    }
    .foot {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .pct {
      font-size: 0.82rem;
      color: var(--muted);
    }
    .target {
      margin-top: 10px;
      font-size: 0.8rem;
      color: var(--muted);
      font-variant-numeric: tabular-nums;
    }
  `,
})
export class KpiCardComponent {
  @Input({ required: true }) row!: SummaryRow;

  readonly formatValue = formatValue;
  readonly formatVariance = formatVariance;
  readonly formatVariancePercent = formatVariancePercent;
}