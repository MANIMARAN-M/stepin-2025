import express, { Request, Response } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { main } from './generatePlan';

const app = express();
const PORT = 3000;

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Save the uploaded file to a specific directory with a custom name
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

// Configure multer for file uploads
const upload = multer({ storage });

app.get('/', (req: Request, res: Response) => {
  main();
  res.sendFile(path.join(__dirname, 'plan.html'));
});

app.get('/plan.json', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'plan.json'));
});

// API endpoint to handle file uploads using multer
app.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      message: 'No file uploaded. Ensure the field name is "file" in the form-data.',
    });
  }

  res.status(200).json({
    message: 'File uploaded successfully',
    filePath: req.file.path,
    originalName: req.file.originalname,
  });
});

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Report is generated at http://localhost:${PORT}`);
});

// Extend the Request type to include the `file` property
declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}