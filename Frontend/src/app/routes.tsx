import { createBrowserRouter } from 'react-router';
import { LandingPage } from './pages/LandingPage';
import { HomePage } from './pages/HomePage';
import { RootLayout } from './components/RootLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      {
        index: true,
        Component: LandingPage,
      },
      {
        path: 'app',
        Component: HomePage,
      },
    ],
  },
]);
