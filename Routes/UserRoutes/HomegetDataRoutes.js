import express from 'express';
import {getAllProjects, getProjectById, getResume, getUserAboutData, getUserEducation, getuserHomeData, getUserSkills} from '../../Controller/UserController/UserHomeController.js'
import Project from '../../Models/ProjectModels.js';
import { cacheMiddleware } from '../../Middleware/caching.js';
const router = express.Router();

router.get('/userhome-data', cacheMiddleware(HOME_CACHE_KEY), getuserHomeData);
router.get('/userabout-data', cacheMiddleware(ABOUT_CACHE_KEY), getUserAboutData);
router.get('/userskills-data', cacheMiddleware(SKILLS_CACHE_KEY), getUserSkills);
router.get('/usereducation-data', cacheMiddleware(EDUCATION_CACHE_KEY), getUserEducation);
router.get('/projects', cacheMiddleware(PROJECTS_CACHE_KEY), getAllProjects);
router.get('/projects/:id', async (req, res) => {
  const cacheKey = `project_${req.params.id}`;
  const cachedProject = cache.get(cacheKey);
  if (cachedProject) {
    return res.json(cachedProject);
  }
  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    cache.set(cacheKey, project);
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;