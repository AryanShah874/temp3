import React from 'react';
import { Transaction } from '../../types';
import { formatTime } from '../../utils/dataUtils';
import './TransactionItem.scss';

interface TransactionItemProps {
  transaction: Transaction;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  const { stock_name, stock_symbol, transaction_price, timestamp, status } = transaction;
  
  // Format currency based on the symbol (assuming INR for the example)
  const formatCurrency = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };
  
  return (
    <div className="transaction-item">
      <div className="transaction-item__cell">
        <p className="transaction-item__stock-name">{stock_name}</p>
      </div>
      <div className="transaction-item__cell transaction-item__cell--text-center">
        <p className="transaction-item__stock-symbol">{stock_symbol}</p>
      </div>
      <div className="transaction-item__cell transaction-item__cell--text-right">
        <p className="transaction-item__price">{formatCurrency(transaction_price)}</p>
      </div>
      <div className="transaction-item__cell transaction-item__cell--text-right">
        <p className="transaction-item__timestamp">{formatTime(timestamp)}</p>
      </div>
      <div 
        className={`transaction-item__status-indicator transaction-item__status-indicator--${status === 'Passed' ? 'success' : 'failed'}`}
      />
    </div>
  );
};

export default TransactionItem;