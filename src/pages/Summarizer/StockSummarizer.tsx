import { useState, useEffect } from 'react';
// import { styled } from '@mui/material/styles';
import { Box, Typography, Container } from '@mui/material';
// import { ClipLoader } from 'react-spinners';
import StockCard from './StockCard';
import { StockData, StockResult } from '../../types';
import './StockSummarizer.scss';
import Spinner from '../../components/Spinner/Spinner';

const StockSummarizer: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [stockResults, setStockResults] = useState<StockResult[]>([]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/stockWorker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope:', registration.scope);

          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data.type === 'STOCK_RESULTS') {
              setStockResults(event.data.results);
              setLoading(false);
            }
          });

          fetch('https://dev-1gyvfva3nqtb0v4.api.raw-labs.com/mock/all-stocks-transactions')
            .then(response => {return response.json();})
            .then((data: StockData) => {
              if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                  type: 'PROCESS_STOCKS',
                  data: data
                });
              }
            })
            .catch(error => {
              console.error('Error fetching stock data:', error);
              setLoading(false);
            });
          })
        .catch(error => {
          console.error('ServiceWorker registration failed:', error);
          setLoading(false);
        });
    } else {
      console.error('Service workers are not supported in this browser');
      setLoading(false);
    }

    return () => {
      navigator.serviceWorker.removeEventListener('message', () => {});
    };
  }, []);

  return (
    <Box className="main-container">
      <Container className="content-container" maxWidth={false}>
        {loading ? (
          <Box className="loading-container">
            {/* <ClipLoader color="#1976d2" size={60} /> */}
            <Spinner />
            <Typography className="loading-text">
              Calculating maximum profit opportunities...
            </Typography>
          </Box>
        ) : (
          <Box className="cards-container">
            {stockResults.map((result, index) => (
              <StockCard
                key={index}
                company={result.company}
                buyDay={result.buyDay}
                buyPrice={result.buyPrice}
                sellDay={result.sellDay}
                sellPrice={result.sellPrice}
                profit={result.profit}
              />
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default StockSummarizer;
