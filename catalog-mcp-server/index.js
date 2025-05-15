// catalog-mcp-server/index.js
const { Server, createServer } = require('mcp');
const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

// PostgreSQL client setup
const pgClient = new Client({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'catalog',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

// Define MCP server
const server = createServer({
  name: 'catalog-service',
  description: 'MCP server for the product catalog service',
  version: '1.0.0',
  tools: [
    {
      name: 'list_products',
      description: 'Lists all products in the catalog',
      parameters: {},
      handler: async () => {
        await pgClient.connect();
        try {
          const result = await pgClient.query('SELECT * FROM products');
          return result.rows;
        } catch (error) {
          console.error('Error executing query', error);
          throw error;
        } finally {
          await pgClient.end();
        }
      }
    },
    {
      name: 'get_product',
      description: 'Get details of a specific product by ID',
      parameters: {
        product_id: {
          type: 'number',
          description: 'ID of the product to retrieve'
        }
      },
      handler: async ({ product_id }) => {
        await pgClient.connect();
        try {
          const result = await pgClient.query('SELECT * FROM products WHERE id = $1', [product_id]);
          if (result.rows.length === 0) {
            return { error: 'Product not found' };
          }
          return result.rows[0];
        } catch (error) {
          console.error('Error executing query', error);
          throw error;
        } finally {
          await pgClient.end();
        }
      }
    },
    {
      name: 'search_products',
      description: 'Search products by name or category',
      parameters: {
        query: {
          type: 'string',
          description: 'Search term for product name or category'
        }
      },
      handler: async ({ query }) => {
        await pgClient.connect();
        try {
          const result = await pgClient.query(
            'SELECT * FROM products WHERE name ILIKE $1 OR category ILIKE $1',
            [`%${query}%`]
          );
          return result.rows;
        } catch (error) {
          console.error('Error executing query', error);
          throw error;
        } finally {
          await pgClient.end();
        }
      }
    },
    {
      name: 'get_product_inventory',
      description: 'Get inventory information for a product',
      parameters: {
        product_id: {
          type: 'number',
          description: 'ID of the product to check inventory'
        }
      },
      handler: async ({ product_id }) => {
        await pgClient.connect();
        try {
          // First check if product exists
          const productResult = await pgClient.query('SELECT * FROM products WHERE id = $1', [product_id]);
          
          if (productResult.rows.length === 0) {
            return { error: 'Product not found' };
          }
          
          // For demo purposes, we'll use a mock inventory service
          // In a real implementation, this would connect to the inventory service
          return {
            product_id,
            product_name: productResult.rows[0].name,
            quantity_available: Math.floor(Math.random() * 100),
            last_updated: new Date().toISOString()
          };
        } catch (error) {
          console.error('Error executing query', error);
          throw error;
        } finally {
          await pgClient.end();
        }
      }
    },
    {
      name: 'get_product_categories',
      description: 'Get list of all product categories',
      parameters: {},
      handler: async () => {
        await pgClient.connect();
        try {
          const result = await pgClient.query('SELECT DISTINCT category FROM products');
          return result.rows.map(row => row.category);
        } catch (error) {
          console.error('Error executing query', error);
          throw error;
        } finally {
          await pgClient.end();
        }
      }
    },
    {
      name: 'analyze_product_trends',
      description: 'Analyze product trends and popularity',
      parameters: {},
      handler: async () => {
        await pgClient.connect();
        try {
          // For demo purposes, we'll return a mock analysis
          // In a real implementation, this would analyze actual sales data
          const productsResult = await pgClient.query('SELECT * FROM products');
          const products = productsResult.rows;
          
          // Generate mock trend data
          return {
            most_popular_categories: [
              { category: 'Electronics', popularity_score: 0.85 },
              { category: 'Clothing', popularity_score: 0.72 }
            ],
            trending_products: products.slice(0, 3).map(product => ({
              id: product.id,
              name: product.name,
              trend_score: (Math.random() * 0.5 + 0.5).toFixed(2),
              week_over_week_change: `+${Math.floor(Math.random() * 30)}%`
            })),
            recommendation: 'Focus marketing efforts on Electronics category for highest ROI'
          };
        } catch (error) {
          console.error('Error executing query', error);
          throw error;
        } finally {
          await pgClient.end();
        }
      }
    }
  ]
});

// Start the server
server.start();
