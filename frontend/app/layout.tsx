import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { ThemeProvider } from "@/components/ThemeProvider"
import { Footer } from "@/components/Footer"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Aprendizado Ativo',
  description: 'Plataforma de Estudos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      {/* Google tag (gtag.js) — Google Ads */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-18177691059"
        strategy="afterInteractive"
      />
      <Script id="google-gtag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-18177691059');
        `}
      </Script>
      {/* AS CORES ESTÃO AQUI NO BODY 👇 */}
      <body className={`${inter.className} bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>

          {children}
          <Footer />

        </ThemeProvider>
      </body>
    </html>
  )
}