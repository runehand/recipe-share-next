'use client';

import { useEffect, useMemo, useState } from 'react';
import { Camera, ChefHat, Clock3, ImagePlus, Loader2, Send, Sparkles, Trash2 } from 'lucide-react';

const initialForm = {
  title: '',
  ingredients: '',
  instructions: '',
  photo: null
};

function RecipeForm({ onRecipeCreated }) {
  const [form, setForm] = useState(initialForm);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updatePhoto(event) {
    const file = event.target.files?.[0] || null;
    setForm((current) => ({ ...current, photo: file }));
    setPreviewUrl(file ? URL.createObjectURL(file) : '');
  }

  async function submitRecipe(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    const body = new FormData();
    body.append('title', form.title);
    body.append('ingredients', form.ingredients);
    body.append('instructions', form.instructions);
    if (form.photo) {
      body.append('photo', form.photo);
    }

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        body
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Could not save recipe.');
      }

      const recipe = await response.json();
      onRecipeCreated(recipe);
      setForm(initialForm);
      setPreviewUrl('');
      event.currentTarget.reset();
      setMessage('Recipe shared.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="recipe-form" onSubmit={submitRecipe}>
      <div className="form-heading">
        <span className="icon-badge"><ChefHat size={20} /></span>
        <div>
          <h2>Share a Recipe</h2>
          <p>Add the essentials and an optional photo.</p>
        </div>
      </div>

      <label>
        Recipe title
        <input
          name="title"
          value={form.title}
          onChange={updateField}
          placeholder="Garlic butter noodles"
          required
          maxLength={80}
        />
      </label>

      <label>
        Ingredients
        <textarea
          name="ingredients"
          value={form.ingredients}
          onChange={updateField}
          placeholder="Noodles, butter, garlic, parsley..."
          required
          rows={4}
        />
      </label>

      <label>
        Short instructions
        <textarea
          name="instructions"
          value={form.instructions}
          onChange={updateField}
          placeholder="Cook noodles, melt butter with garlic, toss together..."
          required
          rows={4}
        />
      </label>

      <label className="photo-drop">
        <input type="file" accept="image/*" onChange={updatePhoto} />
        {previewUrl ? (
          <img src={previewUrl} alt="Recipe preview" />
        ) : (
          <span>
            <ImagePlus size={22} />
            Optional photo
          </span>
        )}
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
        {isSubmitting ? 'Sharing...' : 'Share Recipe'}
      </button>

      {message && <p className="form-message">{message}</p>}
    </form>
  );
}

function RecipeCard({ recipe, isDeleting, onDelete }) {
  const date = useMemo(() => {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(recipe.createdAt));
  }, [recipe.createdAt]);

  return (
    <article className="recipe-card">
      <div className="recipe-photo">
        {recipe.photoUrl ? (
          <img src={recipe.photoUrl} alt={recipe.title} />
        ) : (
          <div className="photo-placeholder">
            <Camera size={28} />
          </div>
        )}
      </div>
      <div className="recipe-content">
        <div className="recipe-meta">
          <span><Clock3 size={14} /> {date}</span>
          <button
            type="button"
            className="icon-button"
            onClick={() => onDelete(recipe.id)}
            disabled={isDeleting}
            aria-label={`Delete ${recipe.title}`}
            title="Delete recipe"
          >
            {isDeleting ? <Loader2 className="spin" size={16} /> : <Trash2 size={16} />}
          </button>
        </div>
        <h3>{recipe.title}</h3>
        <div>
          <h4>Ingredients</h4>
          <p>{recipe.ingredients}</p>
        </div>
        <div>
          <h4>Instructions</h4>
          <p>{recipe.instructions}</p>
        </div>
      </div>
    </article>
  );
}

export default function App() {
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadRecipes() {
      try {
        const response = await fetch('/api/recipes');
        if (!response.ok) {
          throw new Error('Could not load recipes.');
        }
        setRecipes(await response.json());
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadRecipes();
  }, []);

  function addRecipe(recipe) {
    setRecipes((current) => [recipe, ...current]);
  }

  async function deleteRecipe(id) {
    const recipe = recipes.find((item) => item.id === id);
    const confirmed = window.confirm(`Delete "${recipe?.title || 'this recipe'}"?`);

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setError('');

    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Could not delete recipe.');
      }

      setRecipes((current) => current.filter((item) => item.id !== id));
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setDeletingId('');
    }
  }

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={16} /> Community kitchen</span>
          <h1>Recipe Share</h1>
          <p>Post simple meals, browse what others are cooking, and keep every recipe easy to read on any phone.</p>
        </div>
      </section>

      <section className="app-shell" aria-label="Recipe sharing workspace">
        <RecipeForm onRecipeCreated={addRecipe} />

        <div className="recipes-panel">
          <div className="section-heading">
            <div>
              <h2>Shared Recipes</h2>
              <p>{recipes.length} recipe{recipes.length === 1 ? '' : 's'} available</p>
            </div>
          </div>

          {isLoading && <p className="status">Loading recipes...</p>}
          {error && <p className="status error">{error}</p>}
          {!isLoading && !error && (
            <div className="recipe-grid">
              {recipes.map((recipe) => (
                <RecipeCard
                  recipe={recipe}
                  key={recipe.id}
                  isDeleting={deletingId === recipe.id}
                  onDelete={deleteRecipe}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
