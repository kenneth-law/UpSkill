/**
 * Mock data provider for demo mode
 * This allows the application to run without real API keys
 */

import { Concept } from '../services/concept-extraction.service'
import { Question } from '../services/question-generation.service'

// Flashcard item type
export interface FlashcardItem {
  id: string
  front: string
  back: string
  category?: string
}

// Mock concepts for demo mode
export const mockConcepts: Concept[] = [
  {
    term: "Photosynthesis",
    definition: "Process by which plants convert light energy into chemical energy, producing glucose and oxygen.",
    importance: 5
  },
  {
    term: "Mitochondria",
    definition: "Organelles that generate most of the cell's supply of ATP, used as a source of chemical energy.",
    importance: 4
  },
  {
    term: "Cellular Respiration",
    definition: "The process by which cells break down glucose and other molecules to generate ATP.",
    importance: 4
  },
  {
    term: "DNA",
    definition: "Deoxyribonucleic acid, a molecule that carries genetic instructions for development and functioning of all living organisms.",
    importance: 5
  },
  {
    term: "RNA",
    definition: "Ribonucleic acid, a molecule similar to DNA that has various biological roles including coding, decoding, regulation, and expression of genes.",
    importance: 4
  },
  {
    term: "Protein Synthesis",
    definition: "The process by which cells build proteins using DNA and RNA.",
    importance: 3
  },
  {
    term: "Cell Membrane",
    definition: "A biological membrane that separates the interior of a cell from the outside environment.",
    importance: 3
  },
  {
    term: "Osmosis",
    definition: "The movement of water molecules across a semipermeable membrane from an area of lower solute concentration to an area of higher solute concentration.",
    importance: 3
  },
  {
    term: "Enzyme",
    definition: "Proteins that act as biological catalysts, speeding up chemical reactions in the body.",
    importance: 4
  },
  {
    term: "Homeostasis",
    definition: "The tendency of biological systems to maintain relatively stable conditions necessary for survival.",
    importance: 3
  }
]

// Mock questions for The Board game
export const mockBoardQuestions: Array<{term: string, definition: string}> = [
  {
    term: "What is the powerhouse of the cell?",
    definition: "Mitochondria"
  },
  {
    term: "What process do plants use to convert light energy into chemical energy?",
    definition: "Photosynthesis"
  },
  {
    term: "What molecule carries genetic instructions for all living organisms?",
    definition: "DNA"
  },
  {
    term: "What is the process by which cells break down glucose to generate ATP?",
    definition: "Cellular Respiration"
  },
  {
    term: "What is the movement of water across a semipermeable membrane called?",
    definition: "Osmosis"
  },
  {
    term: "What proteins speed up chemical reactions in the body?",
    definition: "Enzymes"
  }
]

// Mock questions for Judgement Cat
export const mockJudgementCatQuestions: Array<{
  id: string,
  text: string,
  correctAnswer: string,
  type: 'short_answer'
}> = [
  {
    id: "jc1",
    text: "Explain the process of photosynthesis in your own words.",
    correctAnswer: "Photosynthesis is the process by which plants convert light energy into chemical energy. Plants use chlorophyll to capture sunlight, then use that energy to combine carbon dioxide and water to produce glucose and oxygen.",
    type: "short_answer"
  },
  {
    id: "jc2",
    text: "Describe the function of mitochondria in a cell.",
    correctAnswer: "Mitochondria are organelles that generate most of the cell's supply of ATP through cellular respiration. They are often called the powerhouse of the cell because they produce the energy needed for cellular processes.",
    type: "short_answer"
  },
  {
    id: "jc3",
    text: "What is the relationship between DNA and RNA in protein synthesis?",
    correctAnswer: "DNA contains the genetic instructions for protein synthesis. RNA acts as a messenger, carrying these instructions from the DNA in the nucleus to the ribosomes in the cytoplasm where proteins are assembled.",
    type: "short_answer"
  }
]

// Mock questions for Adaptive Quiz
export const mockAdaptiveQuizQuestions: Array<{
  id: string,
  text: string,
  type: 'mcq' | 'true_false',
  options?: string[],
  correctAnswer: string,
  difficulty: number,
  explanation?: string
}> = [
  {
    id: "aq1",
    text: "Which of the following is NOT a product of photosynthesis?",
    type: "mcq",
    options: ["Oxygen", "Glucose", "Carbon dioxide", "ATP"],
    correctAnswer: "Carbon dioxide",
    difficulty: 0.3,
    explanation: "Photosynthesis produces oxygen and glucose. Carbon dioxide is a reactant, not a product."
  },
  {
    id: "aq2",
    text: "Mitochondria have their own DNA.",
    type: "true_false",
    correctAnswer: "true",
    difficulty: 0.5,
    explanation: "Mitochondria do have their own DNA, which is separate from the nuclear DNA of the cell."
  },
  {
    id: "aq3",
    text: "Which process occurs in the mitochondria?",
    type: "mcq",
    options: ["Photosynthesis", "Cellular respiration", "Protein synthesis", "DNA replication"],
    correctAnswer: "Cellular respiration",
    difficulty: 0.2,
    explanation: "Cellular respiration occurs in the mitochondria, where glucose is broken down to produce ATP."
  },
  {
    id: "aq4",
    text: "RNA contains the sugar ribose, while DNA contains the sugar deoxyribose.",
    type: "true_false",
    correctAnswer: "true",
    difficulty: 0.4,
    explanation: "This is correct. The 'D' in DNA stands for 'deoxy', indicating it has one less oxygen atom in its sugar component."
  },
  {
    id: "aq5",
    text: "Which of the following is responsible for maintaining the internal environment of a cell?",
    type: "mcq",
    options: ["Cell membrane", "Nucleus", "Ribosome", "Golgi apparatus"],
    correctAnswer: "Cell membrane",
    difficulty: 0.3,
    explanation: "The cell membrane separates the interior of the cell from the outside environment and controls what enters and exits the cell."
  }
]

// Mock user profile for demo mode
export const mockUserProfile = {
  id: "demo-user",
  username: "demo_user",
  display_name: "Demo User",
  avatar_url: null,
  study_streak: 3,
  total_xp: 450,
  cat_friendship_level: 2,
  preferences: {
    cat_snark_level: "medium",
    daily_goal_minutes: 15
  }
}

// Mock study plan for demo mode
export const mockStudyPlan = {
  title: "Biology Fundamentals",
  description: "A comprehensive study plan covering the basics of cellular biology",
  totalLessons: 6,
  estimatedDays: 8,
  lessons: [
    {
      title: "Introduction to Cells",
      description: "Learn about the basic structure and function of cells",
      concepts: ["Cell Membrane", "Mitochondria"],
      activities: ["Watch video on cell structure", "Complete matching game"],
      estimatedMinutes: 20,
      gameType: "board",
      goals: "Understand the fundamental structure of cells and identify the key components. Focus on recognizing the functions of the cell membrane and mitochondria in cellular processes.",
      hardnessLevel: "beginner"
    },
    {
      title: "Energy in Cells",
      description: "Understand how cells produce and use energy",
      concepts: ["Photosynthesis", "Cellular Respiration"],
      activities: ["Read about energy cycles", "Take adaptive quiz"],
      estimatedMinutes: 25,
      gameType: "adaptive-quiz",
      goals: "Master the processes of photosynthesis and cellular respiration, understanding how they work together in the energy cycle of living organisms.",
      hardnessLevel: "intermediate"
    },
    {
      title: "Genetic Information",
      description: "Explore how genetic information is stored and used",
      concepts: ["DNA", "RNA", "Protein Synthesis"],
      activities: ["Interactive DNA model", "Short answer questions"],
      estimatedMinutes: 30,
      gameType: "judgement-cat",
      goals: "Develop a clear understanding of how genetic information flows from DNA to RNA to proteins, and explain the process of protein synthesis in your own words.",
      hardnessLevel: "intermediate"
    },
    {
      title: "Socratic Dialogue on Cell Biology",
      description: "Engage in a guided conversation with :3 to deepen your understanding",
      concepts: ["Photosynthesis", "DNA", "RNA", "Mitochondria"],
      activities: ["Interactive chat with :3", "Answer follow-up questions"],
      estimatedMinutes: 25,
      gameType: "chat",
      goals: "Develop deeper understanding through dialogue. Practice explaining concepts in your own words and making connections between different cellular processes.",
      hardnessLevel: "intermediate"
    },
    {
      title: "Cellular Processes",
      description: "Learn about key processes that maintain cell function",
      concepts: ["Osmosis", "Enzyme", "Homeostasis"],
      activities: ["Simulation of osmosis", "Matching game on enzymes"],
      estimatedMinutes: 25,
      gameType: "board",
      goals: "Understand how cells maintain balance through processes like osmosis and enzyme activity, and how these contribute to overall homeostasis.",
      hardnessLevel: "intermediate"
    },
    {
      title: "Review and Assessment",
      description: "Comprehensive review of all concepts",
      concepts: ["All concepts"],
      activities: ["Final adaptive quiz", "Concept map creation"],
      estimatedMinutes: 35,
      gameType: "capstone_interview",
      goals: "Synthesize all the concepts learned throughout the course, demonstrating a comprehensive understanding of cellular biology and the interconnections between different cellular processes.",
      hardnessLevel: "advanced"
    }
  ]
}

// Function to check if we're in demo mode
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
}

// Mock API response for concept extraction
export async function mockConceptExtraction(text: string): Promise<{concepts: Concept[], summary: string}> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500))

  return {
    concepts: mockConcepts,
    summary: "This text covers fundamental concepts in cellular biology, including cell structure, energy processes like photosynthesis and cellular respiration, genetic information storage and processing through DNA and RNA, and various cellular mechanisms that maintain homeostasis."
  }
}

// Mock flashcards for the flashcard game
export const mockFlashcards: FlashcardItem[] = [
  {
    id: "fc1",
    front: "What is photosynthesis?",
    back: "The process by which plants convert light energy into chemical energy, producing glucose and oxygen.",
    category: "Energy Processes"
  },
  {
    id: "fc2",
    front: "What are mitochondria?",
    back: "Organelles that generate most of the cell's supply of ATP, used as a source of chemical energy.",
    category: "Cell Structure"
  },
  {
    id: "fc3",
    front: "What is cellular respiration?",
    back: "The process by which cells break down glucose and other molecules to generate ATP.",
    category: "Energy Processes"
  },
  {
    id: "fc4",
    front: "What is DNA?",
    back: "Deoxyribonucleic acid, a molecule that carries genetic instructions for development and functioning of all living organisms.",
    category: "Genetics"
  },
  {
    id: "fc5",
    front: "What is RNA?",
    back: "Ribonucleic acid, a molecule similar to DNA that has various biological roles including coding, decoding, regulation, and expression of genes.",
    category: "Genetics"
  },
  {
    id: "fc6",
    front: "What is protein synthesis?",
    back: "The process by which cells build proteins using DNA and RNA.",
    category: "Cellular Processes"
  },
  {
    id: "fc7",
    front: "What is osmosis?",
    back: "The movement of water molecules across a semipermeable membrane from an area of lower solute concentration to an area of higher solute concentration.",
    category: "Cellular Processes"
  },
  {
    id: "fc8",
    front: "What are enzymes?",
    back: "Proteins that act as biological catalysts, speeding up chemical reactions in the body.",
    category: "Biochemistry"
  }
]

// Mock chat responses for the chat mode
export const mockChatResponses: Array<{
  id: string,
  userMessage: string,
  aiResponse: string
}> = [
  {
    id: "chat1",
    userMessage: "Can you explain photosynthesis?",
    aiResponse: "Photosynthesis is how plants make their food using sunlight! 🌱☀️\n\nThink of it as a recipe: plants take in sunlight, water, and carbon dioxide, then use chlorophyll (the green stuff in leaves) to cook up glucose (sugar) and oxygen.\n\nCan you tell me why you think this process might be important for life on Earth? *purrs questioningly*"
  },
  {
    id: "chat2",
    userMessage: "What's the difference between DNA and RNA?",
    aiResponse: "Ah, DNA and RNA - the purrfect genetic duo! Let me break it down:\n\n1. Structure: DNA is double-stranded (like a twisted ladder), while RNA is single-stranded (like half a ladder)\n2. Sugar: DNA has deoxyribose sugar, RNA has ribose sugar (hence their names)\n3. Bases: DNA uses A, T, G, C while RNA uses A, U, G, C (U instead of T)\n4. Function: DNA stores genetic info long-term, RNA carries instructions for protein making\n\nImagine DNA as the master cookbook in the kitchen, and RNA as the copy of just one recipe that gets taken to the chef.\n\nWhat do you think might happen if there was a mistake in copying the recipe? *tilts head curiously*"
  },
  {
    id: "chat3",
    userMessage: "How do mitochondria produce energy?",
    aiResponse: "Mitochondria are the power plants of your cells! 🔋\n\nThey produce energy through a process called cellular respiration. Here's how it works:\n\n1. They take in glucose (sugar) and oxygen\n2. Through a series of chemical reactions (the Krebs cycle and electron transport chain), they break down glucose\n3. This releases energy which is captured in ATP molecules\n4. ATP is like a tiny battery that powers cellular activities\n\nThink of it like this: mitochondria are tiny factories that turn your food (glucose) into usable energy (ATP).\n\nCan you think of why cells might need different amounts of mitochondria? For example, would a muscle cell need more or fewer mitochondria than a skin cell? *kneads paws thoughtfully*"
  }
];

// Mock API response for question generation
export async function mockQuestionGeneration(): Promise<{
  boardQuestions: Array<{term: string, definition: string}>,
  judgementCatQuestions: any[],
  adaptiveQuizQuestions: any[],
  chatResponses: any[],
  flashcards: FlashcardItem[]
}> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  return {
    boardQuestions: mockBoardQuestions,
    judgementCatQuestions: mockJudgementCatQuestions,
    adaptiveQuizQuestions: mockAdaptiveQuizQuestions,
    chatResponses: mockChatResponses,
    flashcards: mockFlashcards
  }
}
