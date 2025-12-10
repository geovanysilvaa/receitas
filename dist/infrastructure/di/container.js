"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Container = exports.container = void 0;
const CategoryMemoryRepository_1 = require("../repositories/memory/CategoryMemoryRepository");
const RecipeMemoryRepository_1 = require("../repositories/memory/RecipeMemoryRepository");
const CategoryService_1 = require("../../application/services/CategoryService");
const RecipeService_1 = require("../../application/services/RecipeService");
const IngredientService_1 = require("../../application/services/IngredientService");
const IngredientMemoryRepository_1 = require("../repositories/memory/IngredientMemoryRepository");
class Container {
    constructor() {
        this.factories = new Map();
        this.instances = new Map();
    }
    registerSingleton(token, factory) {
        this.factories.set(token, factory);
    }
    get(token) {
        if (this.instances.has(token))
            return this.instances.get(token);
        const factory = this.factories.get(token);
        if (!factory)
            throw new Error("Token not registered");
        const instance = factory(this);
        this.instances.set(token, instance);
        return instance;
    }
}
exports.Container = Container;
const container = new Container();
exports.container = container;
container.registerSingleton("CategoryRepository", () => new CategoryMemoryRepository_1.CategoryMemoryRepository());
container.registerSingleton("RecipeRepository", () => new RecipeMemoryRepository_1.RecipeMemoryRepository());
container.registerSingleton("IngredientRepository", () => new IngredientMemoryRepository_1.IngredientMemoryRepository());
container.registerSingleton(CategoryService_1.CategoryService, (c) => new CategoryService_1.CategoryService(c.get("CategoryRepository"), c.get("RecipeRepository")));
container.registerSingleton(RecipeService_1.RecipeService, (c) => new RecipeService_1.RecipeService(c.get("RecipeRepository"), c.get("CategoryRepository")));
container.registerSingleton(IngredientService_1.IngredientService, (c) => new IngredientService_1.IngredientService(c.get("IngredientRepository")));
