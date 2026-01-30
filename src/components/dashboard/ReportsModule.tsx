'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/Card';
import { COLORS } from '@/config/colors';
import { reportsService, type HourlyAverage, type PeriodStatistics } from '@/services/reports.service';
import { parkingService } from '@/services/parking.service';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  BarChart3,
  RefreshCw,
  Loader2,
  AlertCircle,
  Camera,
} from 'lucide-react';

type Period = 'today' | 'yesterday' | 'week' | 'month';

export const ReportsModule: React.FC = () => {
  const { t } = useLanguage();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('today');
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);

  const [hourlyData, setHourlyData] = useState<HourlyAverage[]>([]);
  const [periodStats, setPeriodStats] = useState<PeriodStatistics | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; name: string }>>([]);
  
  // Estado para datos en tiempo real
  const [liveStats, setLiveStats] = useState<{
    totalSpaces: number;
    occupiedSpaces: number;
    freeSpaces: number;
    occupancyRate: number;
  } | null>(null);

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

  // Cargar datos en tiempo real del servicio Python
  const loadLiveStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/parking/status?cameraId=default');
      if (response.ok) {
        const data = await response.json();
        if (data && data.totalSpaces > 0) {
          setLiveStats({
            totalSpaces: data.totalSpaces || 0,
            occupiedSpaces: data.occupiedSpaces || 0,
            freeSpaces: data.freeSpaces || (data.totalSpaces - data.occupiedSpaces) || 0,
            occupancyRate: data.occupancyRate || (data.totalSpaces > 0 
              ? (data.occupiedSpaces / data.totalSpaces) * 100 
              : 0),
          });
        }
      }
    } catch (error) {
      console.warn('Error loading live stats for reports:', error);
    }
  };

  // Cargar datos históricos
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Cargar cámaras disponibles
      const camerasData = await parkingService.getCameras();
      setCameras(camerasData.map(c => ({ id: c.id, name: c.name })));

      // Obtener rango de fechas según período
      const { start, end } = reportsService.getDateRange(selectedPeriod);

      // Cargar datos de ocupación por hora
      const days = selectedPeriod === 'month' ? 30 : selectedPeriod === 'week' ? 7 : 1;
      
      try {
        const hourlyDataResult = await reportsService.getHourlyAverage(selectedCamera, days);
        setHourlyData(hourlyDataResult);
      } catch (hourlyError) {
        console.warn('No hourly data available:', hourlyError);
        // Generar datos vacíos para las 24 horas
        const emptyHourlyData = Array.from({ length: 24 }, (_, hour) => ({
          hour,
          avgOccupancy: 0,
          count: 0,
        }));
        setHourlyData(emptyHourlyData);
      }

      // Cargar estadísticas del período
      try {
        const statsResult = await reportsService.getPeriodStatistics(selectedCamera, start, end);
        setPeriodStats(statsResult);
      } catch (statsError) {
        console.warn('No period stats available, trying live data:', statsError);
        
        // Fallback: Obtener datos en tiempo real del servicio Python
        try {
          const liveResponse = await fetch('http://localhost:5000/api/parking/status?cameraId=default');
          if (liveResponse.ok) {
            const liveData = await liveResponse.json();
            const currentOccupancy = liveData.totalSpaces > 0 
              ? (liveData.occupiedSpaces / liveData.totalSpaces) * 100 
              : 0;
            
            setPeriodStats({
              avgOccupancy: currentOccupancy,
              maxOccupancy: currentOccupancy,
              minOccupancy: currentOccupancy,
              peakHour: new Date().getHours(),
              totalSnapshots: 1,
            });
          } else {
            throw new Error('Live data not available');
          }
        } catch (liveError) {
          // Usar valores por defecto si no hay datos
          setPeriodStats({
            avgOccupancy: 0,
            maxOccupancy: 0,
            minOccupancy: 0,
            peakHour: 0,
            totalSnapshots: 0,
          });
        }
      }

    } catch (err: unknown) {
      console.error('Error loading reports data:', err);
      
      // Verificar si es un error de autenticación
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else {
        setError('Error al cargar datos de reportes. Por favor, intenta nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos iniciales y cuando cambian los filtros
  useEffect(() => {
    loadData();
    loadLiveStats(); // Cargar datos en tiempo real
  }, [selectedPeriod, selectedCamera]);

  // Actualización automática cada 3 segundos para datos en tiempo real
  useEffect(() => {
    const liveInterval = setInterval(() => {
      loadLiveStats();
    }, 3000);
    
    return () => clearInterval(liveInterval);
  }, []);

  // Actualización de datos históricos cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      // Recargar datos históricos sin mostrar loading
      loadData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [selectedPeriod, selectedCamera]);

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'today': return 'Hoy';
      case 'yesterday': return 'Ayer';
      case 'week': return 'Última Semana';
      case 'month': return 'Último Mes';
    }
  };

  const getPeriodColor = () => {
    switch (selectedPeriod) {
      case 'today': return colors.accent;
      case 'yesterday': return COLORS.status.success;
      case 'week': return '#8B5CF6';
      case 'month': return '#F59E0B';
    }
  };

  // Preparar datos para la gráfica
  const chartData = hourlyData.map(item => ({
    hour: `${item.hour.toString().padStart(2, '0')}:00`,
    occupancy: item.avgOccupancy,
    count: item.count,
  }));

  // Estado de carga
  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <div className="text-center">
          <Loader2 
            className="animate-spin h-12 w-12 mx-auto mb-4"
            style={{ color: colors.accent }}
          />
          <p style={{ color: colors.textSecondary }}>Cargando datos de reportes...</p>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <AlertCircle 
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: COLORS.status.error }}
            />
            <h3 className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>
              Error al cargar datos
            </h3>
            <p className="mb-4" style={{ color: colors.textSecondary }}>
              {error}
            </p>
            <button
              onClick={loadData}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg mx-auto"
              style={{ 
                backgroundColor: colors.accent,
                color: 'white'
              }}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reintentar</span>
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
            Reportes y Analíticas
          </h1>
          <p className="text-lg mt-1" style={{ color: colors.textSecondary }}>
            Análisis de ocupación del parking
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors disabled:opacity-50"
          style={{ 
            borderColor: colors.border,
            color: colors.accent,
            backgroundColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = `${colors.accent}15`;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
            Período de Análisis
          </label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as Period)}
            className="w-full px-4 py-3 border rounded-lg text-sm font-medium"
            style={{ 
              borderColor: colors.border,
              color: colors.textPrimary,
              backgroundColor: colors.surface
            }}
          >
            <option value="today">Hoy</option>
            <option value="yesterday">Ayer</option>
            <option value="week">Última Semana (7 días)</option>
            <option value="month">Último Mes (30 días)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
            Cámara
          </label>
          <select
            value={selectedCamera || ''}
            onChange={(e) => setSelectedCamera(e.target.value || null)}
            className="w-full px-4 py-3 border rounded-lg text-sm font-medium"
            style={{ 
              borderColor: colors.border,
              color: colors.textPrimary,
              backgroundColor: colors.surface
            }}
          >
            <option value="">Global (Todas las cámaras)</option>
            {cameras.map(camera => (
              <option key={camera.id} value={camera.id}>{camera.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Estadísticas en Tiempo Real */}
      {liveStats && (
        <Card className="p-6 border-2" style={{ borderColor: colors.accent }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-75" />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                Estado Actual en Tiempo Real
              </h3>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium">
              LIVE
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${COLORS.status.error}15` }}>
              <p className="text-3xl font-bold" style={{ color: COLORS.status.error }}>
                {liveStats.occupiedSpaces}
              </p>
              <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>Espacios Ocupados</p>
            </div>
            
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${COLORS.status.success}15` }}>
              <p className="text-3xl font-bold" style={{ color: COLORS.status.success }}>
                {liveStats.freeSpaces}
              </p>
              <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>Espacios Libres</p>
            </div>
            
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${colors.accent}15` }}>
              <p className="text-3xl font-bold" style={{ color: colors.accent }}>
                {liveStats.totalSpaces}
              </p>
              <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>Total Espacios</p>
            </div>
            
            <div className="text-center p-4 rounded-xl" style={{ 
              backgroundColor: liveStats.occupancyRate > 80 
                ? `${COLORS.status.error}15` 
                : liveStats.occupancyRate > 60 
                  ? `${COLORS.status.warning}15`
                  : `${COLORS.status.success}15`
            }}>
              <p className="text-3xl font-bold" style={{ 
                color: liveStats.occupancyRate > 80 
                  ? COLORS.status.error 
                  : liveStats.occupancyRate > 60 
                    ? COLORS.status.warning
                    : COLORS.status.success
              }}>
                {liveStats.occupancyRate.toFixed(1)}%
              </p>
              <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>Tasa Ocupación</p>
            </div>
          </div>
          
          {/* Barra de progreso de ocupación */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                Nivel de Ocupación Actual
              </span>
              <span className="text-sm font-bold" style={{ color: colors.accent }}>
                {liveStats.occupiedSpaces}/{liveStats.totalSpaces}
              </span>
            </div>
            <div className="w-full h-3 rounded-full" style={{ backgroundColor: colors.border }}>
              <div 
                className="h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${liveStats.occupancyRate}%`,
                  backgroundColor: liveStats.occupancyRate > 80 
                    ? COLORS.status.error 
                    : liveStats.occupancyRate > 60 
                      ? COLORS.status.warning 
                      : COLORS.status.success
                }}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Estadísticas del Período */}
      {periodStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: colors.textSecondary }}>Ocupación Promedio</span>
              <TrendingUp className="w-4 h-4" style={{ color: getPeriodColor() }} />
            </div>
            <p className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
              {periodStats.avgOccupancy.toFixed(1)}%
            </p>
            <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
              {getPeriodLabel()}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: colors.textSecondary }}>Ocupación Máxima</span>
              <TrendingUp className="w-4 h-4" style={{ color: COLORS.status.error }} />
            </div>
            <p className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
              {periodStats.maxOccupancy.toFixed(1)}%
            </p>
            <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
              Pico registrado
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: colors.textSecondary }}>Ocupación Mínima</span>
              <TrendingDown className="w-4 h-4" style={{ color: COLORS.status.success }} />
            </div>
            <p className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
              {periodStats.minOccupancy.toFixed(1)}%
            </p>
            <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
              Mínimo registrado
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: colors.textSecondary }}>Hora Pico</span>
              <Clock className="w-4 h-4" style={{ color: COLORS.status.warning }} />
            </div>
            <p className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
              {periodStats.peakHour.toString().padStart(2, '0')}:00
            </p>
            <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
              Mayor ocupación
            </p>
          </Card>
        </div>
      )}

      {/* Gráfica de Ocupación por Hora */}
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
            Ocupación por Hora
          </h3>
          <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            Promedio de {getPeriodLabel()} - {selectedCamera ? cameras.find(c => c.id === selectedCamera)?.name : 'Global'}
          </p>
        </div>

        {chartData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={getPeriodColor()} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={getPeriodColor()} stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis 
                  dataKey="hour" 
                  stroke={colors.textSecondary}
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke={colors.textSecondary}
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: colors.textPrimary }}
                  formatter={(value: any, name: string) => {
                    if (name === 'occupancy') {
                      return [`${value.toFixed(1)}%`, 'Ocupación'];
                    }
                    return [value, name];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="occupancy"
                  stroke={getPeriodColor()}
                  strokeWidth={3}
                  fill="url(#colorOccupancy)"
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center" style={{ color: colors.textSecondary }}>
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay datos disponibles para este período</p>
            </div>
          </div>
        )}
      </Card>

      {/* Información Adicional */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
            Resumen del Análisis
          </h3>
          {periodStats && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: `${colors.accent}10` }}>
                <span style={{ color: colors.textSecondary }}>Snapshots analizados</span>
                <span className="font-semibold" style={{ color: colors.textPrimary }}>
                  {periodStats.totalSnapshots}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: `${colors.accent}10` }}>
                <span style={{ color: colors.textSecondary }}>Período</span>
                <span className="font-semibold" style={{ color: colors.textPrimary }}>
                  {getPeriodLabel()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: `${colors.accent}10` }}>
                <span style={{ color: colors.textSecondary }}>Vista</span>
                <span className="font-semibold" style={{ color: colors.textPrimary }}>
                  {selectedCamera ? 'Por cámara' : 'Global'}
                </span>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
            Interpretación
          </h3>
          {periodStats && (
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div 
                  className="p-2 rounded-lg mt-1"
                  style={{ backgroundColor: `${COLORS.status.info}20`, color: COLORS.status.info }}
                >
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    Hora con mayor demanda
                  </p>
                  <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                    La ocupación alcanza su pico a las {periodStats.peakHour.toString().padStart(2, '0')}:00. 
                    Considera aumentar recursos en este horario.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div 
                  className="p-2 rounded-lg mt-1"
                  style={{ 
                    backgroundColor: periodStats.avgOccupancy > 80 
                      ? `${COLORS.status.error}20` 
                      : periodStats.avgOccupancy > 60 
                        ? `${COLORS.status.warning}20`
                        : `${COLORS.status.success}20`,
                    color: periodStats.avgOccupancy > 80 
                      ? COLORS.status.error 
                      : periodStats.avgOccupancy > 60 
                        ? COLORS.status.warning
                        : COLORS.status.success
                  }}
                >
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    Nivel de ocupación
                  </p>
                  <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                    {periodStats.avgOccupancy > 80 
                      ? 'Ocupación alta. El parking está muy utilizado.' 
                      : periodStats.avgOccupancy > 60 
                        ? 'Ocupación media. Rendimiento óptimo.'
                        : 'Ocupación baja. Hay disponibilidad constante.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
