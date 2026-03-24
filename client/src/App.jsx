import React from 'react';
import { Toaster } from 'react-hot-toast';
import AppRouter from './routes/AppRouter';

const App = () => (
  <>
    <AppRouter />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: '12px',
          background: '#111b21',
          color: '#ffffff',
        },
      }}
    />
  </>
);

export default App;
