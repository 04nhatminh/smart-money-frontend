import analyticsAPI from "../api/transaction_analytics.api";
import { FinancialSetupApi } from "../api/financialSetup.api";
import notificationService from "../notification/notificationService";
import { notificationEmitter } from "../utils/notificationEmitter";

export interface OverspendingWarning {
  /** Tổng chi tháng hiện tại */
  monthlyTotalExpense: number;
  /** Tổng thu tháng hiện tại */
  monthlyTotalIncome: number;
  /** Mức thâm hụt = chi - thu */
  deficit: number;
  /** Thu nhập người dùng đã thiết lập trong Financial Setup */
  setupIncome: number;
}

const NOTIFICATION_CONTENT = "notification.overspending_warning";

class OverspendingWarningService {
  /**
   * So sánh thâm hụt tháng hiện tại (tổng chi - tổng thu) với thu nhập
   * đã thiết lập. Trả về chi tiết cảnh báo nếu thâm hụt lớn hơn thu nhập
   * thiết lập, ngược lại trả về null.
   */
  async check(): Promise<OverspendingWarning | null> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const [analyticsRes, setupRes] = await Promise.all([
      analyticsAPI.getTransactionAnalytics(month, year),
      FinancialSetupApi.getFinancialSetup(),
    ]);

    if (!analyticsRes.success || !analyticsRes.data) return null;
    if (!setupRes.success || !setupRes.data) return null;

    const monthlyTotalExpense = analyticsRes.data.monthlyTotalExpense || 0;
    const monthlyTotalIncome = analyticsRes.data.monthlyTotalIncome || 0;
    const setupIncome = setupRes.data.income || 0;

    const deficit = monthlyTotalExpense - monthlyTotalIncome;

    if (deficit > setupIncome) {
      return { monthlyTotalExpense, monthlyTotalIncome, deficit, setupIncome };
    }

    return null;
  }

  /**
   * Tạo thông báo cảnh báo trên server và cập nhật badge chưa đọc.
   * Lỗi ở bước này không được chặn luồng tạo giao dịch.
   */
  async notify(): Promise<void> {
    try {
      await notificationService.createNotification({
        content: NOTIFICATION_CONTENT,
      });

      const unread = await notificationService.getUnreadCount();
      notificationEmitter.emit("NEW_NOTIFICATION", unread);
    } catch (error) {
      console.log("OverspendingWarningService.notify error:", error);
    }
  }

  /**
   * Gọi sau khi tạo giao dịch mới: kiểm tra điều kiện bội chi, nếu vượt
   * thì tạo thông báo cảnh báo và trả về dữ liệu cho panel cảnh báo.
   */
  async checkAndNotify(): Promise<OverspendingWarning | null> {
    try {
      const warning = await this.check();
      if (!warning) return null;

      await this.notify();
      return warning;
    } catch (error) {
      console.log("OverspendingWarningService.checkAndNotify error:", error);
      return null;
    }
  }
}

export default new OverspendingWarningService();
