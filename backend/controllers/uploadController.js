const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const NodeClam = require('clamscan');

const uploadDir = path.join(__dirname, '..', 'uploads');
const quarantineDir = path.join(__dirname, '..', 'quarantine');

const ensureUploadDir = async () => {
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
  
  try {
    await fs.access(quarantineDir);
  } catch {
    await fs.mkdir(quarantineDir, { recursive: true });
  }
};

// Initialize ClamAV scanner
let clamScanner = null;
const initScanner = async () => {
  if (clamScanner) return clamScanner;
  
  try {
    clamScanner = await new NodeClam().init({
      removeInfected: false,
      quarantineInfected: quarantineDir,
      scanLog: path.join(__dirname, '..', 'logs', 'virus-scan.log'),
      debugMode: process.env.NODE_ENV !== 'production',
      clamdscan: {
        socket: false,
        host: '127.0.0.1',
        port: 3310,
        timeout: 60000,
        localFallback: true
      },
      preference: 'clamdscan'
    });
    console.log('✅ Antivirus scanner initialized');
    return clamScanner;
  } catch (error) {
    console.warn('⚠️ ClamAV not available, file scanning disabled:', error.message);
    return null;
  }
};

const uploadFile = async (req, res) => {
  let tempFilePath = null;
  
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

    // Write to temporary file for scanning
    const tempFilename = `temp_${crypto.randomBytes(16).toString('hex')}${ext}`;
    tempFilePath = path.join(uploadDir, tempFilename);
    await fs.writeFile(tempFilePath, fileBuffer);

    // Initialize and run virus scan
    const scanner = await initScanner();
    if (scanner) {
      try {
        const { isInfected, viruses } = await scanner.isInfected(tempFilePath);
        
        if (isInfected) {
          // Move to quarantine
          const quarantineFile = path.join(quarantineDir, tempFilename);
          await fs.rename(tempFilePath, quarantineFile);
          tempFilePath = null;
          
          // Log security event
          const { logSecurityEvent } = require('../middleware/securityLogger');
          logSecurityEvent('VIRUS_DETECTED', {
            filename: req.body.filename,
            viruses: viruses,
            userId: req.user?.userId,
            ip: req.ip
          });
          
          return res.status(400).json({
            success: false,
            message: 'File rejected: Malicious content detected',
            error: 'VIRUS_DETECTED'
          });
        }
      } catch (scanError) {
        console.error('Virus scan error:', scanError);
        // Continue upload if scanner fails (fallback behavior)
        console.warn('⚠️ Continuing upload without virus scan due to scanner error');
      }
    }

    // File is clean, move to final location
    const filename = `${crypto.randomBytes(16).toString('hex')}${ext}`;
    const filepath = path.join(uploadDir, filename);
    await fs.rename(tempFilePath, filepath);
    tempFilePath = null;

    const fileUrl = `/uploads/${filename}`;

    // Log successful upload
    const { logSecurityEvent } = require('../middleware/securityLogger');
    logSecurityEvent('FILE_UPLOADED', {
      filename: filename,
      originalFilename: req.body.filename,
      size: fileBuffer.length,
      userId: req.user?.userId,
      virusScanned: scanner !== null
    });

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: fileUrl,
        filename: filename,
        originalFilename: req.body.filename,
        size: fileBuffer.length,
        uploadedAt: new Date(),
        virusScanned: scanner !== null
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up temp file if it exists
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (cleanupError) {
        console.error('Failed to cleanup temp file:', cleanupError);
      }
    }
    
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
