#!/usr/bin/env bash
# ── SentinelAI — Local E2E Test Runner ───────────────────────────────────
#
# Usage:
#   cd tests
#   bash run_tests.sh              # Run all tests
#   bash run_tests.sh -m smoke     # Run only smoke tests
#   bash run_tests.sh --teardown   # Just tear down services
# ─────────────────────────────────────────────────────────────────────────

set -euo pipefail
cd "$(dirname "$0")"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

PYTEST_ARGS="${@:---tb=short -v}"

# ── Teardown mode ────────────────────────────────────────────────────────
if [[ "${1:-}" == "--teardown" ]]; then
    echo -e "${CYAN}Tearing down test infrastructure...${NC}"
    docker compose -f docker-compose.test.yml down -v --remove-orphans 2>/dev/null || true
    echo -e "${GREEN}Done.${NC}"
    exit 0
fi

echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN} SentinelAI — E2E Test Runner${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"

# ── 1. Start services ────────────────────────────────────────────────────
echo -e "\n${CYAN}[1/5] Starting Docker Compose services...${NC}"
docker compose -f docker-compose.test.yml up -d --build

# ── 2. Wait for services ────────────────────────────────────────────────
echo -e "${CYAN}[2/5] Waiting for services to be healthy...${NC}"
for i in $(seq 1 40); do
    if curl -sf http://localhost:8000/api/v1/health > /dev/null 2>&1 && \
       curl -sf http://localhost:9999/health > /dev/null 2>&1; then
        echo -e "${GREEN}  All services healthy (attempt $i)${NC}"
        break
    fi
    if [ $i -eq 40 ]; then
        echo -e "${RED}  Services failed to start!${NC}"
        docker compose -f docker-compose.test.yml logs api-test
        exit 1
    fi
    sleep 2
done

# ── 3. Stamp Alembic (tables created by app startup via create_all) ─────
echo -e "${CYAN}[3/5] Stamping Alembic version...${NC}"
docker compose -f docker-compose.test.yml exec -T api-test \
    sh -c 'cd /app && PYTHONPATH=/app alembic stamp head'

# ── 4. Seed test data ───────────────────────────────────────────────────
echo -e "${CYAN}[4/5] Seeding test data...${NC}"
python3 seed_data.py --host localhost --port 5433

# ── 5. Run tests ────────────────────────────────────────────────────────
echo -e "${CYAN}[5/5] Running E2E tests...${NC}"
mkdir -p results

export API_BASE_URL=http://localhost:8000
export MOCK_SERVER_URL=http://localhost:9999
export MOCK_SERVER_INTERNAL_URL=http://mock-server:9999

pytest $PYTEST_ARGS --junit-xml=results/e2e-results.xml 2>&1 | tee results/test-output.txt
TEST_EXIT=$?

echo -e "\n${CYAN}═══════════════════════════════════════════════════════════════${NC}"
if [ $TEST_EXIT -eq 0 ]; then
    echo -e "${GREEN} All tests passed!${NC}"
else
    echo -e "${RED} Some tests failed (exit code: $TEST_EXIT)${NC}"
fi
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "\nTo tear down: ${CYAN}bash run_tests.sh --teardown${NC}"
exit $TEST_EXIT
