import './globals.css';

export const metadata = {
  title: 'Recipe Share',
  description: 'Share and browse simple community recipes.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
