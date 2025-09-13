import questionBank from './question-bank.json';
import { Question, QuestionSchema } from './schemas';

export type QuestionCategory = 'candidate:cultural' | 'candidate:professional' | 'candidate:dreamJob' | 'company:job';

export interface QuestionBankData {
  'candidate:cultural': {
    workStyle: Question[];
    culturePreferences: Question[];
    location: Question[];
    compensation: Question[];
  };
  'candidate:professional': Question[];
  'candidate:dreamJob': Question[];
  'company:job': Question[];
}

class QuestionBankLoader {
  private data: QuestionBankData;

  constructor() {
    this.data = questionBank as QuestionBankData;
  }

  getQuestionsByCategory(category: QuestionCategory): Question[] {
    const categoryData = this.data[category];
    
    if (!categoryData) {
      throw new Error(`Category ${category} not found in question bank`);
    }

    if (category === 'candidate:cultural') {
      // Flatten all subcategories for cultural questions
      const cultData = categoryData as QuestionBankData['candidate:cultural'];
      return [
        ...cultData.workStyle,
        ...cultData.culturePreferences,
        ...cultData.location,
        ...cultData.compensation,
      ];
    }

    return categoryData as Question[];
  }

  getQuestionsByCategoryAndSubcategory(category: 'candidate:cultural', subcategory: keyof QuestionBankData['candidate:cultural']): Question[] {
    const categoryData = this.data[category];
    return categoryData[subcategory];
  }

  getQuestionById(category: QuestionCategory, questionId: string): Question | null {
    const questions = this.getQuestionsByCategory(category);
    return questions.find(q => q.id === questionId) || null;
  }

  validateQuestion(question: unknown): Question {
    return QuestionSchema.parse(question);
  }

  getAllCategories(): QuestionCategory[] {
    return Object.keys(this.data) as QuestionCategory[];
  }

  getCategoryWeight(category: QuestionCategory): number {
    const questions = this.getQuestionsByCategory(category);
    return questions.reduce((total, question) => total + question.matchingWeight, 0);
  }

  getQuestionWeight(category: QuestionCategory, questionId: string): number {
    const question = this.getQuestionById(category, questionId);
    return question?.matchingWeight || 0;
  }
}

export const questionBankLoader = new QuestionBankLoader();

// Helper functions for specific use cases
export function getCandidateCulturalQuestions() {
  return questionBankLoader.getQuestionsByCategory('candidate:cultural');
}

export function getCandidateProfessionalQuestions() {
  return questionBankLoader.getQuestionsByCategory('candidate:professional');
}

export function getCandidateDreamJobQuestions() {
  return questionBankLoader.getQuestionsByCategory('candidate:dreamJob');
}

export function getCompanyJobQuestions() {
  return questionBankLoader.getQuestionsByCategory('company:job');
}

// Subcategory helpers for cultural questions
export function getWorkStyleQuestions() {
  return questionBankLoader.getQuestionsByCategoryAndSubcategory('candidate:cultural', 'workStyle');
}

export function getCulturePreferenceQuestions() {
  return questionBankLoader.getQuestionsByCategoryAndSubcategory('candidate:cultural', 'culturePreferences');
}

export function getLocationQuestions() {
  return questionBankLoader.getQuestionsByCategoryAndSubcategory('candidate:cultural', 'location');
}

export function getCompensationQuestions() {
  return questionBankLoader.getQuestionsByCategoryAndSubcategory('candidate:cultural', 'compensation');
}