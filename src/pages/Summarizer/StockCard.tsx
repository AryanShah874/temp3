import { Paper, Typography, Box } from '@mui/material';
import './StockCard.scss';

interface StockCardProps {
  company: string;
  buyDay: number;
  buyPrice: number;
  sellDay: number;
  sellPrice: number;
  profit: number;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getDate()}-${date.toLocaleString('en-US', { month: 'long' })}-${date.getFullYear()}`;
};

const StockCard: React.FC<StockCardProps> = ({ 
  company, 
  buyDay, 
  buyPrice, 
  sellDay, 
  sellPrice, 
  profit 
}) => {
  return (
    <Paper className={`card-container ${profit > 0 ? 'profit' : 'loss'}`} elevation={3}>
      <Box className="company-info">
        <Typography className="company-name">{company}</Typography>
        <Typography className="profit-margin">Profit margin: ₹{profit}</Typography>
      </Box>
      <Box className="trade-info">
        <Typography className="trade-detail">Buy: ₹{buyPrice} on {formatDate(buyDay.toString())}</Typography>
        <Typography className="trade-detail">Sell: ₹{sellPrice} on {formatDate(sellDay.toString())}</Typography>
      </Box>
    </Paper>
  );
};

export default StockCard;
