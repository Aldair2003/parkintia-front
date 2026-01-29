'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/config/colors';
import { parkingService } from '@/services/parking.service';
import { X } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  cameraName: string;
  cameraLocation: string;
  isOnline: boolean;
  cameraId?: string;
  videoSource?: string;
}

const VideoModal: React.FC<VideoModalProps> = ({ 
  isOpen, 
  onClose, 
  cameraName, 
  cameraLocation, 
  isOnline,
  cameraId = 'cam-01',
  videoSource
}) => {
  const [status, setStatus] = useState<any>(null);
  const [streamUrl, setStreamUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen && isOnline) {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      // Prioritize videoSource if available
      const targetId = videoSource || cameraId;
      const url = `${backendUrl}/cameras/video-feed?cameraId=${targetId}&t=${Date.now()}`;
      setStreamUrl(url);

      // Cargar estado cada 2 segundos
      const interval = setInterval(fetchStatus, 2000);
      fetchStatus();
      
      return () => clearInterval(interval);
    }
  }, [isOpen, isOnline, cameraId, videoSource]);

  const fetchStatus = async () => {
    try {
      const targetId = videoSource || cameraId;
      const data = await parkingService.getParkingStatusLive(targetId);
      setStatus(data);
    } catch (err) {
      console.error('Error fetching status:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-7xl">
        <Card className="overflow-hidden bg-gray-900 border-gray-700">
          {/* Header */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {cameraName}
              </h3>
              <p className="text-sm text-gray-400">
                {cameraLocation}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {status && (
                <div className="flex items-center space-x-4 text-sm text-gray-300">
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {status.freeSpaces} Libres
                  </span>
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    {status.occupiedSpaces} Ocupados
                  </span>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Video Content */}
          <div className="relative bg-black min-h-[400px] flex items-center justify-center">
            {isOnline && streamUrl ? (
              <img
                src={streamUrl}
                alt={`Stream de ${cameraName}`}
                className="w-full h-auto"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-500">
                {isOnline ? (
                  <div className="w-12 h-12 border-4 border-gray-600 border-t-white rounded-full animate-spin mb-4"></div>
                ) : (
                  <>
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 21l-3-3m0 0L5.636 5.636M15 12H9m6 0a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p>Cámara fuera de línea</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer with controls and stats */}
          <div className="p-4 bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              {/* Controles eliminados - stream en vivo */}
              
              {/* Estadísticas */}
              {status && (
                <div className="flex items-center space-x-6 text-sm text-gray-300 w-full justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{status.totalSpaces}</div>
                    <div>Total Espacios</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{status.freeSpaces}</div>
                    <div>Libres</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{status.occupiedSpaces}</div>
                    <div>Ocupados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">
                      {status.totalSpaces > 0 
                        ? Math.round((status.occupiedSpaces / status.totalSpaces) * 100) 
                        : 0}%
                    </div>
                    <div>Ocupación</div>
                  </div>
                </div>
              )}
            </div>

            {/* Estado de espacios */}
            {status && status.spaces && (
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 mt-4">
                {status.spaces.map((space: any) => (
                  <div
                    key={space.id}
                    className={`p-2 rounded text-center font-medium text-xs transition-all ${
                      space.isOccupied 
                        ? 'bg-red-900 text-red-200 border border-red-700' 
                        : 'bg-green-900 text-green-200 border border-green-700'
                    }`}
                  >
                    #{space.spaceNumber}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VideoModal;
