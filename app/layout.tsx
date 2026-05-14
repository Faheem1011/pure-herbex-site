import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
});

export const metadata: Metadata = {
  title: 'Pure Herbex Ultra Force | Potent Herbal Sexual Enhancement Pakistan',
  description: 'Pure Herbex Ultra Force is Pakistan\'s premium medical-grade herbal formula for sexual enhancement, natural stamina, and genital health. 100% Herbal. Rs. 3,000. Cash on Delivery Available.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-PK" className={`${inter.variable} ${sora.variable} scroll-smooth`}>
      <body className="font-sans" suppressHydrationWarning>{children}</body>
    </html>
  );
}
