import { useState, useCallback } from 'react';
import { 
  questionBankLoader, 
  QuestionCategory, 
  getCandidateCulturalQuestions,
  getCandidateProfessionalQuestions,
  getCandidateDreamJobQuestions,
  getCompanyJobQuestions
} from '@/lib/question-bank-loader';
import { Question } from '@/lib/schemas';

export function useQuestionBank(category: QuestionCategory) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});

  const questions = questionBankLoader.getQuestionsByCategory(category);
  const currentQuestion = questions[currentQuestionIndex];

  const updateResponse = useCallback((questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  }, []);

  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      return true;
    }
    return false;
  }, [currentQuestionIndex, questions.length]);

  const previousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      return true;
    }
    return false;
  }, [currentQuestionIndex]);

  const goToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
      return true;
    }
    return false;
  }, [questions.length]);

  const isComplete = useCallback(() => {
    const requiredQuestions = questions.filter(q => q.required);
    return requiredQuestions.every(q => responses[q.id] !== undefined && responses[q.id] !== '');
  }, [questions, responses]);

  const getProgress = useCallback(() => {
    return ((currentQuestionIndex + 1) / questions.length) * 100;
  }, [currentQuestionIndex, questions.length]);

  const getResponse = useCallback((questionId: string) => {
    return responses[questionId];
  }, [responses]);

  const setResponse = useCallback((questionId: string, value: any) => {
    updateResponse(questionId, value);
  }, [updateResponse]);

  const resetResponses = useCallback(() => {
    setResponses({});
    setCurrentQuestionIndex(0);
  }, []);

  return {
    questions,
    currentQuestion,
    currentQuestionIndex,
    responses,
    updateResponse,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    isComplete,
    getProgress,
    getResponse,
    setResponse,
    resetResponses,
    totalQuestions: questions.length,
    hasNext: currentQuestionIndex < questions.length - 1,
    hasPrevious: currentQuestionIndex > 0,
  };
}

// Specialized hooks for different categories
export function useCandidateCulturalQuestions() {
  return useQuestionBank('candidate:cultural');
}

export function useCandidateProfessionalQuestions() {
  return useQuestionBank('candidate:professional');
}

export function useCandidateDreamJobQuestions() {
  return useQuestionBank('candidate:dreamJob');
}

export function useCompanyJobQuestions() {
  return useQuestionBank('company:job');
}