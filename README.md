# Receitas — Sistema de Gerenciamento de Receitas e Categorias

Aplicação em camadas (SRP) construída com Node.js, TypeScript e Express, com contêiner simples de injeção de dependências. Inclui serviços de negócio, repositórios em memória e API HTTP.

## Sumário
- Visão Geral
- Arquitetura
- Pré-requisitos
- Instalação
- Execução
- Endpoints
- Exemplos rápidos (Windows)
- Estrutura do projeto

## Visão Geral
- CRUD de Categorias, Ingredientes e Receitas.
- Busca e filtragem de receitas por `categoryId` e por texto (`search`).
- Regras de negócio:
  - Unicidade de nome para Categoria e Ingrediente.
  - Receita deve referenciar uma Categoria existente.
  - Bloqueio de exclusão de Categoria quando houver Receitas relacionadas.

## Arquitetura Simplificada (2 Camadas)
- `core`: Contém toda a lógica de negócio, modelos de dados, interfaces e acesso aos dados (armazenamento em memória).
- `presentation`: API HTTP (Express), rotas e configuração do servidor.

O projeto aplica o princípio da **Inversão de Dependência (DIP)**:
- A camada `presentation` depende de **interfaces** definidas no `core` (`ICategoryService`, etc.), e não das implementações concretas.
- Isso desacopla as camadas e facilita testes e manutenção.

### Estrutura do Código
- Servidor e rotas: `src/presentation/http`.
- Interfaces (Contratos): `src/core/interfaces`.
- Implementação de Serviços: `src/core/*Service.ts`.
- Modelos e DTOs: `src/core/models.ts`.
- Dados em memória: `src/core/store.ts`.

### Documentação Visual
Diagramas UML estão disponíveis na pasta `docs/diagrams`:
- `package-diagram.puml`: Visão geral das camadas e componentes.
- `class-diagram.puml`: Detalhes das classes, interfaces e relacionamentos.
- `use-case-diagram.puml`: Casos de uso e interações do usuário.

### Fluxo de Dados
1. Requisição HTTP chega na `presentation`.
2. Controller/Rota chama o `Service` correspondente no `core`.
3. `Service` valida regras e manipula o `store` (banco de dados em memória).
4. Resposta retorna pela `presentation`.

## Pré-requisitos
- Node.js 18+ (recomendado 20+)
- npm 9+

## Instalação
1. Baixar o repositório:
   ```bash
   git clone https://github.com/mayllonveras/receitas/
   cd receitas
   ```
2. Instalar dependências:
   ```bash
   npm install
   ```

## Execução
- Desenvolvimento:
  ```bash
  npm run dev
  ```
- Produção local:
  ```bash
  npm run build
  npm start
  ```
- Porta: `PORT` (opcional). Padrão `3000`.

## Endpoints
Categorias
- `GET /categories` — lista todas
- `GET /categories/:id` — detalhe
- `POST /categories` — cria `{ name }`
- `PUT /categories/:id` — atualiza `{ name? }`
- `DELETE /categories/:id` — remove (bloqueado se houver receitas)

Ingredientes
- `GET /ingredients` — lista todos
- `GET /ingredients/:id` — detalhe
- `POST /ingredients` — cria `{ name }`
- `PUT /ingredients/:id` — atualiza `{ name? }`
- `DELETE /ingredients/:id` — remove

Receitas
- `GET /recipes?categoryId=&search=` — lista com filtros
- `GET /recipes/:id` — detalhe
- `POST /recipes` — cria `{ title, description?, ingredients: [{ name, quantity, unit }], steps[], categoryId }`
- `PUT /recipes/:id` — atualiza parcial dos mesmos campos
- `DELETE /recipes/:id` — remove

Códigos de erro: as validações retornam `400` com `{ error: "mensagem" }` (middleware em `src/presentation/http/middlewares/errorHandler.ts`).

## Clientes HTTP (Insomnia/Postman)
- A pasta `requests` contém coleções de requisições prontas:
  - `Insomnia_recipes_requests.yaml`: Coleção completa para importação direta no **Insomnia**.
  - `recipes_requests.yaml`: Especificação OpenAPI/Swagger (se aplicável) ou coleção genérica.
- Base URL: `http://localhost:3000` (ajuste `PORT` se necessário).
- Headers: `Content-Type: application/json` para requisições com corpo.
- Fluxo sugerido:
  - Criar Categoria
    - Método: `POST`
    - URL: `/categories`
    - Body (raw JSON): `{ "name": "Sobremesa" }`
  - Criar Ingrediente
    - Método: `POST`
    - URL: `/ingredients`
    - Body: `{ "name": "Leite" }`
  - Criar Receita
    - Método: `POST`
    - URL: `/recipes`
    - Body:
      ```json
      {
        "title": "Pavê de chocolate",
        "description": "Camadas de biscoito e creme",
        "ingredients": [
          { "name": "biscoito", "quantity": 200, "unit": "g" },
          { "name": "creme", "quantity": 300, "unit": "ml" },
          { "name": "chocolate", "quantity": 100, "unit": "g" }
        ],
        "steps": ["misturar", "montar", "gelar"],
        "servings": 8,
        "categoryId": "<ID_DA_CATEGORIA>"
      }
  - Publicar receita
    - Método: `PATCH`  
    - URL: `/recipes/:id/public`

      ```
- Listagens e filtros:
  - `GET /categories`, `GET /ingredients`, `GET /recipes` — somente published
  - `GET /recipes?categoryId=<ID>` para filtrar por categoria somente published
  - `GET /recipes?search=<texto>` para buscar por título/descrição/ingredientes somente published
- Dicas de uso:
  - Crie um ambiente com variável `base_url` e use `{{ base_url }}` nas requisições.
  - Salve exemplos de corpo usando os arquivos em `requests/`.

## Exemplos rápidos (Windows PowerShell)
- Criar categoria usando arquivo:
  ```powershell
  curl.exe -s -X POST http://localhost:3000/categories -H "Content-Type: application/json" --data @requests/category.json
  ```
- Criar ingrediente usando arquivo:
  ```powershell
  curl.exe -s -X POST http://localhost:3000/ingredients -H "Content-Type: application/json" --data @requests/ingredient.json
  ```
- Criar receita (ajuste `categoryId`):
  ```powershell
  curl.exe -s -X POST http://localhost:3000/recipes -H "Content-Type: application/json" --data @requests/recipe.json
  ```
- Listar categorias:
  ```powershell
  curl.exe -s http://localhost:3000/categories
  ```
- Listar ingredientes:
  ```powershell
  curl.exe -s http://localhost:3000/ingredients
  ```
- Filtrar receitas por texto:
  ```powershell
  curl.exe -s "http://localhost:3000/recipes?search=chocolate"
  ```

## Estrutura do projeto
```

receitas/
├─ src/
│  ├─ core/
│  │  ├─ interfaces/
│  │  │  ├─ ICategoryService.ts
│  │  │  ├─ IIngredientService.ts
│  │  │  └─ IRecipeService.ts
│  │  ├─ CategoryService.ts
│  │  ├─ IngredientService.ts
│  │  ├─ RecipeService.ts
│  │  ├─ models.ts
│  │  └─ store.ts
│  └─ presentation/
│     └─ http/
│        ├─ middlewares/
│        │  └─ errorHandler.ts
│        ├─ routes/
│        │  ├─ categories.ts
│        │  ├─ ingredients.ts
│        │  └─ recipes.ts
│        └─ server.ts
├─ requests/
│  ├─ Novas_request
│  ├─ Insomnia_recipes_requests.yaml
│  └─ recipes_requests.yaml
├─ package.json
├─ tsconfig.json
└─ README.md

```

## Composição do servidor
- O servidor instancia diretamente os repositórios em memória e os serviços.

### Observação sobre DTOs de criação
- Os repositórios recebem entidades já criadas com `id` e `createdAt` (gerados pela fábrica/serviço).
- As requisições HTTP enviam apenas os campos de entrada (ex.: `{ name }` para categoria/ingrediente; `{ title, description?, ingredients[], steps[], categoryId }` para receita).

## Scripts
- `npm run dev` — inicia em modo desenvolvimento (ts-node)
- `npm run build` — compila TypeScript
- `npm start` — executa o build compilado

---

# Funcionalidades Adicionadas (Evolução do Sistema)

- Conforme solicitado no enunciado do trabalho, o sistema foi evoluído com novas funcionalidades e regras de negócio além do CRUD básico de Categorias, Ingredientes e  Receitas.

- Essas evoluções aumentam a complexidade do domínio e aplicam regras de negócio diretamente na camada de serviço (`core`), respeitando a arquitetura em camadas e o princípio da Inversão de Dependência.

---

## Escalonamento Inteligente de Receitas

- Endpoint: `POST /recipes/:id/scale`
- Permite recalcular automaticamente os ingredientes de uma receita com base em uma nova quantidade de porções.
- O usuário informa o número de porções desejadas (`servings`) no corpo da requisição.
- O sistema:
  - Busca a receita original
  - Calcula proporcionalmente as quantidades dos ingredientes
  - Retorna **uma nova versão da receita completa escalonada**
- A receita original armazenada **não é alterada nem persistida**.
- O número de porções deve ser maior que zero.
- Caso a receita não exista, o sistema retorna erro apropriado.

Exemplo de requisição:

```json
{
  "servings": 4
}
```
---

### Geração de Lista de Compras Consolidada

- Funcionalidade implementada sem criação de novos recursos persistidos.
- A lista de compras é gerada como resposta a uma requisição HTTP existente.
- O sistema recebe uma lista de IDs de receitas.
- O sistema:
  - Busca todas as receitas informadas
  - Consolida os ingredientes
  - Soma as quantidades de ingredientes iguais, considerando:
    - Mesmo ingrediente
    - Mesma unidade de medida
- Ingredientes iguais com unidades diferentes aparecem separadamente.
- Caso algum ID de receita seja inválido, o sistema retorna erro.
- A resposta contém apenas a lista de compras consolidada, de forma clara e organizada.

Exemplo de requisição:

```json
{
  "recipeIds": [
    "id-da-receita-1",
    "id-da-receita-2"
  ]
}
```

Exemplo de resposta
```json
[
  { "ingredientId": "1",  "quantity": 500, "unit": "ml" },
  { "ingredientId": "2",  "quantity": 6, "unit": "un" },
  { "ingredientId": "3",  "quantity": 200, "unit": "g" }
]
```
Exemplo de Erro
```json
// Receita não publicada
{
  "error": "Recipe id-da-receita-1 is not published"
}

// Receita não encontrada
{
  "error": "ID not found"
}
```
---

## Estados da Receita (Workflow Simples)

O sistema implementa um fluxo de estados para as receitas, composto por:

- `draft` (rascunho)  
- `published` (publicada)  
- `archived` (arquivada)  

### Regras de Negócio por Status

| Status       | Pode Listar | Pode Editar | Pode Deletar | Pode Arquivar | Pode Publicar |
|-------------|------------|------------|--------------|---------------|---------------|
| **draft**    |  Não     |  Sim     |  Sim        |  Não        |  Sim        |
| **published**|  Sim     |  Não     |  Não        |  Sim        |  Não        |
| **archived** |  Não     |  Não     |  Não        |  Não        |  Não        |

### Endpoints Relacionados
- `PATCH /recipes/:id/public` — Publicar receitas (apenas draft)  
- `PATCH /recipes/:id/archived` — Arquivar receitas (apenas published)  

### Exemplos de Erro

```json
// Tentativa de deletar uma receita publicada
{
  "error": "You can only delete draft recipes"
}

// Tentativa de editar uma receita archived
{
  "error": "Only draft recipes can be edited"
}

// Tentativa de escalar uma receita draft
{
  "error": "You can only scale published recipes"
}

// Receita não encontrada
{
  "error": "Recipe not found"
}


