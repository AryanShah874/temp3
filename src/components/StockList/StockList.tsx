import React from 'react';
import { Plus, Check, X } from 'lucide-react';
import { Stock } from '../../types';
import './StockList.scss';
import { Link } from 'react-router-dom';

interface StockListProps {
  stocks: Stock[];
  watchlist: Stock[];
  onAddToWatchlist: (stock: Stock) => void;
  onRemoveFromWatchlist: (id: string) => void;
  isWatchlistTab?: boolean;
}

const StockList: React.FC<StockListProps> = ({ 
  stocks, 
  watchlist, 
  onAddToWatchlist, 
  onRemoveFromWatchlist,
  isWatchlistTab = false
}) => {
  const isInWatchlist = (stock_name: string) => {
    return watchlist.some(stock => stock.stock_name === stock_name);
  };

  // Helper function to get the name of the stock
  const getStockName = (stock: Stock): string => {
    return stock.stock_name || 'Unknown';
  };

  // Helper function to get the price of the stock
  const getStockPrice = (stock: Stock): number => {
    return stock.base_price || 0;
  };

  return (
    <div className="stock-list">
      <div className="stock-list__header">
        <div className="stock-list__header-item stock-list__company">Company</div>
        <div className="stock-list__header-item stock-list__price">Base Price</div>
        <div className="stock-list__header-item stock-list__action">Watchlist</div>
      </div>
      
      <div className="stock-list__body">
        {stocks.length === 0 ? (
          <div className="stock-list__empty">
            {isWatchlistTab 
              ? "You haven't added any stocks to your watchlist yet." 
              : "No stocks available."}
          </div>
        ) : (
          stocks.map(stock => (
            <div key={stock.stock_name} className="stock-list__row">
              <Link to={`/stock/${stock.stock_name}`}  className="stock-list__cell stock-list__company">{getStockName(stock)}</Link>
              <div className="stock-list__cell stock-list__price">₹{getStockPrice(stock).toFixed(2)}</div>
              <div className="stock-list__cell stock-list__action">
                {isInWatchlist(stock.stock_name || '') ? (
                  <div className="stock-list__watchlist-added">
                    <Check size={18} className="stock-list__check-icon" />
                    <X 
                      size={18} 
                      className="stock-list__remove-icon" 
                      onClick={() => onRemoveFromWatchlist(stock.stock_name || '')}
                    />
                  </div>
                ) : (
                  <button 
                    className="stock-list__add-button"
                    onClick={() => onAddToWatchlist(stock)}
                  >
                    <Plus size={18} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StockList;