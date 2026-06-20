const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:7860';
const DEFAULT_TIMEOUT_MS = Number(process.env.AI_SERVICE_TIMEOUT_MS || 20000);

async function post(path, payload) {
  const url = `${AI_SERVICE_URL}${path}`;
  const response = await axios.post(url, payload, {
    timeout: DEFAULT_TIMEOUT_MS,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
}

async function get(path) {
  const url = `${AI_SERVICE_URL}${path}`;
  const response = await axios.get(url, { timeout: DEFAULT_TIMEOUT_MS });
  return response.data;
}

async function checkGrammar(text) {
  return post('/grammar/check', { text });
}

async function enhanceResume(text) {
  return post('/resume/enhance', { text });
}

async function generateResume(payload) {
  return post('/resume/generate', payload);
}

async function checkATS(resumeText, jobDescription) {
  return post('/ats/check', { resumeText, jobDescription });
}

async function conciseFeedback(text) {
  return post('/feedback/concise', { text });
}

async function parseAiFilter(prompt) {
  return post('/students/ai-filter', { prompt });
}

async function health() {
  return get('/health');
}

module.exports = {
  checkGrammar,
  enhanceResume,
  generateResume,
  checkATS,
  conciseFeedback,
  parseAiFilter,
  health,
};

