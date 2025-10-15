
import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ensureAdmin } from '../auth';
import ExcelJS from 'exceljs';
import csv from 'csv-parser';
import { parseStringPromise } from 'xml2js';
import { z } from 'zod';
import { db } from '../db';
import { validateRequest } from '../utils/validation';
import { 
  fileUploadSchema, 
  importModeSchema, 
  importPlatformSchema, 
  importConfigSchema,
  templateParamSchema
} from '../schemas/admin-import-schemas';

const router = Router();

// Configure file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'imports');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname;
    cb(null, `${timestamp}-${originalName}`);
  }
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = ['.xlsx', '.csv', '.json', '.xml'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only XLSX, CSV, JSON, and XML files are allowed.'));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Schema validation for different import types
const releaseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  artist: z.string().min(1, "Artist is required"),
  // Add other fields as needed
});

const trackSchema = z.object({
  title: z.string().min(1, "Title is required"),
  primaryArtist: z.string().min(1, "Primary artist is required"),
  // Add other fields as needed
});

// Process Excel file
async function processExcelFile(filePath: string, importType: string, validationMode: 'strict' | 'lenient') {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  const worksheet = workbook.worksheets[0]; // Get the first worksheet
  
  // Convert worksheet data to array of objects
  const data: any[] = [];
  
  // Use headers from the first row
  const headers: string[] = [];
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber - 1] = cell.value ? cell.value.toString() : `Column${colNumber}`;
  });
  
  // Process each row
  worksheet.eachRow((row, rowNumber) => {
    // Skip the header row
    if (rowNumber > 1) {
      const rowData: any = {};
      
      // Process each cell in the row
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        rowData[header] = cell.value;
      });
      
      data.push(rowData);
    }
  });
  
  return processImportData(data, importType, validationMode);
}

// Process CSV file
async function processCsvFile(filePath: string, importType: string, validationMode: 'strict' | 'lenient') {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        processImportData(results, importType, validationMode)
          .then(resolve)
          .catch(reject);
      })
      .on('error', reject);
  });
}

// Process JSON file
async function processJsonFile(filePath: string, importType: string, validationMode: 'strict' | 'lenient') {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(fileContent);
  
  const importData = Array.isArray(data) ? data : 
                     data.items ? data.items : 
                     data.releases ? data.releases : 
                     data.tracks ? data.tracks : 
                     data.artists ? data.artists : 
                     [];
  
  return processImportData(importData, importType, validationMode);
}

// Process XML file
async function processXmlFile(filePath: string, importType: string, validationMode: 'strict' | 'lenient') {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const result = await parseStringPromise(fileContent, { explicitArray: false });
  
  let importData: any[] = [];
  
  if (result.releases && result.releases.release) {
    importData = Array.isArray(result.releases.release) ? result.releases.release : [result.releases.release];
  } else if (result.tracks && result.tracks.track) {
    importData = Array.isArray(result.tracks.track) ? result.tracks.track : [result.tracks.track];
  } else if (result.artists && result.artists.artist) {
    importData = Array.isArray(result.artists.artist) ? result.artists.artist : [result.artists.artist];
  }
  
  return processImportData(importData, importType, validationMode);
}

// Process the import data based on type
async function processImportData(data: any[], importType: string, validationMode: 'strict' | 'lenient') {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      status: 'error',
      message: 'No valid data found in the import file',
      affectedItems: 0,
      totalItems: 0
    };
  }
  
  const validItems: any[] = [];
  const invalidItems: any[] = [];
  const validationErrors: string[] = [];
  
  for (const item of data) {
    try {
      // Apply schema validation based on import type
      let validData;
      
      switch (importType) {
        case 'releases':
          validData = releaseSchema.parse(item);
          break;
        case 'tracks':
          validData = trackSchema.parse(item);
          break;
        // Add cases for other import types
        default:
          validData = item;
      }
      
      validItems.push(validData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = `Row ${data.indexOf(item) + 1}: ${error.errors.map(e => e.message).join(', ')}`;
        validationErrors.push(errorMessage);
      }
      
      invalidItems.push(item);
      
      // If in strict mode, abort on first error
      if (validationMode === 'strict' && invalidItems.length > 0) {
        return {
          status: 'error',
          message: 'Validation failed in strict mode',
          details: validationErrors,
          affectedItems: 0,
          totalItems: data.length
        };
      }
    }
  }
  
  if (validItems.length === 0) {
    return {
      status: 'error',
      message: 'No valid items found in the import file',
      details: validationErrors,
      affectedItems: 0,
      totalItems: data.length
    };
  }
  
  // In a real implementation, you would save the valid items to the database here
  // For now, we'll just return the results
  
  if (invalidItems.length > 0) {
    return {
      status: 'warning',
      message: `Import completed with ${invalidItems.length} warnings`,
      details: validationErrors,
      affectedItems: validItems.length,
      totalItems: data.length
    };
  }
  
  return {
    status: 'success',
    message: `Successfully imported ${validItems.length} ${importType}`,
    affectedItems: validItems.length,
    totalItems: data.length
  };
}

// Route to handle metadata imports
router.post('/metadata', 
  ensureAdmin, 
  upload.single('file'),
  // Validate file upload 
  (req, res, next) => {
    try {
      fileUploadSchema.parse({ file: req.file });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation error',
          details: error.errors.map(err => err.message)
        });
      }
      next(error);
    }
  },
  // Validate import configuration
  (req, res, next) => {
    try {
      const config = {
        mode: req.body.mode || 'merge',
        validateOnly: req.body.validateOnly === 'true',
        skipErrors: req.body.skipErrors === 'true',
        updateExisting: req.body.updateExisting !== 'false',
        platform: req.body.platform,
        options: {
          generateMissingIds: req.body.generateMissingIds !== 'false',
          importRoyalties: req.body.importRoyalties !== 'false',
          importAnalytics: req.body.importAnalytics !== 'false',
          validateMetadata: req.body.validateMetadata !== 'false'
        }
      };
      
      importConfigSchema.parse(config);
      req.body.importConfig = config;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 'error',
          message: 'Import configuration validation error',
          details: error.errors.map(err => err.message)
        });
      }
      next(error);
    }
  },
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      // File validation already done by middleware
      
      if (!file) {
        return res.status(400).json({
          status: 'error',
          message: 'No file was uploaded'
        });
      }
      
      const importType = req.body.importType || 'releases';
      const validationMode = req.body.validationMode || 'strict';
      
      const filePath = file.path;
      const fileExt = path.extname(file.originalname).toLowerCase();
      
      let result;
      
      switch (fileExt) {
        case '.xlsx':
          result = await processExcelFile(filePath, importType, validationMode);
          break;
        case '.csv':
          result = await processCsvFile(filePath, importType, validationMode);
          break;
        case '.json':
          result = await processJsonFile(filePath, importType, validationMode);
          break;
        case '.xml':
          result = await processXmlFile(filePath, importType, validationMode);
          break;
        default:
          return res.status(400).json({
            status: 'error',
            message: 'Unsupported file format'
          });
      }
      
      res.json(result);
    } catch (error) {
      console.error('Import error:', error);
      res.status(500).json({
        status: 'error',
        message: 'An error occurred during import processing',
        details: [(error as Error).message]
      });
    }
  }
);

// Route to get import templates
router.get('/templates/:template', 
  ensureAdmin,
  validateRequest(templateParamSchema, 'params'),
  (req: Request, res: Response) => {
    const templateName = req.params.template;
    const templatesDir = path.join(process.cwd(), 'server', 'templates');
    
    // This is just a placeholder. In a real implementation, you would have actual template files
    // For now, we'll just return a status to simulate template downloads
    
    res.status(200).json({
      status: 'success',
      message: `Template ${templateName} would be downloaded here`
    });
  }
);

export default router;
