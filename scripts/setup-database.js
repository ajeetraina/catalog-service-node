require("dotenv").config();
const { Client } = require("pg");

// Function to initialize the database
async function setupDatabase() {
  console.log("Setting up database...");
  
  const client = new Client({
    host: process.env.PGHOST || 'host.docker.internal',
    port: process.env.PGPORT || 5432,
    database: 'postgres', // Connect to default postgres database first
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
  });
  
  try {
    // Connect to PostgreSQL
    await client.connect();
    console.log("Connected to PostgreSQL");
    
    // Check if catalog database exists
    const dbCheckResult = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = 'catalog'
    `);
    
    // Create catalog database if it doesn't exist
    if (dbCheckResult.rows.length === 0) {
      console.log("Creating catalog database...");
      await client.query(`CREATE DATABASE catalog`);
      console.log("Catalog database created successfully");
    } else {
      console.log("Catalog database already exists");
    }
    
    // Close connection to postgres database
    await client.end();
    
    // Connect to the catalog database
    const catalogClient = new Client({
      host: process.env.PGHOST || 'host.docker.internal',
      port: process.env.PGPORT || 5432,
      database: 'catalog',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
    });
    
    await catalogClient.connect();
    console.log("Connected to catalog database");
    
    // Check if products table exists
    const tableCheckResult = await catalogClient.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'products'
      );
    `);
    
    // Create products table if it doesn't exist
    if (!tableCheckResult.rows[0].exists) {
      console.log("Creating products table...");
      await catalogClient.query(`
        CREATE TABLE products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          upc VARCHAR(255) UNIQUE NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          description TEXT,
          has_image BOOLEAN DEFAULT FALSE
        );
      `);
      console.log("Products table created successfully");
      
      // Insert some sample products
      console.log("Inserting sample products...");
      await catalogClient.query(`
        INSERT INTO products (name, upc, price, description) VALUES
          ('Smartphone X', '123456789012', 799.99, 'Latest smartphone with advanced features'),
          ('Laptop Pro', '123456789013', 1299.99, 'High-performance laptop for professionals'),
          ('Wireless Headphones', '123456789014', 149.99, 'Premium noise-cancelling headphones'),
          ('Smart Watch', '123456789015', 249.99, 'Fitness and health tracking smartwatch'),
          ('Tablet Ultra', '123456789016', 499.99, 'Lightweight tablet with high-resolution display');
      `);
      console.log("Sample products inserted successfully");
    } else {
      console.log("Products table already exists");
    }
    
    // Close connection
    await catalogClient.end();
    console.log("Database setup completed successfully");
    
  } catch (error) {
    console.error("Error setting up database:", error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase();
