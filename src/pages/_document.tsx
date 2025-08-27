import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document'

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    return (
      <Html lang="de">
        <Head>
          <link rel="icon" href="/images/logo-fixed/Logo CT mittig 4c.webp" type="image/webp" />
          <meta name="description" content="Contact Tables verbindet Menschen anonym am Restauranttisch – für authentische Gespräche und neue Begegnungen in entspannter Atmosphäre." />
          <meta name="theme-color" content="#d3d800" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
