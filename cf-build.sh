#!/usr/bin/env bash
# Credits go to: Pablo Martí Gamboa
# https://pablomarti.dev/deploy-zola-to-clouflare-workers/

main() {
  ZOLA_VERSION=0.21.0

  export TZ=Europe/Madrid

  # Install Zola
  echo "Installing Zola ${ZOLA_VERSION}..."
  curl -sLJO "https://github.com/getzola/zola/releases/download/v${ZOLA_VERSION}/zola-v{$ZOLA_VERSION}-x86_64-unknown-linux-gnu.tar.gz"
  mkdir "${HOME}/.local/zola"
  tar -C "${HOME}/.local/zola" -xf "zola-v${ZOLA_VERSION}-x86_64-unknown-linux-gnu.tar.gz"
  rm "zola-v${ZOLA_VERSION}-x86_64-unknown-linux-gnu.tar.gz"
  export PATH="${HOME}/.local/zola:${PATH}"

  # Build the site
  echo "Building the site..."
  # adjust the build script as wish, e.g.
  #  uglifyjs static/js/script.js --mangle > static/js/script.min.js
  #  uglifycss static/css/style.css > static/css/style.min.css

  zola build --minify
}

set -euo pipefail
main "$@"