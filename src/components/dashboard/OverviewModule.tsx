'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/Card';
import { COLORS } from '@/config/colors';
import { parkingService } from '@/services/parking.service';
import { userService } from '@/services/user.service';
import { 
  Building2, 
  Users, 
  Activity,
  RefreshCw,
  FileText,
  UserPlus,
  Camera,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  subtitle?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color, subtitle }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

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
  const defaultColor = color || colors.accent;

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
            {title}
          </p>
          <p className="text-3xl font-bold mt-2" style={{ color: colors.textPrimary }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
              {subtitle}
            </p>
          )}
        </div>
        <div 
          className="p-3 rounded-full"
          style={{ backgroundColor: `${defaultColor}20`, color: defaultColor }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
};

const ParkingIcon = () => <Building2 className="w-6 h-6" />;
const UsersIcon = () => <Users className="w-6 h-6" />;
const CameraIcon = () => <Camera className="w-6 h-6" />;
const ActivityIcon = () => <Activity className="w-6 h-6" />;

export const OverviewModule: React.FC = () => {
  const { t } = useLanguage();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para datos reales
  const [parkingStats, setParkingStats] = useState<{
    totalSpaces: number;
    occupiedSpaces: number;
    freeSpaces: number;
    occupancyRate: number;
    totalCameras: number;
    activeCameras: number;
    camerasWithZones: number;
  } | null>(null);

  const [userStats, setUserStats] = useState<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    usersByRole: Record<string, number>;
  } | null>(null);

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

  // Cargar datos reales con prioridad a datos en tiempo real
  const loadData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    
    try {
      // Usar getCombinedStats que prioriza datos del servicio Python en tiempo real
      const [parkingData, userData] = await Promise.all([
        parkingService.getCombinedStats(),
        userService.getUserStats(),
      ]);
      
      setParkingStats(parkingData);
      setUserStats(userData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  // Cargar datos iniciales y configurar actualización automática
  useEffect(() => {
    loadData();
    
    // Actualizar cada 3 segundos para tiempo real (igual que CamerasModule)
    const interval = setInterval(() => {
      loadData(false); // Sin mostrar loading en actualizaciones automáticas
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const colors = isDarkMode ? COLORS.dark : COLORS.light;

  // Preparar datos de tarjetas con información real
  const getStatsData = () => {
    if (!parkingStats || !userStats) return [];

    return [
      {
        title: t('totalSpaces'),
        value: parkingStats.totalSpaces,
        icon: <ParkingIcon />,
        color: colors.accent,
        subtitle: `${parkingStats.camerasWithZones} cámaras con zonas`
      },
      {
        title: t('occupiedSpaces'),
        value: parkingStats.occupiedSpaces,
        icon: <ParkingIcon />,
        color: '#EF4444',
        subtitle: `${parkingStats.occupancyRate.toFixed(1)}% de ocupación`
      },
      {
        title: 'Cámaras Activas',
        value: parkingStats.activeCameras,
        icon: <CameraIcon />,
        color: '#10B981',
        subtitle: `${parkingStats.totalCameras} total`
      },
      {
        title: t('totalUsers'),
        value: userStats.activeUsers,
        icon: <UsersIcon />,
        color: '#8B5CF6',
        subtitle: `${userStats.totalUsers} registrados`
      }
    ];
  };

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
          <p style={{ color: colors.textSecondary }}>Cargando datos del dashboard...</p>
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
              onClick={() => loadData()}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
            {t('overview')}
          </h1>
          <p className="text-lg mt-1" style={{ color: colors.textSecondary }}>
            {t('welcomeTo')} PARKINTIA
          </p>
        </div>
        <button
          onClick={() => loadData()}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors cursor-pointer disabled:opacity-50"
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
          <span>{t('refresh')}</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getStatsData().map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            subtitle={stat.subtitle}
          />
        ))}
      </div>

      {/* Información detallada */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estadísticas de Parking */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-6" style={{ color: colors.textPrimary }}>
            Estado del Parking
          </h3>
          {parkingStats && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: `${colors.accent}10` }}>
                <div className="flex items-center space-x-3">
                  <Building2 className="w-8 h-8" style={{ color: colors.accent }} />
                  <div>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>Espacios Libres</p>
                    <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                      {parkingStats.freeSpaces}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    de {parkingStats.totalSpaces}
                  </p>
                  <p className="text-lg font-semibold" style={{ color: COLORS.status.success }}>
                    {(100 - parkingStats.occupancyRate).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border" style={{ borderColor: colors.border }}>
                  <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>Total Cámaras</p>
                  <p className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                    {parkingStats.totalCameras}
                  </p>
                </div>
                <div className="p-4 rounded-lg border" style={{ borderColor: colors.border }}>
                  <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>Cámaras Activas</p>
                  <p className="text-xl font-bold" style={{ color: COLORS.status.success }}>
                    {parkingStats.activeCameras}
                  </p>
                </div>
              </div>

              {/* Barra de progreso de ocupación */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                    Nivel de Ocupación
                  </span>
                  <span className="text-sm font-bold" style={{ color: colors.accent }}>
                    {parkingStats.occupancyRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full" style={{ backgroundColor: `${colors.border}` }}>
                  <div 
                    className="h-3 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${parkingStats.occupancyRate}%`,
                      backgroundColor: parkingStats.occupancyRate > 80 
                        ? COLORS.status.error 
                        : parkingStats.occupancyRate > 60 
                          ? COLORS.status.warning 
                          : COLORS.status.success
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Estadísticas de Usuarios */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-6" style={{ color: colors.textPrimary }}>
            Usuarios del Sistema
          </h3>
          {userStats && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: `${COLORS.status.info}20` }}>
                <div className="flex items-center space-x-3">
                  <Users className="w-8 h-8" style={{ color: COLORS.status.info }} />
                  <div>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>Usuarios Activos</p>
                    <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                      {userStats.activeUsers}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    de {userStats.totalUsers}
                  </p>
                  <p className="text-lg font-semibold" style={{ color: COLORS.status.success }}>
                    {userStats.totalUsers > 0 
                      ? ((userStats.activeUsers / userStats.totalUsers) * 100).toFixed(0)
                      : 0}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border" style={{ borderColor: colors.border }}>
                  <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>Registrados</p>
                  <p className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                    {userStats.totalUsers}
                  </p>
                </div>
                <div className="p-4 rounded-lg border" style={{ borderColor: colors.border }}>
                  <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>Inactivos</p>
                  <p className="text-xl font-bold" style={{ color: COLORS.status.error }}>
                    {userStats.inactiveUsers}
                  </p>
                </div>
              </div>

              {/* Distribución por roles */}
              {Object.keys(userStats.usersByRole).length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-3" style={{ color: colors.textSecondary }}>
                    Distribución por Roles
                  </p>
                  <div className="space-y-2">
                    {Object.entries(userStats.usersByRole).map(([role, count]) => (
                      <div key={role} className="flex items-center justify-between">
                        <span className="text-sm capitalize" style={{ color: colors.textPrimary }}>
                          {role}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-20 h-2 rounded-full"
                            style={{ backgroundColor: `${colors.border}` }}
                          >
                            <div 
                              className="h-2 rounded-full"
                              style={{ 
                                width: `${(count / userStats.totalUsers) * 100}%`,
                                backgroundColor: colors.accent
                              }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-8 text-right" style={{ color: colors.textPrimary }}>
                            {count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Información adicional del sistema */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6" style={{ color: colors.textPrimary }}>
          Estado del Sistema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="p-4 border rounded-lg text-center"
            style={{ 
              borderColor: colors.border,
              backgroundColor: 'transparent'
            }}
          >
            <div 
              className="mb-3 p-3 rounded-lg inline-flex"
              style={{ 
                backgroundColor: `${COLORS.status.success}20`, 
                color: COLORS.status.success
              }}
            >
              <Activity className="w-6 h-6" />
            </div>
            <h4 className="font-medium text-lg" style={{ color: colors.textPrimary }}>
              Sistema Activo
            </h4>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Monitoreo en tiempo real
            </p>
          </div>

          <div
            className="p-4 border rounded-lg text-center"
            style={{ 
              borderColor: colors.border,
              backgroundColor: 'transparent'
            }}
          >
            <div 
              className="mb-3 p-3 rounded-lg inline-flex"
              style={{ 
                backgroundColor: `${colors.accent}20`, 
                color: colors.accent
              }}
            >
              <Camera className="w-6 h-6" />
            </div>
            <h4 className="font-medium text-lg" style={{ color: colors.textPrimary }}>
              {parkingStats?.camerasWithZones || 0}
            </h4>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Cámaras configuradas
            </p>
          </div>

          <div
            className="p-4 border rounded-lg text-center"
            style={{ 
              borderColor: colors.border,
              backgroundColor: 'transparent'
            }}
          >
            <div 
              className="mb-3 p-3 rounded-lg inline-flex"
              style={{ 
                backgroundColor: `${COLORS.status.info}20`, 
                color: COLORS.status.info
              }}
            >
              <Users className="w-6 h-6" />
            </div>
            <h4 className="font-medium text-lg" style={{ color: colors.textPrimary }}>
              {userStats?.activeUsers || 0}
            </h4>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Usuarios conectados
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
