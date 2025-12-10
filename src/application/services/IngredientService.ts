import { IIngredientRepository } from "../../domain/repositories/IIngredientRepository"
import { Ingredient } from "../../domain/entities/Ingredient"
import { createIngredient } from "../../domain/factories"

export class IngredientService {
  constructor(private readonly ingredients: IIngredientRepository) {}

  async create(data: { name: string }): Promise<Ingredient> {
    const ingredient = createIngredient({ name: data.name })
    if (!ingredient.name) throw new Error("Name is required")
    const exists = await this.ingredients.findByName(ingredient.name)
    if (exists) throw new Error("Ingredient name must be unique")
    return this.ingredients.create(ingredient)
  }

  async list(): Promise<Ingredient[]> {
    return this.ingredients.list()
  }

  async get(id: string): Promise<Ingredient> {
    const found = await this.ingredients.findById(id)
    if (!found) throw new Error("Ingredient not found")
    return found
  }

  async update(
    id: string,
    data: { name?: string }
  ): Promise<Ingredient> {
    if (data.name) {
      const existing = await this.ingredients.findByName(data.name)
      if (existing && existing.id !== id)
        throw new Error("Ingredient name must be unique")
    }
    return this.ingredients.update(id, data)
  }

  async delete(id: string): Promise<void> {
    await this.ingredients.delete(id)
  }
}
