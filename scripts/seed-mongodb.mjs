import fs from 'node:fs/promises';
import path from 'node:path';
import { MongoClient } from 'mongodb';

const databaseName = 'recipe-share';
const collectionName = 'recipes';
const seedFile = process.env.SEED_FILE || path.join(process.cwd(), 'server', 'data', 'recipes.json');

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is not configured.');
}

const raw = await fs.readFile(seedFile, 'utf8');
const recipes = JSON.parse(raw);

if (!Array.isArray(recipes) || recipes.length === 0) {
  throw new Error('No recipes found to seed.');
}

const client = new MongoClient(process.env.MONGODB_URI);

try {
  await client.connect();
  const collection = client.db(databaseName).collection(collectionName);
  const result = await collection.bulkWrite(
    recipes.map((recipe) => ({
      updateOne: {
        filter: { id: recipe.id },
        update: { $setOnInsert: recipe },
        upsert: true
      }
    }))
  );

  console.log(`Seed complete. inserted=${result.upsertedCount} matched=${result.matchedCount}`);
} finally {
  await client.close();
}
