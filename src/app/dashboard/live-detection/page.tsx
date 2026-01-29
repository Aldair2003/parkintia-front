'use client';

import React from 'react';
import VideoDetectionPlayer from '@/components/dashboard/VideoDetectionPlayer';

export default function LiveDetectionPage() {
  // Configuración explícita de las cámaras deseadas
  const activeCameras = [
    { id: 'cam-01', name: 'Cámara Entrada (01) - IP' },
    { id: 'cam-08', name: 'Cámara Salida (08) - IP' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🚗 Detección de Parqueo en Vivo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitoreo en tiempo real de las cámaras IP 01 y 08 con IA
          </p>
        </div>

        {/* Tarjeta informativa */}
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Sistema de Detección Activo
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  Visualizando <strong>Cámara 01</strong> y <strong>Cámara 08</strong>. 
                  Las zonas configuradas en el panel de control se aplicarán automáticamente.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Camera Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {activeCameras.map((cam) => (
                <div key={cam.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                    <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white border-b pb-2">
                        📷 {cam.name}
                    </h2>
                    <VideoDetectionPlayer 
                      cameraId={cam.id} // ID explícito (cam-01, cam-08)
                      showControls={true}
                    />
                </div>
            ))}
        </div>

        {/* Información técnica y leyenda */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🎨 Leyenda de Colores
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-green-500 rounded mr-3"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Espacio Libre - Disponible para estacionar
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-red-500 rounded mr-3"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Espacio Ocupado - Vehículo detectado
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
               Instrucciones
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>1. Ve a "Configurar Zonas" en el menú lateral.</li>
                <li>2. Dibuja los espacios para cada cámara.</li>
                <li>3. Guarda los cambios.</li>
                <li>4. Vuelve aquí para ver la detección en vivo.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}