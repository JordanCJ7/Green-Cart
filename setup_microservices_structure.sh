#!/usr/bin/env bash
set -euo pipefail

services=("authentication" "inventory" "payment" "notification")

for service in "${services[@]}"; do
  mkdir -p "${service}/.github/workflows" "${service}/api-docs"
  touch "${service}/.gitkeep" "${service}/api-docs/.gitkeep"

  cat > "${service}/Dockerfile" <<EOF
# Placeholder Dockerfile for ${service^} service
FROM alpine:3.20
WORKDIR /app
CMD ["sh", "-c", "echo ${service^} service placeholder container"]
EOF

  cat > "${service}/.github/workflows/ci.yml" <<EOF
name: ${service^} CI

on:
  push:
    paths:
      - '${service}/**'
  pull_request:
    paths:
      - '${service}/**'

jobs:
  placeholder:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Placeholder step
        run: echo "Add ${service^} build and test steps"
EOF
done

mkdir -p shared/architecture shared/docs
touch shared/architecture/.gitkeep shared/docs/.gitkeep

echo "Microservices scaffold created."
