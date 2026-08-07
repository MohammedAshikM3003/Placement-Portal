/**
 * skillUtils.js - Unified Core Skills helper for Placement Portal
 * Maintains identical category ordering and categorization across:
 * - MainRegistration (/signup)
 * - StuProfile (/profile)
 * - ResumeBuilder (/resume-builder)
 */

export const DEFAULT_SKILL_CATEGORIES = [
  { category: 'Languages', items: [] },
  { category: 'Frameworks & Libraries', items: [] },
  { category: 'Databases', items: [] },
  { category: 'Tools & Platforms', items: [] },
  { category: 'Other', items: [] }
];

const KNOWN_SKILL_MAPPING = {
  // Languages
  'java': 'Languages',
  'python': 'Languages',
  'c': 'Languages',
  'c++': 'Languages',
  'cpp': 'Languages',
  'c#': 'Languages',
  'csharp': 'Languages',
  'javascript': 'Languages',
  'js': 'Languages',
  'typescript': 'Languages',
  'ts': 'Languages',
  'html': 'Languages',
  'html5': 'Languages',
  'css': 'Languages',
  'css3': 'Languages',
  'sql': 'Languages',
  'php': 'Languages',
  'go': 'Languages',
  'golang': 'Languages',
  'ruby': 'Languages',
  'rust': 'Languages',
  'swift': 'Languages',
  'kotlin': 'Languages',
  'dart': 'Languages',

  // Frameworks & Libraries
  'react': 'Frameworks & Libraries',
  'react.js': 'Frameworks & Libraries',
  'reactjs': 'Frameworks & Libraries',
  'react native': 'Frameworks & Libraries',
  'angular': 'Frameworks & Libraries',
  'vue': 'Frameworks & Libraries',
  'vue.js': 'Frameworks & Libraries',
  'next.js': 'Frameworks & Libraries',
  'nextjs': 'Frameworks & Libraries',
  'express': 'Frameworks & Libraries',
  'express.js': 'Frameworks & Libraries',
  'expressjs': 'Frameworks & Libraries',
  'django': 'Frameworks & Libraries',
  'flask': 'Frameworks & Libraries',
  'spring': 'Frameworks & Libraries',
  'spring boot': 'Frameworks & Libraries',
  'bootstrap': 'Frameworks & Libraries',
  'tailwind': 'Frameworks & Libraries',
  'tailwind css': 'Frameworks & Libraries',

  // Databases
  'mongodb': 'Databases',
  'mysql': 'Databases',
  'postgresql': 'Databases',
  'postgres': 'Databases',
  'sqlite': 'Databases',
  'oracle': 'Databases',
  'supabase': 'Databases',
  'firebase': 'Databases',
  'redis': 'Databases',

  // Tools & Platforms
  'cursor': 'Tools & Platforms',
  'cursor ai': 'Tools & Platforms',
  'claude': 'Tools & Platforms',
  'gemini': 'Tools & Platforms',
  'chatgpt': 'Tools & Platforms',
  'lovableai': 'Tools & Platforms',
  'perplexity': 'Tools & Platforms',
  'figma': 'Tools & Platforms',
  'canva': 'Tools & Platforms',
  'whimsical': 'Tools & Platforms',
  'git': 'Tools & Platforms',
  'github': 'Tools & Platforms',
  'docker': 'Tools & Platforms',
  'aws': 'Tools & Platforms',
  'strich': 'Tools & Platforms'
};

/**
 * Normalizes any skill data into standard ordered category array:
 * [Languages, Frameworks & Libraries, Databases, Tools & Platforms, Other, ...customCategories]
 *
 * @param {Array|Object|String} skillsInput - Structured array of categories [{category, items}], array of strings, or raw object
 * @param {String} fallbackSkillSetString - Comma-separated string from student.skillSet
 * @returns {Array} - Array of category objects [{category: string, items: Array<string>}]
 */
export function normalizeSkillCategories(skillsInput, fallbackSkillSetString = '') {
  // Initialize default 5 categories in exact order
  const result = DEFAULT_SKILL_CATEGORIES.map(cat => ({ category: cat.category, items: [] }));
  const customCategoriesMap = new Map();

  const addSkillToCategory = (catName, skillName) => {
    if (!skillName || typeof skillName !== 'string' || !skillName.trim()) return;
    const cleanSkill = skillName.trim();

    // Check if category matches one of the default categories (case-insensitive)
    const existingDefault = result.find(c => c.category.toLowerCase() === catName.toLowerCase());
    if (existingDefault) {
      if (!existingDefault.items.some(i => i.toLowerCase() === cleanSkill.toLowerCase())) {
        existingDefault.items.push(cleanSkill);
      }
      return;
    }

    // Custom user-defined category
    if (!customCategoriesMap.has(catName)) {
      customCategoriesMap.set(catName, []);
    }
    const list = customCategoriesMap.get(catName);
    if (!list.some(i => i.toLowerCase() === cleanSkill.toLowerCase())) {
      list.push(cleanSkill);
    }
  };

  // Case 1: Structured array of categories [{ category, items }]
  if (Array.isArray(skillsInput) && skillsInput.length > 0 && typeof skillsInput[0] === 'object' && skillsInput[0] !== null && 'category' in skillsInput[0]) {
    skillsInput.forEach(catObj => {
      const catName = catObj.category || 'Other';
      const items = Array.isArray(catObj.items) ? catObj.items : [];
      items.forEach(item => addSkillToCategory(catName, item));
    });
  }
  // Case 2: Array of plain strings ["JAVA", "PYTHON", "REACT"]
  else if (Array.isArray(skillsInput) && skillsInput.length > 0) {
    skillsInput.forEach(skillStr => {
      if (typeof skillStr === 'string') {
        const lower = skillStr.trim().toLowerCase();
        const mappedCat = KNOWN_SKILL_MAPPING[lower] || 'Other';
        addSkillToCategory(mappedCat, skillStr);
      }
    });
  }
  // Case 3: Fallback string ("JAVA, PYTHON, REACT")
  else if (typeof fallbackSkillSetString === 'string' && fallbackSkillSetString.trim()) {
    const parsed = fallbackSkillSetString.split(',').map(s => s.trim()).filter(Boolean);
    parsed.forEach(skillStr => {
      const lower = skillStr.toLowerCase();
      const mappedCat = KNOWN_SKILL_MAPPING[lower] || 'Other';
      addSkillToCategory(mappedCat, skillStr);
    });
  }

  // Append any extra custom categories after 'Other'
  customCategoriesMap.forEach((items, catName) => {
    result.push({ category: catName, items });
  });

  return result;
}

/**
 * Converts category array back into comma-separated skillSet string for legacy backend fields
 */
export function flattenSkillsToSkillSet(skillsArray) {
  if (!Array.isArray(skillsArray)) return '';
  const allItems = [];
  skillsArray.forEach(cat => {
    if (Array.isArray(cat?.items)) {
      cat.items.forEach(item => {
        if (item && typeof item === 'string' && item.trim()) {
          allItems.push(item.trim());
        }
      });
    }
  });
  return Array.from(new Set(allItems)).join(', ');
}
