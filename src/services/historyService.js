const ResearchHistory = require('../models/ResearchHistory');

class HistoryService {
  async getHistory(userId, filterType = 'all') {
    const query = { userId };

    if (filterType === 'companies') {
      query.type = 'Company';
    } else if (filterType === 'comparisons') {
      query.type = 'Comparison';
    } else if (filterType === 'ai_questions' || filterType === 'questions') {
      query.type = 'AI question';
    }

    const items = await ResearchHistory.find(query).sort({ createdAt: -1 }).limit(50).lean();

    return items.map((item) => ({
      id: item._id.toString(),
      activity: item.activity,
      type: item.type,
      context: item.context,
      time: item.time || new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateGroup: item.dateGroup || 'TODAY / OCT 28, 2026',
      link: item.link,
    }));
  }

  async addHistory(userId, itemData) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const item = await ResearchHistory.create({
      userId,
      activity: itemData.activity,
      type: itemData.type,
      context: itemData.context || '',
      link: itemData.link || '',
      companySlug: itemData.companySlug,
      time: timeStr,
      dateGroup: itemData.dateGroup || 'TODAY / OCT 28, 2026',
    });

    return {
      id: item._id.toString(),
      activity: item.activity,
      type: item.type,
      context: item.context,
      time: item.time,
      dateGroup: item.dateGroup,
      link: item.link,
    };
  }

  async clearHistory(userId) {
    await ResearchHistory.deleteMany({ userId });
    return true;
  }
}

module.exports = new HistoryService();

