"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const factories_1 = require("../../domain/factories");
class CategoryService {
    constructor(categories, recipes) {
        this.categories = categories;
        this.recipes = recipes;
    }
    async create(data) {
        const category = (0, factories_1.createCategory)({ name: data.name });
        if (!category.name)
            throw new Error("Name is required");
        const exists = await this.categories.findByName(category.name);
        if (exists)
            throw new Error("Category name must be unique");
        return this.categories.create(category);
    }
    async list() {
        return this.categories.list();
    }
    async get(id) {
        const found = await this.categories.findById(id);
        if (!found)
            throw new Error("Category not found");
        return found;
    }
    async update(id, data) {
        if (data.name) {
            const existing = await this.categories.findByName(data.name);
            if (existing && existing.id !== id)
                throw new Error("Category name must be unique");
        }
        return this.categories.update(id, data);
    }
    async delete(id) {
        const recipes = await this.recipes.listByCategoryId(id);
        if (recipes.length > 0)
            throw new Error("Cannot delete category with recipes");
        await this.categories.delete(id);
    }
}
exports.CategoryService = CategoryService;
