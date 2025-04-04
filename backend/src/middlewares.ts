import type { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const IdSchema = z.string().max(32).regex(/^[a-zA-Z0-9]+$/);

export const PutTodoSchema = z.object({
  id: IdSchema,
  text: z.string().max(127),
  done: z.boolean().optional(),
});

export function buildValidationMiddleware(fn: (req: Request) => void) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      fn(req);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Invalid data' });
      } else {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  }
}

export const validateId = buildValidationMiddleware(
  req => IdSchema.parse(req.params.id)
);

export const validatePutTodoData = buildValidationMiddleware(
  req => PutTodoSchema.parse(req.body)
);
