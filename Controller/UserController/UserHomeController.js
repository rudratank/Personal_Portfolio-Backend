import About from "../../Models/AboutModel.js";
import Certificate from "../../Models/CertificateModel.js";
import Education from "../../Models/EducationModel.js";
import Home from "../../Models/HomeModel.js";
import Project from "../../Models/ProjectModels.js";
import Skils from "../../Models/Skillmodel.js";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

export const getuserHomeData = async (req, res) => {
    try {
      const homeData = await Home.findOne()
        .select('name title description image socialLinks')
        .lean()
        .sort({ createdAt: -1 });
      
      if (!homeData) {
        return res.status(404).json({ message: 'No home data found' });
      }
  
      res.status(200).json(homeData);
    } catch (error) {
      res.status(500).json({ 
        message: 'Error fetching home data',
        error: error.message 
      });
    }
  };


// Controller/UserController/UserAboutController.js

export const getUserAboutData = async (req, res) => {
    try {
        const aboutData = await About.findOne().sort({ updatedAt: -1 });
        
        if (!aboutData) {
            return res.status(404).json({
                success: false,
                message: 'About data not found'
            });
        }

        res.status(200).json({
            success: true,
            data: aboutData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching about data',
            error: error.message
        });
    }
};

export const getUserSkills = async (req, res) => {
    try {
        // Fetch all skills and sort them by category
        const skills = await Skils.find({}).sort({ category: 1, name: 1 });
        
        // Group skills by category
        const groupedSkills = {
            frontend: skills.filter(skill => skill.category === 'frontend'),
            backend: skills.filter(skill => skill.category === 'backend')
        };
        

        if (!skills.length) {
            return res.status(404).json({
                success: false,
                message: 'No skills found'
            });
        }

        res.status(200).json({
            success: true,
            data: groupedSkills
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching skills data',
            error: error.message
        });
    }
};

export const getUserEducation = async (req, res) => {
    try {
        // Fetch education data
        const educationData = await Education.find()
            .sort({ 'period': -1 }) // Sort by period in descending order
            .lean(); // Convert mongoose documents to plain JavaScript objects

        // Fetch certificates
        const certificateData = await Certificate.find()
            .sort({ 'date': -1 }) // Sort by date in descending order
            .lean(); // Convert mongoose documents to plain JavaScript objects

        // Transform certificate data to match frontend structure
        const transformedCertificates = certificateData.map(cert => ({
            id: cert._id.toString(),
            title: cert.title,
            platform: cert.platform,
            imageUrl: cert.image,
            date: cert.date, // We'll use the original date format
            credentialId: cert.credentialId || null,
            credentialUrl: cert.credentialUrl || null,
            skills: cert.skills || []
        }));

        res.status(200).json({
            success: true,
            data: {
                education: educationData,
                certificates: transformedCertificates
            }
        });
    } catch (error) {
        console.error('Error in getUserEducation:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching education data',
            error: error.message
        });
    }
};

export const getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find({});
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.status(200).json(project);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const getResume = async (req, res) => {
    try {
        const about = await About.findOne({}, 'resume');
        if (!about || !about.resume) {
            return res.status(404).json({ message: 'Resume not found' });
        }

        const relativePath = about.resume.replace(/^\//, '');
        const filePath = path.join(__dirname, '../../', relativePath);
        
        if (!fs.existsSync(filePath)) {
            console.error('File not found:', filePath);
            console.error('Absolute file path:', filePath);
            console.error('Relative path from database:', about.resume);
            return res.status(404).json({ message: 'Resume file not found' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=Resume.pdf');
        
        // Stream the file instead of using res.download
        const fileStream = fs.createReadStream(filePath);
        
        fileStream.pipe(res);
        
        fileStream.on('error', (err) => {
            console.error('File stream error:', err);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Error streaming file' });
            }
        });

    } catch (error) {
        console.error('Resume fetch error:', error);
        res.status(500).json({ message: error.message });
    }
};
