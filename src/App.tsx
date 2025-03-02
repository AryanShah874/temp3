import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Dashboard from './pages/Dashboard/Dashboard';
// import Portfolio from './pages/Portfolio/Portfolio';
import Summarizer from './pages/Summarizer/StockSummarizer'
import './App.scss';
import MyPortfolio from './pages/MyPortfolio/MyPortfolio';
import Header from './components/Header/Header';
import StockPage from './pages/StockPage/StockPage';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/portfolio" element={<MyPortfolio />} />
          <Route path="/summarizer" element={<Summarizer />} />
          <Route path='/stock/:name' element={<StockPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;