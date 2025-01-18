import { removeUploadedFile } from '../Middleware/uploadMiddleware.js';
import Certificate from '../Models/CertificateModel.js';



// Get all certificates
export const getCertificate = async (req, res) => {
    try {
        const certificates = await Certificate.find()
            .sort({ date: -1 }); // Sort by date in descending order
        
        res.status(200).json({
            success: true,
            message: 'Certificates fetched successfully',
            data: certificates
        });
    } catch (error) {
        console.error('Error fetching certificates:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching certificates',
            error: error.message
        });
    }
};

// Update certificate
export const updateCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, platform, date } = req.body;

        // Find existing certificate
        const existingCertificate = await Certificate.findById(id);
        if (!existingCertificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found'
            });
        }

        // Prepare update data
        const updateData = {
            title: title || existingCertificate.title,
            platform: platform || existingCertificate.platform,
            date: date || existingCertificate.date,
        };

        // Handle image update if new image is uploaded
        if (req.body.image) {
            // Remove old image file
            if (existingCertificate.image) {
                removeUploadedFile(existingCertificate.image);
            }
            updateData.image = req.body.image;
        }

        // Update certificate
        const updatedCertificate = await Certificate.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Certificate updated successfully',
            data: updatedCertificate
        });
    } catch (error) {
        console.error('Error updating certificate:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating certificate',
            error: error.message
        });
    }
};

// Fix the addCertificate controller
export const addCertificate = async (req, res) => {
    try {
        const { title, platform, date } = req.body;
        
        if (!title || !platform || !date || !req.body.image) {
            return res.status(400).json({
                success: false,
                message: 'All fields including image are required'
            });
        }

        const certificate = await Certificate.create({
            title,
            platform,
            date,
            image: req.body.image
        });

        res.status(201).json({
            success: true,
            message: 'Certificate added successfully',
            data: certificate
        });
    } catch (error) {
        console.error('Error adding certificate:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding certificate',
            error: error.message
        });
    }
};

// Fix the deleteCertificate controller
export const deleteCertificate = async (req, res) => {
    try {
        const { id } = req.params;

        // Find certificate to get image path
        const certificate = await Certificate.findById(id);
        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found'
            });
        }

        // Remove image file
        if (certificate.image) {
            removeUploadedFile(certificate.image);
        }

        // Delete certificate from database
        await Certificate.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Certificate deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting certificate:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting certificate',
            error: error.message
        });
    }
};