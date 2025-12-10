import { IRecipeRepository } from "../../domain/repositories/IRecipeRepository"
import { ICategoryRepository } from "../../domain/repositories/ICategoryRepository"
import { Recipe } from "../../domain/entities/Recipe"
import { createRecipe } from "../../domain/factories"

type CreateRecipeInput = {
  title: string
  description?: string
  ingredients: string[]
  steps: string[]
  categoryId: string
}

export class RecipeService {
  constructor(
    private readonly recipes: IRecipeRepository,
    private readonly categories: ICategoryRepository
  ) {}

  async create(input: CreateRecipeInput): Promise<Recipe> {
    const recipe = createRecipe({
      title: input.title,
      description: input.description,
      ingredients: input.ingredients,
      steps: input.steps,
      categoryId: input.categoryId,
    })
    if (!recipe.title) throw new Error("Title is required")
    const category = await this.categories.findById(input.categoryId)
    if (!category) throw new Error("Category does not exist")
    return this.recipes.create(recipe)
  }

  async list(filter?: { categoryId?: string; search?: string }): Promise<Recipe[]> {
    const items = filter?.categoryId
      ? await this.recipes.listByCategoryId(filter.categoryId)
      : await this.recipes.list()
    if (filter?.search) {
      const searchQuery = filter.search.trim().toLowerCase()
      return items.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(searchQuery) ||
          (recipe.description &&
            recipe.description.toLowerCase().includes(searchQuery)) ||
          recipe.ingredients.some((ingredientName) =>
            ingredientName.toLowerCase().includes(searchQuery)
          )
      )
    }
    return items
  }

  async get(id: string): Promise<Recipe> {
    const found = await this.recipes.findById(id)
    if (!found) throw new Error("Recipe not found")
    return found
  }

  async update(
    id: string,
    data: Partial<CreateRecipeInput>
  ): Promise<Recipe> {
    if (data.categoryId) {
      const category = await this.categories.findById(data.categoryId)
      if (!category) throw new Error("Category does not exist")
    }
    if (data.title !== undefined && !data.title.trim())
      throw new Error("Title is required")
    return this.recipes.update(id, data)
  }

  async delete(id: string): Promise<void> {
    await this.recipes.delete(id)
  }
}
