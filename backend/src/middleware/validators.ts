import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            error: 'Validasi gagal',
            details: errors.array().map(err => ({
                field: 'path' in err ? err.path : 'unknown',
                message: err.msg
            }))
        });
        return;
    }
    next();
};

/**
 * Login validation rules
 */
export const loginValidation = [
    body('nosis')
        .notEmpty().withMessage('NOSIS wajib diisi')
        .trim()
        .escape(),
    body('password')
        .notEmpty().withMessage('Password wajib diisi')
        .isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
    handleValidationErrors
];

/**
 * Registration validation rules
 */
export const registerValidation = [
    body('nosis')
        .notEmpty().withMessage('NOSIS wajib diisi')
        .trim()
        .escape(),
    body('name')
        .notEmpty().withMessage('Nama wajib diisi')
        .trim()
        .escape()
        .isLength({ min: 2, max: 100 }).withMessage('Nama harus 2-100 karakter'),
    body('password')
        .notEmpty().withMessage('Password wajib diisi')
        .isLength({ min: 8 }).withMessage('Password minimal 8 karakter')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password harus mengandung huruf besar, kecil, dan angka'),
    body('role')
        .optional()
        .isIn(['SISWA', 'PEMBIMBING', 'PENGUJI', 'ADMIN', 'SUPER_ADMIN'])
        .withMessage('Role tidak valid'),
    handleValidationErrors
];

/**
 * User update validation
 */
export const userUpdateValidation = [
    body('name')
        .optional()
        .trim()
        .escape()
        .isLength({ min: 2, max: 100 }).withMessage('Nama harus 2-100 karakter'),
    body('email')
        .optional()
        .isEmail().withMessage('Format email tidak valid')
        .normalizeEmail(),
    handleValidationErrors
];

/**
 * Assignment validation
 */
export const assignmentValidation = [
    body('title')
        .notEmpty().withMessage('Judul tugas wajib diisi')
        .trim()
        .isLength({ min: 3, max: 200 }).withMessage('Judul harus 3-200 karakter'),
    body('subject')
        .notEmpty().withMessage('Mata pelajaran wajib diisi')
        .trim(),
    body('deadline')
        .notEmpty().withMessage('Deadline wajib diisi')
        .isISO8601().withMessage('Format tanggal tidak valid'),
    handleValidationErrors
];

/**
 * ID parameter validation
 */
export const idParamValidation = [
    param('id')
        .notEmpty().withMessage('ID wajib diisi')
        .isString().withMessage('ID harus berupa string'),
    handleValidationErrors
];

/**
 * Pagination query validation
 */
export const paginationValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page harus angka positif'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit harus 1-100'),
    handleValidationErrors
];
