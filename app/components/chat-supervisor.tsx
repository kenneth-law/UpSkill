import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createRealtimeSession, isWebRTCSupported } from '@/lib/utils/realtime-api';

interface ChatSupervisorProps {
  sessionId: string;
  topic: string;
  systemPrompt: string;
  onComplete: () => void;
}

export default function ChatSupervisor({ sessionId, topic, systemPrompt, onComplete }: ChatSupervisorProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<'initializing' | 'connecting' | 'connected' | 'disconnected'>('initializing');
  const [transcript, setTranscript] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [realtimeSessionId, setRealtimeSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupervisorThinking, setIsSupervisorThinking] = useState(false);

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
        const data = await createRealtimeSession(topic, systemPrompt);
        setRealtimeSessionId(data.realtimeSessionId);

        // Connect to the realtime session
        if (isWebRTCSupported()) {
          await setupWebRTCConnection(data);
        } else {
          await setupWebSocketConnection(data);
        }

        setStatus('connected');
        setTranscript(prev => [...prev, `Welcome to your chat session on ${topic}. I'm here to help you with any questions or tasks.`]);
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
  }, [topic, systemPrompt, toast]);

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
              setTranscript(prev => [...prev, data.text]);
            } else if (data.type === 'tool_call') {
              // Handle tool calls by delegating to the supervisor
              handleSupervisorRequest(data.tool_call);
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

  // Handle supervisor requests
  const handleSupervisorRequest = async (toolCall: any) => {
    try {
      setIsSupervisorThinking(true);

      // In a real implementation, this would call a more intelligent model like GPT-4.1
      // For now, we'll just simulate it
      setTimeout(() => {
        setIsSupervisorThinking(false);
        setTranscript(prev => [...prev, "I've consulted with my supervisor and they've provided the information you requested."]);
      }, 2000);
    } catch (err) {
      console.error('Error handling supervisor request:', err);
      setIsSupervisorThinking(false);
      setError('Failed to process supervisor request');
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
    if (status !== 'connected') return;

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
        setTranscript(prev => [...prev, "I understand your question. Let me think about that for a moment."]);

        // Simulate supervisor thinking
        setIsSupervisorThinking(true);
        setTimeout(() => {
          setIsSupervisorThinking(false);
          setTranscript(prev => [...prev, "Based on my analysis, I can provide you with a detailed answer to your question about this topic."]);
        }, 2000);
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
      description: 'Your chat session has ended.',
    });
    onComplete();
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-purple-600 p-4 text-white">
        <h1 className="text-xl font-semibold">Chat Supervisor: {topic}</h1>
        <p className="text-sm opacity-80">
          Status: {status === 'connecting' ? 'Connecting...' : status === 'connected' ? 'Connected' : 'Disconnected'}
        </p>
      </div>

      {/* Transcript area */}
      <div className="h-[60vh] overflow-y-auto p-4 bg-gray-50">
        {status === 'connecting' || status === 'initializing' ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="ml-3 text-gray-600">Connecting to OpenAI Realtime API...</p>
          </div>
        ) : (
          <>
            {transcript.map((message, index) => (
              <div key={index} className="mb-4">
                <div className="inline-block rounded-lg p-3 bg-gray-200 text-gray-800">
                  {message}
                </div>
              </div>
            ))}

            {isListening && (
              <div className="mb-4 text-right">
                <div className="inline-block rounded-lg p-3 bg-purple-600 text-white">
                  <div className="flex space-x-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    <span className="ml-2">Listening...</span>
                  </div>
                </div>
              </div>
            )}

            {isSupervisorThinking && (
              <div className="mb-4">
                <div className="inline-block rounded-lg p-3 bg-purple-100 text-gray-800">
                  <div className="flex space-x-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    <span className="ml-2">Supervisor is thinking...</span>
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
            End Chat
          </button>

          {status === 'connected' && (
            <button
              onClick={isListening ? handleStopListening : handleStartListening}
              className={`px-4 py-2 rounded-lg ${
                isListening 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
              disabled={isSupervisorThinking}
            >
              {isListening ? 'Stop' : 'Speak'}
            </button>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <p>This chat uses a realtime agent for basic interactions and a supervisor for complex tasks. {error && `Error: ${error}`}</p>
        </div>
      </div>
    </div>
  );
}
