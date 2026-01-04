import crypto from "node:crypto"
import { store } from "./store.js"
import { Recipe, CreateRecipeInput } from "./models.js"
import { CategoryService } from "./CategoryService.js"
import { IngredientService } from "./IngredientService.js"
import { IRecipeService } from "./interfaces/IRecipeService.js"


export class RecipeService implements IRecipeService {
  private categoryService = new CategoryService()
  private ingredientService = new IngredientService()

  async list(filter?: { categoryId?: string; categoryName?: string; search?: string }): Promise<Recipe[]> {
    let categoryId = filter?.categoryId

    if (filter?.categoryName) {
      const category = await this.categoryService.findByName(filter.categoryName.trim())
      if (category) {
        categoryId = category.id
      } else {
        return []
      }
    }

    let items = [...store.recipes]

    if (categoryId) {
      items = items.filter(r => r.categoryId === categoryId)
    }

    if (filter?.search) {
      const searchQuery = filter.search.trim().toLowerCase()
      const allIngredients = await this.ingredientService.list()
      const nameById = new Map(allIngredients.map((ing) => [ing.id, ing.name.toLowerCase()]))

      items = items.filter((recipe) => {
        if (recipe.title.toLowerCase().includes(searchQuery)) return true
        if (recipe.description && recipe.description.toLowerCase().includes(searchQuery)) return true
        return recipe.ingredients.some((ingredient) => {
          const name = nameById.get(ingredient.ingredientId)
          return !!name && name.includes(searchQuery)
        })
      })
    }
    ///Filtra apenas receitas publicas
    let fReceita = items.filter(receitas => receitas.status == 'published')
    return fReceita
    ///
  }

  async get(id: string): Promise<Recipe> {
    const found = store.recipes.find(r => r.id === id)
    if (!found) throw new Error("Recipe not found")
    ///Verificação status da receitas apenas publicas
    if (found.status !== "published") {
      throw new Error("Only published recipes can be accessed")
    }
    ///
    return found
  }

  async create(input: CreateRecipeInput): Promise<Recipe> {
    const title = input.title.trim()
    if (!title) throw new Error("Title is required")

    // Validate Category
    const category = await this.categoryService.get(input.categoryId).catch(() => null)
    if (!category) throw new Error("Category does not exist")

    // Process Ingredients
    const incoming = Array.isArray(input.ingredients)
      ? input.ingredients.map((i) => ({
        name: String(i.name ?? "").trim(),
        quantity: Number(i.quantity ?? 0),
        unit: String(i.unit ?? "").trim(),
      }))
      : []

    if (incoming.length === 0) throw new Error("Ingredients are required")

    incoming.forEach((i) => {
      if (!i.name) throw new Error("Ingredient name is required")
      if (!(i.quantity > 0)) throw new Error("Ingredient quantity must be > 0")
      if (!i.unit) throw new Error("Ingredient unit is required")
    })

    const resolved = [] as { ingredientId: string; quantity: number; unit: string }[]
    for (const i of incoming) {
      const existing = await this.ingredientService.findByName(i.name)
      const ingredient = existing ?? (await this.ingredientService.create({ name: i.name }))
      resolved.push({ ingredientId: ingredient.id, quantity: i.quantity, unit: i.unit })
    }

    const steps = Array.isArray(input.steps) ? input.steps.map((s) => String(s)) : []

    const servings = Number(input.servings)
    if (!(servings > 0)) throw new Error("Servings must be greater than 0")

    const recipe: Recipe = {
      id: crypto.randomUUID(),
      title,
      description: input.description,
      ingredients: resolved,
      steps,
      servings,
      categoryId: input.categoryId,
      createdAt: new Date(),
      status: 'draft'///Propriedade status começa com draft
    }

    store.recipes.push(recipe)
    return recipe
  }

  async update(id: string, data: Partial<CreateRecipeInput>): Promise<Recipe> {
    const idx = store.recipes.findIndex(r => r.id === id)
    if (idx < 0) throw new Error("Recipe not found")

    const current = store.recipes[idx]

    ///Verificação status receitas so pode editar receitas draft
    if (current.status !== "draft") {
      throw new Error("Only draft recipes can be edited")
    }
    ///

    const updated = { ...current }

    if (data.categoryId) {
      const category = await this.categoryService.get(data.categoryId).catch(() => null)
      if (!category) throw new Error("Category does not exist")
      updated.categoryId = data.categoryId
    }

    if (data.title !== undefined) {
      const title = data.title.trim()
      if (!title) throw new Error("Title is required")
      updated.title = title
    }

    if (data.description !== undefined) {
      updated.description = data.description
    }

    if (data.steps !== undefined) {
      updated.steps = Array.isArray(data.steps) ? [...data.steps] : []
    }

    if (data.servings !== undefined) {
      const servings = Number(data.servings)
      if (!(servings > 0)) throw new Error("Servings must be greater than 0")
      updated.servings = servings
    }

    if (data.ingredients !== undefined) {
      const incoming = Array.isArray(data.ingredients)
        ? data.ingredients.map((i) => ({
          name: String(i.name ?? "").trim(),
          quantity: Number(i.quantity ?? 0),
          unit: String(i.unit ?? "").trim(),
        }))
        : []

      incoming.forEach((i) => {
        if (!i.name) throw new Error("Ingredient name is required")
        if (!(i.quantity > 0)) throw new Error("Ingredient quantity must be > 0")
        if (!i.unit) throw new Error("Ingredient unit is required")
      })

      const resolved = [] as { ingredientId: string; quantity: number; unit: string }[]
      for (const i of incoming) {
        const existing = await this.ingredientService.findByName(i.name)
        const ingredient = existing ?? (await this.ingredientService.create({ name: i.name }))
        resolved.push({ ingredientId: ingredient.id, quantity: i.quantity, unit: i.unit })
      }
      updated.ingredients = resolved
    }

    store.recipes[idx] = updated
    return updated
  }

  async delete(id: string): Promise<void> {
    const idx = store.recipes.findIndex(r => r.id === id)
    const copia = store.recipes[idx]
    if (idx < 0) throw new Error("ID does not exist")
    ///Verificação status receitas so pode deletar receitas draft e archived
    if (copia.status === "published") {
      throw new Error("Published recipes cannot be deleted")
    }
    ///
    store.recipes.splice(idx, 1)
  }
  
  ///novo metodo de escalonamento
  async escalonamento(id: string, servings: number): Promise<Recipe> {
    let procura = store.recipes.find((c) => c.id == id)//verifica de a receita existe se existe retorna a receita se nao returna undefined
    if (!procura) {//lança o erro se for undefined
      throw new Error("Recipe not found")
    }
    ///Verificação status so pode escalonar receitas publicas
    if (procura.status !== "published") {
      throw new Error("You can only scale published recipes")
    }
    ///
    if (servings <= 0) {//verifica se a porção e menos que zero se for lança um erro
      throw new Error("portions must be greater than zero")
    } else {

      let novo: { ingredientId: string; quantity: number; unit: string }[] = []//Array de objeto que começa vazio

      let clonar = [...procura.ingredients]//copia so ingredientes sem mecher com as receitas originais

      let fator = servings / procura.servings//calculo do escalonamento

      clonar.forEach((c) => {//for que cria um objeto com id, unit, e quantity ja calculada
        let novoR = {
          ingredientId: c.ingredientId,
          quantity: c.quantity * fator,
          unit: c.unit
        }
        novo.push(novoR);//adiciona do array [novo]
      })

      let receitaEscalonada: Recipe = {//cria mais um objeto final com o receita completa pra returnar
        ...procura,
        ingredients: novo,//substitui pelo novo
        servings: servings//substitui pelo novo
      }
      return receitaEscalonada//retorna receita escalonada
    }
  }//

  ///Novo metodo lista de compra
  async listaCompra(ids: string[]): Promise<{ ingredientId: string; quantity: number; unit: string }[]> {

    let lista: { ingredientId: string; quantity: number; unit: string }[] = []

    for (const id of ids) {
      const existe = store.recipes.find(itens => itens.id == id)//verifica de a receita existe se existe retorna a receita se nao returna undefined

      if (!existe) {
        throw new Error('ID not found')
      }
      ///Verificação status e publica se for diferente lança o erro 
      if (existe.status !== "published") {
        throw new Error(`Recipe ${id} is not published`)
      }
      ///
      for (const ingrediente of existe.ingredients) {
        let encontrado = false
        for (const item of lista) {
          if (ingrediente.ingredientId == item.ingredientId && ingrediente.unit == item.unit) {//se id for o mesmo e unit for o mesmo entao eu soma
            encontrado = true
            item.quantity = item.quantity + ingrediente.quantity
          }
        }
        if (encontrado == false) {// se nao for eu adiciono como novo ingrediente na lista
          lista.push({
            ingredientId: ingrediente.ingredientId,
            quantity: ingrediente.quantity,
            unit: ingrediente.unit
          })
        }
      }
    }
    return lista//retorna a lista
  }//

  /// Metodo publicar
  async publicar(id: string): Promise<Recipe> {
    let procura = store.recipes.find((c) => c.id == id)//verifica de a receita existe se existe retorna a receita se nao returna undefined

    if (!procura) {
      throw new Error("Recipe not found")
    }
    //verifica se o receita e draft. So pode publicar receitas draft
    if (procura.status !== "draft") {
      throw new Error("You can only publish draft recipes")
    }
    procura.status = "published"
    return procura
  }

  ///Metodo archivar
  async archivar(id: string): Promise<Recipe> {
    let procura = store.recipes.find((c) => c.id == id)

    if (!procura) {
      throw new Error("Recipe not found")
    }
    //verifica se o receita e publica. So pode arquivar receitas publicas
    if (procura.status !== "published") {
      throw new Error("You can only archive published recipes")
    }
    procura.status = "archived"
    return procura
  }
}
