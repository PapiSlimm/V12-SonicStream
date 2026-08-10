#!/bin/bash
# generate-routes.sh

mkdir -p server/routes
mkdir -p server/domains/{identity,music,social,finance,events}

# Generate basic route files as ESM bridges so we retain optimal production TypeScript logic
for route in admin printing ai crm affiliates aijobs integrations marketing artist search recommendations ai-playlist bandcamp credits curation radio assets rss video analytics brain legal bandcamp-webhook webhooks marketplace tenants sitemap; do
  echo "export * from './$route.ts';" > server/routes/$route.js
done

# Generate domain route files
for route in user; do
  echo "export * from './$route.routes.ts';" > server/domains/identity/$route.routes.js
done

for route in tracks playlists; do
  echo "export * from './$route.routes.ts';" > server/domains/music/$route.routes.js
done

for route in social rooms notifications; do
  echo "export * from './$route.routes.ts';" > server/domains/social/$route.routes.js
done

for route in payments royalties payouts billing; do
  echo "export * from './$route.routes.ts';" > server/domains/finance/$route.routes.js
done

for route in events bookings; do
  echo "export * from './$route.routes.ts';" > server/domains/events/$route.routes.js
done

echo "✅ All route bridge files generated"
