'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { parkingService } from '@/services/parking.service';
import VideoPlayer from '@/components/ui/VideoPlayer';
import VideoModal from '@/components/ui/VideoModal';
import { COLORS } from '@/config/colors';

// Interfaz para estadísticas de cámara
interface CameraStats {
  totalSpaces: number;
  occupiedSpaces: number;
  emptySpaces: number;
  occupancyRate: number;
}

// Interfaz para estadísticas en tiempo real
interface LiveStats {
  totalSpaces: number;
  occupiedSpaces: number;
  freeSpaces: number;
  occupancyRate?: number;
}

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
  onStatsUpdate?: (cameraId: string, stats: LiveStats) => void;
}> = ({
  camera,
  onDelete,
  onViewVideo,
  onStatsUpdate
}) => {
  const { t } = useLanguage();
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detectar modo oscuro
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
    }

    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const colors = isDarkMode ? COLORS.dark : COLORS.light;

  useEffect(() => {
    if (camera.status === 'online') {
      loadLiveStats();
      const interval = setInterval(loadLiveStats, 3000);
      return () => clearInterval(interval);
    }
  }, [camera.id, camera.status]);

  const loadLiveStats = async () => {
    try {
      const targetId = camera.stream || camera.id;
      const stats = await parkingService.getParkingStatusLive(targetId);
      if (stats) {
        const enhancedStats: LiveStats = {
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

  // Color de la barra según ocupación
  const getProgressColor = () => {
    if (occupancyPercentage < 50) return COLORS.status.success;
    if (occupancyPercentage < 80) return COLORS.status.warning;
    return COLORS.status.error;
  };

  const progressColor = getProgressColor();

  return (
    <div 
      className="group relative rounded-2xl border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        boxShadow: isDarkMode 
          ? '0 10px 25px rgba(0, 0, 0, 0.4), 0 5px 10px rgba(0, 0, 0, 0.3)' 
          : '0 10px 25px rgba(20, 184, 166, 0.1), 0 5px 10px rgba(20, 184, 166, 0.05)'
      }}
    >
      {/* Header con indicador de estado */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Indicador de estado animado */}
            <div className="relative">
              <div className={`w-3 h-3 rounded-full ${camera.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              {camera.status === 'online' && (
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-75" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg" style={{ color: colors.textPrimary }}>
                {camera.name}
              </h3>
              <p className="text-sm flex items-center gap-1" style={{ color: colors.textSecondary }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {camera.location}
              </p>
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex gap-1">
            <button
              onClick={() => onViewVideo(camera)}
              className="p-2 rounded-xl transition-colors"
              style={{
                backgroundColor: isDarkMode ? `${COLORS.status.info}30` : `${COLORS.status.info}15`,
                color: COLORS.status.info
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode 
                  ? `${COLORS.status.info}50` 
                  : `${COLORS.status.info}25`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode 
                  ? `${COLORS.status.info}30` 
                  : `${COLORS.status.info}15`;
              }}
              title="Ver en pantalla completa"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(camera.id)}
              className="p-2 rounded-xl transition-colors"
              style={{
                backgroundColor: isDarkMode ? `${colors.border}80` : `${colors.border}40`,
                color: colors.textSecondary
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode 
                  ? `${COLORS.status.error}30` 
                  : `${COLORS.status.error}15`;
                e.currentTarget.style.color = COLORS.status.error;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode 
                  ? `${colors.border}80` 
                  : `${colors.border}40`;
                e.currentTarget.style.color = colors.textSecondary;
              }}
              title="Eliminar cámara"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Video Player con overlay */}
      <div 
        className="relative w-full h-44 bg-black cursor-pointer group/video overflow-hidden"
        onClick={() => onViewVideo(camera)}
      >
        <VideoPlayer 
          isOnline={camera.status === 'online'} 
          cameraName={camera.name}
          cameraId={camera.id}
          className="w-full h-full"
          videoSource={camera.stream}
        />
        
        {/* Overlay con badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        
        {/* Badge LIVE */}
        {camera.status === 'online' && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-rose-600 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-lg">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            LIVE
          </div>
        )}
        
        {/* Nombre de cámara en overlay */}
        <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs">
          {camera.name}
        </div>
        
        {/* Badge AI */}
        <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          AI
        </div>
      </div>

      {/* Estadísticas */}
      <div className="p-4 pt-3 space-y-3">
        {/* Header de estadísticas */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
            Ocupación del Parking
          </span>
          <span 
            className="text-sm font-bold"
            style={{ 
              color: occupancyPercentage < 50 
                ? COLORS.status.success 
                : occupancyPercentage < 80 
                  ? COLORS.status.warning 
                  : COLORS.status.error
            }}
          >
            {occupancyPercentage.toFixed(1)}%
          </span>
        </div>
        
        {/* Grid de estadísticas */}
        <div className="grid grid-cols-3 gap-2">
          <div 
            className="text-center p-2 rounded-xl"
            style={{ 
              backgroundColor: isDarkMode 
                ? `${COLORS.status.error}20` 
                : `${COLORS.status.error}15`
            }}
          >
            <div className="text-lg font-bold" style={{ color: COLORS.status.error }}>
              {displayStats.occupiedSpaces}
            </div>
            <div 
              className="text-xs font-medium"
              style={{ 
                color: isDarkMode 
                  ? `${COLORS.status.error}CC` 
                  : `${COLORS.status.error}AA`
              }}
            >
              Ocupados
            </div>
          </div>
          <div 
            className="text-center p-2 rounded-xl"
            style={{ 
              backgroundColor: isDarkMode 
                ? `${COLORS.status.success}20` 
                : `${COLORS.status.success}15`
            }}
          >
            <div className="text-lg font-bold" style={{ color: COLORS.status.success }}>
              {displayStats.freeSpaces}
            </div>
            <div 
              className="text-xs font-medium"
              style={{ 
                color: isDarkMode 
                  ? `${COLORS.status.success}CC` 
                  : `${COLORS.status.success}AA`
              }}
            >
              Libres
            </div>
          </div>
          <div 
            className="text-center p-2 rounded-xl"
            style={{ 
              backgroundColor: isDarkMode 
                ? `${colors.accent}20` 
                : `${colors.accent}15`
            }}
          >
            <div className="text-lg font-bold" style={{ color: colors.accent }}>
              {displayStats.totalSpaces}
            </div>
            <div 
              className="text-xs font-medium"
              style={{ 
                color: isDarkMode 
                  ? `${colors.accent}CC` 
                  : `${colors.accent}AA`
              }}
            >
              Total
            </div>
          </div>
        </div>
        
        {/* Barra de progreso mejorada */}
        <div 
          className="w-full rounded-full h-2.5 overflow-hidden"
          style={{ backgroundColor: colors.border }}
        >
          <div 
            className="h-2.5 rounded-full transition-all duration-500"
            style={{ 
              width: `${occupancyPercentage}%`,
              backgroundColor: progressColor
            }}
          />
        </div>

        {/* Footer con actividad y estado */}
        <div 
          className="flex items-center justify-between pt-2 border-t"
          style={{ borderColor: colors.border }}
        >
          <span className="text-xs" style={{ color: colors.textSecondary }}>
            Actividad: {camera.lastActivity}
          </span>
          <span 
            className="px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: camera.status === 'online' 
                ? (isDarkMode ? `${COLORS.status.success}30` : `${COLORS.status.success}20`)
                : (isDarkMode ? `${COLORS.status.error}30` : `${COLORS.status.error}20`),
              color: camera.status === 'online' 
                ? COLORS.status.success 
                : COLORS.status.error
            }}
          >
            {t(camera.status)}
          </span>
        </div>
      </div>
    </div>
  );
};

export const CamerasModule: React.FC = () => {
  const { t } = useLanguage();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [_lastUpdate, setLastUpdate] = useState<string>('');
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [camerasStatsMap, setCamerasStatsMap] = useState<Record<string, LiveStats>>({});
  const [globalStats, setGlobalStats] = useState<CameraStats>({
    totalSpaces: 0,
    occupiedSpaces: 0,
    emptySpaces: 0,
    occupancyRate: 0
  });

  // Detectar modo oscuro
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const colors = isDarkMode ? COLORS.dark : COLORS.light;

  // Función para cargar estadísticas globales directamente del servicio Python
  const loadGlobalStatsFromPython = async () => {
    try {
      // Intentar obtener del servicio Python directamente para tiempo real
      const response = await fetch('http://localhost:5000/api/parking/status?cameraId=default');
      if (response.ok) {
        const data = await response.json();
        if (data && data.totalSpaces > 0) {
          setGlobalStats({
            totalSpaces: data.totalSpaces || 0,
            occupiedSpaces: data.occupiedSpaces || 0,
            emptySpaces: data.freeSpaces || (data.totalSpaces - data.occupiedSpaces) || 0,
            occupancyRate: data.occupancyRate || (data.totalSpaces > 0 
              ? (data.occupiedSpaces / data.totalSpaces) * 100 
              : 0)
          });
          return true; // Datos obtenidos exitosamente
        }
      }
    } catch (error) {
      console.warn('Python service not available, using aggregated stats');
    }
    return false;
  };

  // Efecto para actualizar estadísticas globales
  useEffect(() => {
    const updateGlobalStats = async () => {
      // Primero intentar del servicio Python
      const pythonSuccess = await loadGlobalStatsFromPython();
      
      // Si no hay datos de Python, usar datos agregados de las tarjetas
      if (!pythonSuccess) {
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
      }
    };
    
    updateGlobalStats();
  }, [camerasStatsMap, cameras]);

  // Polling para actualizar estadísticas globales cada 3 segundos
  useEffect(() => {
    const interval = setInterval(loadGlobalStatsFromPython, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStatsUpdate = (cameraId: string, stats: LiveStats) => {
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
            {t('cameraManagement')}
          </h1>
          <p className="text-base mt-1" style={{ color: colors.textSecondary }}>
            {loading 
              ? 'Cargando datos...' 
              : `Sistema Total: ${globalStats.occupiedSpaces}/${globalStats.totalSpaces} ocupados (${globalStats.occupancyRate.toFixed(1)}%)`
            }
          </p>
        </div>
        <button
          onClick={loadCameraData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Mensaje de error del backend */}
      {backendError && (
        <div className="p-4 border-l-4 border-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-lg shadow-md">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1 text-rose-700 dark:text-rose-400">
                Error de conexión
              </h3>
              <p className="text-sm text-rose-600 dark:text-rose-300">
                {backendError}
              </p>
              <p className="text-xs mt-2 text-rose-500 dark:text-rose-400">
                Por favor, verifica que el servidor backend esté corriendo y accesible.
              </p>
            </div>
            <button
              onClick={() => setBackendError(null)}
              className="flex-shrink-0 p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors text-rose-500"
              aria-label="Cerrar mensaje"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ocupados */}
        <div 
          className="rounded-2xl p-5 border shadow-lg hover:shadow-xl transition-shadow"
          style={{ 
            backgroundColor: colors.surface,
            borderColor: colors.border,
            boxShadow: isDarkMode 
              ? '0 10px 25px rgba(0, 0, 0, 0.4), 0 5px 10px rgba(0, 0, 0, 0.3)' 
              : '0 10px 25px rgba(20, 184, 166, 0.1), 0 5px 10px rgba(20, 184, 166, 0.05)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                Ocupados
              </p>
              <p className="text-3xl font-bold mt-1" style={{ color: COLORS.status.error }}>
                {loading ? '...' : globalStats.occupiedSpaces}
              </p>
            </div>
            <div 
              className="p-3 rounded-xl"
              style={{ 
                backgroundColor: isDarkMode 
                  ? `${COLORS.status.error}20` 
                  : `${COLORS.status.error}15`
              }}
            >
              <svg className="w-6 h-6" style={{ color: COLORS.status.error }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>
        </div>

        {/* Libres */}
        <div 
          className="rounded-2xl p-5 border shadow-lg hover:shadow-xl transition-shadow"
          style={{ 
            backgroundColor: colors.surface,
            borderColor: colors.border,
            boxShadow: isDarkMode 
              ? '0 10px 25px rgba(0, 0, 0, 0.4), 0 5px 10px rgba(0, 0, 0, 0.3)' 
              : '0 10px 25px rgba(20, 184, 166, 0.1), 0 5px 10px rgba(20, 184, 166, 0.05)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                Libres
              </p>
              <p className="text-3xl font-bold mt-1" style={{ color: COLORS.status.success }}>
                {loading ? '...' : globalStats.emptySpaces}
              </p>
            </div>
            <div 
              className="p-3 rounded-xl"
              style={{ 
                backgroundColor: isDarkMode 
                  ? `${COLORS.status.success}20` 
                  : `${COLORS.status.success}15`
              }}
            >
              <svg className="w-6 h-6" style={{ color: COLORS.status.success }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total */}
        <div 
          className="rounded-2xl p-5 border shadow-lg hover:shadow-xl transition-shadow"
          style={{ 
            backgroundColor: colors.surface,
            borderColor: colors.border,
            boxShadow: isDarkMode 
              ? '0 10px 25px rgba(0, 0, 0, 0.4), 0 5px 10px rgba(0, 0, 0, 0.3)' 
              : '0 10px 25px rgba(20, 184, 166, 0.1), 0 5px 10px rgba(20, 184, 166, 0.05)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                Total
              </p>
              <p className="text-3xl font-bold mt-1" style={{ color: colors.accent }}>
                {loading ? '...' : globalStats.totalSpaces}
              </p>
            </div>
            <div 
              className="p-3 rounded-xl"
              style={{ 
                backgroundColor: isDarkMode 
                  ? `${colors.accent}20` 
                  : `${colors.accent}15`
              }}
            >
              <svg className="w-6 h-6" style={{ color: colors.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Tasa */}
        <div 
          className="rounded-2xl p-5 border shadow-lg hover:shadow-xl transition-shadow"
          style={{ 
            backgroundColor: colors.surface,
            borderColor: colors.border,
            boxShadow: isDarkMode 
              ? '0 10px 25px rgba(0, 0, 0, 0.4), 0 5px 10px rgba(0, 0, 0, 0.3)' 
              : '0 10px 25px rgba(20, 184, 166, 0.1), 0 5px 10px rgba(20, 184, 166, 0.05)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                Ocupación
              </p>
              <p 
                className="text-3xl font-bold mt-1"
                style={{ 
                  color: globalStats.occupancyRate < 50 
                    ? COLORS.status.success 
                    : globalStats.occupancyRate < 80 
                      ? COLORS.status.warning 
                      : COLORS.status.error
                }}
              >
                {loading ? '...' : `${globalStats.occupancyRate.toFixed(1)}%`}
              </p>
            </div>
            <div 
              className="p-3 rounded-xl"
              style={{ 
                backgroundColor: isDarkMode 
                  ? `${COLORS.status.warning}20` 
                  : `${COLORS.status.warning}15`
              }}
            >
              <svg 
                className="w-6 h-6" 
                style={{ color: COLORS.status.warning }} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filtro */}
      <div className="flex justify-end">
        <select 
          className="px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.textPrimary
          }}
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
        cameraId={selectedCamera?.id || 'default'}
        videoSource={selectedCamera?.stream}
      />
    </div>
  );
};
