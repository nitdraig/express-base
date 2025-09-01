import { Request } from "express";
import { logInfo } from "../utils/logger";

// Tipos para analytics
export interface PageView {
  path: string;
  method: string;
  userAgent: string;
  ip: string;
  userId?: string;
  timestamp: Date;
  responseTime: number;
  statusCode: number;
}

export interface UserAction {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  ip: string;
}

export interface AnalyticsData {
  pageViews: PageView[];
  userActions: UserAction[];
  errors: any[];
  performance: {
    avgResponseTime: number;
    totalRequests: number;
    errorRate: number;
  };
}

// Servicio de Analytics
export class AnalyticsService {
  private pageViews: PageView[] = [];
  private userActions: UserAction[] = [];
  private errors: any[] = [];
  private performanceData = {
    totalRequests: 0,
    totalResponseTime: 0,
    totalErrors: 0,
  };

  // Registrar vista de página
  trackPageView(req: Request, responseTime: number, statusCode: number) {
    const pageView: PageView = {
      path: req.path,
      method: req.method,
      userAgent: req.get("User-Agent") || "Unknown",
      ip: req.ip || req.connection.remoteAddress || "Unknown",
      userId: (req as any).user?.id,
      timestamp: new Date(),
      responseTime,
      statusCode,
    };

    this.pageViews.push(pageView);
    this.updatePerformanceMetrics(responseTime, statusCode);

    logInfo("Page view tracked", {
      path: pageView.path,
      method: pageView.method,
      responseTime,
      statusCode,
    });
  }

  // Registrar acción de usuario
  trackUserAction(
    userId: string,
    action: string,
    resource: string,
    resourceId?: string,
    metadata?: Record<string, any>,
    req?: Request
  ) {
    const userAction: UserAction = {
      userId,
      action,
      resource,
      resourceId,
      metadata,
      timestamp: new Date(),
      ip: req?.ip || req?.connection.remoteAddress || "Unknown",
    };

    this.userActions.push(userAction);

    logInfo("User action tracked", {
      userId,
      action,
      resource,
      resourceId,
    });
  }

  // Registrar error
  trackError(error: any, req?: Request) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
      path: req?.path,
      method: req?.method,
      ip: req?.ip || req?.connection.remoteAddress,
      userId: (req as any)?.user?.id,
    };

    this.errors.push(errorData);
    this.performanceData.totalErrors++;

    logInfo("Error tracked", {
      message: error.message,
      path: req?.path,
    });
  }

  // Actualizar métricas de performance
  private updatePerformanceMetrics(responseTime: number, statusCode: number) {
    this.performanceData.totalRequests++;
    this.performanceData.totalResponseTime += responseTime;

    if (statusCode >= 400) {
      this.performanceData.totalErrors++;
    }
  }

  // Obtener métricas de performance
  getPerformanceMetrics() {
    const avgResponseTime =
      this.performanceData.totalRequests > 0
        ? this.performanceData.totalResponseTime /
          this.performanceData.totalRequests
        : 0;

    const errorRate =
      this.performanceData.totalRequests > 0
        ? (this.performanceData.totalErrors /
            this.performanceData.totalRequests) *
          100
        : 0;

    return {
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      totalRequests: this.performanceData.totalRequests,
      errorRate: Math.round(errorRate * 100) / 100,
    };
  }

  // Obtener vistas de página por período
  getPageViews(startDate?: Date, endDate?: Date) {
    let filteredViews = this.pageViews;

    if (startDate) {
      filteredViews = filteredViews.filter(
        (view) => view.timestamp >= startDate
      );
    }

    if (endDate) {
      filteredViews = filteredViews.filter((view) => view.timestamp <= endDate);
    }

    return filteredViews;
  }

  // Obtener acciones de usuario por período
  getUserActions(startDate?: Date, endDate?: Date, userId?: string) {
    let filteredActions = this.userActions;

    if (startDate) {
      filteredActions = filteredActions.filter(
        (action) => action.timestamp >= startDate
      );
    }

    if (endDate) {
      filteredActions = filteredActions.filter(
        (action) => action.timestamp <= endDate
      );
    }

    if (userId) {
      filteredActions = filteredActions.filter(
        (action) => action.userId === userId
      );
    }

    return filteredActions;
  }

  // Obtener errores por período
  getErrors(startDate?: Date, endDate?: Date) {
    let filteredErrors = this.errors;

    if (startDate) {
      filteredErrors = filteredErrors.filter(
        (error) => error.timestamp >= startDate
      );
    }

    if (endDate) {
      filteredErrors = filteredErrors.filter(
        (error) => error.timestamp <= endDate
      );
    }

    return filteredErrors;
  }

  // Obtener estadísticas de rutas más visitadas
  getTopRoutes(limit: number = 10) {
    const routeStats = new Map<
      string,
      { count: number; avgResponseTime: number; totalResponseTime: number }
    >();

    this.pageViews.forEach((view) => {
      const key = `${view.method} ${view.path}`;
      const current = routeStats.get(key) || {
        count: 0,
        avgResponseTime: 0,
        totalResponseTime: 0,
      };

      current.count++;
      current.totalResponseTime += view.responseTime;
      current.avgResponseTime = current.totalResponseTime / current.count;

      routeStats.set(key, current);
    });

    return Array.from(routeStats.entries())
      .map(([route, stats]) => ({
        route,
        count: stats.count,
        avgResponseTime: Math.round(stats.avgResponseTime * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // Obtener estadísticas de usuarios más activos
  getTopUsers(limit: number = 10) {
    const userStats = new Map<string, { actions: number; lastAction: Date }>();

    this.userActions.forEach((action) => {
      const current = userStats.get(action.userId) || {
        actions: 0,
        lastAction: action.timestamp,
      };

      current.actions++;
      if (action.timestamp > current.lastAction) {
        current.lastAction = action.timestamp;
      }

      userStats.set(action.userId, current);
    });

    return Array.from(userStats.entries())
      .map(([userId, stats]) => ({
        userId,
        actions: stats.actions,
        lastAction: stats.lastAction,
      }))
      .sort((a, b) => b.actions - a.actions)
      .slice(0, limit);
  }

  // Limpiar datos antiguos (más de 30 días)
  cleanupOldData() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    this.pageViews = this.pageViews.filter(
      (view) => view.timestamp > thirtyDaysAgo
    );
    this.userActions = this.userActions.filter(
      (action) => action.timestamp > thirtyDaysAgo
    );
    this.errors = this.errors.filter(
      (error) => error.timestamp > thirtyDaysAgo
    );

    logInfo("Old analytics data cleaned up");
  }

  // Exportar todos los datos
  exportData(): AnalyticsData {
    return {
      pageViews: this.pageViews,
      userActions: this.userActions,
      errors: this.errors,
      performance: this.getPerformanceMetrics(),
    };
  }

  // Resetear datos (útil para testing)
  reset() {
    this.pageViews = [];
    this.userActions = [];
    this.errors = [];
    this.performanceData = {
      totalRequests: 0,
      totalResponseTime: 0,
      totalErrors: 0,
    };
  }
}

// Instancia singleton
export const analyticsService = new AnalyticsService();

// Middleware para tracking automático
export const analyticsMiddleware = (req: Request, res: any, next: any) => {
  const startTime = Date.now();

  // Interceptar el final de la respuesta
  res.on("finish", () => {
    const responseTime = Date.now() - startTime;
    analyticsService.trackPageView(req, responseTime, res.statusCode);
  });

  next();
};
