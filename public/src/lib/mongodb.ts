import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb+srv://Vercel-Admin-atlas-emerald-lamp:ltYSHPWkANJvIjCu@atlas-emerald-lamp.7esvdpu.mongodb.net/?retryWrites=true&w=majority";

// Validate URI format
if (!uri || !uri.includes('mongodb')) {
  throw new Error('Invalid MongoDB URI format');
}

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

let db: any = null;

export async function connectToDatabase() {
  if (db) {
    return db;
  }

  try {
    // Connect the client to the server
    await client.connect();
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Successfully connected to MongoDB!");
    
    // Select the database
    const dbName = process.env.MONGODB_DB_NAME || "atlas-emerald-lamp";
    db = client.db(dbName);
    console.log(`📊 Using database: ${dbName}`);
    
    return db;
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    // Don't throw in development to allow app to continue
    if (process.env.NODE_ENV === 'development') {
      console.warn("⚠️ MongoDB connection failed in development mode - continuing without database");
      return null;
    }
    throw error;
  }
}

export async function disconnectFromDatabase() {
  await client.close();
  db = null;
}

export { client };