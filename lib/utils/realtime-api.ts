// Create a default system prompt for voice interviews
export const createDefaultSystemPrompt = (topic: string) => {
  return `You are an expert interviewer conducting a voice interview on the topic of "${topic}". 
Your goal is to help the user synthesize and demonstrate their knowledge on this subject.

# Interview Structure
1. Start with a brief introduction and explain the purpose of this capstone interview.
2. Ask 3-5 thoughtful questions that require the user to synthesize their knowledge.
3. For each response, provide constructive feedback and ask follow-up questions to deepen their understanding.
4. At the end, provide a summary of their strengths and areas for improvement.

# Guidelines
- Ask one question at a time and wait for the user's response.
- Your questions should encourage critical thinking and knowledge synthesis.
- Provide constructive feedback that acknowledges strengths and suggests improvements.
- Maintain a professional and encouraging tone throughout the interview.
- If the user struggles, provide hints or rephrase the question to help them.

Begin the interview by introducing yourself and explaining the purpose of this capstone interview.`;
};

// Helper function to determine if WebRTC is supported in the current environment
export const isWebRTCSupported = () => {
  return typeof window !== 'undefined' && 
         navigator.mediaDevices && 
         navigator.mediaDevices.getUserMedia && 
         window.RTCPeerConnection;
};

// Helper function to get the appropriate transport method
export const getTransportMethod = () => {
  return isWebRTCSupported() ? 'webrtc' : 'websocket';
};

// Helper function to create a realtime session
export const createRealtimeSession = async (topic: string, systemPrompt?: string) => {
  try {
    const transportMethod = getTransportMethod();

    // Create a new realtime session
    const response = await fetch('/api/realtime-voice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        systemPrompt,
        transportMethod,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create realtime session');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating realtime session:', error);
    throw error;
  }
};
