import { prisma } from "./lib/prisma.js";
import type { Recipe, CreateRecipeInput } from "./models.js";

export class RecipeService {
  async list(filter?: { categoryId?: string; categoryName?: string; search?: string }): Promise<Recipe[]> {
    const where: any = { status: "published" };

    if (filter?.categoryId) {
      where.categoryId = filter.categoryId;
    }

    if (filter?.categoryName) {
      const category = await prisma.category.findUnique({ where: { name: filter.categoryName } });
      if (!category) return [];
      where.categoryId = category.id;
    }

    let recipes = await prisma.recipe.findMany({
      where,
      include: { ingredients: true, category: true }
    });

    return recipes.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description ?? undefined,
      ingredients: r.ingredients.map(i => ({
        ingredientId: i.ingredientId,
        quantity: i.quantity,
        unit: i.unit
      })),
      steps: r.steps,
      servings: r.servings,
      categoryId: r.categoryId,
      createdAt: r.createdAt,
      status: r.status as 'draft' | 'published' | 'archived'
    }));
  }

  async get(id: string): Promise<Recipe> {
    const r = await prisma.recipe.findUnique({ where: { id }, include: { ingredients: true, category: true } });
    if (!r) throw new Error("Recipe not found");
    if (r.status !== "published") throw new Error("Only published recipes can be accessed");

    return {
      id: r.id,
      title: r.title,
      description: r.description ?? undefined,
      ingredients: r.ingredients.map(i => ({
        ingredientId: i.ingredientId,
        quantity: i.quantity,
        unit: i.unit
      })),
      steps: r.steps,
      servings: r.servings,
      categoryId: r.categoryId,
      createdAt: r.createdAt,
      status: r.status as 'draft' | 'published' | 'archived'
    };
  }

  async create(input: CreateRecipeInput): Promise<Recipe> {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category) throw new Error("Category does not exist");

    const resolvedIngredients = [];
    for (const i of input.ingredients) {
      let ingredient = await prisma.ingredient.findUnique({ where: { name: i.name } });
      if (!ingredient) ingredient = await prisma.ingredient.create({ data: { name: i.name } });
      resolvedIngredients.push({
        ingredientId: ingredient.id,
        quantity: i.quantity,
        unit: i.unit
      });
    }

    const r = await prisma.recipe.create({
      data: {
        title: input.title,
        description: input.description,
        servings: input.servings,
        steps: input.steps,
        categoryId: input.categoryId,
        status: "draft",
        ingredients: { create: resolvedIngredients }
      },
      include: { ingredients: true, category: true }
    });

    return {
      id: r.id,
      title: r.title,
      description: r.description ?? undefined,
      ingredients: r.ingredients.map(i => ({
        ingredientId: i.ingredientId,
        quantity: i.quantity,
        unit: i.unit
      })),
      steps: r.steps,
      servings: r.servings,
      categoryId: r.categoryId,
      createdAt: r.createdAt,
      status: r.status as 'draft' | 'published' | 'archived'
    };
  }

  async update(id: string, data: Partial<CreateRecipeInput>): Promise<Recipe> {
    const r = await prisma.recipe.findUnique({ where: { id }, include: { ingredients: true } });
    if (!r) throw new Error("Recipe not found");
    if (r.status !== "draft") throw new Error("Only draft recipes can be edited");

    const updatedData: any = {};
    if (data.title) updatedData.title = data.title;
    if (data.description !== undefined) updatedData.description = data.description;
    if (data.servings) updatedData.servings = data.servings;
    if (data.steps) updatedData.steps = data.steps;
    if (data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) throw new Error("Category does not exist");
      updatedData.categoryId = data.categoryId;
    }

    if (data.ingredients) {
      await prisma.recipeIngredient.deleteMany({ where: { recipeId: id } });
      const ingredientsToCreate = [];
      for (const i of data.ingredients) {
        let ingredient = await prisma.ingredient.findUnique({ where: { name: i.name } });
        if (!ingredient) ingredient = await prisma.ingredient.create({ data: { name: i.name } });
        ingredientsToCreate.push({
          ingredientId: ingredient.id,
          quantity: i.quantity,
          unit: i.unit
        });
      }
      updatedData.ingredients = { create: ingredientsToCreate };
    }

    const updated = await prisma.recipe.update({
      where: { id },
      data: updatedData,
      include: { ingredients: true, category: true }
    });

    return {
      id: updated.id,
      title: updated.title,
      description: updated.description ?? undefined,
      ingredients: updated.ingredients.map(i => ({
        ingredientId: i.ingredientId,
        quantity: i.quantity,
        unit: i.unit
      })),
      steps: updated.steps,
      servings: updated.servings,
      categoryId: updated.categoryId,
      createdAt: updated.createdAt,
      status: updated.status as 'draft' | 'published' | 'archived'
    };
  }

  async delete(id: string): Promise<void> {
    const recipe = await prisma.recipe.findUnique({
      where: { id }
    })

    if (!recipe) throw new Error("Recipe not found")

    if (recipe.status !== "draft") {
      throw new Error("You can only delete draft recipes")
    }

    await prisma.recipeIngredient.deleteMany({
      where: { recipeId: id }
    })

    await prisma.recipe.delete({
      where: { id }
    })
  }


  async publish(id: string): Promise<Recipe> {
    const r = await prisma.recipe.findUnique({ where: { id } });
    if (!r) throw new Error("Recipe not found");
    if (r.status !== "draft") throw new Error("You can only publish draft recipes");

    const updated = await prisma.recipe.update({ where: { id }, data: { status: "published" }, include: { ingredients: true, category: true } });
    return {
      id: updated.id,
      title: updated.title,
      description: updated.description ?? undefined,
      ingredients: updated.ingredients.map(i => ({
        ingredientId: i.ingredientId,
        quantity: i.quantity,
        unit: i.unit
      })),
      steps: updated.steps,
      servings: updated.servings,
      categoryId: updated.categoryId,
      createdAt: updated.createdAt,
      status: updated.status as 'draft' | 'published' | 'archived'
    };
  }

  async archive(id: string): Promise<Recipe> {
    const r = await prisma.recipe.findUnique({ where: { id } });
    if (!r) throw new Error("Recipe not found");
    if (r.status !== "published") throw new Error("You can only archive published recipes");

    const updated = await prisma.recipe.update({ where: { id }, data: { status: "archived" }, include: { ingredients: true, category: true } });
    return {
      id: updated.id,
      title: updated.title,
      description: updated.description ?? undefined,
      ingredients: updated.ingredients.map(i => ({
        ingredientId: i.ingredientId,
        quantity: i.quantity,
        unit: i.unit
      })),
      steps: updated.steps,
      servings: updated.servings,
      categoryId: updated.categoryId,
      createdAt: updated.createdAt,
      status: updated.status as 'draft' | 'published' | 'archived'
    };
  }

  async scaleRecipes(id: string, servings: number): Promise<Recipe> {
    const r = await prisma.recipe.findUnique({ where: { id }, include: { ingredients: true } });

    if (!r) throw new Error("Recipe not found");
    
    if (r.status !== "published") throw new Error("You can only scale published recipes");

    const factor = servings / r.servings;

    return {
      id: r.id,
      title: r.title,
      description: r.description ?? undefined,
      ingredients: r.ingredients.map(i => ({
        ingredientId: i.ingredientId,
        quantity: i.quantity * factor,
        unit: i.unit
      })),
      steps: r.steps,
      servings,
      categoryId: r.categoryId,
      createdAt: r.createdAt,
      status: r.status as 'draft' | 'published' | 'archived'
    };
  }

  async shoppingList(ids: string[]): Promise<{ ingredientId: string; quantity: number; unit: string }[]> {

    const lista: { ingredientId: string; quantity: number; unit: string }[] = [];

    for (const id of ids) {
      const existe = await prisma.recipe.findUnique({ where: { id }, include: { ingredients: true } });

      if (!existe){
        throw new Error(`Recipe ${id} not found`);
      } 
      if (existe.status !== "published"){
        throw new Error(`Recipe ${id} is not published`);
      } 

      for (const ing of existe.ingredients) {

        const existing = lista.find(item => item.ingredientId === ing.ingredientId && item.unit === ing.unit);

        if (existing) {
          existing.quantity = existing.quantity + ing.quantity;
        } else {
          lista.push({ ingredientId: ing.ingredientId, quantity: ing.quantity, unit: ing.unit });
        }
      }
    }
    return lista;
  }
}
