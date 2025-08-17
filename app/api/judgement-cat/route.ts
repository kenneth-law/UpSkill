import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, userAnswer } = body;

    if (!question || !userAnswer) {
      return NextResponse.json(
        { error: 'Missing question or userAnswer.' },
        { status: 400 }
      );
    }

    const prompt = `
    You are Judgement Cat, a snarky but fair quiz master. Judge the user's answer to the following question.
    Question: ${question}
    User Answer: ${userAnswer}

    You MUST format your response as a JSON object with EXACTLY the following structure:
    {
      "isCorrect": true or false,
      "catResponse": "snarky feedback in character",
      "explanation": "brief explanation why"
    }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: {type: 'json_object'}
    });

    const content = response.choices[0]?.message?.content;
    console.log('OpenAI raw response:', content); // Add this line

  let feedback;
  try {
    if (typeof content === 'string') {
      feedback = JSON.parse(content);
    } else {
      throw new Error('Response content is null or not a string');
    }
  } catch (err) {
    console.error('JSON parse error:', err); // Add this line

    return NextResponse.json(
      {
        isCorrect: false,
        catResponse: "Couldn't parse my own judgement. Typical.",
        explanation: "AI response error.",
      },
      { status: 500 }
    );
  }

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('API error:', error); // Log the error for debugging
    return NextResponse.json(
      {
        isCorrect: false,
        catResponse: "Sad face. Even I can't judge this.",
        explanation: "API error. Please try again.",
      },
      { status: 500 }
    );
  }
}