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
      // Use lean() for better performance when you don't need Mongoose documents
      const homeData = await Home.findOne()
        .sort({ createdAt: -1 })
        .select('-__v') // Exclude version key
        .lean();
      
      if (!homeData) {
        return res.status(404).json({ message: 'No home data found' });
      }
  
      res.sendAndCache(homeData);
    } catch (error) {
      console.error('Error fetching home data:', error);
      res.status(500).json({ message: 'Error fetching home data' });
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
      // Use projection to select only needed fields
      const skills = await Skils.find({}, 'category name proficiency')
        .lean()
        .sort({ category: 1, name: 1 });
  
      // Use reduce instead of filter for better performance
      const groupedSkills = skills.reduce((acc, skill) => {
        const category = skill.category || 'other';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(skill);
        return acc;
      }, {});
  
      if (!skills.length) {
        return res.status(404).json({
          success: false,
          message: 'No skills found'
        });
      }
  
      res.sendAndCache({
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
      // Use Promise.all for parallel execution
      const [educationData, certificateData] = await Promise.all([
        Education.find()
          .select('-__v')
          .sort({ 'period': -1 })
          .lean(),
        Certificate.find()
          .select('-__v')
          .sort({ 'date': -1 })
          .lean()
      ]);
  
      const transformedCertificates = certificateData.map(({ 
        _id, title, platform, image, date, credentialId, credentialUrl, skills 
      }) => ({
        id: _id.toString(),
        title,
        platform,
        imageUrl: image,
        date,
        credentialId: credentialId || null,
        credentialUrl: credentialUrl || null,
        skills: skills || []
      }));
  
      res.sendAndCache({
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

        // Remove the leading slash if present
        const relativePath = about.resume.replace(/^\//, '');
        
        // Construct the correct file path
        const filePath = path.join(__dirname, '../../', relativePath);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error('File not found:', filePath);
            return res.status(404).json({ message: 'Resume file not found' });
        }

        // Set headers for file download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=Resume.pdf');
        
        // Send the file
        res.download(filePath, 'Resume.pdf', (err) => {
            if (err) {
                console.error('Download error:', err);
                return res.status(500).json({ message: 'Error downloading file' });
            }
        });
    } catch (error) {
        console.error('Resume fetch error:', error);
        res.status(500).json({ message: error.message });
    }
};