import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { UserAuthProvider } from './contexts/UserAuthContext.jsx';
import { DataProvider } from './contexts/DataContext.jsx';
import { CurrencyProvider } from './contexts/CurrencyContext.jsx';
import { AudioProvider } from './contexts/AudioContext.jsx';
import { ToastProvider } from './admin/components/Toast.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <ThemeProvider>
<AuthProvider>
<UserAuthProvider>
<DataProvider>
<CurrencyProvider>
<AudioProvider>
                  <App />
</AudioProvider>
</CurrencyProvider>
</DataProvider>
</UserAuthProvider>
</AuthProvider>
        </ThemeProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
