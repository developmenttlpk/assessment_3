import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ENGAGEMENT_TYPES, MONTHS, MonthKey, SummaryRow } from '../../models/dashboard.models';
import { DashboardStateService, DashboardViewModel } from '../../services/dashboard-state.service';
import { SummaryTableComponent } from '../../components/summary-table/summary-table.component';
import { KpiCardComponent } from '../../components/kpi-card/kpi-card.component';

@Component({
  selector: 'app-dashboard',
  imports: [AsyncPipe, FormsModule, SummaryTableComponent, KpiCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  months = MONTHS;
  engagementTypes = ENGAGEMENT_TYPES;
  cardKeys = ['revenue', 'gp', 'gp_percentage', 'trips'];
  search = '';

  vm$;

  constructor(public state: DashboardStateService) {
    this.vm$ = this.state.viewModel$;
  }

  getMonthName(key: MonthKey): string {
    for (let i = 0; i < this.months.length; i++) {
      if (this.months[i].key == key) {
        return this.months[i].label;
      }
    }
    return key;
  }

  getFilteredCostCenters(names: string[]): string[] {
    let text = this.search.trim().toLowerCase();
    if (text == '') {
      return names;
    }

    let result: string[] = [];
    for (let name of names) {
      if (name.toLowerCase().includes(text)) {
        result.push(name);
      }
    }
    return result;
  }

  getCardRows(rows: SummaryRow[]): SummaryRow[] {
    let result: SummaryRow[] = [];
    for (let key of this.cardKeys) {
      for (let row of rows) {
        if (row.key == key) {
          result.push(row);
        }
      }
    }
    return result;
  }

  getSelectionText(vm: DashboardViewModel): string {
    let centers = 'All cost centers';
    if (vm.selectedCostCenters.length > 0) {
      centers = vm.selectedCostCenters.join(', ');
    }

    let types = 'Combined';
    if (vm.filters.engagementTypes.length > 0) {
      types = vm.filters.engagementTypes.join(' + ');
    }

    return centers + ' - ' + types;
  }
}
