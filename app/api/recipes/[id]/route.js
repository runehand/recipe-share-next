import { deletePhoto, deleteRecipe, findRecipe, jsonError } from '@/lib/recipes';

export const runtime = 'nodejs';

export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    const recipe = await findRecipe(id);

    if (!recipe) {
      return jsonError('Recipe not found.', 404);
    }

    await deletePhoto(recipe);
    await deleteRecipe(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return jsonError(error.message || 'Unexpected server error.', error.statusCode || 500);
  }
}
