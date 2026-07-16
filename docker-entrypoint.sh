#!/bin/sh
# docker-entrypoint.sh
#
# Runs as root at container startup to ensure the mounted data volume
# is owned by the 'node' user before handing off the process.
# Uses su-exec (Alpine native) to drop privileges cleanly.

set -e

DATA_DIR="/usr/src/app/data"

# Fix ownership of the data directory in case it was mounted by Docker/Coolify
# as root (which overrides the chown done during image build).
if [ "$(stat -c '%U' "$DATA_DIR" 2>/dev/null)" != "node" ]; then
  chown -R node:node "$DATA_DIR"
fi

# Drop to the 'node' user and exec the application
exec su-exec node node dist/server.js
