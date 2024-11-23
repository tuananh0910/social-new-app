import { supabase } from '../lib/supabase';
import { uploadFile } from './imageService';

export const createOrUpdateRecipe = async (recipe) => {
  try {
    if (recipe.file && typeof recipe.file == 'object') {
      // Kiểm tra xem có phải là ảnh không
      let isImage = recipe?.file?.type == 'image';
      let folderName = isImage ? 'recipeImages' : 'recipeVideos';

      // Upload file
      let fileResult = await uploadFile(folderName, recipe?.file?.uri, isImage);
      if (fileResult.success) {
        recipe.file = fileResult.data;
      } else {
        return fileResult; // Dừng lại nếu upload file thất bại
      }
    }

    const { data, error } = await supabase
      .from('recipes')
      .upsert(recipe) // Kết hợp insert và update
      .select()
      .single();

    if (error) {
      console.log('createOrUpdateRecipe error: ', error);
      return { success: false, msg: 'Could not create or update the recipe' };
    }
    return { success: true, data: data };
  } catch (error) {
    console.log('createOrUpdateRecipe error: ', error);
    return { success: false, msg: 'Could not create or update the recipe' };
  }
};

export const fetchRecipes = async (limit = 10, userId) => {
  try {
    if (userId) {
      const { data, error } = await supabase
        .from('recipes')
        .select(
          `
          *,
          user: users (id, name, image)
          `
        )
        .order('created_at', { ascending: false })
        .eq('userId', userId)
        .limit(limit);

      if (error) {
        console.log('fetchRecipes error: ', error);
        return { success: false, msg: 'Could not fetch the recipes' };
      }

      return { success: true, data: data };
    } else {
      const { data, error } = await supabase
        .from('recipes')
        .select(
          `
          *,
          user: users (id, name, image)
          `
        )
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.log('fetchRecipes error: ', error);
        return { success: false, msg: 'Could not fetch the recipes' };
      }

      return { success: true, data: data };
    }
  } catch (error) {
    console.log('fetchRecipes error: ', error);
    return { success: false, msg: 'Could not fetch the recipes' };
  }
};

// Hàm fetchRecipeDetails
export const fetchRecipeDetails = async (recipeId) => {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select(
        `
        *,
        user: users (id, name, image)
        `
      )
      .eq('id', recipeId)
      .single();

    if (error) {
      console.log('fetchRecipeDetails error: ', error);
      return { success: false, msg: 'Could not fetch the recipe' };
    }

    return { success: true, data: data };
  } catch (error) {
    console.log('fetchRecipeDetails error: ', error);
    return { success: false, msg: 'Could not fetch the recipe' };
  }
};

// Hàm removeRecipe
export const removeRecipe = async (recipeId) => {
  try {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId);

    if (error) {
      console.log('removeRecipe error: ', error);
      return { success: false, msg: 'Could not remove the recipe' };
    }

    return { success: true, data: { recipeId } };
  } catch (error) {
    console.log('removeRecipe error: ', error);
    return { success: false, msg: 'Could not remove the recipe' };
  }
};
