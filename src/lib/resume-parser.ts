import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ExtractedResumeData {
  personalInfo: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
  };
  experience: Array<{
    title: string;
    company: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    description: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    gpa?: string;
  }>;
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
  };
  projects: Array<{
    name: string;
    description: string;
    technologies?: string[];
    url?: string;
  }>;
}

export class ResumeParser {
  private static emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  private static phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  private static urlRegex = /(https?:\/\/[^\s]+)/g;
  private static linkedinRegex = /linkedin\.com\/in\/[^\s)]+/gi;
  private static githubRegex = /github\.com\/[^\s)]+/gi;

  /**
   * Parse PDF file and extract resume data
   */
  static async parseResumeFromPdf(file: File): Promise<ExtractedResumeData> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      const pages: string[] = [];

      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        pages.push(pageText);
        fullText += pageText + '\n';
      }

      // Parse the extracted text
      return this.parseTextContent(fullText, pages);
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error('Failed to parse resume PDF');
    }
  }

  /**
   * Parse extracted text content into structured data
   */
  private static parseTextContent(fullText: string, pages: string[]): ExtractedResumeData {
    const lines = fullText.split('\n').map(line => line.trim()).filter(Boolean);
    
    return {
      personalInfo: this.extractPersonalInfo(fullText, lines),
      experience: this.extractExperience(fullText, lines),
      education: this.extractEducation(fullText, lines),
      skills: this.extractSkills(fullText, lines),
      projects: this.extractProjects(fullText, lines),
    };
  }

  /**
   * Extract personal information
   */
  private static extractPersonalInfo(fullText: string, lines: string[]) {
    const personalInfo: ExtractedResumeData['personalInfo'] = {};

    // Extract email
    const emailMatch = fullText.match(this.emailRegex);
    if (emailMatch) {
      personalInfo.email = emailMatch[0];
    }

    // Extract phone
    const phoneMatch = fullText.match(this.phoneRegex);
    if (phoneMatch) {
      personalInfo.phone = phoneMatch[0];
    }

    // Extract LinkedIn
    const linkedinMatch = fullText.match(this.linkedinRegex);
    if (linkedinMatch) {
      personalInfo.linkedin = linkedinMatch[0].startsWith('http') 
        ? linkedinMatch[0] 
        : `https://${linkedinMatch[0]}`;
    }

    // Extract GitHub
    const githubMatch = fullText.match(this.githubRegex);
    if (githubMatch) {
      personalInfo.github = githubMatch[0].startsWith('http') 
        ? githubMatch[0] 
        : `https://${githubMatch[0]}`;
    }

    // Extract name (usually the first line or first few words)
    if (lines.length > 0) {
      const firstLine = lines[0];
      if (firstLine && !firstLine.includes('@') && !firstLine.match(this.phoneRegex)) {
        personalInfo.name = firstLine;
      }
    }

    // Extract location (look for city, state patterns)
    const locationPatterns = [
      /([A-Za-z\s]+),\s*([A-Z]{2})/g, // City, State
      /([A-Za-z\s]+),\s*([A-Za-z\s]+),\s*([A-Z]{2,3})/g, // City, State/Province, Country
    ];
    
    for (const pattern of locationPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        personalInfo.location = match[0];
        break;
      }
    }

    return personalInfo;
  }

  /**
   * Extract work experience
   */
  private static extractExperience(fullText: string, lines: string[]) {
    const experience: ExtractedResumeData['experience'] = [];
    const experienceKeywords = ['experience', 'work', 'employment', 'career', 'professional'];
    
    let inExperienceSection = false;
    let currentEntry: Partial<ExtractedResumeData['experience'][0]> = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      // Detect experience section start
      if (experienceKeywords.some(keyword => line.includes(keyword))) {
        inExperienceSection = true;
        continue;
      }
      
      // Stop if we hit another major section
      if (inExperienceSection && this.isNewSection(line)) {
        if (currentEntry.title) {
          experience.push(currentEntry as ExtractedResumeData['experience'][0]);
        }
        break;
      }
      
      if (inExperienceSection) {
        const originalLine = lines[i];
        
        // Try to identify job title and company
        if (this.looksLikeJobTitle(originalLine)) {
          if (currentEntry.title) {
            experience.push(currentEntry as ExtractedResumeData['experience'][0]);
          }
          currentEntry = {
            title: originalLine,
            company: '',
            description: []
          };
        } else if (this.looksLikeCompanyName(originalLine) && currentEntry.title && !currentEntry.company) {
          currentEntry.company = originalLine;
        } else if (this.looksLikeDate(originalLine)) {
          const dates = this.extractDates(originalLine);
          if (dates.start) currentEntry.startDate = dates.start;
          if (dates.end) currentEntry.endDate = dates.end;
        } else if (originalLine.length > 10 && currentEntry.title) {
          // Add to description
          if (!currentEntry.description) currentEntry.description = [];
          currentEntry.description.push(originalLine);
        }
      }
    }
    
    // Add the last entry
    if (currentEntry.title) {
      experience.push(currentEntry as ExtractedResumeData['experience'][0]);
    }
    
    return experience;
  }

  /**
   * Extract education information
   */
  private static extractEducation(fullText: string, lines: string[]) {
    const education: ExtractedResumeData['education'] = [];
    const educationKeywords = ['education', 'academic', 'university', 'college', 'school'];
    const degreeKeywords = ['bachelor', 'master', 'phd', 'doctorate', 'associate', 'bs', 'ba', 'ms', 'ma'];
    
    let inEducationSection = false;
    let currentEntry: Partial<ExtractedResumeData['education'][0]> = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      if (educationKeywords.some(keyword => line.includes(keyword))) {
        inEducationSection = true;
        continue;
      }
      
      if (inEducationSection && this.isNewSection(line)) {
        if (currentEntry.degree) {
          education.push(currentEntry as ExtractedResumeData['education'][0]);
        }
        break;
      }
      
      if (inEducationSection) {
        const originalLine = lines[i];
        
        // Check if this line contains a degree
        if (degreeKeywords.some(keyword => line.includes(keyword))) {
          if (currentEntry.degree) {
            education.push(currentEntry as ExtractedResumeData['education'][0]);
          }
          currentEntry = {
            degree: originalLine,
            institution: ''
          };
        } else if (this.looksLikeInstitution(originalLine) && currentEntry.degree && !currentEntry.institution) {
          currentEntry.institution = originalLine;
        } else if (this.looksLikeDate(originalLine)) {
          const dates = this.extractDates(originalLine);
          if (dates.start) currentEntry.startDate = dates.start;
          if (dates.end) currentEntry.endDate = dates.end;
        }
      }
    }
    
    if (currentEntry.degree) {
      education.push(currentEntry as ExtractedResumeData['education'][0]);
    }
    
    return education;
  }

  /**
   * Extract skills
   */
  private static extractSkills(fullText: string, lines: string[]) {
    const skills: ExtractedResumeData['skills'] = {
      technical: [],
      soft: [],
      languages: []
    };
    
    const skillsKeywords = ['skills', 'technologies', 'tools', 'programming'];
    const technicalSkills = [
      'javascript', 'typescript', 'python', 'java', 'react', 'node', 'angular', 'vue',
      'html', 'css', 'sql', 'mongodb', 'postgres', 'mysql', 'aws', 'docker', 'kubernetes',
      'git', 'linux', 'windows', 'macos', 'azure', 'gcp', 'tensorflow', 'pytorch'
    ];
    
    let inSkillsSection = false;
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      if (skillsKeywords.some(keyword => lowerLine.includes(keyword))) {
        inSkillsSection = true;
        continue;
      }
      
      if (inSkillsSection && this.isNewSection(lowerLine)) {
        break;
      }
      
      if (inSkillsSection) {
        // Split by common delimiters and check each part
        const parts = line.split(/[,;|•·\n]/).map(s => s.trim()).filter(Boolean);
        
        for (const part of parts) {
          const lowerPart = part.toLowerCase();
          if (technicalSkills.some(skill => lowerPart.includes(skill))) {
            skills.technical.push(part);
          }
        }
      }
    }
    
    return skills;
  }

  /**
   * Extract projects
   */
  private static extractProjects(fullText: string, lines: string[]) {
    const projects: ExtractedResumeData['projects'] = [];
    const projectKeywords = ['projects', 'portfolio', 'work samples'];
    
    let inProjectsSection = false;
    let currentProject: Partial<ExtractedResumeData['projects'][0]> = {};
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      if (projectKeywords.some(keyword => lowerLine.includes(keyword))) {
        inProjectsSection = true;
        continue;
      }
      
      if (inProjectsSection && this.isNewSection(lowerLine)) {
        if (currentProject.name) {
          projects.push(currentProject as ExtractedResumeData['projects'][0]);
        }
        break;
      }
      
      if (inProjectsSection && line.length > 5) {
        if (this.looksLikeProjectTitle(line)) {
          if (currentProject.name) {
            projects.push(currentProject as ExtractedResumeData['projects'][0]);
          }
          currentProject = {
            name: line,
            description: ''
          };
        } else if (currentProject.name && !currentProject.description) {
          currentProject.description = line;
        }
      }
    }
    
    if (currentProject.name) {
      projects.push(currentProject as ExtractedResumeData['projects'][0]);
    }
    
    return projects;
  }

  // Helper methods
  private static isNewSection(line: string): boolean {
    const sectionKeywords = ['experience', 'education', 'skills', 'projects', 'awards', 'certificates'];
    return sectionKeywords.some(keyword => line.includes(keyword));
  }

  private static looksLikeJobTitle(line: string): boolean {
    const titleKeywords = ['engineer', 'developer', 'manager', 'analyst', 'consultant', 'specialist', 'director'];
    return titleKeywords.some(keyword => line.toLowerCase().includes(keyword));
  }

  private static looksLikeCompanyName(line: string): boolean {
    const companyIndicators = ['inc', 'llc', 'corp', 'ltd', 'company', 'group', 'systems', 'solutions'];
    return companyIndicators.some(indicator => line.toLowerCase().includes(indicator)) || 
           (line.length > 3 && line.length < 50 && !line.includes('@'));
  }

  private static looksLikeInstitution(line: string): boolean {
    const institutionKeywords = ['university', 'college', 'institute', 'school', 'academy'];
    return institutionKeywords.some(keyword => line.toLowerCase().includes(keyword));
  }

  private static looksLikeDate(line: string): boolean {
    return /\d{4}/.test(line) && (line.includes('-') || line.includes('to') || line.includes('present'));
  }

  private static looksLikeProjectTitle(line: string): boolean {
    return line.length < 100 && !line.includes('.') && !line.includes(',') && line.split(' ').length < 10;
  }

  private static extractDates(line: string): { start?: string; end?: string } {
    const datePatterns = [
      /(\d{1,2}\/\d{4})\s*-\s*(\d{1,2}\/\d{4}|present)/gi,
      /(\d{4})\s*-\s*(\d{4}|present)/gi,
      /(\w+\s+\d{4})\s*-\s*(\w+\s+\d{4}|present)/gi,
    ];
    
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        const [, start, end] = match;
        return { start, end: end === 'present' ? 'Present' : end };
      }
    }
    
    return {};
  }
}