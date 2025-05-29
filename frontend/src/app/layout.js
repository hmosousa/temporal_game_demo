import './globals.css'

export const metadata = {
  title: 'Temporal Game',
  description: 'A web demo for the TemporalGame',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
