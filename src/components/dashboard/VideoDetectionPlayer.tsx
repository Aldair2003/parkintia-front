'use client';

import React, { useState, useEffect } from 'react';
import { Maximize2 } from 'lucide-react';
import { parkingService } from '@/services/parking.service';

interface VideoDetectionPlayerProps {
  cameraId: string;
  showControls?: boolean;
  className?: string;
}

export default function VideoDetectionPlayer({ 
  cameraId = 'cam-01', 
  showControls = true,
  className = '' 
}: VideoDetectionPlayerProps) {
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string>('');
  
  // URL Directa al servicio de Python (igual que en el configurador)
  const streamUrl = `http://localhost:5000/api/video/feed?cameraId=${cameraId}&t=${Date.now()}`;

  useEffect(() => {
    // Cargar estado inicial
    fetchStatus();

    // Obtener estado cada 2 segundos
    const interval = setInterval(fetchStatus, 2000);

    return () => clearInterval(interval);
  }, [cameraId]);

  const fetchStatus = async () => {
    try {
      // Petición directa al status de Python para asegurar sincronía con las zonas
      const response = await fetch(`http://localhost:5000/api/parking/status?cameraId=${cameraId}`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Error fetching status from Python:', err);
    }
  };

  const handleFullscreen = () => {
    const videoElement = document.getElementById(`video-${cameraId}`);
    if (videoElement) {
      if (videoElement.requestFullscreen) {
        videoElement.requestFullscreen();
      }
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Estadísticas principales */}
      {status && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
            <div className="text-xs font-medium text-blue-600">Total</div>
            <div className="text-xl font-bold">{status.totalSpaces || 0}</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
            <div className="text-xs font-medium text-green-600">Libres</div>
            <div className="text-xl font-bold">{status.totalSpaces - status.occupiedSpaces || 0}</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-center">
            <div className="text-xs font-medium text-red-600">Ocupados</div>
            <div className="text-xl font-bold">{status.occupiedSpaces || 0}</div>
          </div>
        </div>
      )}

      {/* Video Stream */}
      <div className="relative bg-black rounded-lg overflow-hidden shadow-lg border-2 border-gray-200 dark:border-gray-700">
        <img
          id={`video-${cameraId}`}
          src={streamUrl}
          alt={`Stream ${cameraId}`}
          className="w-full h-auto"
          onError={() => setError('Error de conexión con la cámara')}
        />
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Grid de Espacios */}
      {status && status.spaces && status.spaces.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {status.spaces.map((space: any) => (
            <div
              key={space.id}
              className={`text-[10px] p-1 rounded border text-center font-bold ${
                space.isOccupied ? 'bg-red-100 border-red-300 text-red-700' : 'bg-green-100 border-green-300 text-green-700'
              }`}
            >
              #{space.spaceNumber}
            </div>
          ))}
        </div>
      )}

      {showControls && (
        <button
          onClick={handleFullscreen}
          className="text-xs flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors"
        >
          <Maximize2 size={12} /> Fullscreen
        </button>
      )}
    </div>
  );
}