Product Catalog MCP Server Implementation Guide
This guide explains how to set up the Model Context Protocol (MCP) server for your product catalog service, allowing you to demonstrate AI-driven strategic decision making to your leadership team.
What is MCP?
Model Context Protocol (MCP) is an open protocol that standardizes how applications provide context to LLMs like Claude. It acts as a unified connector, similar to a USB-C port, allowing AI models to seamlessly access your application's data.
Implementation Overview
The MCP server included in this project allows Claude to:

Query your product catalog database directly
Search for products by name or category
Check inventory levels
Analyze product trends and popularity
Make strategic recommendations based on product data

Files Added to Your Project

catalog-mcp-server/index.js: The main MCP server implementation that defines the tools Claude can use
catalog-mcp-server/package.json: Dependencies for the MCP server
catalog-mcp-server/Dockerfile: Container definition for the MCP server
docker-compose.mcp.yml: Docker Compose configuration for running the MCP server

Setup Instructions

Create the MCP server directory:
bashmkdir -p catalog-mcp-server

Copy the provided files to your project:
Copy the code from the artifacts provided into the corresponding files in your project.
Start your main application:
bashdocker compose up -d
npm install --omit=optional
npm run dev

Start the MCP server:
bashcd catalog-mcp-server
npm install
npm start
Or using Docker:
bashdocker compose -f docker-compose.mcp.yml up -d

Connect Claude Desktop to the MCP server:

Open Claude Desktop
Go to Settings > Model Context Protocol
Add a new server with address: http://localhost:9000
Click "Connect"



Leadership Demo Guide
Once connected, you can ask Claude questions like:
Strategic Product Analysis

"What are our top product categories?"
"Which products have the highest profit margins?"
"What inventory optimization opportunities do we have?"

Trend Analysis

"What product trends should we be aware of?"
"Which product categories are growing fastest?"
"What's our inventory vs. demand breakdown?"

Strategic Decision Support

"What market opportunities exist based on our product portfolio?"
"Where should we focus our marketing budget based on product performance?"
"What product categories should we expand based on current data?"

Extending the MCP Server
The current implementation provides basic functionality. You can extend it by:

Adding more sophisticated analytics tools
Connecting to your actual sales data
Implementing real-time inventory tracking
Adding competitive analysis capabilities

Troubleshooting

If Claude cannot connect to the MCP server, ensure it's running and accessible
Check the MCP server logs for any errors
Verify your PostgreSQL connection details are correct
