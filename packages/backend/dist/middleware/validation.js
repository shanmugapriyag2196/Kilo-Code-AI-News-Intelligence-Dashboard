import { z } from 'zod';
const newsQuerySchema = z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    dateRange: z.enum(['today', 'yesterday', '7d', '30d', 'custom']).default('today'),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
});
export function validateNewsQuery(req, res, next) {
    const result = newsQuerySchema.safeParse(req.query);
    if (!result.success) {
        return res.status(400).json({ error: 'Invalid query parameters', details: result.error.issues });
    }
    req.validatedQuery = result.data;
    next();
}
export function validateSaveToggle(req, res, next) {
    const schema = z.object({ id: z.string().min(1) });
    const result = schema.safeParse(req.params);
    if (!result.success) {
        return res.status(400).json({ error: 'Invalid article ID' });
    }
    req.validatedId = result.data.id;
    next();
}
//# sourceMappingURL=validation.js.map