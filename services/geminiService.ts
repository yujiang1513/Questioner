
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import type { AssessmentDomain, DomainAssessment, Question, FinalReport } from '../types';

export class AIService {
  private ai: GoogleGenAI | null = null;
  private useMock: boolean;

  constructor() {
    const apiKey = process.env.API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
      this.useMock = false;
    } else {
      console.warn("API_KEY environment variable not found. Using mock data.");
      this.useMock = true;
    }
  }

  private async _generateMockInitialAssessment(youtubeUrl: string): Promise<{ main_topic: string; domains: AssessmentDomain[] }> {
    console.log("Generating MOCK initial assessment from URL:", youtubeUrl);
    await new Promise(res => setTimeout(res, 500));
    const main_topic = "Mock Video Topic";
    const domains: AssessmentDomain[] = [];
    for (let i = 1; i <= 4; i++) {
        domains.push({
            domain_name: `Mock Domain ${i} from Video`,
            description: `This is a mock description for domain ${i}, derived from the video content.`,
            estimated_difficulty: 20 + i * 15,
        });
    }
    return { main_topic, domains };
  }

  public async generateInitialAssessment(youtubeUrl: string): Promise<{ main_topic: string, domains: AssessmentDomain[] }> {
    if (this.useMock || !this.ai) return this._generateMockInitialAssessment(youtubeUrl);
    
    const prompt = `
# Role and Objective
You are an expert educational content analyst. Your task is to analyze the content of a YouTube video based on its URL, then break it down into distinct knowledge domains for an assessment. You must infer the video's content and structure to create relevant domains. Your response must be pure JSON.

# Input
1. \`youtubeUrl\` (string): ${youtubeUrl}

# Task
1. Based on the provided YouTube URL, infer the video's main topic and key learning points. Act as if you have watched the video.
2. Deconstruct the video's content into 4-5 logical, assessable knowledge domains.
3. For each domain, provide a name and a short description of the knowledge it covers from the video.
4. Estimate the relative difficulty of each domain based on typical content structure (e.g., introductions are easier, advanced applications are harder).

# Output Format (strictly follow, no extra text)
{
  "main_topic": "The inferred main topic of the video",
  "domains": [
    {
      "domain_name": "Domain 1: e.g., 'Introduction to X'",
      "description": "What knowledge from the video this domain assesses.",
      "estimated_difficulty": 20
    },
    {
      "domain_name": "Domain 2: e.g., 'Core Concept Y'",
      "description": "What knowledge from the video this domain assesses.",
      "estimated_difficulty": 50
    }
  ]
}
`;

    const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    main_topic: { type: Type.STRING },
                    domains: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                domain_name: { type: Type.STRING },
                                description: { type: Type.STRING },
                                estimated_difficulty: { type: Type.INTEGER }
                            },
                             required: ["domain_name", "description", "estimated_difficulty"]
                        }
                    }
                },
                required: ["main_topic", "domains"]
            }
        }
    });

    try {
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch(e) {
        console.error("Failed to parse initial assessment:", e, "Raw response:", response.text);
        throw new Error("Received malformed domain data from AI.");
    }
  }

  private async _generateMockQuestion(domain: string, difficulty: number, knowledge_gaps: string[], youtubeUrl: string): Promise<Question> {
    console.log(`Generating MOCK question for ${domain} at difficulty ${difficulty} from ${youtubeUrl}`);
    await new Promise(res => setTimeout(res, 500));
    return {
        question: `This is a mock question for the video domain "${domain}". What is the correct option? Gaps to focus on: ${knowledge_gaps.join(', ') || 'None'}`,
        options: ["Mock Option A", "Mock Option B (Correct)", "Mock Option C", "Mock Option D"],
        correct_answer_index: 1,
        knowledge_tag: "Mock Video Knowledge",
        explanation: "Mock Option B is correct because this is a mock question and it was designated as such.",
        difficulty_level: difficulty,
        estimated_time: 30
    };
  }

  public async generateAssessmentQuestion(domain: string, difficulty: number, knowledge_gaps: string[], youtubeUrl: string): Promise<Question> {
    if (this.useMock || !this.ai) return this._generateMockQuestion(domain, difficulty, knowledge_gaps, youtubeUrl);
    
    const gaps_str = knowledge_gaps.length > 0 ? `["${knowledge_gaps.join('", "')}"]` : "[]";
    const prompt = `
# Role and Objective
You are an expert assessment designer. Your task is to create a high-quality multiple-choice question based on the content of a specific YouTube video. The question must test knowledge from a specific domain within that video at a precise difficulty. Your response must be a pure JSON object.

# Context
1. \`videoUrl\` (string): ${youtubeUrl} - All questions must be derived from the content presented in this video. Act as if you have watched it.

# Input
1. \`domain\` (string): ${domain}
2. \`difficulty\` (number): ${difficulty} (1-100 scale, where 1=very basic, 100=expert level)
3. \`knowledgeGaps\` (array): ${gaps_str}

# Task
1. Create a question that tests a specific fact, concept, or skill taught *in the provided YouTube video*.
2. The question should align with the given \`domain\` and precisely match the \`difficulty\` level.
3. If \`knowledgeGaps\` is provided, focus on assessing those specific areas from the video.
4. Design 4 options with exactly one correct answer.
5. Include plausible distractors that reveal common misconceptions related to the video's content.
6. Provide a knowledge tag and a clear explanation that references concepts from the video.
7. Estimate the time a knowledgeable person would need to answer.

# Difficulty Guidelines
- 1-20: Basic definitions and simple recall from the video
- 21-40: Understanding and simple application of concepts shown
- 41-60: Analysis and moderate application of video content
- 61-80: Synthesis and problem-solving using video's methods
- 81-100: Expert-level evaluation based on the video's advanced topics

# Output Format (strictly follow, no extra text)
{
  "question": "Clear, precise question text that tests the intended knowledge from the video",
  "options": [
    "Option A - plausible but incorrect",
    "Option B - correct answer",
    "Option C - plausible but incorrect",
    "Option D - plausible but incorrect"
  ],
  "correct_answer_index": 1,
  "knowledge_tag": "Specific knowledge area from the video",
  "explanation": "Clear explanation of why the correct answer is right and why others are wrong, referencing the video's content.",
  "difficulty_level": ${difficulty},
  "estimated_time": 30
}
`;

    const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correct_answer_index: { type: Type.INTEGER },
                    knowledge_tag: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    difficulty_level: { type: Type.INTEGER },
                    estimated_time: { type: Type.INTEGER }
                },
                required: ["question", "options", "correct_answer_index", "knowledge_tag", "explanation", "difficulty_level", "estimated_time"]
            }
        }
    });

    try {
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch(e) {
        console.error("Failed to parse question:", e, "Raw response:", response.text);
        throw new Error("Received malformed question data from AI.");
    }
  }

  public async generateAssessmentSummary(main_topic: string, domain_assessments: DomainAssessment[], total_time: number, youtubeUrl: string): Promise<FinalReport> {
    if (this.useMock || !this.ai) {
        console.log("Generating MOCK summary for video:", youtubeUrl);
        await new Promise(res => setTimeout(res, 500));
        const breakdown: FinalReport["detailed_breakdown"] = {};
        domain_assessments.forEach(da => {
            breakdown[da.domain_name] = {
                score: (da.questions_correct / da.questions_attempted) * 100,
                status: da.status.toLowerCase(),
                key_strengths: ["Mock Strength from video"],
                improvement_areas: ["Mock Gap from video"]
            };
        });
        return {
            title: `Knowledge Assessment Report: ${main_topic}`,
            overall_score: 75.0,
            total_time_minutes: 5.2,
            domains_assessed: domain_assessments.length,
            knowledge_level: "Intermediate",
            strengths: ["Mock Strength: Core Concepts"],
            areas_for_improvement: ["Mock Weakness: Advanced Topics"],
            recommendations: ["Rewatch the middle part of the video.", "Practice the main example shown in the video."],
            detailed_breakdown: breakdown
        };
    }
    
    const assessment_str = JSON.stringify(domain_assessments.map(d => ({
        domain: d.domain_name,
        accuracy: d.questions_attempted > 0 ? d.questions_correct / d.questions_attempted : 0,
        status: d.status,
        knowledge_gaps: d.knowledge_gaps,
        mastery_areas: d.mastery_areas
    })), null, 2);

    const total_questions = domain_assessments.reduce((sum, d) => sum + d.questions_attempted, 0);
    const total_correct = domain_assessments.reduce((sum, d) => sum + d.questions_correct, 0);
    const overall_accuracy = total_questions > 0 ? total_correct / total_questions : 0;
    
    const prompt = `
# Role and Objective
You are an expert knowledge assessor and analyst. Your task is to analyze a user's performance on an assessment based on a YouTube video and generate a comprehensive assessment report. Your response must be a pure JSON object.

# Context
1. \`videoUrl\` (string): ${youtubeUrl} - The assessment was based on this video. Act as if you know the video's content.

# Input
1. \`mainTopic\` (string): ${main_topic}
2. \`assessmentData\` (array): ${assessment_str}
3. \`totalTimeMinutes\` (number): ${(total_time / 60000).toFixed(1)}
4. \`overallAccuracy\` (number): ${overall_accuracy.toFixed(2)}

# Task
1. Determine the user's overall knowledge level (Beginner/Intermediate/Advanced/Expert) based on their performance on the video's content.
2. Identify their strongest domains and specific mastery areas from the video.
3. Identify areas needing improvement and specific knowledge gaps from the video.
4. Provide 3-5 specific, actionable recommendations for improvement. These recommendations must be specific to the video, for example: "Rewatch the section of the video discussing [knowledge_gap] (you might find this around the middle of the video)" or "Practice the technique for [topic] shown towards the end of the video.".
5. Create a detailed breakdown of performance by domain.

# Knowledge Level Guidelines
- Beginner (0-40% accuracy): Basic understanding, needs to rewatch the video for foundational concepts.
- Intermediate (41-70% accuracy): Solid grasp of fundamentals, ready for application.
- Advanced (71-85% accuracy): Strong competency, can handle complex scenarios based on the video.
- Expert (86-100% accuracy): Mastery level of the video's content.

# Output Format (strictly follow, no extra text)
{
  "title": "Knowledge Assessment Report: ${main_topic}",
  "overall_score": ${+(overall_accuracy * 100).toFixed(1)},
  "total_time_minutes": ${+(total_time / 60000).toFixed(1)},
  "domains_assessed": ${domain_assessments.length},
  "knowledge_level": "Determine based on overall performance",
  "strengths": [
    "List specific domains and knowledge areas from the video where user excelled"
  ],
  "areas_for_improvement": [
    "List specific domains and knowledge gaps from the video that need attention"
  ],
  "recommendations": [
    "Provide 3-5 specific, actionable recommendations for improvement, referencing parts of the video."
  ],
  "detailed_breakdown": {
    "domain_name_1": {
      "score": 85.5,
      "status": "mastered",
      "key_strengths": ["specific strength 1 from video", "specific strength 2 from video"],
      "improvement_areas": ["specific gap 1 from video"]
    }
  }
}
`;

    const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    overall_score: { type: Type.NUMBER },
                    total_time_minutes: { type: Type.NUMBER },
                    domains_assessed: { type: Type.INTEGER },
                    knowledge_level: { type: Type.STRING },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    areas_for_improvement: { type: Type.ARRAY, items: { type: Type.STRING } },
                    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
                    detailed_breakdown: {
                        type: Type.OBJECT,
                        properties: {}, // Allow any properties
                    },
                },
                required: ["title", "overall_score", "total_time_minutes", "domains_assessed", "knowledge_level", "strengths", "areas_for_improvement", "recommendations", "detailed_breakdown"]
            }
        }
    });

    try {
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Failed to parse summary:", e, "Raw response:", response.text);
        throw new Error("Received malformed summary data from AI.");
    }
  }
}