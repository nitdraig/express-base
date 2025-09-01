import { Request } from "express";

// Tipos para filtros y búsqueda
export interface SearchFilters {
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
  filters?: Record<string, any>;
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
    page: parseInt(page as string) || 1,
    limit: parseInt(limit as string) || 10,
    filters: filters as Record<string, any>,
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
export const buildMongoQuery = (filters: SearchFilters) => {
  const query: any = {};

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
    const dateQuery: any = {};
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
export const buildSortOptions = (filters: SearchFilters) => {
  const sortOptions: any = {};

  if (filters.sort) {
    sortOptions[filters.sort] = filters.order === "asc" ? 1 : -1;
  } else {
    sortOptions.createdAt = -1; // Por defecto, más recientes primero
  }

  return sortOptions;
};

// Aplicar paginación
export const applyPagination = async <T>(
  query: any,
  model: any,
  filters: SearchFilters
): Promise<PaginationResult<T>> => {
  const skip = (filters.page - 1) * filters.limit;
  const limit = filters.limit;

  // Ejecutar queries en paralelo
  const [data, total] = await Promise.all([
    model
      .find(query)
      .sort(buildSortOptions(filters))
      .skip(skip)
      .limit(limit)
      .lean(),
    model.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page: filters.page,
      limit,
      total,
      totalPages,
      hasNext: filters.page < totalPages,
      hasPrev: filters.page > 1,
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
        url.searchParams.set(key, value.toString());
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
    const rangeQuery: any = {};
    if (min !== undefined) rangeQuery.$gte = min;
    if (max !== undefined) rangeQuery.$lte = max;
    return { [field]: rangeQuery };
  },

  // Búsqueda por array
  arrayContains: (field: string, values: any[]) => {
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
export const validateSearchFilters = (req: Request, res: any, next: any) => {
  const filters = extractSearchFilters(req);

  // Validar página
  if (filters.page < 1) {
    return res.status(400).json({
      success: false,
      error: "La página debe ser mayor a 0",
    });
  }

  // Validar límite
  if (filters.limit < 1 || filters.limit > 100) {
    return res.status(400).json({
      success: false,
      error: "El límite debe estar entre 1 y 100",
    });
  }

  // Validar orden
  if (filters.order && !["asc", "desc"].includes(filters.order)) {
    return res.status(400).json({
      success: false,
      error: 'El orden debe ser "asc" o "desc"',
    });
  }

  // Validar fechas
  if (filters.dateRange) {
    if (filters.dateRange.start && isNaN(filters.dateRange.start.getTime())) {
      return res.status(400).json({
        success: false,
        error: "Fecha de inicio inválida",
      });
    }
    if (filters.dateRange.end && isNaN(filters.dateRange.end.getTime())) {
      return res.status(400).json({
        success: false,
        error: "Fecha de fin inválida",
      });
    }
  }

  next();
};
