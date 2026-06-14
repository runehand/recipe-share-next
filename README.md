# Recipe Share

A small mobile-friendly recipe sharing app converted to Next.js.

## Features

- Submit a recipe title, ingredients, short instructions, and optional photo
- Browse submitted recipes in a responsive card layout
- Delete recipes from each card
- Seed recipes are inserted into MongoDB when the collection is empty
- Photo uploads are saved to Cloudinary

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Database

Set `MONGODB_URI` before running the app. The API stores recipes in the `recipe-share` database and the `recipes` collection.

For Vercel, add `MONGODB_URI` and any Cloudinary variables in Project Settings > Environment Variables.

## Cloud Photo Storage

Set either `CLOUDINARY_URL` or all three of these variables before running the app:

```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

New recipe photos are uploaded to Cloudinary under the `recipe-share` folder, and deleted recipes remove their Cloudinary photo when the stored `photoPublicId` is available. Without Cloudinary credentials, recipes without photos can still be submitted, but photo uploads return a configuration error.

## Build

```bash
npm run build
```
