import { prisma } from "./lib/prisma.js";
import type { Ingredient } from "./models.js";
import { IIngredientService } from "./interfaces/IIngredientService.js";

export class IngredientService implements IIngredientService {
  async list(): Promise<Ingredient[]> {
    return prisma.ingredient.findMany();
  }

  async get(id: string): Promise<Ingredient> {
    const ingredient = await prisma.ingredient.findUnique({ where: { id } });
    if (!ingredient) throw new Error("Ingredient not found");
    return ingredient;
  }

  async findByName(name: string): Promise<Ingredient | undefined> {
    const ingredient = await prisma.ingredient.findUnique({ where: { name } });
    return ingredient ?? undefined; // converte null para undefined
  }

  async create(data: { name: string }): Promise<Ingredient> {
    return prisma.ingredient.create({ data });
  }

  async update(id: string, data: { name?: string }): Promise<Ingredient> {
    return prisma.ingredient.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.ingredient.delete({ where: { id } });
  }
}
