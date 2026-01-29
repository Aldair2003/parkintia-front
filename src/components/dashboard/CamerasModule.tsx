'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/config/colors';
import { cameraService, CameraData, CameraStats } from '@/services/camera.service';
import { parkingService } from '@/services/parking.service';
import VideoPlayer from '@/components/ui/VideoPlayer';
import VideoModal from '@/components/ui/VideoModal';

interface Camera {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline';
  isActive: boolean;
  lastActivity: string;
  stream?: string;
  occupiedSpaces?: number;
  emptySpaces?: number;
  totalSpaces?: number;
  occupancyRate?: number;
}

const CameraCard: React.FC<{ 
  camera: Camera; 
  onDelete: (id: string) => void;
  onViewVideo: (camera: Camera) => void;
  onStatsUpdate?: (cameraId: string, stats: any) => void;
}> = ({
  camera,
  onDelete,
  onViewVideo,
  onStatsUpdate
}) => {
  const { t } = useLanguage();
  const [liveStats, setLiveStats] = useState<any>(null);

  useEffect(() => {
    if (camera.status === 'online') {
      loadLiveStats();
      const interval = setInterval(loadLiveStats, 3000);
      return () => clearInterval(interval);
    }
  }, [camera.id, camera.status]);

  const loadLiveStats = async () => {
    try {
      // Priorizar el ID del stream (ej: cam-08) si existe, ya que es el que reconoce el servicio Python
      const targetId = camera.stream || camera.id;
      const stats = await parkingService.getParkingStatusLive(targetId);
      if (stats) {
        // Aseguramos que freeSpaces esté calculado para la UI
        const enhancedStats = {
          ...stats,
          freeSpaces: (stats.totalSpaces || 0) - (stats.occupiedSpaces || 0)
        };
        setLiveStats(enhancedStats);
        if (onStatsUpdate) {
          onStatsUpdate(camera.id, enhancedStats);
        }
      }
    } catch (error) {
      console.error('Error loading live stats:', error);
    }
  };

  const displayStats = liveStats || {
    totalSpaces: camera.totalSpaces || 0,
    occupiedSpaces: 0,
    freeSpaces: camera.totalSpaces || 0,
  };

  const occupancyPercentage = displayStats.totalSpaces > 0 
    ? (displayStats.occupiedSpaces / displayStats.totalSpaces) * 100 
    : 0;

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div 
            className={`w-3 h-3 rounded-full ${camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <div>
            <h3 className="font-semibold" style={{ color: COLORS.light.textPrimary }}>
              {camera.name}
            </h3>
            <p className="text-sm" style={{ color: COLORS.light.textSecondary }}>
              {camera.location}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onViewVideo(camera)}
            className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
            style={{ color: COLORS.light.accent }}
            title="Ver en pantalla completa"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(camera.id)}
            className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
            style={{ color: COLORS.light.textSecondary }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div 
        className="w-full h-48 rounded-lg mb-4 overflow-hidden bg-black cursor-pointer"
        style={{ backgroundColor: `${COLORS.light.border}10` }}
        onClick={() => onViewVideo(camera)}
      >
        <VideoPlayer 
          isOnline={camera.status === 'online'} 
          cameraName={camera.name}
          cameraId={camera.id}
          className="rounded-lg"
          videoSource={camera.stream}
        />
      </div>

      <div className="space-y-3">
        {/* Estadísticas de ocupación */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: COLORS.light.textPrimary }}>
              Ocupación del Parking
            </span>
            <span className="text-sm font-bold" style={{ color: COLORS.light.accent }}>
              {occupancyPercentage.toFixed(1)}%
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="font-semibold text-red-600">{displayStats.occupiedSpaces}</div>
              <div style={{ color: COLORS.light.textSecondary }}>Ocupados</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-600">{displayStats.freeSpaces}</div>
              <div style={{ color: COLORS.light.textSecondary }}>Libres</div>
            </div>
            <div className="text-center">
              <div className="font-semibold" style={{ color: COLORS.light.textPrimary }}>{displayStats.totalSpaces}</div>
              <div style={{ color: COLORS.light.textSecondary }}>Total</div>
            </div>
          </div>
          
          {/* Barra de progreso */}
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${occupancyPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span style={{ color: COLORS.light.textSecondary }}>
            Actividad: {camera.lastActivity}
          </span>
          <span 
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              camera.status === 'online' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}
          >
            {t(camera.status)}
          </span>
        </div>
      </div>
    </Card>
  );
};

export const CamerasModule: React.FC = () => {
  const { t } = useLanguage();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  
  const [camerasStatsMap, setCamerasStatsMap] = useState<Record<string, any>>({});
  const [globalStats, setGlobalStats] = useState<CameraStats>({
    totalSpaces: 0,
    occupiedSpaces: 0,
    emptySpaces: 0,
    occupancyRate: 0
  });

  useEffect(() => {
    const statsArray = Object.values(camerasStatsMap);
    
    if (statsArray.length === 0) {
      const total = cameras.reduce((acc, cam) => acc + (cam.totalSpaces || 0), 0);
      setGlobalStats({
        totalSpaces: total,
        occupiedSpaces: 0,
        emptySpaces: total,
        occupancyRate: 0
      });
      return;
    }

    const totals = statsArray.reduce((acc, stat) => {
      acc.total += (stat.totalSpaces || 0);
      acc.occupied += (stat.occupiedSpaces || 0);
      acc.free += (stat.freeSpaces || 0);
      return acc;
    }, { total: 0, occupied: 0, free: 0 });

    setGlobalStats({
      totalSpaces: totals.total,
      occupiedSpaces: totals.occupied,
      emptySpaces: totals.free,
      occupancyRate: totals.total > 0 ? (totals.occupied / totals.total) * 100 : 0
    });
  }, [camerasStatsMap, cameras]);

  const handleStatsUpdate = (cameraId: string, stats: any) => {
    setCamerasStatsMap(prev => ({
      ...prev,
      [cameraId]: stats
    }));
  };
  
  useEffect(() => {
    loadCameraData();
    const interval = setInterval(loadCameraData, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadCameraData = async () => {
    try {
      setBackendError(null);
      setLoading(true);
      const realCameras = await parkingService.getCameras();
      const convertedCameras: Camera[] = realCameras.map((cam: any) => ({
        id: cam.id,
        name: cam.name,
        location: cam.description || 'Sin descripción',
        status: cam.isActive ? 'online' : 'offline',
        isActive: cam.isActive,
        lastActivity: cam.updatedAt ? new Date(cam.updatedAt).toLocaleString() : 'Nunca',
        totalSpaces: cam.total_parking || 0,
        stream: cam.streamUrl || cam.videoFile
      }));
      
      setCameras(convertedCameras);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cargar datos';
      setBackendError(errorMessage);
      console.error('Error loading camera data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCameras = cameras.filter(camera => {
    if (statusFilter && camera.status !== statusFilter) return false;
    return true;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta cámara?')) return;
    try {
      await parkingService.deleteCamera(id);
      loadCameraData();
    } catch (error) {
      console.error('Error deleting camera:', error);
    }
  };

  const handleViewVideo = (camera: Camera) => {
    setSelectedCamera(camera);
    setShowVideoModal(true);
  };

  const handleCloseVideoModal = () => {
    setSelectedCamera(null);
    setShowVideoModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: COLORS.light.textPrimary }}>
            {t('cameraManagement')}
          </h1>
          <p className="text-lg mt-1" style={{ color: COLORS.light.textSecondary }}>
            {loading 
              ? 'Cargando datos...' 
              : `Sistema Total: ${globalStats.occupiedSpaces}/${globalStats.totalSpaces} ocupados (${globalStats.occupancyRate.toFixed(1)}%)`
            }
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={loadCameraData}
            disabled={loading}
            style={{ 
              borderColor: COLORS.light.accent,
              color: COLORS.light.accent 
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>
      </div>

      {/* Mensaje de error del backend */}
      {backendError && (
        <div 
          className="p-4 border-l-4 rounded-lg shadow-md"
          style={{ 
            borderLeftColor: COLORS.status.error,
            backgroundColor: `${COLORS.status.error}10`
          }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5" style={{ color: COLORS.status.error }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1" style={{ color: COLORS.status.error }}>
                Error de conexión
              </h3>
              <p className="text-sm" style={{ color: COLORS.light.textSecondary }}>
                {backendError}
              </p>
              <p className="text-xs mt-2" style={{ color: COLORS.light.textSecondary }}>
                Por favor, verifica que el servidor backend esté corriendo y accesible.
              </p>
            </div>
            <button
              onClick={() => setBackendError(null)}
              className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
              aria-label="Cerrar mensaje"
            >
              <svg className="w-4 h-4" style={{ color: COLORS.light.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: COLORS.light.textSecondary }}>
                Espacios Ocupados
              </p>
              <p className="text-3xl font-bold mt-2" style={{ color: COLORS.light.textPrimary }}>
                {loading ? '...' : globalStats.occupiedSpaces}
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#EF444420', color: '#EF4444' }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: COLORS.light.textSecondary }}>
                Espacios Libres
              </p>
              <p className="text-3xl font-bold mt-2" style={{ color: COLORS.light.textPrimary }}>
                {loading ? '...' : globalStats.emptySpaces}
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#10B98120', color: '#10B981' }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: COLORS.light.textSecondary }}>
                Total Espacios
              </p>
              <p className="text-3xl font-bold mt-2" style={{ color: COLORS.light.textPrimary }}>
                {loading ? '...' : globalStats.totalSpaces}
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: `${COLORS.light.primary}20`, color: COLORS.light.primary }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: COLORS.light.textSecondary }}>
                Tasa Ocupación
              </p>
              <p className="text-3xl font-bold mt-2" style={{ color: COLORS.light.textPrimary }}>
                {loading ? '...' : `${globalStats.occupancyRate.toFixed(1)}%`}
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <select 
          className="px-4 py-2 border rounded-lg bg-white"
          style={{ borderColor: COLORS.light.primaryLight }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="online">{t('online')}</option>
          <option value="offline">{t('offline')}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCameras.map((camera) => (
          <CameraCard
            key={camera.id}
            camera={camera}
            onDelete={handleDelete}
            onViewVideo={handleViewVideo}
            onStatsUpdate={handleStatsUpdate}
          />
        ))}
      </div>

      <VideoModal
        isOpen={showVideoModal}
        onClose={handleCloseVideoModal}
        cameraName={selectedCamera?.name || ''}
        cameraLocation={selectedCamera?.location || ''}
        isOnline={selectedCamera?.status === 'online'}
        cameraId={selectedCamera?.id || 'cam-01'}
        videoSource={selectedCamera?.stream}
      />
    </div>
  );
};
