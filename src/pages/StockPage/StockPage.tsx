import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { ArrowUp, ArrowDown, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  setSelectedStock, 
  clearTransactions, 
  clearLiveTransactions, 
  clearPriceHistory 
} from '../../store/stockSlice';
import { 
  initializeWebSocket, 
  joinStockRoom, 
  leaveStockRoom, 
  sendTransaction 
} from '../../services/websocketService';
import { formatTime } from '../../utils/dataUtils';
import Spinner from '../../components/Spinner/Spinner';
import './StockPage.scss';

const StockPage: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { 
    stocks, 
    selectedStock, 
    transactions, 
    liveTransactions, 
    priceHistory,
    currentPrice,
    previousPrice,
    percentChange,
    userInfo,
    webSocketConnected,
    loading
  } = useAppSelector(state => state.stocks);
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [quantity, setQuantity] = useState(100);
  const [activeTab, setActiveTab] = useState('history');
  const [isInitializing, setIsInitializing] = useState(true);
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const barsContainerRef = useRef<HTMLDivElement>(null);
  
  // Initialize WebSocket and join stock room
  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        setIsInitializing(true);
        await initializeWebSocket();
        if (name) {
          dispatch(setSelectedStock(name));
          joinStockRoom(name);
        }
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    
    connectWebSocket();
    
    return () => {
      leaveStockRoom();
      dispatch(clearTransactions());
      dispatch(clearLiveTransactions());
      dispatch(clearPriceHistory());
    };
  }, [dispatch, name]);
  
  // Auto-scroll graph when new price points are added
  useEffect(() => {
    if (barsContainerRef.current && graphContainerRef.current && priceHistory.length > 0) {
      const containerWidth = barsContainerRef.current.scrollWidth;
      graphContainerRef.current.scrollLeft = containerWidth;
    }
  }, [priceHistory]);
  
  // Handle stock selection change
  const handleStockChange = (stockName: string) => {
    setDropdownOpen(false);
    
    if (stockName !== name) {
      navigate(`/stock/${stockName}`);
      
      // Leave current stock room and join new one
      leaveStockRoom();
      dispatch(clearTransactions());
      dispatch(clearLiveTransactions());
      dispatch(clearPriceHistory());
      dispatch(setSelectedStock(stockName));
      joinStockRoom(stockName);
    }
  };
  
  // Handle buy/sell actions
  const handleTransaction = (action: 'buy' | 'sell') => {
    if (!selectedStock) return;
    
    sendTransaction({
      stock_name: selectedStock.stock_name || '',
      stock_symbol: selectedStock.stock_symbol || '',
      transaction_price: currentPrice || selectedStock.base_price || 0,
      quantity,
      action
    });
  };
  
  // Calculate normalized height for graph bars
  const calculateBarHeight = (price: number) => {
    if (priceHistory.length === 0) return 0;
    
    const maxPrice = Math.max(...priceHistory.map(p => p.price));
    const minPrice = Math.min(...priceHistory.map(p => p.price));
    const range = maxPrice - minPrice;
    
    // Normalize to a height between 10% and 90% of the container height
    const normalizedHeight = range === 0 
      ? 200 
      : 50 + ((price - minPrice) / range) * 400;
    
    return normalizedHeight;
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };
  
  // Format percentage
  const formatPercentage = (percent: number) => {
    return `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };
  
  // Get stock symbol for dropdown
  const getStockSymbol = (stockName: string) => {
    const stock = stocks.find(s => s.stock_name === stockName);
    if (stock && stock.stock_symbol) return stock.stock_symbol;
    
    // Use first 3 letters as symbol if not found
    return stockName.substring(0, 3).toUpperCase();
  };
  
  // Render grid for graph
  const renderGrid = () => {
    const cells = [];
    const cellCount = 20; // 5 columns x 4 rows
    
    for (let i = 0; i < cellCount; i++) {
      cells.push(<div key={`cell-${i}`} className="stock-page__grid-cell"></div>);
    }
    
    return <div className="stock-page__grid">{cells}</div>;
  };
  
  // Render price bars
  const renderBars = () => {
    return priceHistory.map((point, index) => {
      const height = calculateBarHeight(point.price);
      const isUp = index === 0 || point.price >= priceHistory[index - 1].price;
      
      return (
        <div
          key={`bar-${index}`}
          className={`stock-page__bar stock-page__bar--${isUp ? 'up' : 'down'}`}
          style={{ height: `${height}px` }}
          title={`${formatCurrency(point.price)} at ${formatTime(point.timestamp)}`}
        ></div>
      );
    });
  };
  
  // Render x-axis labels
  const renderXAxisLabels = () => {
    const labels = [];
    const labelCount = 5;
    
    for (let i = 0; i < labelCount; i++) {
      const position = i * 100;
      labels.push(
        <div
          key={`x-label-${i}`}
          className="stock-page__x-label"
          style={{ left: `${position}px` }}
        >
          {position}
        </div>
      );
    }
    
    return <div className="stock-page__x-axis">{labels}</div>;
  };
  
  // Render y-axis labels
  const renderYAxisLabels = () => {
    const labels = [];
    const labelCount = 5;
    
    for (let i = 0; i < labelCount; i++) {
      const position = i * 25;
      labels.push(
        <div
          key={`y-label-${i}`}
          className="stock-page__y-label"
          style={{ bottom: `${position}%` }}
        >
          {position}%
        </div>
      );
    }
    
    return <div className="stock-page__y-axis">{labels}</div>;
  };
  
  // Render transaction history
  const renderTransactions = () => {
    if (transactions.length === 0) {
      return <div className="stock-page__empty">No transactions yet</div>;
    }
    
    return transactions
      .filter(t => t.status === 'Passed')
      .map((transaction, index) => (
        <div key={`transaction-${index}`} className="stock-page__transaction">
          <div className="stock-page__transaction-details">
            <div className="stock-page__transaction-quantity">
              {transaction.quantity} stocks
            </div>
            <div className="stock-page__transaction-time">
              {formatTime(transaction.timestamp)}
            </div>
          </div>
          <div className={`stock-page__transaction-action stock-page__transaction-action--${transaction.action}`}>
            {transaction.action === 'buy' ? 'Buy' : 'Sell'}
          </div>
        </div>
      ));
  };
  
  // Render live notifications
  const renderNotifications = () => {
    if (liveTransactions.length === 0) {
      return <div className="stock-page__empty">No activity yet</div>;
    }
    
    return liveTransactions.map((transaction, index) => (
      <div key={`notification-${index}`} className="stock-page__notification">
        <div>
          <span className="stock-page__notification-user">{transaction.user}</span>
          {' '}
          <span className={`stock-page__notification-action stock-page__notification-action--${transaction.action}`}>
            {transaction.action === 'buy' ? 'bought' : 'sold'}
          </span>
          {' '}
          <span className="stock-page__notification-quantity">
            {transaction.quantity} {selectedStock?.stock_name}
          </span>
        </div>
        <div className="stock-page__notification-time">
          {formatTime(transaction.timestamp)}
        </div>
      </div>
    ));
  };
  
  // Render wallet info
  const renderWalletInfo = () => {
    if (!userInfo) return null;
    
    const { wallet } = userInfo;
    const currentStockHolding = wallet.holdings[selectedStock?.stock_name || ''] || 0;
    
    return (
      <div className="stock-page__wallet-info">
        <div className="stock-page__wallet-balance">
          Balance: {formatCurrency(wallet.balance)}
        </div>
        <div className="stock-page__wallet-holdings">
          <div className="stock-page__holding">
            <span>{selectedStock?.stock_name} Holdings:</span>
            <span>{currentStockHolding} stocks</span>
          </div>
        </div>
      </div>
    );
  };
  
  if (loading || isInitializing) {
    return (
      <div className="stock-page">
        <Spinner />
      </div>
    );
  }
  
  if (!selectedStock) {
    return (
      <div className="stock-page">
        <div className="stock-page__error">
          <h2>Stock not found</h2>
          <p>The stock you're looking for doesn't exist or couldn't be loaded.</p>
          <button 
            className="stock-page__back-button"
            onClick={() => navigate('/')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="stock-page">
      <div className="stock-page__header">
        <h1>{selectedStock.stock_name}</h1>
        {renderWalletInfo()}
      </div>
      
      <div className="stock-page__content">
        <div className="stock-page__main">
          <div className="stock-page__controls">
            <div className="stock-page__dropdown">
              <div 
                className="stock-page__dropdown-header"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="stock-page__stock-symbol">
                  {selectedStock.stock_symbol || getStockSymbol(selectedStock.stock_name || '')}
                </div>
                <span>{selectedStock.stock_name}</span>
                <div style={{ marginLeft: 'auto' }}>
                  {dropdownOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>
              
              {dropdownOpen && (
                <div className="stock-page__dropdown-content">
                  {stocks.map(stock => (
                    <div 
                      key={stock.stock_name} 
                      className="stock-page__dropdown-item"
                      onClick={() => handleStockChange(stock.stock_name || '')}
                    >
                      <div className="stock-page__stock-symbol">
                        {getStockSymbol(stock.stock_name || '')}
                      </div>
                      <span>{stock.stock_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="stock-page__price-display">
              <div className="stock-page__price">
                {formatCurrency(currentPrice || selectedStock.base_price || 0)}
              </div>
              <div className={`stock-page__price-change stock-page__price-change--${percentChange >= 0 ? 'up' : 'down'}`}>
                {percentChange >= 0 ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                <span className="stock-page__percent">
                  {formatPercentage(percentChange || 0)}
                </span>
              </div>
            </div>
            
            <div className="stock-page__quantity">
              <span className="stock-page__quantity-label">Quantity:</span>
              <input 
                type="number" 
                className="stock-page__quantity-input"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                min="1"
              />
            </div>
            
            <div className="stock-page__action-buttons">
              <button 
                className="stock-page__buy-button"
                onClick={() => handleTransaction('buy')}
              >
                Buy
              </button>
              <button 
                className="stock-page__sell-button"
                onClick={() => handleTransaction('sell')}
              >
                Sell
              </button>
            </div>
          </div>
          
          <div className="stock-page__graph-container" ref={graphContainerRef}>
            {renderGrid()}
            {renderXAxisLabels()}
            {renderYAxisLabels()}
            <div className="stock-page__bars" ref={barsContainerRef}>
              {renderBars()}
            </div>
          </div>
        </div>
        
        <div className="stock-page__sidebar">
          <div className="stock-page__tab-container">
            <div className="stock-page__tabs">
              <div 
                className={`stock-page__tab ${activeTab === 'history' ? 'stock-page__tab--active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                History
              </div>
              <div 
                className={`stock-page__tab ${activeTab === 'live' ? 'stock-page__tab--active' : ''}`}
                onClick={() => setActiveTab('live')}
              >
                Live
              </div>
            </div>
            
            <div className="stock-page__tab-content">
              {activeTab === 'history' ? renderTransactions() : renderNotifications()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockPage;