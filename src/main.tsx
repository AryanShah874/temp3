import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
// import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* <ThemeProvider> */}
      <CssBaseline />
      <App />
    {/* </ThemeProvider> */}
  </StrictMode>
);