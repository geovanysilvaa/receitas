"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngredientService = void 0;
const factories_1 = require("../../domain/factories");
class IngredientService {
    constructor(ingredients) {
        this.ingredients = ingredients;
    }
    async create(data) {
        const ingredient = (0, factories_1.createIngredient)({ name: data.name });
        if (!ingredient.name)
            throw new Error("Name is required");
        const exists = await this.ingredients.findByName(ingredient.name);
        if (exists)
            throw new Error("Ingredient name must be unique");
        return this.ingredients.create(ingredient);
    }
    async list() {
        return this.ingredients.list();
    }
    async get(id) {
        const found = await this.ingredients.findById(id);
        if (!found)
            throw new Error("Ingredient not found");
        return found;
    }
    async update(id, data) {
        if (data.name) {
            const existing = await this.ingredients.findByName(data.name);
            if (existing && existing.id !== id)
                throw new Error("Ingredient name must be unique");
        }
        return this.ingredients.update(id, data);
    }
    async delete(id) {
        await this.ingredients.delete(id);
    }
}
exports.IngredientService = IngredientService;
