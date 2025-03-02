import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Stock, StockState, Transaction, PricePoint, StockPriceUpdate, UserWallet } from '../types';

// Mock data in case API fails
const mockStocks: Stock[] = [
  { stock_name: 'AAPL', base_price: 500.24 },
  { stock_name: 'SBI', base_price: 500.24 },
  { stock_name: 'LIC', base_price: 500.24 },
  { stock_name: 'HDFC Bank', base_price: 500.24 },
  { stock_name: 'ITC', base_price: 500.24 },
  { stock_name: 'Hindustan Unilever', base_price: 500.24 },
  { stock_name: 'Zomato', base_price: 500.24 },
  { stock_name: 'Reliance', base_price: 500.24 },
  { stock_name: 'TCS', base_price: 500.24 },
  { stock_name: 'Infosys', base_price: 500.24 },
  { stock_name: 'Wipro', base_price: 500.24 },
  { stock_name: 'Bajaj Finance', base_price: 500.24 },
];

// Stock symbols mapping
const stockSymbols: Record<string, string> = {
  'AAPL': 'AAPL',
  'SBI': 'SBI',
  'LIC': 'LIC',
  'HDFC Bank': 'HDFC',
  'ITC': 'ITC',
  'Hindustan Unilever': 'HUL',
  'Zomato': 'ZOM',
  'Reliance': 'REL',
  'TCS': 'TCS',
  'Infosys': 'INF',
  'Wipro': 'WIP',
  'Bajaj Finance': 'BAJ',
};

export const fetchStocks = createAsyncThunk(
  'stocks/fetchStocks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('https://dev-1gyvfva3nqtb0v4.api.raw-labs.com/mock/stocks');
      if (!response.ok) {
        throw new Error('Server Error');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching stocks:', error);
      return rejectWithValue(mockStocks);
    }
  }
);

interface StockSliceState extends StockState {
  selectedStock: Stock | null;
  transactions: Transaction[];
  liveTransactions: Transaction[];
  priceHistory: PricePoint[];
  currentPrice: number;
  previousPrice: number;
  percentChange: number;
  userInfo: {
    userId: string;
    userName: string;
    wallet: UserWallet;
  } | null;
  webSocketConnected: boolean;
}

const initialState: StockSliceState = {
  stocks: mockStocks, // Initialize with mock data to avoid empty state
  watchlist: [],
  loading: false,
  error: null,
  currentPage: 1,
  itemsPerPage: 7,
  selectedStock: null,
  transactions: [],
  liveTransactions: [],
  priceHistory: [],
  currentPrice: 0,
  previousPrice: 0,
  percentChange: 0,
  userInfo: null,
  webSocketConnected: false,
};

const stockSlice = createSlice({
  name: 'stocks',
  initialState,
  reducers: {
    addToWatchlist: (state, action: PayloadAction<Stock>) => {
      const stockExists = state.watchlist.some(stock => stock.stock_name === action.payload.stock_name);
      if (!stockExists) {
        state.watchlist.push(action.payload);
      }
    },
    removeFromWatchlist: (state, action: PayloadAction<string>) => {
      state.watchlist = state.watchlist.filter(stock => stock.stock_name !== action.payload);
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setSelectedStock: (state, action: PayloadAction<string>) => {
      const stockName = action.payload;
      const stock = state.stocks.find(s => s.stock_name === stockName);
      
      if (stock) {
        state.selectedStock = {
          ...stock,
          stock_symbol: stockSymbols[stockName] || stockName.substring(0, 3).toUpperCase()
        };
      }
    },
    updateStockPrice: (state, action: PayloadAction<StockPriceUpdate>) => {
      const { currentPrice, previousPrice, percentChange } = action.payload;
      
      state.currentPrice = currentPrice;
      state.previousPrice = previousPrice;
      state.percentChange = percentChange;
    },
    addPricePoint: (state, action: PayloadAction<PricePoint>) => {
      state.priceHistory.push(action.payload);
      
      // Keep only the last 100 price points
      if (state.priceHistory.length > 100) {
        state.priceHistory.shift();
      }
    },
    setWebSocketConnected: (state, action: PayloadAction<boolean>) => {
      state.webSocketConnected = action.payload;
    },
    setUserInfo: (state, action: PayloadAction<any>) => {
      state.userInfo = action.payload;
    },
    updateUserWallet: (state, action: PayloadAction<UserWallet>) => {
      if (state.userInfo) {
        state.userInfo.wallet = action.payload;
      }
    },
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      // Add to transactions if it's the current user's transaction
      state.transactions.unshift(action.payload);
    },
    addLiveTransaction: (state, action: PayloadAction<Transaction>) => {
      // Add to live transactions for display in the notifications panel
      state.liveTransactions.unshift(action.payload);
      
      // Keep only the last 50 live transactions
      if (state.liveTransactions.length > 50) {
        state.liveTransactions.pop();
      }
    },
    clearTransactions: (state) => {
      state.transactions = [];
    },
    clearLiveTransactions: (state) => {
      state.liveTransactions = [];
    },
    clearPriceHistory: (state) => {
      state.priceHistory = [];
    },
    setPriceHistory: (state, action: PayloadAction<PricePoint[]>) => {
      state.priceHistory = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStocks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStocks.fulfilled, (state, action) => {
        state.loading = false;
        // Create a new sorted array instead of mutating the original
        const sortedStocks = [...action.payload].sort((a: Stock, b: Stock) => {
          const nameA = a.stock_name || '';
          const nameB = b.stock_name || '';
          return nameA.localeCompare(nameB);
        });
        state.stocks = sortedStocks;
      })
      .addCase(fetchStocks.rejected, (state, action) => {
        state.loading = false;
        state.error = 'Failed to fetch stocks';
        // Create a new sorted array instead of mutating the original
        const sortedMockStocks = [...mockStocks].sort((a, b) => {
          const nameA = a.stock_name || '';
          const nameB = b.stock_name || '';
          return nameA.localeCompare(nameB);
        });
        state.stocks = sortedMockStocks;
      });
  },
});

export const { 
  addToWatchlist, 
  removeFromWatchlist, 
  setCurrentPage,
  setSelectedStock,
  updateStockPrice,
  addPricePoint,
  setWebSocketConnected,
  setUserInfo,
  updateUserWallet,
  addTransaction,
  addLiveTransaction,
  clearTransactions,
  clearLiveTransactions,
  clearPriceHistory,
  setPriceHistory
} = stockSlice.actions;

export default stockSlice.reducer;