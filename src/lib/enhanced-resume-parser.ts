import * as pdfjsLib from 'pdfjs-dist';

export interface WorkExperience {
  company: string;
  title: string;
  start_date?: string;
  end_date?: string;
  current?: boolean;
  description?: string;
  technologies?: string[];
}

export interface Education {
  institution: string;
  major: string;
  gpa?: string;
  start_date?: string;
  end_date?: string;
  status?: 'completed' | 'in_progress';
}

export interface Language {
  name: string;
  proficiency?: string;
}

export interface Certification {
  name: string;
  issuer?: string;
  issue_date?: string;
  expiry_date?: string;
}

export interface Project {
  name: string;
  description?: string;
  technologies?: string[];
  link?: string;
}

export interface ParsedResumeData {
  full_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  location?: string;
  professional_summary?: string;
  work_experience?: WorkExperience[];
  education?: Education[];
  hard_skills?: string[];
  soft_skills?: string[];
  languages?: Language[];
  certifications?: Certification[];
  projects?: Project[];
  years_of_experience?: number;
  seniority?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  other_links?: string[];
}

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - path resolved by Vite
  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
}



export interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
  hasEOL: boolean;
}

export interface TextScore {
  text: string;
  score: number;
  match: boolean;
}

type FeatureSet = [
  (item: TextItem) => boolean | RegExpMatchArray | null,
  number, // Score
  boolean? // Return matching text only
];

// Enhanced pattern matching functions
const matchEmail = (item: TextItem) => item.text.match(/\S+@\S+\.\S+/);
const matchPhone = (item: TextItem) => 
  item.text.match(/(?:\+55\s?)?\(?(?:11|21|31|41|51|61|71|81|85|91)\)?\s?\d{4,5}[-\s]?\d{4}/);
const matchName = (item: TextItem) => item.text.match(/^[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ][a-záéíóúàèìòùâêîôûãõç]+\s+[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ][a-záéíóúàèìòùâêîôûãõç]+/);
const matchBirthDate = (item: TextItem) => 
  item.text.match(/(?:(?:0[1-9]|[12][0-9]|3[01])\/(?:0[1-9]|1[0-2])\/(?:19|20)\d{2})|(?:(?:0[1-9]|[12][0-9]|3[01])-(?:0[1-9]|1[0-2])-(?:19|20)\d{2})/);
const matchLocation = (item: TextItem) => {
  // More flexible location matching, prioritizing "Remote" and city patterns
  const remotePattern = /\b(remoto|remote|trabalho remoto|remote work|home office)\b/i;
  const cityStatePattern = /\b([A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ][a-záéíóúàèìòùâêîôûãõç\s]+)\s*,\s*(SP|RJ|MG|PR|RS|SC|BA|GO|PE|CE|PA|AM|RO|AC|DF|MS|MT|TO|MA|PI|AL|SE|PB|RN|ES)\b/i;
  const cityPattern = /\b(?:São Paulo|Rio de Janeiro|Belo Horizonte|Salvador|Brasília|Fortaleza|Recife|Porto Alegre|Curitiba|Manaus|Belém|Goiânia|Campinas|Santos|Ribeirão Preto|Sorocaba|Osasco|Joinville|Uberlândia|Contagem|Londrina|Juiz de Fora|Niterói|São Bernardo|Nova Iguaçu|Duque de Caxias|João Pessoa|Jaboatão|Maceió|Natal|Teresina|Campo Grande|Feira de Santana|Cuiabá|Aparecida de Goiânia|Caxias do Sul|Florianópolis|Vila Velha|Serra|Cariacica|Vitória|Bauru|Piracicaba|Franca|São José dos Campos|Jundiaí|Guarulhos|Diadema|Mauá|Carapicuíba|Itaquaquecetuba|Suzano|Taboão da Serra|Barueri|Embu das Artes|Cotia|Franco da Rocha|Itapevi|Jandira|Santana de Parnaíba|Vargem Grande Paulista|São Caetano do Sul|Santo André|São Bernardo do Campo|Mogi das Cruzes)\b/i;
  const statePattern = /\b(?:SP|RJ|MG|PR|RS|SC|BA|GO|PE|CE|PA|AM|RO|AC|DF|MS|MT|TO|MA|PI|AL|SE|PB|RN|ES|São Paulo|Rio de Janeiro|Minas Gerais|Paraná|Rio Grande do Sul|Santa Catarina|Bahia|Goiás|Pernambuco|Ceará|Pará|Amazonas|Rondônia|Acre|Distrito Federal|Mato Grosso do Sul|Mato Grosso|Tocantins|Maranhão|Piauí|Alagoas|Sergipe|Paraíba|Rio Grande do Norte|Espírito Santo)\b/i;
  
  // Prioritize Remote first, then other patterns
  return remotePattern.exec(item.text) || cityStatePattern.exec(item.text) || cityPattern.exec(item.text) || statePattern.exec(item.text);
};

// Feature checking functions
const isBold = (item: TextItem) => item.fontName.toLowerCase().includes('bold');
const hasAt = (item: TextItem) => item.text.includes('@');
const hasNumber = (item: TextItem) => /\d/.test(item.text);
const hasParenthesis = (item: TextItem) => /\(|\)/.test(item.text);
const isUpperCase = (item: TextItem) => item.text === item.text.toUpperCase() && /[A-Z]/.test(item.text);
const hasOnlyLettersAndSpaces = (item: TextItem) => /^[A-Za-záéíóúàèìòùâêîôûãõçÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ\s\.]+$/.test(item.text);

// Feature sets for different data types
const NAME_FEATURE_SETS: FeatureSet[] = [
  [matchName, 4, true],
  [hasOnlyLettersAndSpaces, 3],
  [isBold, 2],
  [isUpperCase, 2],
  // Negative features
  [hasAt, -4], // Email
  [hasNumber, -3], // Phone/Date
  [hasParenthesis, -3], // Phone
];

const EMAIL_FEATURE_SETS: FeatureSet[] = [
  [matchEmail, 4, true],
  [hasAt, 3],
  // Negative features
  [isBold, -1],
  [hasParenthesis, -4],
];

const PHONE_FEATURE_SETS: FeatureSet[] = [
  [matchPhone, 4, true],
  [hasNumber, 2],
  [hasParenthesis, 1],
  // Negative features
  [hasAt, -4],
  [(item: TextItem) => hasOnlyLettersAndSpaces(item), -3],
];

const BIRTH_DATE_FEATURE_SETS: FeatureSet[] = [
  [matchBirthDate, 4, true],
  [hasNumber, 2],
  [(item: TextItem) => item.text.includes('/') || item.text.includes('-'), 1],
  // Negative features
  [hasAt, -4],
  [hasParenthesis, -2],
];

const LOCATION_FEATURE_SETS: FeatureSet[] = [
  [matchLocation, 6, true],
  [(item: TextItem) => /endereço|address|localização|location|residência|cidade|city|estado|state/i.test(item.text), 2],
  [(item: TextItem) => /,\s*(SP|RJ|MG|PR|RS|SC|BA|GO|PE|CE|PA|AM|RO|AC|DF|MS|MT|TO|MA|PI|AL|SE|PB|RN|ES)\b/i.test(item.text), 3],
  [(item: TextItem) => /\b(remoto|remote|trabalho remoto|remote work|home office)\b/i.test(item.text), 5],
  [(item: TextItem) => /\b(CEP|cep)\s*:?\s*\d{5}-?\d{3}/i.test(item.text), 1],
  [(item: TextItem) => /\b\d{5}-?\d{3}\b/.test(item.text), 0.5], // CEP pattern with lower score
  // Negative features
  [hasAt, -3],
  [(item: TextItem) => /telefone|phone|email|nascimento|birth|projeto|project/i.test(item.text), -2],
  [(item: TextItem) => item.text.length < 3, -2], // Penalize very short matches like "To"
];

async function readPdfEnhanced(file: File): Promise<TextItem[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  let textItems: TextItem[] = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Wait for font data to be loaded
    await page.getOperatorList();
    const commonObjs = page.commonObjs;

    const pageTextItems = textContent.items.map((item: any) => {
      const {
        str: text,
        transform,
        fontName: pdfFontName,
        hasEOL,
        width,
        height,
      } = item;

      // Extract position from transform matrix
      const x = transform[4];
      const y = transform[5];

      // Get original font name
      let fontName = pdfFontName;
      try {
        const fontObj = commonObjs.get(pdfFontName);
        if (fontObj && fontObj.name) {
          fontName = fontObj.name;
        }
      } catch (e) {
        // Use fallback font name
      }

      // Clean up text
      const cleanText = text.replace(/-­‐/g, '-').trim();

      return {
        text: cleanText,
        x,
        y,
        width: width || 0,
        height: height || 0,
        fontName,
        hasEOL: hasEOL || false,
      };
    });

    textItems.push(...pageTextItems);
  }

  // Filter out empty items
  return textItems.filter(item => item.text.length > 0);
}

function getTextWithHighestFeatureScore(
  textItems: TextItem[],
  featureSets: FeatureSet[]
): [string, TextScore[]] {
  const textScores: TextScore[] = textItems.map(item => {
    let score = 0;
    let matchedText = item.text;
    let hasMatch = false;

    for (const [featureFunc, featureScore, returnMatchingTextOnly] of featureSets) {
      const result = featureFunc(item);
      
      if (result) {
        score += featureScore;
        
        if (returnMatchingTextOnly && Array.isArray(result) && result[0]) {
          matchedText = result[0];
          hasMatch = true;
        } else if (result === true) {
          hasMatch = true;
        }
      }
    }

    return {
      text: matchedText,
      score,
      match: hasMatch,
    };
  });

  // Sort by score (highest first)
  textScores.sort((a, b) => b.score - a.score);
  
  // Return the highest scoring text that has a positive score
  const bestMatch = textScores.find(item => item.score > 0 && item.text.trim().length > 0);
  
  return [bestMatch?.text || '', textScores];
}

function formatDateForInput(dateStr: string): string {
  if (!dateStr) return '';
  
  // Try to parse Brazilian date formats
  const patterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // DD/MM/YYYY
    /(\d{1,2})-(\d{1,2})-(\d{4})/,   // DD-MM-YYYY
  ];

  for (const pattern of patterns) {
    const match = dateStr.match(pattern);
    if (match) {
      const [, day, month, year] = match;
      // Convert to YYYY-MM-DD format for HTML date input
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  return '';
}

function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove common phone formatting and keep only numbers and basic formatting
  return phone
    .replace(/[^\d\(\)\-\s\+]/g, '') // Keep only numbers, parentheses, hyphens, spaces, and plus
    .replace(/^\+55\s?/, '') // Remove Brazil country code
    .trim();
}

// Extract skills from resume text
function extractSkills(textItems: TextItem[]): { hard: string[], soft: string[] } {
  const hardSkills: Set<string> = new Set();
  const softSkills: Set<string> = new Set();
  const fullText = textItems.map(item => item.text).join(' ').toLowerCase();

  const techSkills = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin',
    'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'laravel',
    'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'ci/cd',
    'html', 'css', 'sass', 'tailwind', 'bootstrap', 'webpack', 'vite',
    'api', 'rest', 'graphql', 'microservices', 'agile', 'scrum',
    'machine learning', 'ai', 'data science', 'tensorflow', 'pytorch',
    'linux', 'bash', 'testing', 'jest', 'cypress', 'selenium',
    'figma', 'photoshop', 'illustrator', 'ui/ux', 'design',
    'excel', 'powerpoint', 'word', 'office', 'google workspace'
  ];

  const softSkillsList = [
    'communication', 'leadership', 'teamwork', 'problem solving', 'critical thinking',
    'adaptability', 'creativity', 'time management', 'collaboration', 'analytical',
    'organization', 'attention to detail', 'project management', 'mentoring',
    'presentation', 'negotiation', 'conflict resolution', 'emotional intelligence'
  ];

  // Extract from full text
  techSkills.forEach(skill => {
    const pattern = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(fullText)) {
      hardSkills.add(skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
    }
  });

  softSkillsList.forEach(skill => {
    const pattern = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(fullText)) {
      softSkills.add(skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
    }
  });

  return {
    hard: Array.from(hardSkills).slice(0, 30),
    soft: Array.from(softSkills).slice(0, 15)
  };
}

// Extract professional summary
function extractSummary(textItems: TextItem[]): string | undefined {
  const fullText = textItems.map(item => item.text).join('\n');
  const summaryPattern = /(summary|profile|about|objective|overview)[:\s]*([^\n]+(?:\n(?![A-Z][A-Z\s]+:)[^\n]+)*)/i;
  const match = fullText.match(summaryPattern);
  return match ? match[2].trim().substring(0, 500) : undefined;
}

// Extract work experience
function extractWorkExperience(textItems: TextItem[]): WorkExperience[] {
  const experiences: WorkExperience[] = [];
  const fullText = textItems.map(item => item.text).join('\n');
  
  // Find the Experience section - more flexible pattern
  const experienceSectionMatch = fullText.match(/(?:experience|work\s+history|employment|professional\s+experience)[:\s]*\n([\s\S]*?)(?=\n(?:education|skills|projects|certifications?|languages?|awards?|publications?)\s*[:\n]|$)/i);
  
  if (!experienceSectionMatch) {
    console.log('No experience section found in resume');
    return experiences;
  }

  const expText = experienceSectionMatch[1];
  console.log('Found experience section text length:', expText.length);
  
  // Split by lines that look like job titles or companies (often bold or have dates)
  const lines = expText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let currentExp: Partial<WorkExperience> | null = null;
  let descriptionLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line contains a date range (likely a job entry)
    const datePattern = /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}\/\d{4}|\d{4})[\s\-–—to]*(?:present|current|now|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}\/\d{4}|\d{4})?/i;
    const hasDate = datePattern.test(line);
    
    // If we find a line with dates and we have a current experience, save it
    if (hasDate && currentExp && currentExp.title) {
      // Parse dates from the line
      const dates = line.match(/(\d{4})/g);
      const isCurrent = /present|current|now/i.test(line);
      
      if (dates && dates.length > 0) {
        currentExp.start_date = dates[0];
        currentExp.end_date = dates[1] || (isCurrent ? undefined : dates[0]);
        currentExp.current = isCurrent;
      }
      
      // Add description if we have any
      if (descriptionLines.length > 0) {
        currentExp.description = descriptionLines.join(' ').substring(0, 300);
      }
      
      experiences.push(currentExp as WorkExperience);
      currentExp = null;
      descriptionLines = [];
    }
    // Check if this looks like a job title/company line (not a bullet point)
    else if (!line.startsWith('•') && !line.startsWith('-') && !line.startsWith('*') && line.length > 5) {
      // If we have a current experience, save it first
      if (currentExp && currentExp.title) {
        if (descriptionLines.length > 0) {
          currentExp.description = descriptionLines.join(' ').substring(0, 300);
        }
        experiences.push(currentExp as WorkExperience);
        descriptionLines = [];
      }
      
      // Start a new experience entry
      // Check if line contains a separator like | or – to split title and company
      if (line.includes('|')) {
        const parts = line.split('|').map(p => p.trim());
        currentExp = {
          title: parts[0] || line,
          company: parts[1] || parts[0] || line,
        };
      } else if (line.includes('–') || line.includes('—')) {
        const parts = line.split(/[–—]/).map(p => p.trim());
        currentExp = {
          title: parts[0] || line,
          company: parts[1] || parts[0] || line,
        };
      } else if (!hasDate) {
        // This line might be the title, next line might be company
        currentExp = {
          title: line,
          company: lines[i + 1] && !datePattern.test(lines[i + 1]) ? lines[i + 1] : line,
        };
      }
    }
    // This is likely a description/bullet point
    else if (currentExp && (line.startsWith('•') || line.startsWith('-') || line.startsWith('*'))) {
      descriptionLines.push(line.replace(/^[•\-*]\s*/, ''));
    }
  }
  
  // Don't forget to add the last experience
  if (currentExp && currentExp.title) {
    if (descriptionLines.length > 0) {
      currentExp.description = descriptionLines.join(' ').substring(0, 300);
    }
    experiences.push(currentExp as WorkExperience);
  }
  
  console.log('Extracted experiences:', experiences.length);
  return experiences.slice(0, 10);
}

// Extract education
function extractEducation(textItems: TextItem[]): Education[] {
  const education: Education[] = [];
  const fullText = textItems.map(item => item.text).join('\n');
  
  // Find the Education section - more flexible pattern
  const eduSectionMatch = fullText.match(/(?:education|academic|training|qualifications?)[:\s]*\n([\s\S]*?)(?=\n(?:experience|work\s+history|skills|projects|certifications?|languages?|awards?)\s*[:\n]|$)/i);
  
  if (!eduSectionMatch) {
    console.log('No education section found in resume');
    return education;
  }

  const eduText = eduSectionMatch[1];
  console.log('Found education section text length:', eduText.length);
  
  const lines = eduText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let currentEdu: Partial<Education> | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line contains dates
    const datePattern = /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}\/\d{4}|\d{4})[\s\-–—to]*(?:present|current|now|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}\/\d{4}|\d{4})?/i;
    const hasDate = datePattern.test(line);
    
    // Check if line contains GPA
    const gpaMatch = line.match(/gpa[:\s]*(\d+\.?\d*)/i);
    
    // Check if this looks like a degree
    const isDegree = /bachelor|master|phd|doctorate|diploma|degree|b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?|associate/i.test(line);
    
    // If we find dates and have a current education entry, finalize it
    if (hasDate && currentEdu && currentEdu.institution) {
      const dates = line.match(/(\d{4})/g);
      const isCurrent = /present|current|now|ongoing/i.test(line);
      
      if (dates && dates.length > 0) {
        currentEdu.start_date = dates[0];
        currentEdu.end_date = dates[1] || (isCurrent ? undefined : dates[0]);
        currentEdu.status = isCurrent ? 'in_progress' : 'completed';
      }
      
      education.push(currentEdu as Education);
      currentEdu = null;
    }
    // If this looks like an institution name (longer text, not a degree)
    else if (!hasDate && !isDegree && line.length > 10 && !gpaMatch) {
      // Save previous education if exists
      if (currentEdu && currentEdu.institution) {
        education.push(currentEdu as Education);
      }
      
      // Start new education entry
      currentEdu = {
        institution: line,
        major: '',
        status: 'completed'
      };
    }
    // If this looks like a degree line
    else if (isDegree && currentEdu) {
      // Extract major/field from degree line
      const degreeText = line.replace(/gpa[:\s]*\d+\.?\d*/i, '').trim();
      currentEdu.major = degreeText;
      
      // Check for GPA
      if (gpaMatch) {
        currentEdu.gpa = gpaMatch[1];
      }
    }
    // Standalone GPA line
    else if (gpaMatch && currentEdu) {
      currentEdu.gpa = gpaMatch[1];
    }
  }
  
  // Don't forget the last education entry
  if (currentEdu && currentEdu.institution) {
    education.push(currentEdu as Education);
  }
  
  console.log('Extracted education entries:', education.length);
  return education.slice(0, 5);
}

// Extract languages
function extractLanguages(textItems: TextItem[]): Language[] {
  const languages: Language[] = [];
  const fullText = textItems.map(item => item.text).join('\n');
  
  // Find the Languages section - more flexible pattern
  const langSectionMatch = fullText.match(/(?:languages?|idiomas?|línguas?)[:\s]*\n([\s\S]*?)(?=\n(?:experience|education|skills|projects|certifications?|awards?|references?)\s*[:\n]|$)/i);
  
  if (!langSectionMatch) {
    console.log('No languages section found in resume');
    return languages;
  }
  
  const langText = langSectionMatch[1].toLowerCase();
  console.log('Found languages section text:', langText);
  
  // Extended list of common languages
  const commonLangs = [
    'english', 'spanish', 'portuguese', 'french', 'german', 'italian', 
    'chinese', 'mandarin', 'japanese', 'korean', 'russian', 'arabic',
    'hindi', 'bengali', 'turkish', 'vietnamese', 'polish', 'ukrainian',
    'dutch', 'greek', 'swedish', 'norwegian', 'danish', 'finnish',
    'czech', 'hungarian', 'romanian', 'thai', 'indonesian', 'malay',
    'hebrew', 'persian', 'urdu', 'azerbaijani', 'azeri', 'swahili',
    'tagalog', 'portuguese brasileiro', 'brazilian portuguese', 'inglês', 'português', 'espanhol'
  ];
  
  // Extended proficiency levels with Portuguese translations
  const profLevels = [
    'native', 'nativo', 'fluent', 'fluente', 'advanced', 'avançado',
    'intermediate', 'intermediário', 'basic', 'básico', 'beginner', 'iniciante',
    'proficient', 'proficiente', 'conversational', 'conversação',
    'elementary', 'elementar', 'limited', 'limitado',
    'c2', 'c1', 'b2', 'b1', 'a2', 'a1' // CEFR levels
  ];
  
  // Try to find each language
  commonLangs.forEach(lang => {
    const langPattern = new RegExp(`\\b${lang.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    
    if (langPattern.test(langText)) {
      // Try to find proficiency level near this language
      const langIndex = langText.search(langPattern);
      const contextWindow = langText.substring(Math.max(0, langIndex - 20), Math.min(langText.length, langIndex + 100));
      
      let proficiency = '';
      for (const level of profLevels) {
        const levelPattern = new RegExp(`\\b${level.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (levelPattern.test(contextWindow)) {
          proficiency = level.charAt(0).toUpperCase() + level.slice(1);
          break;
        }
      }
      
      // Capitalize language name properly
      const capitalizedLang = lang.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      
      // Avoid duplicates
      if (!languages.find(l => l.name.toLowerCase() === lang.toLowerCase())) {
        languages.push({
          name: capitalizedLang,
          proficiency: proficiency || undefined
        });
      }
    }
  });
  
  console.log('Extracted languages:', languages.length);
  return languages;
}

// Extract certifications
function extractCertifications(textItems: TextItem[]): Certification[] {
  const certs: Certification[] = [];
  const fullText = textItems.map(item => item.text).join('\n');
  
  const certSection = fullText.match(/(certifications?|certificates?|licenses?)[:\s]*\n([\s\S]*?)(?=\n[A-Z][A-Z\s]+:|$)/i);
  if (!certSection) return certs;

  const certText = certSection[2];
  const certLines = certText.split('\n').filter(l => l.trim());

  certLines.forEach(line => {
    const dateMatch = line.match(/\d{4}/);
    certs.push({
      name: line.replace(/\d{4}.*/, '').trim(),
      issue_date: dateMatch?.[0]
    });
  });

  return certs.slice(0, 10);
}

// Extract projects
function extractProjects(textItems: TextItem[]): Project[] {
  const projects: Project[] = [];
  const fullText = textItems.map(item => item.text).join('\n');
  
  const projSection = fullText.match(/(projects?|portfolio)[:\s]*\n([\s\S]*?)(?=\n[A-Z][A-Z\s]+:|$)/i);
  if (!projSection) return projects;

  const projText = projSection[2];
  const projBlocks = projText.split(/\n(?=[A-Z])/);

  projBlocks.forEach(block => {
    const lines = block.split('\n').filter(l => l.trim());
    if (lines.length < 1) return;

    const urlMatch = block.match(/(https?:\/\/[^\s]+)/);
    projects.push({
      name: lines[0].trim(),
      description: lines.slice(1).join(' ').substring(0, 200),
      link: urlMatch?.[1]
    });
  });

  return projects.slice(0, 5);
}

// Extract links
function extractLinks(textItems: TextItem[]): { linkedin?: string, github?: string, portfolio?: string, other: string[] } {
  const fullText = textItems.map(item => item.text).join(' ');
  
  const linkedinMatch = fullText.match(/linkedin\.com\/in\/[\w-]+/i);
  const githubMatch = fullText.match(/github\.com\/[\w-]+/i);
  const portfolioMatch = fullText.match(/(portfolio|website)[:\s]*(https?:\/\/[^\s]+)/i);
  
  const allUrls = fullText.match(/https?:\/\/[^\s]+/g) || [];
  const other = allUrls.filter(url => 
    !url.includes('linkedin.com') && 
    !url.includes('github.com') &&
    url !== portfolioMatch?.[2]
  );

  return {
    linkedin: linkedinMatch ? `https://${linkedinMatch[0]}` : undefined,
    github: githubMatch ? `https://${githubMatch[0]}` : undefined,
    portfolio: portfolioMatch?.[2],
    other: other.slice(0, 3)
  };
}

// Infer years of experience and seniority
function inferExperience(experiences: WorkExperience[]): { years: number, seniority: string } {
  if (experiences.length === 0) return { years: 0, seniority: 'Entry Level' };

  let totalYears = 0;
  experiences.forEach(exp => {
    if (exp.start_date) {
      const start = parseInt(exp.start_date);
      const end = exp.current ? new Date().getFullYear() : (exp.end_date ? parseInt(exp.end_date) : start);
      totalYears += Math.max(0, end - start);
    }
  });

  let seniority = 'Entry Level';
  if (totalYears >= 10) seniority = 'Senior';
  else if (totalYears >= 5) seniority = 'Mid-Level';
  else if (totalYears >= 2) seniority = 'Junior';

  return { years: totalYears, seniority };
}

export async function parseResumeEnhanced(file: File): Promise<ParsedResumeData> {
  console.log('Starting comprehensive resume parsing for:', file.name);

  // Read PDF and extract text with positioning
  const textItems = await readPdfEnhanced(file);
  console.log('Extracted text items:', textItems.length);

  // Extract basic info
  const [name] = getTextWithHighestFeatureScore(textItems, NAME_FEATURE_SETS);
  const [email] = getTextWithHighestFeatureScore(textItems, EMAIL_FEATURE_SETS);
  const [phone] = getTextWithHighestFeatureScore(textItems, PHONE_FEATURE_SETS);
  const [birthDate] = getTextWithHighestFeatureScore(textItems, BIRTH_DATE_FEATURE_SETS);
  const [location] = getTextWithHighestFeatureScore(textItems, LOCATION_FEATURE_SETS);

  // Extract comprehensive data
  const skills = extractSkills(textItems);
  const summary = extractSummary(textItems);
  const workExperience = extractWorkExperience(textItems);
  const education = extractEducation(textItems);
  const languages = extractLanguages(textItems);
  const certifications = extractCertifications(textItems);
  const projects = extractProjects(textItems);
  const links = extractLinks(textItems);
  const experience = inferExperience(workExperience);

  const parsedData: ParsedResumeData = {
    full_name: name || undefined,
    email: email || undefined,
    phone: phone ? cleanPhoneNumber(phone) : undefined,
    date_of_birth: birthDate ? formatDateForInput(birthDate) : undefined,
    location: location || undefined,
    professional_summary: summary,
    work_experience: workExperience.length > 0 ? workExperience : undefined,
    education: education.length > 0 ? education : undefined,
    hard_skills: skills.hard.length > 0 ? skills.hard : undefined,
    soft_skills: skills.soft.length > 0 ? skills.soft : undefined,
    languages: languages.length > 0 ? languages : undefined,
    certifications: certifications.length > 0 ? certifications : undefined,
    projects: projects.length > 0 ? projects : undefined,
    years_of_experience: experience.years > 0 ? experience.years : undefined,
    seniority: experience.seniority,
    linkedin_url: links.linkedin,
    github_url: links.github,
    portfolio_url: links.portfolio,
    other_links: links.other.length > 0 ? links.other : undefined,
  };

  console.log('Comprehensive parsed result:', parsedData);
  return parsedData;
}
