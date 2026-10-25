import { TestBed } from '@angular/core/testing';

import { SummaryRow } from '../../models/dashboard.models';
import { SummaryTableComponent } from './summary-table.component';

describe('SummaryTableComponent', () => {
  const rows: SummaryRow[] = [
    { key: 'revenue', label: 'Revenue', format: 'money', target: 1000, actual: 1234.5, variance: 234.5, variancePercent: 23.45, status: 'good' },
    { key: 'gp_percentage', label: 'GP %', format: 'percent', target: 20, actual: 18, variance: -2, variancePercent: null, status: 'bad' },
    { key: 'trips', label: 'Number of Trips', format: 'number', target: 5, actual: 5, variance: 0, variancePercent: 0, status: 'neutral' },
  ];

  it('formats values, shows N/A for GP % and colours variances', () => {
    const fixture = TestBed.createComponent(SummaryTableComponent);
    fixture.componentRef.setInput('rows', rows);
    fixture.detectChanges();

    const cells = [...fixture.nativeElement.querySelectorAll('tbody tr')].map((tr: HTMLElement) =>
      [...tr.querySelectorAll('th, td')].map((c) => c.textContent!.trim()),
    );
    expect(cells[0]).toEqual(['Revenue', '1,000.00', '1,234.50', '+234.50', '+23.45%']);
    expect(cells[1]).toEqual(['GP %', '20.00%', '18.00%', '-2.00 pp', 'N/A']);
    expect(cells[2]).toEqual(['Number of Trips', '5', '5', '0', '0.00%']);

    const variances = fixture.nativeElement.querySelectorAll('[data-test="variance"]');
    expect(variances[0].classList).toContain('good');
    expect(variances[1].classList).toContain('bad');
    expect(variances[2].classList).toContain('neutral');
  });
});