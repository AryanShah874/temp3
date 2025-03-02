import { WebSocketMessage, Transaction, PricePoint } from '../types';
import { 
  setWebSocketConnected, 
  setUserInfo, 
  updateUserWallet, 
  addTransaction, 
  addLiveTransaction, 
  updateStockPrice, 
  addPricePoint,
  setPriceHistory
} from '../store/stockSlice';
import { store } from '../store';

let socket: WebSocket | null = null;
let currentStockRoom: string | null = null;
let connectionAttempts = 0;
const MAX_ATTEMPTS = 3;

// Mock data for when WebSocket is not available
let mockUserData = {
  userId: 'mock-user-id',
  userName: 'MockUser',
  wallet: {
    balance: 25000,
    holdings: {}
  }
};

// Initialize WebSocket connection
export const initializeWebSocket = (): Promise<void> => {
  return new Promise((resolve) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      resolve();
      return;
    }

    // Close existing socket if it exists
    if (socket) {
      socket.close();
    }

    // In development environment, we might not have the WebSocket server running
    // So we'll use mock data if we can't connect after a few attempts
    if (connectionAttempts >= MAX_ATTEMPTS) {
      console.log('Using mock data for WebSocket');
      store.dispatch(setUserInfo(mockUserData));
      store.dispatch(setWebSocketConnected(true));
      resolve();
      return;
    }

    connectionAttempts++;

    try {
      // Create new WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.hostname}:8080`;
      
      socket = new WebSocket(wsUrl);

      // Set a timeout for the connection
      const connectionTimeout = setTimeout(() => {
        if (socket && socket.readyState !== WebSocket.OPEN) {
          socket.close();
          socket = null;
          console.log(`WebSocket connection attempt ${connectionAttempts} timed out`);
          initializeWebSocket().then(resolve);
        }
      }, 3000);

      socket.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket connection established');
        connectionAttempts = 0;
        store.dispatch(setWebSocketConnected(true));
        resolve();
      };

      socket.onclose = () => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket connection closed');
        store.dispatch(setWebSocketConnected(false));
        socket = null;
      };

      socket.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error('WebSocket error:', error);
        socket = null;
        initializeWebSocket().then(resolve);
      };

      socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      initializeWebSocket().then(resolve);
    }
  });
};

// Handle WebSocket messages
const handleWebSocketMessage = (message: WebSocketMessage) => {
  switch (message.type) {
    case 'USER_INFO':
      store.dispatch(setUserInfo({
        userId: message.userId,
        userName: message.userName,
        wallet: message.wallet
      }));
      break;

    case 'STOCK_PRICE':
      store.dispatch(setPriceHistory(message.history || []));
      break;

    case 'STOCK_PRICE_UPDATE':
      store.dispatch(updateStockPrice({
        stockName: message.stockName,
        previousPrice: message.previousPrice,
        currentPrice: message.currentPrice,
        change: message.change,
        percentChange: message.percentChange,
        timestamp: message.timestamp
      }));
      
      store.dispatch(addPricePoint({
        price: message.currentPrice,
        timestamp: message.timestamp
      }));
      break;

    case 'TRANSACTION_RESULT':
      // Update user wallet
      store.dispatch(updateUserWallet(message.wallet));
      
      // Add transaction to history if successful
      if (message.transaction.status === 'Passed') {
        store.dispatch(addTransaction(message.transaction));
      }
      break;

    case 'LIVE_TRANSACTION':
      // Add to live transactions feed
      store.dispatch(addLiveTransaction(message.transaction));
      break;

    default:
      console.log('Unhandled WebSocket message type:', message.type);
  }
};

// Join a stock room
export const joinStockRoom = (stockName: string) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.log('WebSocket not connected, using mock data');
    
    // If WebSocket is not connected, use mock data
    const mockPrice = 500 + Math.floor(Math.random() * 200);
    const mockPriceHistory: PricePoint[] = [];
    
    // Generate mock price history
    const now = new Date();
    for (let i = 0; i < 10; i++) {
      const timestamp = new Date(now.getTime() - (10 - i) * 5000).toISOString();
      mockPriceHistory.push({
        price: mockPrice - 100 + Math.floor(Math.random() * 200),
        timestamp
      });
    }
    
    // Add current price
    mockPriceHistory.push({
      price: mockPrice,
      timestamp: now.toISOString()
    });
    
    // Update store with mock data
    store.dispatch(setPriceHistory(mockPriceHistory));
    store.dispatch(updateStockPrice({
      stockName,
      previousPrice: mockPriceHistory[mockPriceHistory.length - 2].price,
      currentPrice: mockPrice,
      change: mockPrice - mockPriceHistory[mockPriceHistory.length - 2].price,
      percentChange: ((mockPrice - mockPriceHistory[mockPriceHistory.length - 2].price) / mockPriceHistory[mockPriceHistory.length - 2].price) * 100,
      timestamp: now.toISOString()
    }));
    
    // Start mock price updates
    startMockPriceUpdates(stockName);
    
    return;
  }

  // Leave current room if any
  if (currentStockRoom) {
    leaveStockRoom();
  }

  // Join new room
  socket.send(JSON.stringify({
    type: 'JOIN_STOCK_ROOM',
    stockName
  }));

  currentStockRoom = stockName;
};

// Mock price updates for when WebSocket is not available
let mockPriceInterval: NodeJS.Timeout | null = null;

function startMockPriceUpdates(stockName: string) {
  if (mockPriceInterval) {
    clearInterval(mockPriceInterval);
  }
  
  mockPriceInterval = setInterval(() => {
    const { currentPrice } = store.getState().stocks;
    const priceChange = Math.floor(Math.random() * 1001) - 500;
    const newPrice = Math.max(1, currentPrice + priceChange);
    const percentChange = ((newPrice - currentPrice) / currentPrice) * 100;
    
    store.dispatch(updateStockPrice({
      stockName,
      previousPrice: currentPrice,
      currentPrice: newPrice,
      change: priceChange,
      percentChange,
      timestamp: new Date().toISOString()
    }));
    
    store.dispatch(addPricePoint({
      price: newPrice,
      timestamp: new Date().toISOString()
    }));
  }, 5000);
}

function stopMockPriceUpdates() {
  if (mockPriceInterval) {
    clearInterval(mockPriceInterval);
    mockPriceInterval = null;
  }
}

// Leave current stock room
export const leaveStockRoom = () => {
  // Stop mock price updates if they're running
  stopMockPriceUpdates();
  
  if (!socket || socket.readyState !== WebSocket.OPEN || !currentStockRoom) {
    return;
  }

  socket.send(JSON.stringify({
    type: 'LEAVE_STOCK_ROOM',
    stockName: currentStockRoom
  }));

  currentStockRoom = null;
};

// Send a transaction
export const sendTransaction = (transaction: Partial<Transaction>) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.log('WebSocket not connected, simulating transaction');
    
    // Simulate transaction with mock data
    const mockTransaction: Transaction = {
      stock_name: transaction.stock_name || '',
      stock_symbol: transaction.stock_symbol || '',
      transaction_price: transaction.transaction_price || 0,
      quantity: transaction.quantity || 0,
      action: transaction.action || 'buy',
      timestamp: new Date().toISOString(),
      status: 'Passed',
      user: mockUserData.userName
    };
    
    // Update wallet
    const totalCost = mockTransaction.transaction_price * (mockTransaction.quantity || 0);
    let newBalance = mockTransaction.action === 'buy' 
      ? mockUserData.wallet.balance - totalCost
      : mockUserData.wallet.balance + totalCost;
    
    // Check if transaction should succeed
    if (mockTransaction.action === 'buy' && newBalance < 0) {
      mockTransaction.status = 'Failed';
    } else if (mockTransaction.action === 'sell') {
      const currentHolding = mockUserData.wallet.holdings[mockTransaction.stock_name] || 0;
      if (currentHolding < (mockTransaction.quantity || 0)) {
        mockTransaction.status = 'Failed';
      }
    }
    
    // Update mock wallet if transaction succeeded
    if (mockTransaction.status === 'Passed') {
      mockUserData.wallet.balance = newBalance;
      
      if (mockTransaction.action === 'buy') {
        if (!mockUserData.wallet.holdings[mockTransaction.stock_name]) {
          mockUserData.wallet.holdings[mockTransaction.stock_name] = 0;
        }
        mockUserData.wallet.holdings[mockTransaction.stock_name] += (mockTransaction.quantity || 0);
      } else {
        mockUserData.wallet.holdings[mockTransaction.stock_name] -= (mockTransaction.quantity || 0);
      }
      
      // Dispatch actions
      store.dispatch(updateUserWallet(mockUserData.wallet));
      store.dispatch(addTransaction(mockTransaction));
      store.dispatch(addLiveTransaction(mockTransaction));
    }
    
    return;
  }

  socket.send(JSON.stringify({
    type: 'TRANSACTION',
    transaction
  }));
};

// Close WebSocket connection
export const closeWebSocket = () => {
  stopMockPriceUpdates();
  
  if (socket) {
    socket.close();
    socket = null;
  }
};