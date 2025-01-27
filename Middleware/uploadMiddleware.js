import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sharp from 'sharp'; // Add sharp for image processing

const writeFile = promisify(fs.writeFile);

// Configure multer storage and options
const storage = multer.memoryStorage();

// Separate file filter for images and resumes
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'image') {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Only JPG, PNG and WebP images are allowed'), false);
        }
        cb(null, true);
    } else if (file.fieldname === 'resume') {
        const allowedTypes = ['application/pdf'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Only PDF files are allowed for resume'), false);
        }
        cb(null, true);
    } else {
        cb(new Error('Unexpected field'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1
    },
    fileFilter: fileFilter
});

// Save file to disk with WebP conversion for images
const saveFile = async (buffer, originalname, fieldname) => {
    const timestamp = Date.now();
    const uniqueSuffix = `${timestamp}-${Math.round(Math.random() * 1E9)}`;
    
    if (fieldname === 'image') {
        const webpBuffer = await sharp(buffer)
            .webp({ quality: 80, nearLossless: true })
            .toBuffer();
        
        // Include timestamp in filename
        const filename = `${fieldname}-${uniqueSuffix}.webp`;
        const uploadDir = path.join(process.cwd(), 'uploads', 'images');
        
        await fs.promises.mkdir(uploadDir, { recursive: true });
        
        const filepath = path.join(uploadDir, filename);
        await fs.promises.writeFile(filepath, webpBuffer);
        
        // Return URL with timestamp
        return `/uploads/images/${filename}`;
    } else if (fieldname === 'resume') {
        const extension = path.extname(originalname);
        const filename = `${fieldname}-${uniqueSuffix}${extension}`;
        const uploadDir = path.join(process.cwd(), 'uploads', 'resumes');
        
        await fs.promises.mkdir(uploadDir, { recursive: true });
        
        const filepath = path.join(uploadDir, filename);
        await fs.promises.writeFile(filepath, buffer);
        
        return `/uploads/resumes/${filename}`;
    }
};

// Remove uploaded file
export const removeUploadedFile = (filePath) => {
    if (filePath) {
        try {
            const fullPath = path.join(process.cwd(), filePath.replace(/^\/uploads/, 'uploads'));
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        } catch (error) {
            console.error('Error removing file:', error);
        }
    }
};

// Main upload middleware
export const uploadMiddleware = (req, res, next) => {
    const uploadFields = upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'resume', maxCount: 1 }
    ]);

    uploadFields(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                success: false,
                message: `Upload error: ${err.message}`
            });
        } else if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        try {
            if (req.files) {
                for (const [fieldName, files] of Object.entries(req.files)) {
                    const file = files[0];
                    const filepath = await saveFile(
                        file.buffer,
                        file.originalname,
                        fieldName
                    );
                    req.body[fieldName] = filepath;
                }
            }
            next();
        } catch (error) {
            console.error('File processing error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error processing uploaded files'
            });
        }
    });
};

const removeOldFile = async (filePath) => {
    if (!filePath) return;
    
    try {
        const absolutePath = path.join(process.cwd(), 'uploads', filePath.replace(/^\/uploads\//, ''));
        
        if (fs.existsSync(absolutePath)) {
            await fs.promises.unlink(absolutePath);
            console.log(`Successfully removed old file: ${absolutePath}`);
        }
    } catch (error) {
        console.error('Error removing old file:', error);
    }
};

export { removeOldFile };
