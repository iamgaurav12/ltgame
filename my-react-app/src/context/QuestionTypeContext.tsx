import React, { createContext, useContext, useState, ReactNode } from "react";

// Define the type for follow-up questions
type FollowUpQuestion = string;

// Define the props for the provider
interface QuestionTypeProviderProps {
  children: ReactNode;
}

// Define the context shape
interface QuestionTypeContextProps {
  selectedTypes: (string | null)[];
  setSelectedTypes: (types: (string | null)[]) => void;
  editedQuestions: string[];
  setEditedQuestions: (questions: string[]) => void;
  requiredQuestions: boolean[];
  setRequiredQuestions: (required: boolean[]) => void;
  followUpQuestions: FollowUpQuestion[];
  setFollowUpQuestions: (followUps: FollowUpQuestion[]) => void;
  questionOrder: number[];
  setQuestionOrder: (order: number[]) => void;
  uniqueQuestions: string[]; // Add uniqueQuestions to context
  setUniqueQuestions: (questions: string[]) => void; // Setter for uniqueQuestions
  questionTexts: string[]; // Add questionTexts to context
  setQuestionTexts: (texts: string[]) => void; // Setter for questionTexts
}

// Create the context
const QuestionTypeContext = createContext<QuestionTypeContextProps | undefined>(undefined);

// Create the provider component
export const QuestionTypeProvider: React.FC<QuestionTypeProviderProps> = ({ children }) => {
  const [selectedTypes, setSelectedTypes] = useState<(string | null)[]>([]);
  const [editedQuestions, setEditedQuestions] = useState<string[]>([]);
  const [requiredQuestions, setRequiredQuestions] = useState<boolean[]>([]);
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([]);
  const [questionOrder, setQuestionOrder] = useState<number[]>([]);
  const [uniqueQuestions, setUniqueQuestions] = useState<string[]>([]); // Initialize uniqueQuestions
  const [questionTexts, setQuestionTexts] = useState<string[]>([]); // Initialize questionTexts

  return (
    <QuestionTypeContext.Provider
      value={{
        selectedTypes,
        setSelectedTypes,
        editedQuestions,
        setEditedQuestions,
        requiredQuestions,
        setRequiredQuestions,
        followUpQuestions,
        setFollowUpQuestions,
        questionOrder,
        setQuestionOrder,
        uniqueQuestions,
        setUniqueQuestions,
        questionTexts,
        setQuestionTexts,
      }}
    >
      {children}
    </QuestionTypeContext.Provider>
  );
};

// Custom hook to use the context
export const useQuestionType = () => {
  const context = useContext(QuestionTypeContext);
  if (!context) {
    throw new Error("useQuestionType must be used within a QuestionTypeProvider");
  }
  return context;
};