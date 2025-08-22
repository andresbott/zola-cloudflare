// Constants
const CFP_COOKIE_KEY = 'CFP-Auth-Key';
const CFP_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 1 week
const CFP_ALLOWED_PATHS = ['/cfp_login'];

// Utility functions
async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.prototype.map
    .call(new Uint8Array(buf), (x) => ('00' + x.toString(16)).slice(-2))
    .join('');
}

async function getCookieKeyValue(password?: string): Promise<string> {
  const hash = await sha256(password);
  return `${CFP_COOKIE_KEY}=${hash}`;
}

// Template function
function getTemplate({
  redirectPath,
  withError
}: {
  redirectPath: string;
  withError: boolean;
}): string {
  return `
  <!doctype html>
  <html lang="en" data-theme="dark">

    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Password Protected Site</title>
      <meta name="description" content="This site is password protected.">

      <style>
        *, *::before, *::after {
          box-sizing: border-box;
        }
        
        :root {
          --color-primary: #1095c1;
          --color-primary-hover: #0d85ad;
          --color-secondary: #9da9bb;
          --color-error: #ff3333;
          --color-background: #11191f;
          --color-surface: #1e2a36;
          --color-text: #ffffff;
          --color-error-background: #ffffff;
          --spacing-sm: 0.5em;
          --spacing-md: 1em;
          --spacing-lg: 2em;
          --border-radius: 10px;
          --max-width: 600px;
        }

        body {
          background-color: var(--color-background);
          color: var(--color-text);
          font-family: system-ui, -apple-system, "Segoe UI", "Roboto", sans-serif;
        }

        body > main {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: calc(100vh - 7rem);
          padding: var(--spacing-md) 0;
          max-width: var(--max-width);
          margin: 0 auto;
        }

        article {
          background-color: var(--color-surface);
          padding: var(--spacing-lg);
          border-radius: var(--border-radius);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .error {
          background: var(--color-error-background);
          border-radius: var(--border-radius);
          color: var(--color-error);
          padding: var(--spacing-sm) var(--spacing-md);
          margin-bottom: var(--spacing-md);
        }

        h1 {
          color: var(--color-text);
          margin-bottom: var(--spacing-sm);
        }

        h2 { 
          color: var(--color-secondary);
          font-weight: normal;
          margin-top: 0;
        }

        input[type="password"] {
          width: 100%;
          padding: var(--spacing-md);
          margin: var(--spacing-md) 0;
          border-radius: var(--border-radius);
          border: 1px solid var(--color-secondary);
          background-color: var(--color-background);
          color: var(--color-text);
        }

        button {
          background-color: var(--color-primary);
          color: var(--color-text);
          border: none;
          border-radius: var(--border-radius);
          padding: var(--spacing-md) var(--spacing-lg);
          cursor: pointer;
          font-weight: bold;
          transition: background-color 0.2s;
        }

        button:hover {
          background-color: var(--color-primary-hover);
        }
      </style>
    </head>

    <body>
      <main>
        <article>
          <hgroup>
            <h1>Password</h1>
            <h2>Please enter your password for this site.</h2>
          </hgroup>
          ${withError ? `<p class="error">Incorrect password, please try again.</p>` : ''}
          <form method="post" action="/cfp_login">
            <input type="hidden" name="redirect" value="${redirectPath}" />
            <input type="password" name="password" placeholder="Password" aria-label="Password" autocomplete="current-password" required autofocus>
            <button type="submit" class="contrast">Login</button>
          </form>
        </article>
      </main>
    </body>

  </html>
  `;
}

export default {
  async fetch(request: Request, env: { CFP_PASSWORD?: string, ASSETS?: any }): Promise<Response> {

    const url = new URL(request.url);
    const { pathname, searchParams } = url;
    const { error } = Object.fromEntries(searchParams);
    const cookie = request.headers.get('cookie') || '';
    const cookieKeyValue = await getCookieKeyValue(env.CFP_PASSWORD);

    // Handle login form submission
    if (pathname === '/cfp_login' && request.method === 'POST') {
      const formData = await request.formData();
      const { password, redirect } = Object.fromEntries(formData);
      const hashedPassword = await sha256(password.toString());
      const hashedCfpPassword = await sha256(env.CFP_PASSWORD);
      const redirectPath = redirect.toString() || '/';

      if (hashedPassword === hashedCfpPassword) {
        // Valid password. Redirect to home page and set cookie with auth hash.
        return new Response('', {
          status: 302,
          headers: {
            'Set-Cookie': `${cookieKeyValue}; Max-Age=${CFP_COOKIE_MAX_AGE}; Path=/; HttpOnly; Secure`,
            'Cache-Control': 'no-cache',
            Location: redirectPath
          }
        });
      } else {
        // Invalid password. Redirect to login page with error.
        return new Response('', {
          status: 302,
          headers: {
            'Cache-Control': 'no-cache',
            Location: `${redirectPath}?error=1`
          }
        });
      }
    }

    const isAuthenticated = cookie.includes(cookieKeyValue);
    const isAllowedPath = CFP_ALLOWED_PATHS.includes(pathname);

    if (isAuthenticated || isAllowedPath) {
      // Using env.ASSETS to fetch the asset instead of creating an infinite loop
      // by calling fetch with the same request that triggered this function
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }
      // Fallback if ASSETS is not available
      return new Response('assets handler is not configured', {
        status: 500,
        headers: { 'content-type': 'text/plain' }
      });
    } else {
      // No cookie or incorrect hash in cookie. Show login page.
      return new Response(getTemplate({ redirectPath: pathname, withError: error === '1' }), {
        headers: {
          'content-type': 'text/html',
          'cache-control': 'no-cache'
        }
      });
    }
  },
} satisfies ExportedHandler;