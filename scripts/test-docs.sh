#!/bin/bash

# Exit on error
set -e

# Build the documentation container
docker-compose -f docker-compose.docs.yml build

# Start the documentation server
docker-compose -f docker-compose.docs.yml up -d

# Wait for the service to be ready
echo "Waiting for documentation server to be ready..."
sleep 10

# Test if the main page is accessible
if curl -s http://localhost:8000 | grep -q "Catalog Service Workshop"; then
    echo "✅ Main page is accessible"
else
    echo "❌ Main page is not accessible"
    exit 1
fi

# Test if the navigation structure is correct
for page in "develop/setup" "test/unit-tests" "build/docker-image" "secure/docker-scout"; do
    if curl -s http://localhost:8000/$page | grep -q "404 - Not Found"; then
        echo "❌ Page $page is missing"
        exit 1
    else
        echo "✅ Page $page is accessible"
    fi
done

# Test if the CSS and JavaScript are loaded correctly
if curl -s http://localhost:8000 | grep -q "material/style.css"; then
    echo "✅ CSS is loaded correctly"
else
    echo "❌ CSS is not loaded"
    exit 1
fi

# Test if code highlighting is working
if curl -s http://localhost:8000/develop/setup | grep -q "highlight"; then
    echo "✅ Code highlighting is working"
else
    echo "❌ Code highlighting is not working"
    exit 1
fi

# Test if mermaid diagrams are rendered
if curl -s http://localhost:8000 | grep -q "mermaid"; then
    echo "✅ Mermaid diagrams are working"
else
    echo "❌ Mermaid diagrams are not working"
    exit 1
fi

# Cleanup
docker-compose -f docker-compose.docs.yml down

echo "\n✨ Documentation tests completed successfully!"