
import React, { useState, useEffect } from 'react';
import type { AssessmentSession, Question } from '../types';
import { DomainList } from './DomainList';
import { QuestionView } from './QuestionView';

interface AssessmentScreenProps {
  session: AssessmentSession;
  currentQuestion: Question | null;
  onStartDomain: (domainIndex: number) => void;
  onSubmitAnswer: (answerIndex: number, confidence: number, responseTime: number) => void;
  onGenerateSummary: () => void;
}

export const AssessmentScreen: React.FC<AssessmentScreenProps> = ({
  session,
  currentQuestion,
  onStartDomain,
  onSubmitAnswer,
  onGenerateSummary,
}) => {
    const isAssessmentComplete = session.domain_assessments.every(d => d.progress >= 100);

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-1/3 w-full">
                <DomainList 
                    session={session} 
                    onStartDomain={onStartDomain}
                />
            </aside>
            <main className="lg:w-2/3 w-full">
                {session.current_domain_index !== null ? (
                    currentQuestion ? (
                        <QuestionView 
                            key={currentQuestion.question} 
                            question={currentQuestion} 
                            onSubmit={onSubmitAnswer} 
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-8 h-full text-center">
                            <h3 className="text-xl font-bold text-secondary">Domain Complete!</h3>
                            <p className="text-on-surface-variant mt-2">
                                {isAssessmentComplete ? 
                                "You've completed all domains!" : 
                                "Select the next domain to continue your assessment."
                                }
                            </p>
                            {isAssessmentComplete && (
                                <button
                                    onClick={onGenerateSummary}
                                    className="mt-6 bg-secondary text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-secondary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-transform transform hover:scale-105"
                                >
                                    Generate Final Report
                                </button>
                            )}
                        </div>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-8 h-full text-center">
                        <h3 className="text-2xl font-bold text-primary">Ready to Start?</h3>
                        <p className="text-on-surface-variant mt-2">Select a domain from the list to begin the assessment.</p>
                        <svg className="w-24 h-24 text-primary-light mt-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </div>
                )}
            </main>
        </div>
    );
};
