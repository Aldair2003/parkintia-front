import { fetchWithAuth, API_CONFIG } from '@/config/api.config';

/**
 * Interfaz para datos de cámara
 */
export interface CameraData {
  id: string;
  name: string;
  description?: string;
  location?: string;
  isActive: boolean;
  status: 'online' | 'offline';
  streamUrl?: string;
  videoFile?: string;
  total_parking: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Estadísticas globales de cámaras/parking
 */
export interface CameraStats {
  totalSpaces: number;
  occupiedSpaces: number;
  emptySpaces: number;
  occupancyRate: number;
}

/**
 * Estado de ocupación en tiempo real
 */
export interface LiveParkingStatus {
  totalSpaces: number;
  occupiedSpaces: number;
  freeSpaces: number;
  occupancyRate: number;
  timestamp?: string;
}

/**
 * Servicio de cámaras para el frontend
 * Proporciona funciones para obtener datos de cámaras y estadísticas en tiempo real
 */
export const cameraService = {
  /**
   * Obtener todas las cámaras registradas
   */
  async getCameras(): Promise<CameraData[]> {
    try {
      const response = await fetchWithAuth<any[]>('/cameras');
      return response.map(cam => ({
        id: cam.id,
        name: cam.name,
        description: cam.description,
        location: cam.location,
        isActive: cam.isActive,
        status: cam.isActive ? 'online' : 'offline',
        streamUrl: cam.streamUrl,
        videoFile: cam.videoFile,
        total_parking: cam.total_parking || 0,
        createdAt: cam.createdAt,
        updatedAt: cam.updatedAt,
      }));
    } catch (error) {
      console.error('Error fetching cameras:', error);
      throw error;
    }
  },

  /**
   * Obtener una cámara específica por ID
   */
  async getCamera(id: string): Promise<CameraData> {
    return fetchWithAuth<CameraData>(`/cameras/${id}`);
  },

  /**
   * Obtener estadísticas globales
   */
  async getGlobalStats(): Promise<CameraStats> {
    try {
      const response = await fetchWithAuth<any>('/cameras/stats/global');
      return {
        totalSpaces: response.totalSpaces || 0,
        occupiedSpaces: response.occupiedSpaces || 0,
        emptySpaces: response.freeSpaces || response.emptySpaces || 0,
        occupancyRate: response.occupancyRate || 0,
      };
    } catch (error) {
      console.error('Error fetching global stats:', error);
      return {
        totalSpaces: 0,
        occupiedSpaces: 0,
        emptySpaces: 0,
        occupancyRate: 0,
      };
    }
  },

  /**
   * Obtener estado de parking en tiempo real desde el servicio Python
   */
  async getLiveStatus(cameraId: string = 'default'): Promise<LiveParkingStatus> {
    try {
      const response = await fetchWithAuth<any>(`/cameras/parking-status-live?cameraId=${cameraId}`);
      return {
        totalSpaces: response.totalSpaces || 0,
        occupiedSpaces: response.occupiedSpaces || 0,
        freeSpaces: response.freeSpaces || (response.totalSpaces - response.occupiedSpaces) || 0,
        occupancyRate: response.occupancyRate || (response.totalSpaces > 0 
          ? (response.occupiedSpaces / response.totalSpaces) * 100 
          : 0),
        timestamp: response.timestamp,
      };
    } catch (error) {
      console.error('Error fetching live status:', error);
      // Fallback directo al servicio Python
      try {
        const directResponse = await fetch(`${API_CONFIG.PYTHON_SERVICE_URL}/api/parking/status?cameraId=${cameraId}`);
        if (directResponse.ok) {
          const data = await directResponse.json();
          return {
            totalSpaces: data.totalSpaces || 0,
            occupiedSpaces: data.occupiedSpaces || 0,
            freeSpaces: data.freeSpaces || 0,
            occupancyRate: data.occupancyRate || 0,
            timestamp: data.timestamp,
          };
        }
      } catch (directError) {
        console.error('Error with direct Python service call:', directError);
      }
      
      return {
        totalSpaces: 0,
        occupiedSpaces: 0,
        freeSpaces: 0,
        occupancyRate: 0,
      };
    }
  },

  /**
   * Obtener URL del stream de video
   */
  getVideoStreamUrl(cameraId: string = 'default'): string {
    return `${API_CONFIG.PYTHON_SERVICE_URL}/api/video/feed?cameraId=${cameraId}`;
  },

  /**
   * Controlar el video (play, pause, restart)
   */
  async controlVideo(action: 'play' | 'pause' | 'restart', cameraId: string = 'default'): Promise<{ success: boolean; message?: string }> {
    return fetchWithAuth<{ success: boolean; message?: string }>('/cameras/video-control', {
      method: 'POST',
      body: JSON.stringify({ action, cameraId }),
    });
  },
};
