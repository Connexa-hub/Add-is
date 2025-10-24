const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const uploadDir = path.join(__dirname, '..', 'uploads');

const ensureUploadDir = async () => {
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
};

const uploadFile = async (req, res) => {
  try {
    await ensureUploadDir();
    
    if (!req.body.file || !req.body.filename) {
      return res.status(400).json({
        success: false,
        message: 'File data and filename are required'
      });
    }

    const base64Data = req.body.file.replace(/^data:([A-Za-z-+/]+);base64,/, '');
    const fileBuffer = Buffer.from(base64Data, 'base64');
    
    const ext = path.extname(req.body.filename);
    const allowedExts = ['.jpg', '.jpeg', '.png', '.pdf', '.gif', '.mp4', '.webm', '.mov'];
    
    if (!allowedExts.includes(ext.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Allowed: jpg, jpeg, png, pdf, gif, mp4, webm, mov'
      });
    }

    // 10MB for videos, 5MB for images
    const maxSize = ['.mp4', '.webm', '.mov'].includes(ext.toLowerCase()) ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    
    if (fileBuffer.length > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File size must be less than ${maxSize / (1024 * 1024)}MB`
      });
    }

    const filename = `${crypto.randomBytes(16).toString('hex')}${ext}`;
    const filepath = path.join(uploadDir, filename);
    
    await fs.writeFile(filepath, fileBuffer);

    const fileUrl = `/uploads/${filename}`;

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: fileUrl,
        filename: filename,
        originalFilename: req.body.filename,
        size: fileBuffer.length,
        uploadedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error.message
    });
  }
};

module.exports = {
  uploadFile
};
