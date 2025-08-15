'use client'

import { useState, useEffect, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { createRealtimeSession, isWebRTCSupported } from '@/lib/utils/realtime-api'

interface VoiceInterviewProps {
  sessionId: string
  topic: string
  systemPrompt: string
  onComplete: () => void
}

export default function VoiceInterview({ sessionId, topic, systemPrompt, onComplete }: VoiceInterviewProps) {
  const { toast } = useToast()
  const [status, setStatus] = useState<'initializing' | 'connecting' | 'connected' | 'disconnected'>('initializing')
  const [transcript, setTranscript] = useState<string[]>([])
  const [isListening, setIsListening] = useState(false)
  const [realtimeSessionId, setRealtimeSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Refs for WebRTC/WebSocket connection
  const socketRef = useRef<WebSocket | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const processorNodeRef = useRef<AudioWorkletNode | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)

  // Initialize the realtime session
  useEffect(() => {
    const initializeRealtimeSession = async () => {
      try {
        setStatus('initializing')

        // Create a new realtime session using the helper function
        const data = await createRealtimeSession(topic, systemPrompt)
        setRealtimeSessionId(data.realtimeSessionId)

        // Connect to the realtime session
        if (isWebRTCSupported()) {
          await setupWebRTCConnection(data)
        } else {
          await setupWebSocketConnection(data)
        }

        setStatus('connected')
        setTranscript(prev => [...prev, `Welcome to your voice interview on ${topic}. I'll be asking you questions to help you synthesize your knowledge on this topic.`])
      } catch (err) {
        console.error('Error initializing realtime session:', err)

        // Extract detailed error message
        let errorMessage = 'Failed to initialize realtime session';
        if (err instanceof Error) {
          errorMessage = err.message;
          console.error('Error details:', {
            message: err.message,
            name: err.name,
            stack: err.stack,
          });
        }

        setError(errorMessage)
        setStatus('disconnected')
        toast({
          title: 'Error Connecting to Voice Interview',
          description: errorMessage,
          variant: 'destructive',
        })
      }
    }

    initializeRealtimeSession()

    // Cleanup function
    return () => {
      cleanupConnection()
    }
  }, [topic, systemPrompt, toast])

  // Setup WebRTC connection
  const setupWebRTCConnection = async (sessionData: any) => {
    try {
      setStatus('connecting')

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      // Create peer connection with default STUN servers
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          {
            urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'],
          },
        ],
      })
      peerConnectionRef.current = peerConnection

      // Add audio track to peer connection
      stream.getAudioTracks().forEach(track => {
        peerConnection.addTrack(track, stream)
      })

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // Send ICE candidate to our backend API
          fetch('/api/realtime-voice', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              realtimeSessionId: sessionData.realtimeSessionId,
              candidate: event.candidate 
            }),
          })
          .then(async response => {
            if (!response.ok) {
              // Try to get more detailed error information
              try {
                const errorData = await response.json();
                console.error('Error sending ICE candidate:', errorData);
                throw new Error(errorData.error || errorData.details || 'Failed to send ICE candidate to OpenAI');
              } catch (jsonError) {
                // If we can't parse the JSON, just throw the original error
                throw new Error(`Failed to send ICE candidate: ${response.status} ${response.statusText}`);
              }
            }
            return response.json();
          })
          .then(data => {
            console.log('ICE candidate sent successfully:', data);
          })
          .catch(err => {
            console.error('Error sending ICE candidate:', err);
          });
        }
      }

      // Handle incoming tracks (audio from OpenAI)
      peerConnection.ontrack = (event) => {
        const audioElement = new Audio()
        audioElement.srcObject = event.streams[0]
        audioElement.play().catch(err => {
          console.error('Error playing audio:', err)
        })
      }

      // Create and send offer
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      // Send offer to our backend API
      const offerResponse = await fetch('/api/realtime-voice', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          realtimeSessionId: sessionData.realtimeSessionId,
          sdp: offer.sdp 
        }),
      })

      // Parse the response body
      let responseData;
      try {
        responseData = await offerResponse.json();
      } catch (jsonError) {
        console.error('Error parsing response JSON:', jsonError);
        throw new Error(`Failed to parse response from server: ${offerResponse.status} ${offerResponse.statusText}`);
      }

      // Check if the response is OK
      if (!offerResponse.ok) {
        const errorMessage = responseData.error || responseData.details || 'Failed to send offer to OpenAI';
        console.error('Server error response:', responseData);
        throw new Error(errorMessage);
      }

      // Use the parsed response data
      const answerData = responseData;
      await peerConnection.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: answerData.sdp,
      }))

      // Connection established
      setStatus('connected')
    } catch (err) {
      console.error('Error setting up WebRTC connection:', err)

      // Log more detailed error information
      if (err instanceof Error) {
        console.error('WebRTC connection error details:', {
          message: err.message,
          name: err.name,
          stack: err.stack,
        });
      } else {
        console.error('Unknown WebRTC connection error type:', err);
      }

      throw err
    }
  }

  // Setup WebSocket connection
  const setupWebSocketConnection = async (sessionData: any) => {
    try {
      setStatus('connecting')

      // Create WebSocket connection
      const socket = new WebSocket(`wss://api.openai.com/v1/audio/realtime/${sessionData.realtimeSessionId}`)
      socketRef.current = socket

      // Setup audio context and processor
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioContext

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      // Create source node
      const sourceNode = audioContext.createMediaStreamSource(stream)
      sourceNodeRef.current = sourceNode

      // Load audio worklet
      await audioContext.audioWorklet.addModule('/audio-processor.js')

      // Create processor node
      const processorNode = new AudioWorkletNode(audioContext, 'audio-processor')
      processorNodeRef.current = processorNode

      // Connect nodes
      sourceNode.connect(processorNode)
      processorNode.connect(audioContext.destination)

      // Handle messages from processor
      processorNode.port.onmessage = (event) => {
        if (event.data.audio && socket.readyState === WebSocket.OPEN) {
          socket.send(event.data.audio)
        }
      }

      // Handle WebSocket events
      socket.onopen = () => {
        setStatus('connected')
      }

      socket.onmessage = (event) => {
        // Handle incoming audio data
        if (event.data instanceof Blob) {
          const reader = new FileReader()
          reader.onload = () => {
            const audioBuffer = reader.result as ArrayBuffer
            // Play audio
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            audioContext.decodeAudioData(audioBuffer, (buffer) => {
              const source = audioContext.createBufferSource()
              source.buffer = buffer
              source.connect(audioContext.destination)
              source.start()
            })
          }
          reader.readAsArrayBuffer(event.data)
        } else {
          try {
            const data = JSON.parse(event.data)
            if (data.type === 'transcript') {
              setTranscript(prev => [...prev, data.text])
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err)
          }
        }
      }

      socket.onerror = (event) => {
        console.error('WebSocket error:', event)
        setError('WebSocket connection error')
        setStatus('disconnected')
      }

      socket.onclose = () => {
        setStatus('disconnected')
      }
    } catch (err) {
      console.error('Error setting up WebSocket connection:', err)

      // Log more detailed error information
      if (err instanceof Error) {
        console.error('WebSocket connection error details:', {
          message: err.message,
          name: err.name,
          stack: err.stack,
        });
      } else {
        console.error('Unknown WebSocket connection error type:', err);
      }

      throw err
    }
  }

  // Cleanup connection
  const cleanupConnection = () => {
    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    // Close WebSocket connection
    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
  }

  const handleStartListening = () => {
    if (status !== 'connected') return

    setIsListening(true)

    // In a real implementation, this would start sending audio to OpenAI
    // For now, we'll just simulate it
    if (socketRef.current || peerConnectionRef.current) {
      toast({
        title: 'Listening...',
        description: 'Your voice is being streamed to OpenAI.',
      })
    } else {
      // Fallback to simulation if connection failed
      toast({
        title: 'Listening...',
        description: 'Simulating voice streaming (connection not established).',
      })

      // Simulate receiving a response after a delay
      setTimeout(() => {
        setIsListening(false)
        setTranscript(prev => [...prev, "I heard you mention several interesting points. Could you elaborate on how these concepts connect to form a cohesive understanding of the topic?"])
      }, 5000)
    }
  }

  const handleStopListening = () => {
    setIsListening(false)
  }

  const handleDisconnect = () => {
    cleanupConnection()
    setStatus('disconnected')
    toast({
      title: 'Disconnected',
      description: 'Your voice interview session has ended.',
    })
    onComplete()
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-600 p-4 text-white">
        <h1 className="text-xl font-semibold">Voice Interview: {topic}</h1>
        <p className="text-sm opacity-80">
          Status: {status === 'connecting' ? 'Connecting...' : status === 'connected' ? 'Connected' : 'Disconnected'}
        </p>
      </div>

      {/* Transcript area */}
      <div className="h-[60vh] overflow-y-auto p-4 bg-gray-50">
        {status === 'connecting' ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
                <div className="inline-block rounded-lg p-3 bg-indigo-600 text-white">
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
            End Interview
          </button>

          {status === 'connected' && (
            <button
              onClick={isListening ? handleStopListening : handleStartListening}
              className={`px-4 py-2 rounded-lg ${
                isListening 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isListening ? 'Stop' : 'Speak'}
            </button>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <p>Note: This voice interview uses OpenAI's Realtime API for speech-to-speech conversation. {error && `Error: ${error}`}</p>
        </div>
      </div>
    </div>
  )
}
