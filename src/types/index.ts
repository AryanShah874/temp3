export interface Stock {
  stock_name?: string;
  price?: number;
  base_price?: number;
}

export interface StockState {
  stocks: Stock[];
  watchlist: Stock[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  itemsPerPage: number;
}

//portfolio page
export interface Transaction {
  stock_name: string;
  stock_symbol: string;
  transaction_price: number;
  timestamp: string;
  status: "Passed" | "Failed";
  quantity?: number;
  action?: 'buy' | 'sell';
  user?: string;
}

export interface FilterState {
  searchQuery: string;
  statusFilters: {
    success: boolean;
    failed: boolean;
  };
  stockFilters: Record<string, boolean>;
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
}

//summarizer
export interface StockData {
  [company: string]: {
    [day: string]: number[];
  };
}

export interface StockResult {
  company: string;
  buyDay: number;
  buyPrice: number;
  sellDay: number;
  sellPrice: number;
  profit: number;
}

// Stock page
export interface PricePoint {
  price: number;
  timestamp: string;
}

export interface StockPriceUpdate {
  stockName: string;
  previousPrice: number;
  currentPrice: number;
  change: number;
  percentChange: number;
  timestamp: string;
}

export interface UserWallet {
  balance: number;
  holdings: {
    [stockName: string]: number;
  };
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}