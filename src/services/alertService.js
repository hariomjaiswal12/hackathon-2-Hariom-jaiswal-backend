const Alert = require('../models/Alert');
const User = require('../models/User');
const AppError = require('../utils/appError');

class AlertService {
  async getAlerts(userId) {
    let alerts = [];
    let notifPrefs = null;

    if (userId) {
      alerts = await Alert.find({ userId }).sort({ createdAt: -1 }).lean();
      const user = await User.findById(userId).select('notificationPreferences').lean();
      if (user && user.notificationPreferences) {
        notifPrefs = user.notificationPreferences;
      }
    }

    if (!alerts || alerts.length === 0) {
      // Fallback to sample watchlist alerts
      alerts = await Alert.find({}).sort({ createdAt: -1 }).limit(10).lean();
    }

    // Apply notification preferences if configured
    if (notifPrefs) {
      alerts = alerts.filter((a) => {
        if (notifPrefs.evidenceUpdates === false && (a.type === 'evidence_alert' || a.type === 'score_update')) {
          return false;
        }
        if (notifPrefs.sourceConflictAlerts === false && a.type === 'source_freshness') {
          return false;
        }
        return true;
      });
    }

    return alerts.map((a) => ({
      id: a._id.toString(),
      companyId: a.companySlug || a.companyId?.toString() || 'tcs',
      companyName: a.companyName || 'TCS',
      type: a.type,
      title: a.title,
      date: a.date || 'Oct 28, 2026',
      previousScore: a.previousScore,
      newScore: a.newScore,
      description: a.description,
      isNew: a.isNew ?? true,
      actionText: a.actionText || 'Review changes',
    }));
  }

  async markAsRead(userId, alertId) {
    const alert = await Alert.findOneAndUpdate(
      { _id: alertId, userId },
      { isRead: true, isNew: false },
      { new: true }
    );
    if (!alert) {
      throw new AppError('Alert not found', 404, 'ALERT_NOT_FOUND');
    }
    return alert;
  }
}

module.exports = new AlertService();
