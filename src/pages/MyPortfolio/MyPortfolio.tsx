import React, { useState, useEffect } from 'react';
import { Transaction, FilterState } from '../../types';
import FilterSection from './FilterSection';
import TransactionList from './TransactionList';
import { isWithinDateRange } from '../../utils/dataUtils';
import { fetchTransactions } from '../../services/api';
import Spinner from '../../components/Spinner/Spinner';
import './MyPortfolio.scss';

const MyPortfolio: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [uniqueStocks, setUniqueStocks] = useState<string[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    statusFilters: {
      success: false,
      failed: false
    },
    stockFilters: {},
    dateRange: {
      startDate: null,
      endDate: null
    }
  });

  useEffect(() => {
    const getTransactions = async () => {
      try {
        setIsLoading(true);
        setIsInitialLoading(true);
        
        // Fetch real data from API
        const data = await fetchTransactions();

        // console.log(data)
        
        // Sort transactions by timestamp in descending order (newest first)
        const sortedData = [...data].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        setTransactions(sortedData);
        
        // Extract unique stock names for filters
        const stockNames = [...new Set(data.map((t: Transaction) => t.stock_name))];
        setUniqueStocks(stockNames);
        
        // Initialize stock filters
        const initialStockFilters: Record<string, boolean> = {};
        stockNames.forEach(name => {
          initialStockFilters[name] = false;
        });
        
        setFilters(prev => ({
          ...prev,
          stockFilters: initialStockFilters
        }));
        
        setFilteredTransactions(sortedData);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoading(false);
        setIsInitialLoading(false);
      }
    };

    getTransactions();
  }, []);

  useEffect(() => {
    if (!isInitialLoading) {
      applyFilters();
    }
  }, [filters, transactions, isInitialLoading]);

  const applyFilters = () => {
    setIsLoading(true);
    
    let filtered = [...transactions];
    
    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        t => 
          t.stock_name.toLowerCase().includes(query) || 
          t.stock_symbol.toLowerCase().includes(query)
      );
    }
    
    // Apply status filters
    const { success, failed } = filters.statusFilters;
    if (success || failed) {
      filtered = filtered.filter(t => 
        (success && t.status === 'Passed') || 
        (failed && t.status === 'Failed')
      );
    }
    
    // Apply stock filters
    const selectedStocks = Object.entries(filters.stockFilters)
      .filter(([_, isSelected]) => isSelected)
      .map(([stockName]) => stockName);
    
    if (selectedStocks.length > 0) {
      filtered = filtered.filter(t => selectedStocks.includes(t.stock_name));
    }
    
    // Apply date range filter
    const { startDate, endDate } = filters.dateRange;
    if (startDate || endDate) {
      filtered = filtered.filter(t => 
        isWithinDateRange(t.timestamp, startDate, endDate)
      );
    }
    
    setFilteredTransactions(filtered);
    setIsLoading(false);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    const resetStockFilters: Record<string, boolean> = {};
    uniqueStocks.forEach(name => {
      resetStockFilters[name] = false;
    });
    
    setFilters({
      searchQuery: '',
      statusFilters: {
        success: false,
        failed: false
      },
      stockFilters: resetStockFilters,
      dateRange: {
        startDate: null,
        endDate: null
      }
    });
  };

  const addNewTransaction = (transaction: Transaction) => {
    const updatedTransactions = [transaction, ...transactions];
    setTransactions(updatedTransactions);
    
    // Update unique stocks if needed
    if (!uniqueStocks.includes(transaction.stock_name)) {
      const updatedStocks = [...uniqueStocks, transaction.stock_name];
      setUniqueStocks(updatedStocks);
      
      // Update stock filters
      setFilters(prev => ({
        ...prev,
        stockFilters: {
          ...prev.stockFilters,
          [transaction.stock_name]: false
        }
      }));
    }
  };

  return (
    <div className="portfolio">
      {isInitialLoading ? (
        <Spinner />
      ) : (
        <div className="portfolio__layout">
          <div className="portfolio__sidebar">
            <FilterSection 
              filters={filters}
              stockNames={uniqueStocks}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
          </div>
          
          <div className="portfolio__content">
            <TransactionList 
              transactions={filteredTransactions}
              isLoading={isLoading && !isInitialLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPortfolio;