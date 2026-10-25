import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ENGAGEMENT_TYPES, MONTHS, MonthKey, SummaryRow } from '../../models/dashboard.models';
import { DashboardStateService, DashboardViewModel } from '../../services/dashboard-state.service';
import { SummaryTableComponent } from '../../components/summary-table/summary-table.component';
import { KpiCardComponent } from '../../components/kpi-card/kpi-card.component';

const HIGHLIGHT_KEYS = ['revenue', 'gp', 'gp_percentage', 'trips'];

@Component({
  selector: 'app-dashboard',
  imports: [AsyncPipe, FormsModule, SummaryTableComponent, KpiCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  readonly state = inject(DashboardStateService);
  readonly vm$ = this.state.viewModel$;

  readonly months = MONTHS;
  readonly engagementTypes = ENGAGEMENT_TYPES;

  search = '';

  monthLabel(key: MonthKey): string {
    return MONTHS.find((m) => m.key === key)?.label ?? key;
  }

  filterOptions(options: string[]): string[] {
    const text = this.search.trim().toLowerCase();
    return text ? options.filter((name) => name.toLowerCase().includes(text)) : options;
  }

  highlights(rows: SummaryRow[]): SummaryRow[] {
    return HIGHLIGHT_KEYS.map((key) => rows.find((r) => r.key === key)).filter(
      (r): r is SummaryRow => !!r,
    );
  }

  selectionText(vm: DashboardViewModel): string {
    const centers = vm.selectedCostCenters.length
      ? vm.selectedCostCenters.join(', ')
      : 'All cost centers';
    const types = vm.filters.engagementTypes.length
      ? vm.filters.engagementTypes.join(' + ')
      : 'Combined';
    return `${centers} · ${types}`;
  }

  hasFilters(vm: DashboardViewModel): boolean {
    return vm.selectedCostCenters.length > 0 || vm.filters.engagementTypes.length > 0;
  }
}