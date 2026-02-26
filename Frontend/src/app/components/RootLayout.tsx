import { Outlet } from 'react-router';
import { StarknetProvider } from '../../lib/starknet';
import { ZkKeypairProvider } from '../../contexts/ZkKeypairContext';
import { Toaster } from 'sonner';

export function RootLayout() {
  return (
    <StarknetProvider>
      <ZkKeypairProvider>
        <div className="dark">
          <Outlet />
          <Toaster
            position="top-right"
            theme="dark"
            toastOptions={{
              style: {
                background: 'rgba(17, 24, 39, 0.95)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                backdropFilter: 'blur(12px)',
              },
            }}
          />
        </div>
      </ZkKeypairProvider>
    </StarknetProvider>
  );
}
