import { Request, Response, NextFunction } from 'express';
export declare function validateNewsQuery(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function validateSaveToggle(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
