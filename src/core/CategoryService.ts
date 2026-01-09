import { prisma } from "./lib/prisma.js";
import type { Category } from "./models.js";
import { ICategoryService } from "./interfaces/ICategoryService.js";

export class CategoryService implements ICategoryService {
  async list(): Promise<Category[]> {
    return prisma.category.findMany();
  }

  async get(id: string): Promise<Category> {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new Error("Category not found");
    return category;
  }

  async findByName(name: string): Promise<Category | undefined> {
    const category = await prisma.category.findUnique({ where: { name } });
    return category ?? undefined; 
  }

  async create(data: { name: string }): Promise<Category> {
    return prisma.category.create({ data });
  }

  async update(id: string, data: { name?: string }): Promise<Category> {
    return prisma.category.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.category.delete({ where: { id } });
  }
}
