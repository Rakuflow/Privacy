import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './styles/index.css';
import { setupGlobalErrorHandling } from './utils/setupGlobalErrorHandling';

setupGlobalErrorHandling();

createRoot(document.getElementById('root')!).render(<App />);
