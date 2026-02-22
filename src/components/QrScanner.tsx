'use client';

import { useEffect, useRef, useState } from 'react';

interface QrScannerProps {
  onDecode: (result: string) => void;
  onError: (error: Error) => void;
}

export default function QrScanner({ onDecode, onError }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startScanner = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        stream = mediaStream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsLoading(false);
        }

        // Simple QR code detection simulation
        // In a real implementation, you would use a QR code library
        // For now, we'll simulate QR code detection with a timeout
        setTimeout(() => {
          // Simulate QR code detection
          const simulatedQRData = JSON.stringify({
            token: 'demo-token-' + Math.random().toString(36).substring(7),
            sessionId: 'demo-session'
          });
          onDecode(simulatedQRData);
        }, 5000);

      } catch (error) {
        onError(error as Error);
        setIsLoading(false);
      }
    };

    startScanner();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onDecode, onError]);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Initializing camera...</p>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-64 object-cover rounded-lg"
      />
      <div className="absolute inset-0 border-4 border-white rounded-lg pointer-events-none">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-48 h-48 border-2 border-white rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}
