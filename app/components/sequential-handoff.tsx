import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createRealtimeSession, isWebRTCSupported } from '@/lib/utils/realtime-api';

// Define the agent types
type AgentType = 'greeter' | 'specialist' | 'support';

interface Agent {
  type: AgentType;
  name: string;
  instructions: string;
  handoffTo: AgentType[];
}

// Define the agents
const agents: Record<AgentType, Agent> = {
  greeter: {
    type: 'greeter',
    name: 'Greeter Agent',
    instructions: 'You are a friendly greeter agent. Welcome the user and ask how you can help them. If they need specialized help, transfer them to the specialist agent. If they need support, transfer them to the support agent.',
    handoffTo: ['specialist', 'support'],
  },
  specialist: {
    type: 'specialist',
    name: 'Specialist Agent',
    instructions: 'You are a specialist agent with deep knowledge about our products and services. Help the user with detailed questions. If they need general support, transfer them to the support agent.',
    handoffTo: ['support'],
  },
  support: {
    type: 'support',
    name: 'Support Agent',
    instructions: 'You are a support agent. Help the user with any issues they are experiencing. If they need specialized product information, transfer them to the specialist agent.',
    handoffTo: ['specialist'],
  },
};

interface SequentialHandoffProps {
  sessionId: string;
  topic: string;
  initialAgentType?: AgentType;
  onComplete: () => void;
}

export default function SequentialHandoff({ sessionId, topic, initialAgentType = 'greeter', onComplete }: SequentialHandoffProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<'initializing' | 'connecting' | 'connected' | 'disconnected'>('initializing');
  const [transcript, setTranscript] = useState<Array<{ text: string; agent: AgentType }>>([]);
  const [isListening, setIsListening] = useState(false);
  const [realtimeSessionId, setRealtimeSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentAgent, setCurrentAgent] = useState<AgentType>(initialAgentType);
  const [isHandingOff, setIsHandingOff] = useState(false);

  // Refs for WebRTC/WebSocket connection
  const socketRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorNodeRef = useRef<AudioWorkletNode | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Initialize the realtime session
  useEffect(() => {
    const initializeRealtimeSession = async () => {
      try {
        setStatus('initializing');

        // Create a new realtime session using the helper function
        const agent = agents[currentAgent];
        const systemPrompt = `${agent.instructions}\n\nYou are discussing the topic of "${topic}".`;

        const data = await createRealtimeSession(topic, systemPrompt);
        setRealtimeSessionId(data.realtimeSessionId);

        // Connect to the realtime session
        if (isWebRTCSupported()) {
          await setupWebRTCConnection(data);
        } else {
          await setupWebSocketConnection(data);
        }

        setStatus('connected');
        setTranscript(prev => [...prev, { 
          text: `Hello, I'm the ${agent.name}. ${currentAgent === 'greeter' ? 'Welcome! How can I help you today?' : 'I\'ve been asked to assist you.'} We're discussing ${topic}.`, 
          agent: currentAgent 
        }]);
      } catch (err) {
        console.error('Error initializing realtime session:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize realtime session');
        setStatus('disconnected');
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to initialize realtime session',
          variant: 'destructive',
        });
      }
    };

    initializeRealtimeSession();

    // Cleanup function
    return () => {
      cleanupConnection();
    };
  }, [currentAgent, topic, toast]);

  // Setup WebRTC connection
  const setupWebRTCConnection = async (sessionData: any) => {
    try {
      setStatus('connecting');

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Create peer connection with default STUN servers
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          {
            urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'],
          },
        ],
      });
      peerConnectionRef.current = peerConnection;

      // Add audio track to peer connection
      stream.getAudioTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // Send ICE candidate to server
          fetch(`https://api.openai.com/v1/audio/realtime/${sessionData.realtimeSessionId}/ice`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
            },
            body: JSON.stringify({ candidate: event.candidate }),
          }).catch(err => {
            console.error('Error sending ICE candidate:', err);
          });
        }
      };

      // Handle incoming tracks (audio from OpenAI)
      peerConnection.ontrack = (event) => {
        const audioElement = new Audio();
        audioElement.srcObject = event.streams[0];
        audioElement.play().catch(err => {
          console.error('Error playing audio:', err);
        });
      };

      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send offer to OpenAI
      const offerResponse = await fetch(`https://api.openai.com/v1/audio/realtime/${sessionData.realtimeSessionId}/offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ sdp: offer.sdp }),
      });

      if (!offerResponse.ok) {
        throw new Error('Failed to send offer to OpenAI');
      }

      // Get answer from OpenAI
      const answerData = await offerResponse.json();
      await peerConnection.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: answerData.sdp,
      }));

      // Connection established
      setStatus('connected');
    } catch (err) {
      console.error('Error setting up WebRTC connection:', err);
      throw err;
    }
  };

  // Setup WebSocket connection
  const setupWebSocketConnection = async (sessionData: any) => {
    try {
      setStatus('connecting');

      // Create WebSocket connection
      const socket = new WebSocket(`wss://api.openai.com/v1/audio/realtime/${sessionData.realtimeSessionId}`);
      socketRef.current = socket;

      // Setup audio context and processor
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Create source node
      const sourceNode = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = sourceNode;

      // Load audio worklet
      await audioContext.audioWorklet.addModule('/audio-processor.js');

      // Create processor node
      const processorNode = new AudioWorkletNode(audioContext, 'audio-processor');
      processorNodeRef.current = processorNode;

      // Connect nodes
      sourceNode.connect(processorNode);
      processorNode.connect(audioContext.destination);

      // Handle messages from processor
      processorNode.port.onmessage = (event) => {
        if (event.data.audio && socket.readyState === WebSocket.OPEN) {
          socket.send(event.data.audio);
        }
      };

      // Handle WebSocket events
      socket.onopen = () => {
        setStatus('connected');
      };

      socket.onmessage = (event) => {
        // Handle incoming audio data
        if (event.data instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            const audioBuffer = reader.result as ArrayBuffer;
            // Play audio
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContext.decodeAudioData(audioBuffer, (buffer) => {
              const source = audioContext.createBufferSource();
              source.buffer = buffer;
              source.connect(audioContext.destination);
              source.start();
            });
          };
          reader.readAsArrayBuffer(event.data);
        } else {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'transcript') {
              setTranscript(prev => [...prev, { text: data.text, agent: currentAgent }]);
            } else if (data.type === 'tool_call' && data.tool_call.name === 'transferAgent') {
              // Handle agent handoff
              handleAgentHandoff(data.tool_call.arguments);
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        }
      };

      socket.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
        setStatus('disconnected');
      };

      socket.onclose = () => {
        setStatus('disconnected');
      };
    } catch (err) {
      console.error('Error setting up WebSocket connection:', err);
      throw err;
    }
  };

  // Handle agent handoff
  const handleAgentHandoff = async (args: any) => {
    try {
      // Parse the arguments
      const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
      const { destination_agent, rationale_for_transfer } = parsedArgs;

      // Check if the destination agent is valid
      const destinationAgentType = destination_agent as AgentType;
      if (!agents[destinationAgentType]) {
        throw new Error(`Invalid destination agent: ${destination_agent}`);
      }

      // Check if the current agent can hand off to the destination agent
      if (!agents[currentAgent].handoffTo.includes(destinationAgentType)) {
        throw new Error(`${currentAgent} cannot hand off to ${destinationAgentType}`);
      }

      // Notify the user about the handoff
      setIsHandingOff(true);
      setTranscript(prev => [...prev, { 
        text: `I'm going to transfer you to our ${agents[destinationAgentType].name} who can better assist you with this. ${rationale_for_transfer}`, 
        agent: currentAgent 
      }]);

      // Clean up the current connection
      cleanupConnection();

      // Wait a moment before switching agents
      setTimeout(() => {
        setCurrentAgent(destinationAgentType);
        setIsHandingOff(false);
      }, 2000);
    } catch (err) {
      console.error('Error handling agent handoff:', err);
      setError(err instanceof Error ? err.message : 'Failed to handle agent handoff');
      setIsHandingOff(false);
    }
  };

  // Cleanup connection
  const cleanupConnection = () => {
    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Close WebSocket connection
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  const handleStartListening = () => {
    if (status !== 'connected' || isHandingOff) return;

    setIsListening(true);

    // In a real implementation, this would start sending audio to OpenAI
    if (socketRef.current || peerConnectionRef.current) {
      toast({
        title: 'Listening...',
        description: 'Your voice is being streamed to OpenAI.',
      });
    } else {
      // Fallback to simulation if connection failed
      toast({
        title: 'Listening...',
        description: 'Simulating voice streaming (connection not established).',
      });

      // Simulate receiving a response after a delay
      setTimeout(() => {
        setIsListening(false);

        // Simulate different responses based on the current agent
        if (currentAgent === 'greeter') {
          setTranscript(prev => [...prev, { 
            text: "I understand you need help with a specialized topic. Let me transfer you to our specialist agent who can better assist you.", 
            agent: currentAgent 
          }]);

          // Simulate handoff
          setIsHandingOff(true);
          setTimeout(() => {
            setCurrentAgent('specialist');
            setIsHandingOff(false);
          }, 2000);
        } else if (currentAgent === 'specialist') {
          setTranscript(prev => [...prev, { 
            text: "Based on my expertise, I can provide you with detailed information about this topic. Is there anything specific you'd like to know?", 
            agent: currentAgent 
          }]);
        } else if (currentAgent === 'support') {
          setTranscript(prev => [...prev, { 
            text: "I'm here to help resolve any issues you're experiencing. Could you please describe the problem in more detail?", 
            agent: currentAgent 
          }]);
        }
      }, 3000);
    }
  };

  const handleStopListening = () => {
    setIsListening(false);
  };

  const handleDisconnect = () => {
    cleanupConnection();
    setStatus('disconnected');
    toast({
      title: 'Disconnected',
      description: 'Your session has ended.',
    });
    onComplete();
  };

  // Get the color for the current agent
  const getAgentColor = (agentType: AgentType) => {
    switch (agentType) {
      case 'greeter':
        return 'bg-purple-600';
      case 'specialist':
        return 'bg-green-600';
      case 'support':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className={`p-4 text-white ${getAgentColor(currentAgent)}`}>
        <h1 className="text-xl font-semibold">{agents[currentAgent].name}: {topic}</h1>
        <p className="text-sm opacity-80">
          Status: {isHandingOff ? 'Transferring...' : status === 'connecting' ? 'Connecting...' : status === 'connected' ? 'Connected' : 'Disconnected'}
        </p>
      </div>

      {/* Transcript area */}
      <div className="h-[60vh] overflow-y-auto p-4 bg-gray-50">
        {status === 'connecting' || status === 'initializing' || isHandingOff ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="ml-3 text-gray-600">
              {isHandingOff ? 'Transferring to another agent...' : 'Connecting to OpenAI Realtime API...'}
            </p>
          </div>
        ) : (
          <>
            {transcript.map((message, index) => (
              <div key={index} className="mb-4">
                <div className={`inline-block rounded-lg p-3 text-white ${getAgentColor(message.agent)}`}>
                  <div className="text-xs font-semibold mb-1">{agents[message.agent].name}</div>
                  {message.text}
                </div>
              </div>
            ))}

            {isListening && (
              <div className="mb-4 text-right">
                <div className="inline-block rounded-lg p-3 bg-gray-700 text-white">
                  <div className="flex space-x-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    <span className="ml-2">Listening...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 border-t">
        <div className="flex justify-between">
          <button
            onClick={handleDisconnect}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
            disabled={status === 'disconnected'}
          >
            End Session
          </button>

          {status === 'connected' && !isHandingOff && (
            <button
              onClick={isListening ? handleStopListening : handleStartListening}
              className={`px-4 py-2 rounded-lg ${
                isListening 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : `${getAgentColor(currentAgent)} hover:opacity-90 text-white`
              }`}
            >
              {isListening ? 'Stop' : 'Speak'}
            </button>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <p>This demo showcases sequential handoffs between specialized agents. {error && `Error: ${error}`}</p>
        </div>
      </div>
    </div>
  );
}
