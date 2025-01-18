import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import About from '../Models/AboutModel.js';
import { removeOldFile } from '../Middleware/uploadMiddleware.js';


// Get current directory when using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Utility function for file upload
const handleFileUpload = async (file, type) => {
    try {
        const uploadDir = path.join(__dirname, `../../public/uploads/${type}`);
        
        // Create directory if it doesn't exist
        await fs.promises.mkdir(uploadDir, { recursive: true });
        
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = uniqueSuffix + path.extname(file.originalname);
        const filepath = path.join(uploadDir, filename);
        
        // Write file using promises
        await fs.promises.writeFile(filepath, file.buffer);
        return `/uploads/${type}/${filename}`;
    } catch (error) {
        throw new Error(`File upload failed: ${error.message}`);
    }
};

// Controller for fetching the 'About' section
export const getAbout = async (req, res) => {
    try {
        const about = await About.findOne().sort({ updatedAt: -1 });
        if (!about) {
            return res.status(404).json({ 
                success: false,
                message: 'About section not found' 
            });
        }
        res.status(200).json({
            success: true,
            data: about
        });
    } catch (error) {
        console.error('Get About Error:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || "Internal server error while fetching about section"
        });
    }
};

// Controller for updating or creating the 'About' section
export const updateAbout = async (req, res) => {
    try {
        let aboutData = { ...req.body };
        
        // Convert string numbers to actual numbers
        if (aboutData.projectsCompleted) {
            aboutData.projectsCompleted = Number(aboutData.projectsCompleted);
        }
        if (aboutData.experience) {
            aboutData.experience = Number(aboutData.experience);
        }

        // Find existing about section
        const existingAbout = await About.findOne();

        let about;
        if (!existingAbout) {
            about = new About(aboutData);
            await about.save();
        } else {
            // Remove old files if new ones are uploaded
            if (aboutData.image && existingAbout.image) {
                await removeOldFile(existingAbout.image);
            }
            if (aboutData.resume && existingAbout.resume) {
                await removeOldFile(existingAbout.resume);
            }

            about = await About.findByIdAndUpdate(
                existingAbout._id,
                { 
                    ...aboutData,
                    updatedAt: Date.now()
                },
                { 
                    new: true,
                    runValidators: true 
                }
            );
        }

        if (!about) {
            return res.status(404).json({
                success: false,
                message: "Failed to save about section"
            });
        }

        res.status(200).json({
            success: true,
            data: about,
            message: existingAbout ? "Updated successfully" : "Created successfully"
        });
    } catch (error) {
        console.error('Update About Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Internal server error while updating about section"
        });
    }
};