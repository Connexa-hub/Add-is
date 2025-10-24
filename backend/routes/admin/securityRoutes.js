
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const verifyToken = require('../../middleware/verifyToken');
const isAdmin = require('../../middleware/isAdmin');

const quarantineDir = path.join(__dirname, '../../quarantine');
const scanLogFile = path.join(__dirname, '../../logs/virus-scan.log');

// Get quarantined files
router.get('/quarantine', verifyToken, isAdmin, async (req, res) => {
  try {
    const files = await fs.readdir(quarantineDir);
    const fileDetails = await Promise.all(
      files.map(async (filename) => {
        const filePath = path.join(quarantineDir, filename);
        const stats = await fs.stat(filePath);
        return {
          filename,
          size: stats.size,
          quarantinedAt: stats.mtime
        };
      })
    );

    res.json({
      success: true,
      data: {
        count: fileDetails.length,
        files: fileDetails
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quarantined files',
      error: error.message
    });
  }
});

// Get virus scan logs
router.get('/scan-logs', verifyToken, isAdmin, async (req, res) => {
  try {
    const logContent = await fs.readFile(scanLogFile, 'utf-8');
    const logs = logContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(log => log !== null)
      .reverse()
      .slice(0, 100);

    res.json({
      success: true,
      data: { logs }
    });
  } catch (error) {
    res.json({
      success: true,
      data: { logs: [] }
    });
  }
});

// Delete quarantined file
router.delete('/quarantine/:filename', verifyToken, isAdmin, async (req, res) => {
  try {
    const filePath = path.join(quarantineDir, req.params.filename);
    await fs.unlink(filePath);

    res.json({
      success: true,
      message: 'Quarantined file deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete quarantined file',
      error: error.message
    });
  }
});

module.exports = router;
