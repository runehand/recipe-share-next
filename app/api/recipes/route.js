import { createRecipe, insertRecipe, jsonError, readRecipes, storePhoto } from '@/lib/recipes';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const recipes = await readRecipes();
    return Response.json(recipes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (error) {
    console.error(error);
    return jsonError(error.message || 'Unexpected server error.', error.statusCode || 500);
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const title = formData.get('title')?.trim();
    const ingredients = formData.get('ingredients')?.trim();
    const instructions = formData.get('instructions')?.trim();

    if (!title || !ingredients || !instructions) {
      return jsonError('Title, ingredients, and instructions are required.', 400);
    }

    const photo = await storePhoto(formData.get('photo'));
    const recipe = createRecipe({ title, ingredients, instructions, photo });

    return Response.json(await insertRecipe(recipe), { status: 201 });
  } catch (error) {
    console.error(error);
    return jsonError(error.message || 'Unexpected server error.', error.statusCode || 500);
  }
}
