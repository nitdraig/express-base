import { Request, Response, NextFunction } from "express";
import type { FilterQuery, Model } from "mongoose";

// Tipos para filtros y búsqueda
export interface SearchFilters {
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  page: number;
  limit: number;
  filters?: Record<string, string | number | boolean>;
  dateRange?: {
    start?: Date;
    end?: Date;
    field?: string;
  };
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Extraer filtros de la query string
export const extractSearchFilters = (req: Request): SearchFilters => {
  const {
    search,
    sort,
    order = "desc",
    page = 1,
    limit = 10,
    startDate,
    endDate,
    dateField = "createdAt",
    ...filters
  } = req.query;

  const searchFilters: SearchFilters = {
    search: search as string,
    sort: sort as string,
    order: order as "asc" | "desc",
    page: parseInt(String(page), 10) || 1,
    limit: parseInt(String(limit), 10) || 10,
    filters: filters as Record<string, string | number | boolean>,
  };

  // Agregar rango de fechas si se proporciona
  if (startDate || endDate) {
    searchFilters.dateRange = {
      start: startDate ? new Date(startDate as string) : undefined,
      end: endDate ? new Date(endDate as string) : undefined,
      field: dateField as string,
    };
  }

  return searchFilters;
};

// Construir query de MongoDB
export const buildMongoQuery = (
  filters: SearchFilters
): Record<string, unknown> => {
  const query: Record<string, unknown> = {};

  // Búsqueda de texto
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: "i" } },
      { email: { $regex: filters.search, $options: "i" } },
      { description: { $regex: filters.search, $options: "i" } },
    ];
  }

  // Filtros específicos
  if (filters.filters) {
    Object.assign(query, filters.filters);
  }

  // Rango de fechas
  if (filters.dateRange) {
    const dateQuery: Record<string, Date> = {};
    const field = filters.dateRange.field || "createdAt";

    if (filters.dateRange.start) {
      dateQuery.$gte = filters.dateRange.start;
    }
    if (filters.dateRange.end) {
      dateQuery.$lte = filters.dateRange.end;
    }

    if (Object.keys(dateQuery).length > 0) {
      query[field] = dateQuery;
    }
  }

  return query;
};

// Construir opciones de sort
export const buildSortOptions = (
  filters: SearchFilters
): Record<string, 1 | -1> => {
  const sortOptions: Record<string, 1 | -1> = {};

  if (filters.sort) {
    sortOptions[filters.sort] = filters.order === "asc" ? 1 : -1;
  } else {
    sortOptions.createdAt = -1; // Por defecto, más recientes primero
  }

  return sortOptions;
};

// Aplicar paginación
export const applyPagination = async <T>(
  query: Record<string, unknown>,
  model: Model<T>,
  filters: SearchFilters
): Promise<PaginationResult<T>> => {
  const { page, limit } = filters;
  const skip = (page - 1) * limit;
  const mongoQuery = query as FilterQuery<T>;

  const [data, total] = await Promise.all([
    model
      .find(mongoQuery)
      .sort(buildSortOptions(filters))
      .skip(skip)
      .limit(limit)
      .lean(),
    model.countDocuments(mongoQuery),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: data as T[],
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

// Generar respuesta paginada
export const createPaginatedResponse = <T>(
  data: T[],
  pagination: PaginationResult<T>["pagination"],
  baseUrl: string,
  filters: SearchFilters
) => {
  const { page, limit, total, totalPages, hasNext, hasPrev } = pagination;

  // Construir URLs de paginación
  const buildUrl = (pageNum: number) => {
    const url = new URL(baseUrl);
    url.searchParams.set("page", pageNum.toString());
    url.searchParams.set("limit", limit.toString());

    if (filters.search) url.searchParams.set("search", filters.search);
    if (filters.sort) url.searchParams.set("sort", filters.sort);
    if (filters.order) url.searchParams.set("order", filters.order);

    // Agregar filtros adicionales
    if (filters.filters) {
      Object.entries(filters.filters).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
      });
    }

    return url.toString();
  };

  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
      links: {
        first: buildUrl(1),
        last: buildUrl(totalPages),
        next: hasNext ? buildUrl(page + 1) : null,
        prev: hasPrev ? buildUrl(page - 1) : null,
      },
    },
  };
};

// Utilidades de búsqueda avanzada
export const searchUtils = {
  // Búsqueda por similitud de texto
  textSearch: (text: string, fields: string[]) => {
    const searchQuery = {
      $or: fields.map((field) => ({
        [field]: { $regex: text, $options: "i" },
      })),
    };
    return searchQuery;
  },

  // Búsqueda por rango numérico
  numericRange: (field: string, min?: number, max?: number) => {
    const rangeQuery: Record<string, number> = {};
    if (min !== undefined) rangeQuery.$gte = min;
    if (max !== undefined) rangeQuery.$lte = max;
    return { [field]: rangeQuery };
  },

  // Búsqueda por array
  arrayContains: (field: string, values: unknown[]) => {
    return { [field]: { $in: values } };
  },

  // Búsqueda por existencia
  exists: (field: string, exists: boolean = true) => {
    return { [field]: { $exists: exists } };
  },

  // Búsqueda por regex personalizado
  regex: (field: string, pattern: string, options: string = "i") => {
    return { [field]: { $regex: pattern, $options: options } };
  },
};

// Middleware para validar filtros
export const validateSearchFilters = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const filters = extractSearchFilters(req);

  if (filters.page < 1) {
    res.status(400).json({
      success: false,
      error: "La página debe ser mayor a 0",
    });
    return;
  }

  if (filters.limit < 1 || filters.limit > 100) {
    res.status(400).json({
      success: false,
      error: "El límite debe estar entre 1 y 100",
    });
    return;
  }

  if (filters.order && !["asc", "desc"].includes(filters.order)) {
    res.status(400).json({
      success: false,
      error: 'El orden debe ser "asc" o "desc"',
    });
    return;
  }

  if (filters.dateRange) {
    if (filters.dateRange.start && isNaN(filters.dateRange.start.getTime())) {
      res.status(400).json({
        success: false,
        error: "Fecha de inicio inválida",
      });
      return;
    }
    if (filters.dateRange.end && isNaN(filters.dateRange.end.getTime())) {
      res.status(400).json({
        success: false,
        error: "Fecha de fin inválida",
      });
      return;
    }
  }

  next();
};
