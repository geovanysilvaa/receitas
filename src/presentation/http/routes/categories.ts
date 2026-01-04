import { Router } from "express"
import { ICategoryService } from "../../../core/interfaces/ICategoryService.js"

export function categoriesRoutes(service: ICategoryService) {
  const router = Router()

  router.get("/", async (_req, res, next) => {//List Categories
    try {
      const items = await service.list()
      res.json(items)
    } catch (error) {
      next(error)
    }
  })

  router.get("/:id", async (req, res, next) => {//Show Category
    try {
      const item = await service.get(req.params.id)
      res.json(item)
    } catch (error) {
      next(error)
    }
  })

  router.post("/", async (req, res, next) => {//Create Category
    try {
      const item = await service.create({
        name: String(req.body.name ?? ""),
      })
      res.status(201).json(item)
    } catch (error) {
      next(error)
    }
  })

  router.put("/:id", async (req, res, next) => {//Update category 
    try {
      const item = await service.update(req.params.id, {
        name: req.body.name,
      })
      res.json(item)
    } catch (error) {
      next(error)
    }
  })

  router.delete("/:id", async (req, res, next) => {//Delete category
    try {
      await service.delete(req.params.id)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  })

  return router
}
