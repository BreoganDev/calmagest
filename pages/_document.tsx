import { Head, Html, Main, NextScript } from 'next/document';

// Some tooling/plugins (e.g. PWA wrappers) still probe for `/_document` even in App Router projects.
// Providing a minimal Document avoids build-time `PageNotFoundError: /_document` failures.
export default function Document() {
  return (
    <Html lang="es">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

