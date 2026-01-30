'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { parkingService } from '@/services/parking.service';
import { COLORS } from '@/config/colors';
import { 
  X, 
  MapPin, 
  Activity, 
  Square, 
  CheckSquare, 
  XSquare,
  TrendingUp,
  Wifi,
  WifiOff
} from 'lucide-react';

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
  cameraId = 'default',
  videoSource
}) => {
  const [status, setStatus] = useState<any>(null);
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  const fetchStatus = useCallback(async () => {
    try {
      const targetId = videoSource || cameraId;
      const data = await parkingService.getParkingStatusLive(targetId);
      // Calcular freeSpaces como se hace en CamerasModule
      if (data) {
        const enhancedStats = {
          ...data,
          freeSpaces: (data.totalSpaces || 0) - (data.occupiedSpaces || 0)
        };
        setStatus(enhancedStats);
      }
    } catch (err) {
      console.error('Error fetching status:', err);
    }
  }, [cameraId, videoSource]);

  useEffect(() => {
    if (isOpen && isOnline) {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const targetId = videoSource || cameraId;
      const url = `${backendUrl}/cameras/video-feed?cameraId=${targetId}&t=${Date.now()}`;
      setStreamUrl(url);

      // Cargar estado cada 2 segundos
      const interval = setInterval(fetchStatus, 2000);
      fetchStatus();
      
      return () => clearInterval(interval);
    }
  }, [isOpen, isOnline, cameraId, videoSource, fetchStatus]);

  // Evitar scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);


  const occupancyPercentage = status?.totalSpaces > 0 
    ? Math.round((status.occupiedSpaces / status.totalSpaces) * 100) 
    : 0;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-sm z-50 animate-in fade-in duration-200"
      style={{ 
        backgroundColor: isDarkMode 
          ? `${colors.background}E6` 
          : `${colors.surface}F2`
      }}
      onClick={onClose}
    >
      {/* Modal de pantalla completa */}
      <div 
        className="h-screen w-screen flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header compacto */}
        <div 
          className="flex-shrink-0 px-4 py-3 border-b shadow-lg"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <h3 className="text-xl font-bold truncate" style={{ color: colors.textPrimary }}>
                {cameraName}
              </h3>
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-lg"
                style={{
                  backgroundColor: isOnline ? COLORS.status.success : COLORS.status.error,
                  boxShadow: isOnline ? `0 4px 14px ${COLORS.status.success}50` : 'none'
                }}
              >
                {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                {isOnline ? 'EN LÍNEA' : 'FUERA DE LÍNEA'}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div 
                className="hidden md:flex items-center gap-2 text-sm"
                style={{ color: colors.textSecondary }}
              >
                <MapPin size={14} />
                <span>{cameraLocation}</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-all duration-200 hover:scale-110 cursor-pointer"
                style={{ 
                  color: colors.textSecondary,
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode 
                    ? `${COLORS.status.error}30` 
                    : `${COLORS.status.error}15`;
                  e.currentTarget.style.color = COLORS.status.error;
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = colors.textSecondary;
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title="Cerrar"
              >
                <X size={22} />
              </button>
            </div>
          </div>
        </div>

        {/* Contenido principal - Layout horizontal */}
        <div 
          className="flex-1 flex flex-col lg:flex-row overflow-hidden"
          style={{ backgroundColor: colors.background }}
        >
          
          {/* Lado izquierdo - Video y estadísticas principales */}
          <div className="flex-1 flex flex-col p-3 lg:p-4 gap-3 lg:gap-4 overflow-y-auto">
            
            {/* Estadísticas compactas en una fila */}
            {status && (
              <div className="flex-shrink-0 grid grid-cols-4 gap-2 lg:gap-3">
                {/* Total */}
                <div 
                  className="rounded-lg p-2.5 lg:p-3 border shadow-sm"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded-md" style={{ backgroundColor: colors.accent }}>
                      <Square size={14} className="text-white" />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: colors.textSecondary }}>TOTAL</span>
                  </div>
                  <div className="text-2xl lg:text-3xl font-bold" style={{ color: colors.textPrimary }}>
                    {status.totalSpaces}
                  </div>
                </div>

                {/* Libres */}
                <div 
                  className="rounded-lg p-2.5 lg:p-3 border shadow-sm"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded-md" style={{ backgroundColor: COLORS.status.success }}>
                      <CheckSquare size={14} className="text-white" />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: colors.textSecondary }}>LIBRES</span>
                  </div>
                  <div className="text-2xl lg:text-3xl font-bold" style={{ color: COLORS.status.success }}>
                    {status.freeSpaces || 0}
                  </div>
                </div>

                {/* Ocupados */}
                <div 
                  className="rounded-lg p-2.5 lg:p-3 border shadow-sm"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded-md" style={{ backgroundColor: COLORS.status.error }}>
                      <XSquare size={14} className="text-white" />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: colors.textSecondary }}>OCUPADOS</span>
                  </div>
                  <div className="text-2xl lg:text-3xl font-bold" style={{ color: COLORS.status.error }}>
                    {status.occupiedSpaces}
                  </div>
                </div>

                {/* Ocupación % */}
                <div 
                  className="rounded-lg p-2.5 lg:p-3 border shadow-sm"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded-md" style={{ backgroundColor: COLORS.status.warning }}>
                      <TrendingUp size={14} className="text-white" />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: colors.textSecondary }}>OCUPACIÓN</span>
                  </div>
                  <div 
                    className="text-2xl lg:text-3xl font-bold"
                    style={{ 
                      color: occupancyPercentage < 50 
                        ? COLORS.status.success 
                        : occupancyPercentage < 80 
                          ? COLORS.status.warning 
                          : COLORS.status.error
                    }}
                  >
                    {occupancyPercentage}%
                  </div>
                </div>
              </div>
            )}

            {/* Video principal */}
            <div 
              className="flex-1 bg-black rounded-lg overflow-hidden shadow-2xl border min-h-0"
              style={{ borderColor: colors.border }}
            >
              <div className="relative w-full h-full flex items-center justify-center">
                {isOnline && streamUrl ? (
                  <>
                    <img
                      src={streamUrl}
                      alt={`Stream de ${cameraName}`}
                      className="w-full h-full object-contain"
                    />
                    {/* Indicador LIVE */}
                    <div className="absolute top-3 left-3 flex items-center gap-2 bg-rose-600 text-white px-3 py-1.5 rounded-lg shadow-lg shadow-rose-500/50">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span className="text-xs font-bold tracking-wider">EN VIVO</span>
                    </div>
                    {/* Indicador IA */}
                    <div 
                      className="absolute top-3 right-3 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg border"
                      style={{
                        backgroundColor: isDarkMode 
                          ? `${colors.surface}E6` 
                          : `${colors.surface}E6`,
                        color: COLORS.status.success,
                        borderColor: isDarkMode 
                          ? `${COLORS.status.success}30` 
                          : `${COLORS.status.success}50`
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Activity size={14} />
                        <span className="text-xs font-semibold">IA ACTIVA</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8" style={{ color: colors.textSecondary }}>
                    {isOnline ? (
                      <>
                        <div 
                          className="w-16 h-16 border-4 rounded-full animate-spin mb-4"
                          style={{
                            borderColor: colors.border,
                            borderTopColor: colors.accent
                          }}
                        ></div>
                        <p className="text-base font-medium" style={{ color: colors.textPrimary }}>Cargando transmisión...</p>
                      </>
                    ) : (
                      <>
                        <div 
                          className="p-4 rounded-full mb-4"
                          style={{ backgroundColor: colors.surface }}
                        >
                          <WifiOff size={48} style={{ color: COLORS.status.error }} />
                        </div>
                        <p className="text-lg font-bold mb-2" style={{ color: colors.textPrimary }}>Cámara Fuera de Línea</p>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>Transmisión no disponible</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lado derecho - Grid de espacios */}
          <div 
            className="w-full lg:w-80 xl:w-96 flex-shrink-0 p-3 lg:p-4 border-t lg:border-t-0 lg:border-l overflow-y-auto"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border
            }}
          >
            {status && status.spaces && status.spaces.length > 0 ? (
              <div className="h-full flex flex-col">
                {/* Header del panel */}
                <div className="flex-shrink-0 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-base font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
                      <Square size={18} style={{ color: colors.accent }} />
                      ESPACIOS
                    </h4>
                    <span className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                      {status.spaces.length} Total
                    </span>
                  </div>
                  
                  {/* Leyenda compacta */}
                  <div 
                    className="flex gap-3 p-2 rounded-lg border"
                    style={{
                      backgroundColor: isDarkMode 
                        ? `${colors.background}80` 
                        : `${colors.background}60`,
                      borderColor: colors.border
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.status.success }}></div>
                      <span className="text-xs font-medium" style={{ color: colors.textPrimary }}>Libre</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.status.error }}></div>
                      <span className="text-xs font-medium" style={{ color: colors.textPrimary }}>Ocupado</span>
                    </div>
                  </div>
                </div>

                {/* Grid de espacios - scrolleable */}
                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2">
                    {status.spaces.map((space: any) => (
                      <div
                        key={space.id}
                        className={`group relative p-3 rounded-lg text-center font-bold text-sm transition-all duration-200 cursor-pointer ${
                          space.isOccupied 
                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/50' 
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/50'
                        }`}
                        title={`Espacio ${space.spaceNumber} - ${space.isOccupied ? 'Ocupado' : 'Libre'}`}
                      >
                        <div className="flex flex-col items-center justify-center gap-1">
                          {space.isOccupied ? (
                            <XSquare size={16} />
                          ) : (
                            <CheckSquare size={16} />
                          )}
                          <span className="text-base">#{space.spaceNumber}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resumen compacto */}
                <div 
                  className="flex-shrink-0 mt-3 pt-3 border-t"
                  style={{ borderColor: colors.border }}
                >
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div 
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: isDarkMode 
                          ? `${colors.background}80` 
                          : `${colors.background}60`
                      }}
                    >
                      <div className="text-xs mb-1" style={{ color: colors.textSecondary }}>Disponibles</div>
                      <div className="text-lg font-bold" style={{ color: COLORS.status.success }}>
                        {status.freeSpaces || 0}
                      </div>
                    </div>
                    <div 
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: isDarkMode 
                          ? `${colors.background}80` 
                          : `${colors.background}60`
                      }}
                    >
                      <div className="text-xs mb-1" style={{ color: colors.textSecondary }}>En Uso</div>
                      <div className="text-lg font-bold" style={{ color: COLORS.status.error }}>
                        {status.occupiedSpaces}
                      </div>
                    </div>
                    <div 
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: isDarkMode 
                          ? `${colors.background}80` 
                          : `${colors.background}60`
                      }}
                    >
                      <div className="text-xs mb-1" style={{ color: colors.textSecondary }}>Tasa</div>
                      <div 
                        className="text-lg font-bold"
                        style={{ 
                          color: occupancyPercentage < 50 
                            ? COLORS.status.success 
                            : occupancyPercentage < 80 
                              ? COLORS.status.warning 
                              : COLORS.status.error
                        }}
                      >
                        {occupancyPercentage}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center p-6">
                  <Activity size={32} className="mx-auto mb-3 animate-pulse" style={{ color: COLORS.status.warning }} />
                  <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                    Esperando datos...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estilos para scrollbar personalizado */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(229, 231, 235, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.8);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.9);
        }
        
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.8);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.9);
        }
      `}</style>
    </div>
  );
};

export default VideoModal;
