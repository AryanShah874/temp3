import React, { useRef } from 'react';
import { FilterState } from '../../types';
import { Search } from 'lucide-react';
import { formatDate } from '../../utils/dataUtils';
import './FilterSection.scss';

interface FilterSectionProps {
  filters: FilterState;
  stockNames: string[];
  onFilterChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  filters,
  stockNames,
  onFilterChange,
  onClearFilters
}) => {
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      searchQuery: e.target.value
    });
  };

  const handleStatusFilterChange = (status: 'success' | 'failed') => {
    onFilterChange({
      ...filters,
      statusFilters: {
        ...filters.statusFilters,
        [status]: !filters.statusFilters[status]
      }
    });
  };

  const handleStockFilterChange = (stockName: string) => {
    onFilterChange({
      ...filters,
      stockFilters: {
        ...filters.stockFilters,
        [stockName]: !filters.stockFilters[stockName]
      }
    });
  };

  const handleDateChange = (type: 'startDate' | 'endDate', value: string) => {
    onFilterChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [type]: value || null
      }
    });
  };

  return (
    <div className="filter-section">
      <div className="filter-section__header">
        <h3 className="filter-section__header-title">Filters</h3>
        <button
          onClick={onClearFilters}
          className="filter-section__header-clear-btn"
        >
          Clear All
        </button>
      </div>

      <div className="filter-section__search">
        <div className="filter-section__search-container">
          <Search className="filter-section__search-icon" size={18} />
          <input
            type="text"
            placeholder="Search for a Stock"
            className="filter-section__search-input"
            value={filters.searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="filter-section__date-range">
        <div className="filter-section__date-range-container">
          <div className="filter-section__date-range-field">
            <div 
              className="filter-section__date-range-label"
              onClick={() => startDateRef.current?.showPicker?.() || startDateRef.current?.click()}
            >
              {filters.dateRange.startDate ? formatDate(filters.dateRange.startDate) : 'Start Date'}
            </div>
            <input
              ref={startDateRef}
              type="date"
              value={filters.dateRange.startDate || ''}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="filter-section__date-range-input"
            />
          </div>
          <div className="filter-section__date-range-field">
            <input
              ref={endDateRef}
              type="date"
              value={filters.dateRange.endDate || ''}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="filter-section__date-range-input"
            />
            <div 
              className="filter-section__date-range-label"
              onClick={() => endDateRef.current?.showPicker?.() || endDateRef.current?.click()}
            >
              <span>{filters.dateRange.endDate ? formatDate(filters.dateRange.endDate) : 'End Date'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="filter-section__status">
        <div className="filter-section__status-container">
          <label className="filter-section__status-label">
            <input
              type="checkbox"
              checked={filters.statusFilters.success}
              onChange={() => handleStatusFilterChange('success')}
              className="filter-section__status-checkbox filter-section__status-checkbox--success"
            />
            <span>Passed</span>
          </label>
          <label className="filter-section__status-label">
            <input
              type="checkbox"
              checked={filters.statusFilters.failed}
              onChange={() => handleStatusFilterChange('failed')}
              className="filter-section__status-checkbox filter-section__status-checkbox--failed"
            />
            <span>Failed</span>
          </label>
        </div>
      </div>

      <div className="filter-section__stocks">
        <div className="filter-section__stocks-list">
          {stockNames.map((stockName) => (
            <label
              key={stockName}
              className={`filter-section__stocks-label ${
                filters.stockFilters[stockName] ? '' : 'filter-section__stocks-label--inactive'
              }`}
            >
              <input
                type="checkbox"
                checked={!!filters.stockFilters[stockName]}
                onChange={() => handleStockFilterChange(stockName)}
                className="filter-section__stocks-checkbox"
              />
              <span className={filters.stockFilters[stockName] ? 'filter-section__stocks-name--active' : ''}>
                {stockName}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterSection;