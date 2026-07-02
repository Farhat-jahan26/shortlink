import './globals.css'

export const metadata = {
  title: 'ShortLink',
  description: 'URL Shortener Platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}