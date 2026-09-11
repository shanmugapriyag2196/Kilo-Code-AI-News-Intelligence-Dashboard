import { DateRange } from '@ai-news/shared';
import { AI_CATEGORIES } from '../api/client';

interface SearchFiltersProps {
  search: string;
  onSearchChange: (q: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (r: DateRange) => void;
  category: string;
  onCategoryChange: (c: string) => void;
  customFrom: string;
  onFromChange: (d: string) => void;
  customTo: string;
  onToChange: (d: string) => void;
}

export function SearchFilters({
  search, onSearchChange, dateRange, onDateRangeChange,
  category, onCategoryChange, customFrom, onFromChange, customTo, onToChange,
}: SearchFiltersProps) {
  return (
    <div className="search-filters">
      <div className="search-filters-left">
        <div className="search-input-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            type="text"
            placeholder="Semantic search..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <div className="search-filters-right">
        <div className="date-range-group">
          {(['today', 'yesterday', '7d', '30d'] as DateRange[]).map(range => (
            <button
              key={range}
              className={`date-chip ${dateRange === range ? 'active' : ''}`}
              onClick={() => onDateRangeChange(range)}
            >
              {range === 'today' ? 'Today' : range === 'yesterday' ? 'Yesterday' : range === '7d' ? '7 Days' : '30 Days'}
            </button>
          ))}
          <button
            className={`date-chip ${dateRange === 'custom' ? 'active' : ''}`}
            onClick={() => onDateRangeChange('custom')}
          >
            Custom
          </button>
        </div>
        {dateRange === 'custom' && (
          <div className="custom-date-range">
            <input type="date" value={customFrom} onChange={(e) => onFromChange(e.target.value)} />
            <span className="date-separator">to</span>
            <input type="date" value={customTo} onChange={(e) => onToChange(e.target.value)} />
          </div>
        )}
        <select value={category} onChange={(e) => onCategoryChange(e.target.value)}>
          <option value="">All Categories</option>
          {AI_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
    </div>
  );
}
