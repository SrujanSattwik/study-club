const { v4: uuidv4 } = require('uuid');

async function trackActivity(userId, materialId, activityType, progress, getConnection) {
  const conn = await getConnection();
  try {
    const activityId = uuidv4();
    await conn.execute(
      `INSERT INTO user_material_activity (activity_id, user_id, material_id, activity_type, progress)
       VALUES (:activityId, :userId, :materialId, :activityType, :progress)`,
      { activityId, userId, materialId, activityType, progress: progress || 0 },
      { autoCommit: false }
    );
    
    // Update stats in same transaction
    await updateDashboardStatsInTransaction(userId, conn);
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    await conn.close();
  }
}

async function updateDashboardStatsInTransaction(userId, conn) {
  const stats = await conn.execute(
    `SELECT 
      COUNT(DISTINCT material_id) as total_materials,
      AVG(progress) as completion_rate
     FROM user_material_activity 
     WHERE user_id = :userId`,
    { userId }
  );

  const totalMaterials = stats.rows[0]?.TOTAL_MATERIALS || 0;
  const completionRate = stats.rows[0]?.COMPLETION_RATE || 0;

  const existing = await conn.execute(
    'SELECT user_id FROM user_dashboard_stats WHERE user_id = :userId',
    { userId }
  );

  if (existing.rows.length === 0) {
    await conn.execute(
      `INSERT INTO user_dashboard_stats (user_id, total_materials, completion_rate, last_updated)
       VALUES (:userId, :totalMaterials, :completionRate, CURRENT_TIMESTAMP)`,
      { userId, totalMaterials, completionRate },
      { autoCommit: false }
    );
  } else {
    await conn.execute(
      `UPDATE user_dashboard_stats 
       SET total_materials = :totalMaterials, 
           completion_rate = :completionRate,
           last_updated = CURRENT_TIMESTAMP
       WHERE user_id = :userId`,
      { userId, totalMaterials, completionRate },
      { autoCommit: false }
    );
  }
}

async function recordView(req, res, getConnection) {
  try {
    const { materialId } = req.body;
    if (!materialId) {
      return res.status(400).json({ success: false, message: 'Material ID is required' });
    }
    await trackActivity(req.userId, materialId, 'view', 0, getConnection);
    res.json({ success: true, message: 'View recorded' });
  } catch (error) {
    console.error('Record view error:', error);
    res.status(500).json({ success: false, message: 'Failed to record view' });
  }
}

async function recordDownload(req, res, getConnection) {
  try {
    const { materialId } = req.body;
    if (!materialId) {
      return res.status(400).json({ success: false, message: 'Material ID is required' });
    }
    await trackActivity(req.userId, materialId, 'download', 0, getConnection);
    res.json({ success: true, message: 'Download recorded' });
  } catch (error) {
    console.error('Record download error:', error);
    res.status(500).json({ success: false, message: 'Failed to record download' });
  }
}

async function updateProgress(req, res, getConnection) {
  try {
    const { materialId, progress } = req.body;
    if (!materialId) {
      return res.status(400).json({ success: false, message: 'Material ID is required' });
    }
    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({ success: false, message: 'Progress must be between 0 and 100' });
    }
    await trackActivity(req.userId, materialId, 'progress', progress, getConnection);
    res.json({ success: true, message: 'Progress updated' });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ success: false, message: 'Failed to update progress' });
  }
}

module.exports = { recordView, recordDownload, updateProgress };
