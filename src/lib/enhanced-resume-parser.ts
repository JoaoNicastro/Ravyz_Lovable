import * as pdfjsLib from 'pdfjs-dist';

export interface ParsedResumeData {
  full_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  location?: string;
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
  // More flexible location matching
  const cityStatePattern = /\b([A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ][a-záéíóúàèìòùâêîôûãõç\s]+)\s*,\s*(SP|RJ|MG|PR|RS|SC|BA|GO|PE|CE|PA|AM|RO|AC|DF|MS|MT|TO|MA|PI|AL|SE|PB|RN|ES)\b/i;
  const cityPattern = /\b(?:São Paulo|Rio de Janeiro|Belo Horizonte|Salvador|Brasília|Fortaleza|Recife|Porto Alegre|Curitiba|Manaus|Belém|Goiânia|Campinas|Santos|Ribeirão Preto|Sorocaba|Osasco|Joinville|Uberlândia|Contagem|Londrina|Juiz de Fora|Niterói|São Bernardo|Nova Iguaçu|Duque de Caxias|João Pessoa|Jaboatão|Maceió|Natal|Teresina|Campo Grande|Feira de Santana|Cuiabá|Aparecida de Goiânia|Caxias do Sul|Florianópolis|Vila Velha|Serra|Cariacica|Vitória|Bauru|Piracicaba|Franca|São José dos Campos|Jundiaí|Guarulhos|Diadema|Mauá|Carapicuíba|Itaquaquecetuba|Suzano|Taboão da Serra|Barueri|Embu das Artes|Cotia|Franco da Rocha|Itapevi|Jandira|Santana de Parnaíba|Vargem Grande Paulista|São Caetano do Sul|Santo André|São Bernardo do Campo|Mogi das Cruzes|Remoto|Remote)\b/i;
  const statePattern = /\b(?:SP|RJ|MG|PR|RS|SC|BA|GO|PE|CE|PA|AM|RO|AC|DF|MS|MT|TO|MA|PI|AL|SE|PB|RN|ES|São Paulo|Rio de Janeiro|Minas Gerais|Paraná|Rio Grande do Sul|Santa Catarina|Bahia|Goiás|Pernambuco|Ceará|Pará|Amazonas|Rondônia|Acre|Distrito Federal|Mato Grosso do Sul|Mato Grosso|Tocantins|Maranhão|Piauí|Alagoas|Sergipe|Paraíba|Rio Grande do Norte|Espírito Santo)\b/i;
  
  return cityStatePattern.exec(item.text) || cityPattern.exec(item.text) || statePattern.exec(item.text);
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
  [matchLocation, 5, true],
  [(item: TextItem) => /endereço|address|localização|location|residência|cidade|city|estado|state/i.test(item.text), 2],
  [(item: TextItem) => /,\s*(SP|RJ|MG|PR|RS|SC|BA|GO|PE|CE|PA|AM|RO|AC|DF|MS|MT|TO|MA|PI|AL|SE|PB|RN|ES)\b/i.test(item.text), 3],
  [(item: TextItem) => /\b(CEP|cep)\s*:?\s*\d{5}-?\d{3}/i.test(item.text), 1],
  [(item: TextItem) => /\b\d{5}-?\d{3}\b/.test(item.text), 1], // CEP pattern
  // Negative features
  [hasAt, -3],
  [hasNumber, -0.5], // Less penalty for numbers since addresses can have numbers
  [(item: TextItem) => /telefone|phone|email|nascimento|birth/i.test(item.text), -2],
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

export async function parseResumeEnhanced(file: File): Promise<ParsedResumeData> {
  try {
    console.log('Starting enhanced resume parsing for:', file.name);
    
    // Step 1: Extract text items with positioning
    const textItems = await readPdfEnhanced(file);
    console.log('Extracted text items:', textItems.length);

    if (textItems.length === 0) {
      throw new Error('No text could be extracted from the PDF');
    }

    // Step 2: Extract structured information using feature scoring
    const [name] = getTextWithHighestFeatureScore(textItems, NAME_FEATURE_SETS);
    const [email] = getTextWithHighestFeatureScore(textItems, EMAIL_FEATURE_SETS);
    const [phone] = getTextWithHighestFeatureScore(textItems, PHONE_FEATURE_SETS);
    const [birthDate] = getTextWithHighestFeatureScore(textItems, BIRTH_DATE_FEATURE_SETS);
    const [location] = getTextWithHighestFeatureScore(textItems, LOCATION_FEATURE_SETS);

    console.log('Extracted data:', { name, email, phone, birthDate, location });
    console.log('Location extraction details:', textItems
      .filter(item => matchLocation(item))
      .map(item => ({ text: item.text, match: matchLocation(item) }))
    );

    // Step 3: Format and validate the extracted data
    const result: ParsedResumeData = {};

    if (name && name.length > 1) {
      result.full_name = name.trim();
    }

    if (email && matchEmail({ text: email } as TextItem)) {
      result.email = email.toLowerCase().trim();
    }

    if (phone && phone.length > 8) {
      result.phone = cleanPhoneNumber(phone);
    }

    if (birthDate) {
      const formattedDate = formatDateForInput(birthDate);
      if (formattedDate) {
        result.date_of_birth = formattedDate;
      }
    }

    if (location && location.length > 2) {
      result.location = location.trim();
    }

    console.log('Final parsed result:', result);
    return result;

  } catch (error) {
    console.error('Enhanced resume parsing failed:', error);
    throw new Error(`Failed to parse resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
