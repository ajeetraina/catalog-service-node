#!/bin/bash
API_URL="http://localhost:3000/api"
 
echo "Seeding test products..."
 
curl -s -X POST "$API_URL/products" \
  -H "Content-Type: application/json" \
  -d '{"name":"Vintage Camera","description":"Classic 35mm film camera","price":299.99,"upc":"CAM001"}' \
  > /dev/null && echo "✅ Vintage Camera"
 
curl -s -X POST "$API_URL/products" \
  -H "Content-Type: application/json" \
  -d '{"name":"Rare Vinyl Record - LAST ONE!","description":"Limited edition. Only 1 left!","price":149.99,"upc":"VINYL001"}' \
  > /dev/null && echo "✅ Rare Vinyl Record"
 
curl -s -X POST "$API_URL/products" \
  -H "Content-Type: application/json" \
  -d '{"name":"Professional DSLR Camera","description":"50MP camera with 8K video","price":2499.99,"upc":"CAMPRO001"}' \
  > /dev/null && echo "✅ Professional DSLR"
 
# Add bulk test products
for i in {4..15}; do
  curl -s -X POST "$API_URL/products" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Test Product $i\",\"description\":\"Bulk test product $i\",\"price\":$((50 + RANDOM % 450)).99,\"upc\":\"BULK$(printf '%03d' $i)\"}" \
    > /dev/null && echo "✅ Test Product $i"
done
 
echo ""
TOTAL=$(curl -s "$API_URL/products" | jq '. | length')
echo "Total products: $TOTAL"
echo "Ready! Visit http://localhost:5173"
