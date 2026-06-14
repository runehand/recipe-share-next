import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';
import { MongoClient } from 'mongodb';

const databaseName = 'recipe-share';
const collectionName = 'recipes';
const localSeedFile = path.join(process.cwd(), 'server', 'data', 'recipes.json');

const seedRecipes = [
  {
    id: 'seed-lemon-pasta',
    title: 'Lemon Herb Pasta',
    ingredients: 'Spaghetti, lemon, parsley, olive oil, parmesan, garlic',
    instructions: 'Cook pasta until al dente. Toss with lemon juice, olive oil, garlic, herbs, and parmesan.',
    photoUrl: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80',
    photoPublicId: '',
    createdAt: '2026-06-01T10:30:00.000Z'
  },
  {
    id: 'seed-berry-toast',
    title: 'Berry Breakfast Toast',
    ingredients: 'Sourdough, ricotta, strawberries, blueberries, honey, mint',
    instructions: 'Toast bread, spread ricotta, add berries, drizzle honey, and finish with torn mint.',
    photoUrl: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=900&q=80',
    photoPublicId: '',
    createdAt: '2026-06-02T08:15:00.000Z'
  }
];

const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_URL ||
  (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
);

if (hasCloudinaryConfig && !process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

let cachedClient;

export function jsonError(message, status = 500) {
  return Response.json({ message }, { status });
}

async function getMongoClient() {
  if (!process.env.MONGODB_URI) {
    const error = new Error('MONGODB_URI is not configured.');
    error.statusCode = 500;
    throw error;
  }

  if (!cachedClient) {
    cachedClient = new MongoClient(process.env.MONGODB_URI).connect();
  }

  return cachedClient;
}

async function getRecipesCollection() {
  const client = await getMongoClient();
  return client.db(databaseName).collection(collectionName);
}

function serializeRecipe(recipe) {
  const { _id, ...serialized } = recipe;
  return serialized;
}

export async function ensureSeedRecipes() {
  const collection = await getRecipesCollection();
  const recipeCount = await collection.estimatedDocumentCount();

  if (recipeCount === 0) {
    const recipes = await readSeedRecipes();
    await collection.insertMany(recipes);
  }
}

async function readSeedRecipes() {
  try {
    const raw = await fs.readFile(localSeedFile, 'utf8');
    const recipes = JSON.parse(raw);
    return Array.isArray(recipes) && recipes.length > 0 ? recipes : seedRecipes;
  } catch {
    return seedRecipes;
  }
}

export async function readRecipes() {
  await ensureSeedRecipes();
  const collection = await getRecipesCollection();
  const recipes = await collection.find({}).sort({ createdAt: -1 }).toArray();
  return recipes.map(serializeRecipe);
}

export async function insertRecipe(recipe) {
  const collection = await getRecipesCollection();
  await collection.insertOne(recipe);
  return recipe;
}

export async function findRecipe(id) {
  const collection = await getRecipesCollection();
  const recipe = await collection.findOne({ id });
  return recipe ? serializeRecipe(recipe) : null;
}

export async function deleteRecipe(id) {
  const collection = await getRecipesCollection();
  await collection.deleteOne({ id });
}

export async function storePhoto(file) {
  if (!file || file.size === 0) {
    return { photoUrl: '', photoPublicId: '' };
  }

  if (!file.type?.startsWith('image/')) {
    const error = new Error('Only image uploads are supported.');
    error.statusCode = 400;
    throw error;
  }

  if (file.size > 5 * 1024 * 1024) {
    const error = new Error('Photo uploads must be 5 MB or smaller.');
    error.statusCode = 413;
    throw error;
  }

  if (!hasCloudinaryConfig) {
    const error = new Error('Cloudinary photo storage is not configured. Set CLOUDINARY_URL or Cloudinary API credentials.');
    error.statusCode = 503;
    throw error;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'recipe-share',
        resource_type: 'image'
      },
      (error, uploadResult) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(uploadResult);
      }
    );

    stream.end(buffer);
  });

  return {
    photoUrl: result.secure_url,
    photoPublicId: result.public_id
  };
}

export async function deletePhoto(recipe) {
  if (recipe.photoPublicId && hasCloudinaryConfig) {
    await cloudinary.uploader.destroy(recipe.photoPublicId, { resource_type: 'image' });
  }
}

export function createRecipe({ title, ingredients, instructions, photo }) {
  return {
    id: randomUUID(),
    title,
    ingredients,
    instructions,
    photoUrl: photo.photoUrl,
    photoPublicId: photo.photoPublicId,
    createdAt: new Date().toISOString()
  };
}
