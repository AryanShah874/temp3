import { Transaction } from '../types';

// Mock transactions data
const mockTransactions: Transaction[] = [
  {
    stock_name: "Zomato",
    stock_symbol: "ZOM",
    transaction_price: 142.32,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: "Passed",
    quantity: 100,
    action: "buy"
  },
  {
    stock_name: "Reliance",
    stock_symbol: "REL",
    transaction_price: 2500.75,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    status: "Passed",
    quantity: 50,
    action: "buy"
  },
  {
    stock_name: "TCS",
    stock_symbol: "TCS",
    transaction_price: 3450.20,
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    status: "Failed",
    quantity: 200,
    action: "buy"
  }
];

export const fetchTransactions = async (): Promise<Transaction[]> => {
  try {
    const response = await fetch('https://dev-1gyvfva3nqtb0v4.api.raw-labs.com/mock/portfolio-transactions');
    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }
    
    const data = await response.json();
    
    // Map the API response to match our expected format
    // Ensure status is 'Success' or 'Failed' (capitalize first letter)
    return data.map((item: any) => ({
      ...item,
      status: item.status === 'success' ? 'Success' : 
              item.status === 'failed' ? 'Failed' : item.status
    }));
  } catch (error) {
    console.error('Error fetching transactions:', error);
    // Return mock data if API fails
    return mockTransactions;
  }
};

export const addTransaction = (transaction: Transaction): Promise<Transaction> => {
  // This is a mock implementation since we don't have a real backend
  // In a real application, this would make a POST request to the backend
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(transaction);
    }, 500);
  });
};