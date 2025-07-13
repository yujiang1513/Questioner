
import React, { useState, useEffect } from 'react';
import type { Question } from '../types';
import { Icon } from './Icon';

interface QuestionViewProps {
  question: Question;
  onSubmit: (answerIndex: number, confidence: number, responseTime: number) => void;
}

export const QuestionView: React.FC<QuestionViewProps> = ({ question, onSubmit }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [confidence, setConfidence] = useState(50);
  const [startTime, setStartTime] = useState(Date.now());
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    setStartTime(Date.now());
    setSelectedOption(null);
    setShowExplanation(false);
    setConfidence(50);
  }, [question]);

  const handleSubmit = () => {
    if (selectedOption !== null) {
        const responseTime = (Date.now() - startTime) / 1000; // in seconds
        setShowExplanation(true);
        // Delay submission to allow user to see explanation
        setTimeout(() => {
            onSubmit(selectedOption, confidence / 100, responseTime);
        }, 3000); 
    }
  };

  const getOptionClasses = (index: number) => {
    let base = "w-full text-left p-4 rounded-lg border-2 transition-all cursor-pointer flex items-center gap-3";
    
    if(showExplanation) {
        if(index === question.correct_answer_index) {
            return `${base} bg-green-100 border-green-500`;
        }
        if(index === selectedOption) {
            return `${base} bg-red-100 border-red-500`;
        }
        return `${base} bg-gray-100 border-gray-300 opacity-60`;
    }

    if(selectedOption === index) {
        return `${base} bg-primary/10 border-primary shadow-md`;
    }

    return `${base} bg-white border-gray-300 hover:border-primary/70 hover:bg-primary/5`;
  }

  const confidenceColors = [
    'text-red-500', 'text-orange-500', 'text-yellow-500', 'text-lime-500', 'text-green-500'
  ];
  const confidenceColor = confidenceColors[Math.floor((confidence-1) / 20)];
  const confidenceLabels = ["Guessing", "Unsure", "Somewhat Sure", "Confident", "Very Confident"];
  const confidenceLabel = confidenceLabels[Math.floor((confidence-1) / 20)];

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border animate-fade-in">
        <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-secondary">{question.knowledge_tag}</p>
              <h3 className="text-xl font-bold text-on-surface mt-1">{question.question}</h3>
            </div>
            <div className="text-right text-sm text-on-surface-variant flex-shrink-0 ml-4">
                <div className="flex items-center gap-1">
                    <Icon name="tag" className="w-4 h-4"/>
                    <span>Difficulty: {question.difficulty_level}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                    <Icon name="clock" className="w-4 h-4"/>
                    <span>Est. Time: {question.estimated_time}s</span>
                </div>
            </div>
        </div>

      <div className="space-y-3 my-6">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => !showExplanation && setSelectedOption(index)}
            className={getOptionClasses(index)}
            disabled={showExplanation}
          >
            <span className={`flex-shrink-0 font-bold ${selectedOption === index ? 'text-primary' : 'text-on-surface-variant'}`}>{String.fromCharCode(65 + index)}.</span>
            <span className={`${selectedOption === index ? 'text-on-surface' : 'text-on-surface-variant'}`}>{option}</span>
          </button>
        ))}
      </div>

      {showExplanation && (
        <div className="mt-6 p-4 bg-blue-50 border-l-4 border-primary rounded-r-lg animate-fade-in">
            <h4 className="font-bold text-primary">Explanation</h4>
            <p className="text-on-surface-variant mt-1">{question.explanation}</p>
        </div>
      )}

      {!showExplanation && (
        <>
        <div className="mt-8">
            <label htmlFor="confidence" className="block text-sm font-medium text-on-surface-variant mb-2">
            How confident are you in your answer? <span className={`font-bold ${confidenceColor}`}>{confidenceLabel}</span>
            </label>
            <input
            type="range"
            id="confidence"
            min="1"
            max="100"
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
        </div>

        <button
            onClick={handleSubmit}
            disabled={selectedOption === null}
            className="mt-8 w-full bg-primary text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
        >
            Submit Answer
        </button>
        </>
      )}

    </div>
  );
};
