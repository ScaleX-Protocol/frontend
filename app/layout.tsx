import type { Metadata } from 'next';
import './globals.css';
import LoadingScreen from '@/components/LoadingScreen';
import AppLoggerWrapper from '@/components/AppLoggerWrapper';

export const metadata: Metadata = {
  title: 'ScaleX - Trade Without Limits',
  description: 'Trade Without Limits. Protect Against Chaos.',
};

import { Space_Grotesk } from 'next/font/google';
import { ProvidersWithOnboarding } from '@/providers/ProvidersWithOnboarding';
import { WebSocketProvider } from '@/providers/websocketProvider';
import { Endpoints } from '@/configs/endpoints';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${spaceGrotesk.className}`}>
      <body className={`antialiased`}>
        <LoadingScreen />
        <AppLoggerWrapper>
          <ProvidersWithOnboarding>
            <WebSocketProvider url={Endpoints.websocket}>{children}</WebSocketProvider>
          </ProvidersWithOnboarding>
        </AppLoggerWrapper>
      </body>
    </html>
  );
}
