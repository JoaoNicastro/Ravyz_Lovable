import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker with CDN fallback
if (typeof window !== 'undefined') {
  // Use CDN worker which is more reliable in Lovable environment
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
}

export interface ParsedResumeData {
  full_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
}

// Email pattern
const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

// Phone patterns (various formats)
const phonePatterns = [
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // 123-456-7890, 123.456.7890, 123 456 7890
  /\(\d{3}\)\s?\d{3}[-.\s]?\d{4}/g, // (123) 456-7890, (123)456-7890
  /\+\d{1,3}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g, // +1-123-456-7890
];

// Date patterns for birth dates (common formats)
const datePatterns = [
  /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, // MM/DD/YYYY or M/D/YYYY
  /\b\d{1,2}-\d{1,2}-\d{4}\b/g, // MM-DD-YYYY or M-D-YYYY
  /\b\d{4}-\d{1,2}-\d{1,2}\b/g, // YYYY-MM-DD
];

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log('Starting PDF text extraction for file:', file.name, 'Size:', file.size);
    
    const arrayBuffer = await file.arrayBuffer();
    console.log('Successfully converted file to arrayBuffer');
    
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    console.log('PDF document loaded, pages:', pdf.numPages);
    
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + ' ';
      console.log(`Extracted text from page ${i}, length:`, pageText.length);
    }

    console.log('Total extracted text length:', fullText.length);
    return fullText;
  } catch (error) {
    console.error('Detailed error in extractTextFromPDF:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function extractPersonalInfo(text: string): ParsedResumeData {
  const result: ParsedResumeData = {};

  // Extract email
  const emailMatches = text.match(emailPattern);
  if (emailMatches && emailMatches.length > 0) {
    result.email = emailMatches[0];
  }

  // Extract phone number
  for (const pattern of phonePatterns) {
    const phoneMatches = text.match(pattern);
    if (phoneMatches && phoneMatches.length > 0) {
      result.phone = phoneMatches[0];
      break;
    }
  }

  // Extract name (heuristic approach)
  // Look for name patterns near the beginning of the document
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    // Skip lines that are likely titles/headers
    if (line.length > 50 || 
        line.toLowerCase().includes('resume') || 
        line.toLowerCase().includes('cv') ||
        emailPattern.test(line) ||
        phonePatterns.some(pattern => pattern.test(line))) {
      continue;
    }
    
    // Look for name pattern (2-3 words, first letter capitalized)
    const namePattern = /^[A-Z][a-z]+\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)?$/;
    if (namePattern.test(line)) {
      result.full_name = line;
      break;
    }
  }

  // Extract potential birth date
  for (const pattern of datePatterns) {
    const dateMatches = text.match(pattern);
    if (dateMatches && dateMatches.length > 0) {
      // Basic validation to avoid false positives
      const dateStr = dateMatches[0];
      const date = new Date(dateStr);
      const currentYear = new Date().getFullYear();
      const birthYear = date.getFullYear();
      
      // Reasonable birth year range (18-80 years old)
      if (birthYear >= currentYear - 80 && birthYear <= currentYear - 18) {
        result.date_of_birth = dateStr;
        break;
      }
    }
  }

  return result;
}

export async function parseResume(file: File): Promise<ParsedResumeData> {
  try {
    console.log('Starting resume parsing for:', file.name);
    const text = await extractTextFromPDF(file);
    console.log('Text extraction successful, parsing personal info...');
    const personalInfo = extractPersonalInfo(text);
    console.log('Parsed personal info:', personalInfo);
    return personalInfo;
  } catch (error) {
    console.error('Detailed error in parseResume:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
    throw new Error(`Failed to parse resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}