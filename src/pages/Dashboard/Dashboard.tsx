import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchStocks, addToWatchlist, removeFromWatchlist, setCurrentPage } from '../../store/stockSlice';
import Header from '../../components/Header/Header';
import Tabs from '../../components/Tabs/Tabs';
import StockList from '../../components/StockList/StockList';
import Pagination from '../../components/Pagination/Pagination';
import Spinner from '../../components/Spinner/Spinner';
import './Dashboard.scss';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { stocks, watchlist, loading, currentPage, itemsPerPage } = useAppSelector(state => state.stocks);
  const [activeTab, setActiveTab] = useState('explore');

  useEffect(() => {
    dispatch(fetchStocks());
  }, [dispatch]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    dispatch(setCurrentPage(1)); // Reset to first page when changing tabs
  };

  const handleAddToWatchlist = (stock: any) => {
    dispatch(addToWatchlist(stock));
  };

  const handleRemoveFromWatchlist = (id: string) => {
    dispatch(removeFromWatchlist(id));
  };

  const handlePageChange = (page: number) => {
    dispatch(setCurrentPage(page));
  };

  // Calculate pagination
  const currentData = activeTab === 'explore' ? stocks : watchlist;
  const totalPages = Math.ceil(currentData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = currentData.slice(startIndex, endIndex);

  return (
    <div className="dashboard">
      {/* <Header /> */}
      
      <main className="dashboard__content">
        <Tabs activeTab={activeTab} onTabChange={handleTabChange} />
        
        {loading ? (
          <Spinner />
        ) : (
          <>
            <StockList 
              stocks={paginatedData}
              watchlist={watchlist}
              onAddToWatchlist={handleAddToWatchlist}
              onRemoveFromWatchlist={handleRemoveFromWatchlist}
              isWatchlistTab={activeTab === 'watchlist'}
            />
            
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;