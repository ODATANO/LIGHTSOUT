# The kit, the MCP server and the sandbox service in one image. It holds no proving keys:
# compose mounts contracts/*/managed/*/keys.
FROM node:22-bookworm
WORKDIR /app
COPY package.json package-lock.json ./
COPY kit/package.json kit/
COPY mcp/package.json mcp/
COPY web/package.json web/
COPY contracts/midnight-bridge/package.json contracts/midnight-bridge/
COPY contracts/board/package.json contracts/board/
COPY crates/burn-proof-js/package.json crates/burn-proof-js/
RUN npm ci --no-audit --no-fund
COPY . .
