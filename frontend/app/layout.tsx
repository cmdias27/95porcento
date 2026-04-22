import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from "@/components/ThemeProvider"
import { ThemeToggle } from "@/components/ThemeToggle"

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
      {/* AS CORES ESTÃO AQUI NO BODY 👇 */}
      <body className={`${inter.className} bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          
          {children}

        </ThemeProvider>
      </body>
    </html>
  )
}