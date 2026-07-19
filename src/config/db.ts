import { MongoClient, type Db } from "mongodb";
import { env } from "./env.js";

let client: MongoClient | null = null;
let dbInstance: Db | null = null;

export async function connectMongo(): Promise<Db> {
  if (dbInstance) return dbInstance;

  client = new MongoClient(env.mongodbUri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 30000,
    connectTimeoutMS: 15000,
    retryWrites: true,
  });

  await client.connect();
  dbInstance = client.db(env.mongodbDbName);
  console.info(`[mongo] connected to database "${env.mongodbDbName}"`);
  return dbInstance;
}

export async function closeMongo(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    dbInstance = null;
    console.info("[mongo] connection closed");
  }
}

export function getDb(): Db {
  if (!dbInstance) {
    throw new Error("MongoDB not connected. Call connectMongo() first.");
  }
  return dbInstance;
}
