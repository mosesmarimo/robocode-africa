#!/bin/sh
# Builds all four RoboCode code-runner sandbox images.
# Run from anywhere; paths below are relative to this script's location.
set -e
cd "$(dirname "$0")/.."

docker build -f sandbox/Dockerfile.base -t robocode-sandbox-base sandbox
docker build -f sandbox/Dockerfile.go -t robocode-sandbox-go sandbox
docker build -f sandbox/Dockerfile.rust -t robocode-sandbox-rust sandbox
docker build -f sandbox/Dockerfile.csharp -t robocode-sandbox-csharp sandbox

echo "Built: robocode-sandbox-base robocode-sandbox-go robocode-sandbox-rust robocode-sandbox-csharp"
