import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "../auth";

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "uploads/";
    
    // Determine upload directory based on mime type
    if (file.mimetype.startsWith("audio/")) {
      uploadPath += "audio/";
    } else if (file.mimetype.startsWith("image/")) {
      uploadPath += "images/";
    } else {
      uploadPath += "documents/";
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const fileId = uuidv4();
    const extension = path.extname(file.originalname);
    const filename = `${fileId}${extension}`;
    cb(null, filename);
  }
});

// File size limits
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB for audio files
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB for images
const MAX_DOC_SIZE = 20 * 1024 * 1024;   // 20MB for documents

// File size limit based on file type
const fileSizeLimit = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith("audio/")) {
    if (parseInt(req.headers["content-length"] || "0") > MAX_AUDIO_SIZE) {
      return cb(new Error(`Audio file size should not exceed ${MAX_AUDIO_SIZE / (1024 * 1024)}MB`));
    }
  } else if (file.mimetype.startsWith("image/")) {
    if (parseInt(req.headers["content-length"] || "0") > MAX_IMAGE_SIZE) {
      return cb(new Error(`Image file size should not exceed ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`));
    }
  } else {
    if (parseInt(req.headers["content-length"] || "0") > MAX_DOC_SIZE) {
      return cb(new Error(`Document file size should not exceed ${MAX_DOC_SIZE / (1024 * 1024)}MB`));
    }
  }
  cb(null, true);
};

// File type filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed MIME types
  const allowedAudioTypes = ["audio/mpeg", "audio/wav", "audio/flac", "audio/aac", "audio/ogg"];
  const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const allowedDocTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  
  if (file.mimetype.startsWith("audio/") && !allowedAudioTypes.includes(file.mimetype)) {
    return cb(new Error("Invalid audio file format. Allowed formats: MP3, WAV, FLAC, AAC, OGG"));
  }
  
  if (file.mimetype.startsWith("image/") && !allowedImageTypes.includes(file.mimetype)) {
    return cb(new Error("Invalid image file format. Allowed formats: JPEG, PNG, GIF, WEBP"));
  }
  
  if (file.mimetype.startsWith("application/") && !allowedDocTypes.includes(file.mimetype)) {
    return cb(new Error("Invalid document file format. Allowed formats: PDF, DOC, DOCX"));
  }
  
  cb(null, true);
};

// Configure multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Math.max(MAX_AUDIO_SIZE, MAX_IMAGE_SIZE, MAX_DOC_SIZE)
  }
});

// Handle file upload
export const uploadFile = async (req: Request, res: Response) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      console.error("File upload error:", err);
      return res.status(400).json({ 
        success: false, 
        message: err.message || "Error uploading file" 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No file uploaded" 
      });
    }
    
    try {
      const file = req.file;
      const fileId = path.parse(file.filename).name; // Extract UUID from filename
      const fileUrl = `/api/uploads/${file.filename}`;
      
      // Return file information in response
      return res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        fileId,
        fileUrl,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size
      });
    } catch (error: any) {
      console.error("File processing error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Error processing uploaded file" 
      });
    }
  });
};

// Serve uploaded files
export const serveUploadedFile = (req: Request, res: Response) => {
  const filename = req.params.filename;
  
  // Determine file path based on extension
  const ext = path.extname(filename).toLowerCase();
  let filePath = "";
  
  if ([".mp3", ".wav", ".flac", ".aac", ".ogg"].includes(ext)) {
    filePath = path.join("uploads/audio", filename);
  } else if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) {
    filePath = path.join("uploads/images", filename);
  } else {
    filePath = path.join("uploads/documents", filename);
  }
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ 
      success: false, 
      message: "File not found" 
    });
  }
  
  // Serve the file
  res.sendFile(path.resolve(filePath));
};