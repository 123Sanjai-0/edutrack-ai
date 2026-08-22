#!/usr/bin/env bash
set -o errexit

echo "=== Installing Python dependencies ==="
pip install --upgrade pip
pip install -r requirements.txt

echo "=== Seeding database ==="
python -m app.seeds.seed_data

echo "=== Build complete ==="
