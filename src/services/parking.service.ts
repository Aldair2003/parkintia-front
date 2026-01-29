import { Camera, ParkingZone, ParkingStatusSummary } from '@/types/parking';
import { fetchWithAuth, API_CONFIG } from '@/config/api.config';

// Backend NestJS URL (puerto 3001)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const parkingService = {
  // ========== CAMERAS ==========
  
  async getCameras(): Promise<Camera[]> {
    try {
      // Crear un AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout
      
      const response = await fetchWithAuth<Camera[]>('/cameras', {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error: unknown) {
      // Si es un error de red o timeout, lanzar un error más descriptivo
      if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TypeError' || error.message?.includes('fetch'))) {
        throw new Error('Backend no disponible. Verifica que el servidor esté corriendo.');
      }
      throw error;
    }
  },

  async getCamera(id: string): Promise<Camera> {
    return fetchWithAuth<Camera>(`/cameras/${id}`);
  },

  async createCamera(data: Partial<Camera>): Promise<Camera> {
    return fetchWithAuth<Camera>('/cameras', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCamera(id: string, data: Partial<Camera>): Promise<Camera> {
    return fetchWithAuth<Camera>(`/cameras/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteCamera(id: string): Promise<void> {
    await fetchWithAuth<void>(`/cameras/${id}`, {
      method: 'DELETE',
    });
  },

  // ========== PARKING ZONES ==========

  async getParkingZones(cameraId: string): Promise<ParkingZone[]> {
    return fetchWithAuth<ParkingZone[]>(`/cameras/${cameraId}/parking-zones`);
  },

  async createParkingZone(data: Omit<ParkingZone, 'id' | 'isOccupied'> & { cameraId: string }): Promise<ParkingZone> {
    return fetchWithAuth<ParkingZone>('/cameras/parking-zones', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async bulkCreateParkingZones(cameraId: string, zones: Array<Omit<ParkingZone, 'id' | 'isOccupied'>>): Promise<ParkingZone[]> {
    return fetchWithAuth<ParkingZone[]>('/cameras/parking-zones/bulk', {
      method: 'POST',
      body: JSON.stringify({ cameraId, zones }),
    });
  },

  async updateParkingZone(zoneId: string, data: Partial<ParkingZone>): Promise<ParkingZone> {
    return fetchWithAuth<ParkingZone>(`/cameras/parking-zones/${zoneId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteParkingZone(zoneId: string): Promise<void> {
    await fetchWithAuth<void>(`/cameras/parking-zones/${zoneId}`, {
      method: 'DELETE',
    });
  },

  async deleteAllZones(cameraId: string): Promise<void> {
    await fetchWithAuth<void>(`/cameras/${cameraId}/parking-zones/all`, {
      method: 'DELETE',
    });
  },

  // ========== PARKING STATUS & DETECTION ==========

  async getParkingStatus(cameraId: string, mappingId?: string): Promise<ParkingStatusSummary> {
    // Si tenemos mappingId (cam-08...), pedimos directo a Python
    if (mappingId && mappingId.startsWith('cam-')) {
       try {
         const response = await fetch(`http://localhost:5000/api/parking/status?cameraId=${mappingId}`);
         if (response.ok) return response.json();
       } catch (e) {
         console.warn("Python service not reachable, falling back to backend");
       }
    }

    return fetchWithAuth<ParkingStatusSummary>(`/cameras/${cameraId}/parking-status`);
  },

  async getParkingStatusLive(cameraId: string = 'cam-01'): Promise<ParkingStatusSummary> {
    try {
      return await fetchWithAuth<ParkingStatusSummary>(`/cameras/parking-status-live?cameraId=${cameraId}`);
    } catch (e) {
      // Fallback a llamada directa si el backend falla
      console.warn('Backend live status failed, trying direct Python service...');
    }

    // Intento directo al servicio Python
    try {
      const response = await fetch(`http://localhost:5000/api/parking/status?cameraId=${cameraId}`);
      if (!response.ok) throw new Error('Failed to fetch live parking status from Python');
      return response.json();
    } catch (e) {
      throw new Error('Failed to fetch live parking status');
    }
  },

  getStreamUrl(cameraId: string, videoSource: string): string {
    // Si videoSource es una clave conocida (cam-08, cam-01), úsala como ID para el servicio Python
    const idParam = videoSource && videoSource.startsWith('cam-') 
      ? videoSource 
      : cameraId;
    
    // Conexión directa al servicio Python
    return `http://localhost:5000/api/video/feed?cameraId=${idParam}`;
  },

  getVideoFeedUrl(cameraId: string = 'cam-01'): string {
    return `http://localhost:5000/api/video/feed?cameraId=${cameraId}`;
  },

  async controlVideo(action: 'play' | 'pause' | 'restart', cameraId: string = 'cam-01'): Promise<{ success: boolean; message?: string }> {
    return fetchWithAuth<{ success: boolean; message?: string }>('/cameras/video-control', {
      method: 'POST',
      body: JSON.stringify({ action, cameraId }),
    });
  },

  async getDefaultZones(): Promise<{ zones: ParkingZone[] }> {
    return fetchWithAuth<{ zones: ParkingZone[] }>('/cameras/zones/default');
  },

  // ========== ESTADÍSTICAS GLOBALES ==========

  async getGlobalStats(): Promise<{
    totalSpaces: number;
    occupiedSpaces: number;
    freeSpaces: number;
    occupancyRate: number;
    totalCameras: number;
    activeCameras: number;
    camerasWithZones: number;
  }> {
    return fetchWithAuth('/cameras/stats/global');
  },
};

