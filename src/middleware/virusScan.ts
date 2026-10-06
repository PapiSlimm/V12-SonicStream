import { Response, NextFunction } from 'express';
import fs from 'fs';

// Simulated virus scan for demo purposes
// In a real app, you'd use ClamAV or a similar service
export const virusScan = async (req: any, res: Response, next: NextFunction) => {
  const file = req.file;
  if (!file) return next();

  console.log(`Scanning file: ${file.originalname} (${file.size} bytes)`);

  // Simulate scanning delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simulate a "clean" result
  const isClean = true;

  if (!isClean) {
    fs.unlinkSync(file.path); // Delete malicious file
    return res.status(400).json({ error: 'Virus detected in uploaded file' });
  }

  console.log('File scan complete: CLEAN');
  next();
};

export const validateFileSignature = (req: any, res: Response, next: NextFunction) => {
  const file = req.file;
  if (!file) return next();

  // Basic MIME type check (already handled by multer, but extra layer)
  const allowedMimes = ['audio/mpeg', 'audio/wav', 'video/mp4', 'image/jpeg', 'image/png'];
  if (!allowedMimes.includes(file.mimetype)) {
    fs.unlinkSync(file.path);
    return res.status(400).json({ error: 'Invalid file signature' });
  }

  next();
};
