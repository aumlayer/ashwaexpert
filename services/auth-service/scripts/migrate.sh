#!/usr/bin/env bash
set -euo pipefail

alembic -c alembic.ini upgrade head
