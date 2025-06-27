import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="de">
      <Head>
        <link rel="icon" href="/images/logo-fixed/Logo CT mittig 4c.webp" type="image/webp" />
        <meta name="description" content="Contact Tables verbindet Menschen anonym am Restauranttisch – für echte Gespräche statt Einsamkeit." />
        <meta name="theme-color" content="#d3d800" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
