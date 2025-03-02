import React from 'react';
import { Transaction } from '../../types';
import TransactionItem from './TransactionItem';
import { formatDate } from '../../utils/dataUtils';
import './TransactionList.scss';
import Spinner from '../../components/Spinner/Spinner';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, isLoading }) => {
  if (isLoading) {
    return <Spinner />;
  }

  if (transactions.length === 0) {
    return (
      <div className="transaction-list__empty">
        <p className="transaction-list__empty-message">No transactions found.</p>
      </div>
    );
  }

  // Group transactions by date
  const groupedTransactions: { [key: string]: Transaction[] } = {};
  
  transactions.forEach((transaction) => {
    const date = formatDate(transaction.timestamp);
    if (!groupedTransactions[date]) {
      groupedTransactions[date] = [];
    }
    groupedTransactions[date].push(transaction);
  });

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  return (
    <div className="transaction-list">
      {sortedDates.map((date) => (
        <div key={date} className="transaction-list__group">
          <h3 className="transaction-list__date-header">{date}</h3>
          <div className="transaction-list__transactions-container">
            {groupedTransactions[date].map((transaction, index) => (
              <TransactionItem key={`${transaction.timestamp}-${index}`} transaction={transaction} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionList;