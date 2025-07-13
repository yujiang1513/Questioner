
export enum DomainStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  MASTERED = "MASTERED",
  STRUGGLING = "STRUGGLING",
}

export interface AssessmentDomain {
  domain_name: string;
  description: string;
  estimated_difficulty: number;
}

export interface Question {
  question: string;
  options: string[];
  correct_answer_index: number;
  knowledge_tag: string;
  explanation: string;
  difficulty_level: number;
  estimated_time: number;
}

export interface QuestionResponse {
  question_id: string; // Using question text as ID for simplicity
  user_answer_index: number;
  is_correct: boolean;
  response_time: number;
  confidence_level: number;
  timestamp: number;
}

export interface DomainAssessment {
  domain_name: string;
  status: DomainStatus;
  current_difficulty: number;
  questions_attempted: number;
  questions_correct: number;
  response_history: QuestionResponse[];
  knowledge_gaps: string[];
  mastery_areas: string[];
  average_response_time: number;
  confidence_score: number;
  progress: number;
}

export interface AssessmentSession {
  youtubeUrl: string;
  main_topic: string;
  domain_list: AssessmentDomain[];
  current_domain_index: number | null;
  domain_assessments: DomainAssessment[];
  overall_score: number;
  start_time: number;
  total_questions: number;
  total_correct: number;
}

export interface FinalReport {
  title: string;
  overall_score: number;
  total_time_minutes: number;
  domains_assessed: number;
  knowledge_level: string;
  strengths: string[];
  areas_for_improvement: string[];
  recommendations: string[];
  detailed_breakdown: {
    [key: string]: {
      score: number;
      status: string;
      key_strengths: string[];
      improvement_areas: string[];
    };
  };
}