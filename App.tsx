
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { StartScreen } from './components/StartScreen';
import { AssessmentScreen } from './components/AssessmentScreen';
import { SummaryScreen } from './components/SummaryScreen';
import { Spinner } from './components/Spinner';
import { AIService } from './services/geminiService';
import { ImprovedAdaptiveDifficultyEngine } from './services/assessmentEngine';
import type { AssessmentSession, Question, DomainAssessment, FinalReport, QuestionResponse } from './types';
import { DomainStatus } from './types';

type AppState = 'START' | 'ASSESSING' | 'SUMMARY';

export default function App() {
  const [appState, setAppState] = useState<AppState>('START');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const aiService = useMemo(() => new AIService(), []);
  
  const difficultyEngineRef = useRef<ImprovedAdaptiveDifficultyEngine | null>(null);

  const startAssessment = useCallback(async (youtubeUrl: string) => {
    setIsLoading(true);
    setLoadingMessage('Analyzing video and creating assessment...');
    setError(null);
    try {
      const { main_topic, domains } = await aiService.generateInitialAssessment(youtubeUrl);
      const newSession: AssessmentSession = {
        youtubeUrl: youtubeUrl,
        main_topic: main_topic,
        domain_list: domains,
        current_domain_index: null,
        domain_assessments: domains.map(d => ({
          domain_name: d.domain_name,
          status: DomainStatus.NOT_STARTED,
          current_difficulty: d.estimated_difficulty || 50,
          questions_attempted: 0,
          questions_correct: 0,
          response_history: [],
          knowledge_gaps: [],
          mastery_areas: [],
          average_response_time: 0,
          confidence_score: 0,
          progress: 0,
        })),
        overall_score: 0,
        start_time: Date.now(),
        total_questions: 0,
        total_correct: 0,
      };
      setSession(newSession);
      setAppState('ASSESSING');
    } catch (e) {
      setError(e instanceof Error ? `Failed to start assessment: ${e.message}` : String(e));
      setAppState('START');
    } finally {
      setIsLoading(false);
    }
  }, [aiService]);

  const generateNewQuestion = useCallback(async (domainName: string, domainAssessment: DomainAssessment, youtubeUrl: string) => {
    setIsLoading(true);
    setLoadingMessage('Generating new question...');
    setError(null);
    try {
      const question = await aiService.generateAssessmentQuestion(
        domainName,
        Math.round(domainAssessment.current_difficulty),
        domainAssessment.knowledge_gaps,
        youtubeUrl
      );
      setCurrentQuestion(question);
    } catch(e) {
       setError(e instanceof Error ? `Failed to generate question: ${e.message}` : String(e));
    } finally {
      setIsLoading(false);
    }
  }, [aiService]);

  const startDomainAssessment = useCallback((domainIndex: number) => {
    if (!session) return;

    const domainName = session.domain_list[domainIndex].domain_name;
    const domainAssessment = session.domain_assessments[domainIndex];
    difficultyEngineRef.current = new ImprovedAdaptiveDifficultyEngine(domainAssessment.current_difficulty);
    
    generateNewQuestion(domainName, domainAssessment, session.youtubeUrl);

    setSession(prev => {
        if(!prev) return null;
        const newAssessments = [...prev.domain_assessments];
        newAssessments[domainIndex].status = DomainStatus.IN_PROGRESS;
        return {
            ...prev,
            current_domain_index: domainIndex,
            domain_assessments: newAssessments,
        }
    });
  }, [session, generateNewQuestion]);

  const submitAnswer = useCallback((answerIndex: number, confidence: number, responseTime: number) => {
    if (!session || session.current_domain_index === null || !currentQuestion || !difficultyEngineRef.current) return;

    const domainIndex = session.current_domain_index;
    const oldDomainAssessment = session.domain_assessments[domainIndex];
    const isCorrect = answerIndex === currentQuestion.correct_answer_index;

    const newDifficulty = difficultyEngineRef.current.update_difficulty(isCorrect, responseTime, confidence, currentQuestion.estimated_time);
    
    const newResponse: QuestionResponse = {
        question_id: currentQuestion.question,
        user_answer_index: answerIndex,
        is_correct: isCorrect,
        response_time: responseTime,
        confidence_level: confidence,
        timestamp: Date.now(),
    };

    const progressIncrement = isCorrect ? 100 / 5 : 0; // 5 questions to complete a domain
    const newProgress = Math.min(100, oldDomainAssessment.progress + progressIncrement);

    const questionsAttempted = oldDomainAssessment.questions_attempted + 1;
    const questionsCorrect = oldDomainAssessment.questions_correct + (isCorrect ? 1 : 0);

    let newStatus = oldDomainAssessment.status;
    if (newProgress >= 100) {
        const accuracy = questionsAttempted > 0 ? questionsCorrect / questionsAttempted : 0;
        if(accuracy >= 0.8) newStatus = DomainStatus.MASTERED;
        else if(accuracy >= 0.6) newStatus = DomainStatus.COMPLETED;
        else newStatus = DomainStatus.STRUGGLING;
    }

    const newDomainAssessment: DomainAssessment = {
        ...oldDomainAssessment,
        current_difficulty: newDifficulty,
        questions_attempted: questionsAttempted,
        questions_correct: questionsCorrect,
        mastery_areas: isCorrect ? [...oldDomainAssessment.mastery_areas, currentQuestion.knowledge_tag] : oldDomainAssessment.mastery_areas,
        knowledge_gaps: !isCorrect ? [...oldDomainAssessment.knowledge_gaps, currentQuestion.knowledge_tag] : oldDomainAssessment.knowledge_gaps,
        response_history: [...oldDomainAssessment.response_history, newResponse],
        progress: newProgress,
        status: newStatus,
    };

    setSession(prev => {
        if(!prev) return null;
        const updatedAssessments = [...prev.domain_assessments];
        updatedAssessments[domainIndex] = newDomainAssessment;

        return {
            ...prev,
            domain_assessments: updatedAssessments,
            total_questions: prev.total_questions + 1,
            total_correct: prev.total_correct + (isCorrect ? 1 : 0),
        };
    });

    if (newProgress < 100) {
        const domainName = session.domain_list[domainIndex].domain_name;
        generateNewQuestion(domainName, newDomainAssessment, session.youtubeUrl);
    } else {
        setCurrentQuestion(null); // Domain finished
    }
  }, [session, currentQuestion, generateNewQuestion]);


  const generateFinalSummary = useCallback(async () => {
    if(!session) return;
    setIsLoading(true);
    setLoadingMessage('Generating final report...');
    setError(null);

    const completedDomains = session.domain_assessments.filter(d => d.status !== DomainStatus.NOT_STARTED && d.status !== DomainStatus.IN_PROGRESS);

    try {
        const report = await aiService.generateAssessmentSummary(session.main_topic, completedDomains, Date.now() - session.start_time, session.youtubeUrl);
        setFinalReport(report);
        setAppState('SUMMARY');
    } catch(e) {
        setError(e instanceof Error ? `Failed to generate summary: ${e.message}` : String(e));
    } finally {
        setIsLoading(false);
    }
  }, [session, aiService]);

  const renderContent = () => {
    if (isLoading) {
      return <Spinner message={loadingMessage} />;
    }
    if(error){
      return <div className="text-red-500 text-center p-4">{error}</div>
    }

    switch (appState) {
      case 'START':
        return <StartScreen onStart={startAssessment} />;
      case 'ASSESSING':
        if (session) {
          return (
            <AssessmentScreen
              session={session}
              currentQuestion={currentQuestion}
              onStartDomain={startDomainAssessment}
              onSubmitAnswer={submitAnswer}
              onGenerateSummary={generateFinalSummary}
            />
          );
        }
        return <div className="text-center">Error: Assessment session not found.</div>;
      case 'SUMMARY':
        if (finalReport) {
          return <SummaryScreen report={finalReport} onRestart={() => {
              setSession(null);
              setFinalReport(null);
              setCurrentQuestion(null);
              setAppState('START');
          }} />;
        }
        return <div className="text-center">Error: Final report not found.</div>;
      default:
        return <div>Invalid application state.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-6xl mb-6 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">The Knowledge Debugger</h1>
        <p className="text-on-surface-variant mt-2">Your personalized path to mastery, powered by YouTube</p>
      </header>
      <main className="w-full max-w-6xl bg-surface rounded-2xl shadow-lg p-4 sm:p-8">
        {renderContent()}
      </main>
      <footer className="w-full max-w-6xl mt-8 text-center text-sm text-on-surface-variant">
        <p>UNSW HACKERTHON</p>
      </footer>
    </div>
  );
}