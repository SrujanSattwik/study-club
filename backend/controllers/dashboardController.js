async function getDashboard(req, res, getConnection) {
  try {
    const userId = req.userId;
    const conn = await getConnection();

    try {
      // Get dashboard stats
      const statsResult = await conn.execute(
        `SELECT total_materials, completion_rate, last_updated 
         FROM user_dashboard_stats 
         WHERE user_id = :userId`,
        { userId }
      );

      const stats = statsResult.rows[0] || {
        TOTAL_MATERIALS: 0,
        COMPLETION_RATE: 0,
        LAST_UPDATED: null
      };

      // Get recent activity (last 5)
      const activityResult = await conn.execute(
        `SELECT * FROM (
           SELECT activity_id, material_id, activity_type, progress, accessed_at
           FROM user_material_activity
           WHERE user_id = :userId
           ORDER BY accessed_at DESC
         ) WHERE ROWNUM <= 5`,
        { userId }
      );

      const recentActivity = activityResult.rows.map(row => ({
        activityId: row.ACTIVITY_ID,
        materialId: row.MATERIAL_ID,
        activityType: row.ACTIVITY_TYPE,
        progress: row.PROGRESS,
        timestamp: row.ACCESSED_AT
      }));

      res.json({
        success: true,
        data: {
          stats: {
            totalMaterials: stats.TOTAL_MATERIALS,
            completionRate: stats.COMPLETION_RATE,
            lastUpdated: stats.LAST_UPDATED
          },
          recentActivity
        }
      });
    } finally {
      await conn.close();
    }
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
  }
}

module.exports = { getDashboard };
