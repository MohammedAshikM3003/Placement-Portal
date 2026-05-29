const express = require('express');

const aiService = require('../services/aiService');

const router = express.Router();

async function enhanceText(text) {
  if (!text || !String(text).trim()) {
    return '';
  }
  const result = await aiService.enhanceResume(String(text));
  return result.enhanced || result.corrected || String(text).trim();
}

router.get('/health', async (req, res) => {
  try {
    const status = await aiService.health();
    res.json(status);
  } catch (error) {
    res.status(503).json({ status: 'unavailable', error: error.message });
  }
});

router.post('/grammar/check', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }
    const result = await aiService.checkGrammar(String(text));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Grammar check failed', details: error.message });
  }
});

router.post('/resume/enhance', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }
    const result = await aiService.enhanceResume(String(text));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Resume enhancement failed', details: error.message });
  }
});

router.post('/resume/enhance-batch', async (req, res) => {
  try {
    const { sections } = req.body || {};
    if (!sections || typeof sections !== 'object') {
      return res.status(400).json({ error: 'sections is required' });
    }

    const summary = await enhanceText(sections.summary || '');
    const experiences = Array.isArray(sections.experiences)
      ? await Promise.all(sections.experiences.map(enhanceText))
      : [];
    const projects = Array.isArray(sections.projects)
      ? await Promise.all(sections.projects.map(enhanceText))
      : [];
    const certifications = Array.isArray(sections.certifications)
      ? await Promise.all(sections.certifications.map(enhanceText))
      : [];
    const achievements = Array.isArray(sections.achievements)
      ? await Promise.all(sections.achievements.map(enhanceText))
      : [];

    res.json({
      summary,
      experiences,
      projects,
      certifications,
      achievements,
    });
  } catch (error) {
    res.status(500).json({ error: 'Batch resume enhancement failed', details: error.message });
  }
});

router.post('/resume/generate', async (req, res) => {
  try {
    const { projectName, technologies, description } = req.body || {};
    if (!projectName) {
      return res.status(400).json({ error: 'projectName is required' });
    }
    const result = await aiService.generateResume({ projectName, technologies, description });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Resume generation failed', details: error.message });
  }
});

router.post('/ats/check', async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body || {};
    if (!resumeText) {
      return res.status(400).json({ error: 'resumeText is required' });
    }
    const result = await aiService.checkATS(String(resumeText), String(jobDescription || ''));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'ATS check failed', details: error.message });
  }
});

module.exports = router;
