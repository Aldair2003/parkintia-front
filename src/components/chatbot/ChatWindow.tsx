'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { chatbotService, formatChatbotError, generateMessageId } from '@/services/chatbot.service';
import { ChatMessage, ChatbotState } from '@/types/chatbot';
import { COLORS } from '@/config/colors';

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<ChatbotState>({
    isOpen,
    isLoading: false,
    messages: [],
    conversationId: undefined,
    error: undefined,
    isConnected: false
  });
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Inicializar conexión cuando se abre el chat
  useEffect(() => {
    if (isOpen && !state.isConnected) {
      initializeChatbot();
    }
  }, [isOpen]);

  // Auto scroll a los mensajes más recientes
  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  // Focus en input cuando se abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChatbot = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: undefined }));
    
    try {
      // MODO DEMO: Comentamos la verificación hasta que el backend esté listo
      // const isAvailable = await chatbotService.isServiceAvailable();
      // if (!isAvailable) {
      //   throw new Error('El servicio de chatbot no está disponible en este momento');
      // }

      // Inicializar conversación (genera ID local)
      const { conversationId } = await chatbotService.initializeConversation(user?.id);
      
      // Mensaje de bienvenida
      const welcomeMessage: ChatMessage = {
        id: generateMessageId(),
        content: '¡Hola! Soy el asistente virtual de MedicalPluss. ¿En qué puedo ayudarte hoy?\n\nPuedo ayudarte con información sobre disponibilidad de parqueo y soporte técnico.',
        isUser: false,
        timestamp: new Date(),
        status: 'sent'
      };

      setState(prev => ({
        ...prev,
        isLoading: false,
        isConnected: true, // En modo demo, marcamos como conectado
        conversationId,
        messages: [welcomeMessage],
        error: undefined
      }));

    } catch (error) {
      console.error('Error initializing chatbot:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        isConnected: false,
        error: { message: formatChatbotError(error) }
      }));
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || state.isLoading) return;

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      content: inputMessage.trim(),
      isUser: true,
      timestamp: new Date(),
      status: 'sending'
    };

    // Añadir mensaje del usuario inmediatamente
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true
    }));

    setInputMessage('');
    setIsTyping(true);

    try {
      // MODO DEMO: Simulamos respuesta hasta que el backend esté listo
      // Comentar estas líneas cuando el backend esté funcionando:
      
      // Simular delay del servidor
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      // Generar respuesta inteligente basada en el mensaje
      const generateSmartResponse = (message: string): string => {
        const lowerMessage = message.toLowerCase();
        
        // Respuestas específicas por palabras clave
        if (lowerMessage.includes('hola') || lowerMessage.includes('hi') || lowerMessage.includes('buenas')) {
          return '¡Hola! Bienvenido a MedicalPluss. ¿En qué puedo asistirte? Puedo ayudarte con disponibilidad de parqueo y soporte técnico.';
        }
        
        if (lowerMessage.includes('parking') || lowerMessage.includes('espacio') || lowerMessage.includes('plaza')) {
          return 'Contamos con monitoreo inteligente de parqueo en tiempo real para MedicalPluss. ¿Deseas consultar la disponibilidad actual?';
        }
        
        if (lowerMessage.includes('reserva') || lowerMessage.includes('reservar')) {
          return 'Por el momento en MedicalPluss el sistema es de libre acceso según disponibilidad detectada por nuestras cámaras. ¿Quieres saber cuántos cupos hay ahora?';
        }
        
        if (lowerMessage.includes('precio') || lowerMessage.includes('costo') || lowerMessage.includes('tarifa')) {
          return 'El uso del parqueadero en MedicalPluss es gratuito para pacientes y visitantes autorizados.';
        }
        
        if (lowerMessage.includes('horario') || lowerMessage.includes('hora') || lowerMessage.includes('cuando')) {
          return 'El sistema de MedicalPluss opera 24/7 sincronizado con los horarios de la clínica.';
        }
        
        if (lowerMessage.includes('pago') || lowerMessage.includes('pagar') || lowerMessage.includes('tarjeta')) {
          return 'No se requiere pago para el estacionamiento de MedicalPluss.';
        }
        
        if (lowerMessage.includes('ubicacion') || lowerMessage.includes('donde') || lowerMessage.includes('direccion')) {
          return 'Estamos ubicados en las instalaciones de la clínica MedicalPluss.';
        }
        
        if (lowerMessage.includes('ayuda') || lowerMessage.includes('help') || lowerMessage.includes('soporte')) {
          return 'Estoy aquí para ayudarte! Puedo asistirte con:\n• Información de espacios disponibles\n• Reporte de problemas\n• Consultar horarios de MedicalPluss\n\n¿Qué necesitas?';
        }
        
        if (lowerMessage.includes('disponible') || lowerMessage.includes('libre') || lowerMessage.includes('ocupado')) {
          return 'Puedo darte el reporte en tiempo real si seleccionas la opción de consultar disponibilidad en el menú principal.';
        }
        
        if (lowerMessage.includes('trata') || lowerMessage.includes('que es') || lowerMessage.includes('acerca')) {
          return 'MedicalPluss Smart Parking es un sistema inteligente que utiliza IA para gestionar el estacionamiento de la clínica de forma eficiente.';
        }
        
        // Respuestas generales amigables
        const generalResponses = [
          '¡Excelente pregunta! Como asistente de MedicalPluss, estoy aquí para ayudarte con la gestión del parking.',
          'Entiendo tu consulta. ¿Te gustaría saber más sobre el sistema de parqueo de MedicalPluss?',
          '¡Perfecto! ¿En qué aspecto de MedicalPluss te puedo ayudar?',
          'Gran pregunta! MedicalPluss ofrece soluciones modernas de parking. ¿Hay algo específico que te interese saber?',
          'Me da mucho gusto ayudarte. ¿Qué información sobre MedicalPluss necesitas?'
        ];
        
        return generalResponses[Math.floor(Math.random() * generalResponses.length)];
      };
      
      const smartResponse = generateSmartResponse(userMessage.content);
      
             // Crear mensaje de respuesta del bot (simulado)
       const botMessage: ChatMessage = {
         id: generateMessageId(),
         content: smartResponse,
         isUser: false,
         timestamp: new Date(),
         status: 'sent'
       };

      // ---- CÓDIGO REAL (descomenta cuando tengas el backend) ----
      // const response = await chatbotService.sendMessage({
      //   message: userMessage.content,
      //   conversationId: state.conversationId,
      //   userId: user?.id
      // });
      // 
      // const botMessage: ChatMessage = {
      //   id: generateMessageId(),
      //   content: response.message,
      //   isUser: false,
      //   timestamp: new Date(response.timestamp),
      //   status: 'sent'
      // };

      // Actualizar estado con la respuesta
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'sent' as const }
            : msg
        ).concat(botMessage),
        isLoading: false,
        conversationId: state.conversationId, // Mantener el ID actual en demo
        error: undefined
      }));

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Marcar mensaje del usuario como error y añadir mensaje de error
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
        isUser: false,
        timestamp: new Date(),
        status: 'error'
      };

      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'error' as const }
            : msg
        ).concat(errorMessage),
        isLoading: false,
        error: { message: formatChatbotError(error) }
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 rounded-t-lg text-white"
        style={{ background: COLORS.light.accent }}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-sm">Asistente MedicalPluss</h3>
            <p className="text-xs opacity-90">
              {state.isConnected ? 'En línea' : 'Conectando...'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {state.messages.length === 0 && state.isLoading && (
          <div className="flex justify-center">
            <div className="flex items-center space-x-2 text-gray-700">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
              <span className="text-sm">Iniciando chat...</span>
            </div>
          </div>
        )}

        {state.error && !state.isConnected && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{state.error.message}</p>
            <button
              onClick={initializeChatbot}
              className="text-red-600 text-sm underline mt-1 hover:text-red-700"
            >
              Reintentar conexión
            </button>
          </div>
        )}

        {state.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isTyping && (
          <div className="flex items-center space-x-2">
            <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Container */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje..."
            disabled={state.isLoading || !state.isConnected}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || state.isLoading || !state.isConnected}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente para cada burbuja de mensaje
const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.isUser;
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs rounded-lg p-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900'
        } ${message.status === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : ''}`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-700'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {message.status === 'sending' && (
            <span className="ml-1">
              <svg className="w-3 h-3 inline animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </span>
          )}
          {message.status === 'error' && (
            <span className="ml-1">
              <svg className="w-3 h-3 inline" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </p>
      </div>
    </div>
  );
}; 