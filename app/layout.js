import { Pacifico, Mitr } from 'next/font/google';
import './globals.css';

const pacifico = Pacifico({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
});

const mitr = Mitr({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata = {
  title: 'Zefir_of_love',
  description: 'ระบบสั่งอาหารร้านบุฟเฟต์ Zefir_of_love',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className={`${pacifico.variable} ${mitr.variable}`}>
        {children}
      </body>
    </html>
  );
}
