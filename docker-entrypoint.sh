#!/bin/sh
# Selects which SonicStream service this container runs, by SONIC_ROLE.
case "${SONIC_ROLE:-server}" in
  worker)    exec node dist/worker.cjs ;;
  scheduler) exec node dist/scheduler.cjs ;;
  server|all|ai|*) exec node dist/server.cjs ;;
esac
