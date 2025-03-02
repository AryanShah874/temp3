import React from 'react';
import Header from '../../components/Header/Header';
import './Summarizer.scss';

const Summarizer: React.FC = () => {
  return (
    <div className="summarizer">
      <Header />
      
      <main className="summarizer__content">
        <h1 className="summarizer__title">Stock Summarizer</h1>
        <p className="summarizer__description">
          This tool provides summaries of stock performance and market trends.
        </p>
        
        <div className="summarizer__placeholder">
          <p>Summarizer content will be displayed here.</p>
        </div>
      </main>
    </div>
  );
};

export default Summarizer;