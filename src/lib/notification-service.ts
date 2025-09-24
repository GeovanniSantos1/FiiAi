import { db } from '@/lib/db';

export type NotificationType = 
  | 'ANALYSIS_COMPLETE'
  | 'CREDIT_LOW'
  | 'CREDIT_DEPLETED'
  | 'MARKET_ALERT'
  | 'SYSTEM_UPDATE'
  | 'PORTFOLIO_ALERT'
  | 'RECOMMENDATION_READY';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  data?: any;
  expiresAt?: Date;
}

export class NotificationService {
  
  static async createNotification(data: CreateNotificationData) {
    try {
      const notification = await db.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          priority: data.priority || 'NORMAL',
          title: data.title,
          message: data.message,
          data: data.data,
          expiresAt: data.expiresAt
        }
      });
      
      console.log(`Notification created for user ${data.userId}: ${data.title}`);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Analysis completed notification
  static async notifyAnalysisComplete(
    userId: string, 
    analysisType: 'PORTFOLIO_EVALUATION' | 'INVESTMENT_RECOMMENDATION',
    portfolioName?: string
  ) {
    const typeLabels = {
      PORTFOLIO_EVALUATION: 'Avaliação de Carteira',
      INVESTMENT_RECOMMENDATION: 'Recomendação de Aportes'
    };

    const title = `${typeLabels[analysisType]} Concluída`;
    let message = `Sua análise foi concluída com sucesso e está pronta para visualização.`;
    
    if (portfolioName) {
      message += ` Carteira analisada: ${portfolioName}`;
    }

    return this.createNotification({
      userId,
      type: 'ANALYSIS_COMPLETE',
      priority: 'NORMAL',
      title,
      message,
      data: {
        analysisType,
        portfolioName
      }
    });
  }

  // Credit balance warnings
  static async notifyCreditLow(userId: string, remainingCredits: number) {
    return this.createNotification({
      userId,
      type: 'CREDIT_LOW',
      priority: 'HIGH',
      title: 'Créditos Baixos',
      message: `Você tem apenas ${remainingCredits} créditos restantes. Considere recarregar para continuar usando os agentes de IA.`,
      data: { remainingCredits }
    });
  }

  static async notifyCreditDepleted(userId: string) {
    return this.createNotification({
      userId,
      type: 'CREDIT_DEPLETED',
      priority: 'URGENT',
      title: 'Créditos Esgotados',
      message: 'Seus créditos se esgotaram. Recarregue agora para continuar usando as análises de IA da FiiAI.',
      data: { needsTopUp: true }
    });
  }

  // Portfolio alerts
  static async notifyPortfolioAlert(
    userId: string, 
    alertType: 'HIGH_CONCENTRATION' | 'SECTOR_IMBALANCE' | 'PERFORMANCE_CONCERN',
    details: string
  ) {
    const alertTitles = {
      HIGH_CONCENTRATION: 'Concentração Alta Detectada',
      SECTOR_IMBALANCE: 'Desequilíbrio Setorial',
      PERFORMANCE_CONCERN: 'Alerta de Performance'
    };

    return this.createNotification({
      userId,
      type: 'PORTFOLIO_ALERT',
      priority: 'HIGH',
      title: alertTitles[alertType],
      message: details,
      data: { alertType }
    });
  }

  // Market alerts
  static async notifyMarketAlert(
    userId: string,
    title: string,
    message: string,
    priority: NotificationPriority = 'NORMAL'
  ) {
    return this.createNotification({
      userId,
      type: 'MARKET_ALERT',
      priority,
      title,
      message,
      data: { source: 'market_analysis' }
    });
  }

  // System updates
  static async notifySystemUpdate(
    userId: string,
    updateType: 'NEW_FEATURE' | 'MAINTENANCE' | 'IMPROVEMENT',
    title: string,
    message: string
  ) {
    const priorities = {
      NEW_FEATURE: 'NORMAL' as NotificationPriority,
      MAINTENANCE: 'HIGH' as NotificationPriority,
      IMPROVEMENT: 'LOW' as NotificationPriority
    };

    return this.createNotification({
      userId,
      type: 'SYSTEM_UPDATE',
      priority: priorities[updateType],
      title,
      message,
      data: { updateType }
    });
  }

  // Broadcast notification to all users
  static async broadcastToAllUsers(
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = 'NORMAL',
    data?: any
  ) {
    try {
      // Get all active users
      const users = await db.user.findMany({
        where: { isActive: true },
        select: { id: true }
      });

      const notifications = users.map(user => ({
        userId: user.id,
        type,
        priority,
        title,
        message,
        data
      }));

      // Create notifications in batch
      await db.notification.createMany({
        data: notifications
      });

      console.log(`Broadcast notification sent to ${users.length} users: ${title}`);
      return { sentTo: users.length };
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      throw error;
    }
  }

  // Clean up expired notifications
  static async cleanupExpiredNotifications() {
    try {
      const result = await db.notification.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      console.log(`Cleaned up ${result.count} expired notifications`);
      return result;
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      throw error;
    }
  }
}