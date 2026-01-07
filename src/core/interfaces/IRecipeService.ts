import { Recipe, CreateRecipeInput } from "../models.js"

export interface IRecipeService {
  list(filter?: { categoryId?: string; categoryName?: string; search?: string }): Promise<Recipe[]>
  get(id: string): Promise<Recipe>
  create(input: CreateRecipeInput): Promise<Recipe>
  update(id: string, data: Partial<CreateRecipeInput>): Promise<Recipe>
  delete(id: string): Promise<void>
  scaleRecipes(id: string, servings: number): Promise<Recipe> /* Metodo escalonamento com porções (sem persistência)
*/
  shoppingList(id: string[]): Promise<{ ingredientId: string; quantity: number; unit: string }[]>/* Metodo Geração de Lista de Compras Consolidada (como resposta da requisição)
*/
  publish(id: string): Promise<Recipe>/* Metodo publicar receita Nessario pra emplementação status */
  archive(id:string): Promise<Recipe>/* Metodo arquivar receita Necessario pra emplementação status */
}
