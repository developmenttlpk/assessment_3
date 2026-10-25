MTD Performance Dashboard

An Angular 20 dashboard for tracking month-to-date (MTD) target vs. actual performance for a logistics company.

Users can select September or October 2026, filter by cost center and engagement type (Own, Rented, or Hired), and view KPI cards and a summary table showing targets, actuals, variances, and variance percentages.

Screenshots

Desktop View

!Desktop Dashboard

Mobile View

!Mobile Dashboard

Error State

!Dashboard Error State

How to Run

Requirements: Node.js 20.19 or newer.

bash
npm install
npm start


Open http://localhost:4200 in your browser.

Run Tests
bash
npm test -- --watch=false --browsers=ChromeHeadless


The 16 tests cover calculations, filters, merged cost centers, caching, refresh behavior, API errors, localStorage, and table formatting.

Project Structure
text
src/app/
  data/              JSON data files
  models/            TypeScript interfaces
  services/          Mock API and dashboard state management
  utils/             Calculations and number formatting
  components/        KPI cards and summary table
  pages/dashboard/   Main dashboard page

Key Features
Target vs. actual performance tracking.
Filters for cost center and engagement type.
KPI cards and a summary table with variance calculations.
Mock API with random delays and occasional failures.
Loading and error states.
Monthly data caching and refresh support.
RxJS switchMap to prevent outdated responses from overwriting newer data.
Filter preferences saved in localStorage.
How the Calculations Work
Cost centers: Selected cost centers are matched against cost_center and merged_group_costcenters. Each detail is processed only once to avoid duplicate totals for merged groups. If no cost center is selected, all are included.
Target and actual: The combined tables are used when no engagement type is selected. Otherwise, only the selected engagement_tables are included. The data.report values are not used.
Calculated metrics:
Adjusted GP = GP - revenue * 1.15 * 0.07
GP % = adjusted GP / revenue * 100 (0 when revenue is zero)
Variance = actual - target (for costs, target - actual)
Variance % = variance / target * 100 (0 when target is zero)
Status is determined by the variance.

Variance and status values from the JSON files are not used, and percentages are calculated from totals rather than added together.

API Handling and Caching

The mock API simulates request delays of 0.3–3 seconds and occasional failures.

The dashboard uses RxJS switchMap to cancel previous requests when the selected month changes or a refresh is triggered. This prevents outdated responses from replacing the latest data or affecting its loading and error states.

Each month's data is cached in a Map.
Refresh bypasses the cache and requests fresh data.
If a refresh fails, the error is displayed while the last successful data is retained.
Filters update calculations locally without additional API requests.
Angular's async pipe manages subscriptions.
The selected month and filters are saved in localStorage.
Technologies Used
Angular 20
TypeScript
RxJS
Bootstrap 5
Bootstrap Icons
Google Fonts (Poppins)
Jasmine and Karma