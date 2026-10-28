import './globals.css';
import SessionProvider from '@/components/SessionProvider';

export const metadata = {
  title: 'StudyStreak',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, background: '#020408' }}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}