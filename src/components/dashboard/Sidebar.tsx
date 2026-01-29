'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { COLORS } from '@/config/colors';

interface SidebarProps {
  activeModule: string;
  onModuleSelect: (module: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

// Professional SVG Icons
const NavIcons = {
  overview: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  cameras: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  sun: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  moon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  collapse: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="11 17 6 12 11 7" />
      <polyline points="18 17 13 12 18 7" />
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
};

const navItems = [
  { id: 'overview', label: { es: 'Resumen', en: 'Overview' }, icon: 'overview' },
  { id: 'cameras', label: { es: 'Cámaras', en: 'Cameras' }, icon: 'cameras' },
  { id: 'reports', label: { es: 'Reportes', en: 'Reports' }, icon: 'reports' },
  { id: 'config', label: { es: 'Configurar Zonas', en: 'Configure Zones' }, icon: 'collapse' } // Temporary icon reuse
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeModule, 
  onModuleSelect, 
  collapsed, 
  onToggleCollapse 
}) => {
  const { language, toggleLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const colors = isDarkMode ? COLORS.dark : COLORS.light;

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const handleSelect = (id: string) => {
    if (id === 'config') {
        window.open('http://localhost:5000/config', '_blank');
        return;
    }
    onModuleSelect(id);
    setMobileOpen(false);
  };

  // Mobile Bottom Navigation
  const MobileNav = () => (
    <nav 
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-2 pb-2"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}
    >
      <div 
        className="flex items-center justify-around py-2 px-1 rounded-2xl backdrop-blur-xl"
        style={{ 
          backgroundColor: `${colors.surface}ee`,
          border: `1px solid ${colors.border}`,
          boxShadow: `0 -4px 30px ${isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'}`
        }}
      >
        {navItems.map((item) => {
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl transition-all duration-300"
              style={{
                backgroundColor: isActive ? `${colors.accent}15` : 'transparent',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                color: isActive ? colors.accent : colors.textSecondary
              }}
            >
              <div className="w-5 h-5">
                {NavIcons[item.icon as keyof typeof NavIcons]}
              </div>
              <span 
                className="text-[10px] font-semibold"
                style={{ color: isActive ? colors.accent : colors.textSecondary }}
              >
                {item.label[language as 'es' | 'en']}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );

  // Desktop Sidebar
  return (
    <>
      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Desktop Sidebar */}
      <aside 
        className={`
          hidden lg:flex flex-col
          ${collapsed ? 'w-20' : 'w-72'}
          h-screen sticky top-0
          transition-all duration-500 ease-in-out
        `}
        style={{ 
          backgroundColor: colors.surface,
          borderRight: `1px solid ${colors.border}`,
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* ══════════ TOP: BRAND ══════════ */}
        <div className="p-4">
          <div 
            className={`
              flex items-center gap-3 p-3 rounded-2xl
              transition-all duration-500 ease-in-out
              ${collapsed ? 'justify-center' : ''}
            `}
            style={{ 
              backgroundColor: `${colors.accent}08`,
              border: `1px solid ${colors.accent}15`
            }}
          >
            {/* Logo */}
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500 ease-in-out hover:scale-105"
              style={{ 
                backgroundColor: colors.accent,
                boxShadow: `0 4px 15px ${colors.accent}30`
              }}
            >
              <span className="text-white font-black text-lg">P</span>
            </div>
            
            <div 
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
              }`}
              style={{ 
                transitionDelay: collapsed ? '0ms' : '150ms'
              }}
            >
              <h1 className="text-lg font-bold whitespace-nowrap" style={{ color: colors.textPrimary }}>
                Parkintia
              </h1>
              <div className="flex items-center gap-1.5">
                <div 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: COLORS.status.success }}
                />
                <span className="text-xs font-medium whitespace-nowrap" style={{ color: COLORS.status.success }}>
                  {language === 'es' ? 'Sistema activo' : 'System active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════ NAVIGATION ══════════ */}
        <div className="flex-1 px-3 overflow-y-auto">
          <div className="space-y-1.5">
            {navItems.map((item, index) => {
              const isActive = activeModule === item.id;
              const isHovered = hovered === item.id;
              const label = item.label[language as 'es' | 'en'];

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  onMouseEnter={() => setHovered(item.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`
                    group relative w-full rounded-xl overflow-hidden cursor-pointer
                    transition-all duration-300 ease-out
                    ${collapsed ? 'p-3' : 'p-3.5'}
                  `}
                  style={{
                    backgroundColor: isActive 
                      ? colors.accent 
                      : isHovered 
                        ? `${colors.accent}10` 
                        : 'transparent',
                    transform: isActive ? 'scale(1.02)' : isHovered ? 'translateX(4px)' : 'translateX(0)',
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
                    {/* Icon */}
                    <div 
                      className={`
                        w-5 h-5 flex-shrink-0 transition-transform duration-300
                        ${isHovered && !isActive ? 'scale-110' : ''}
                      `}
                      style={{ 
                        color: isActive ? '#FFFFFF' : colors.accent
                      }}
                    >
                      {NavIcons[item.icon as keyof typeof NavIcons]}
                    </div>
                    
                    <div 
                      className={`overflow-hidden transition-all duration-500 ease-in-out ${
                        collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                      }`}
                      style={{ 
                        transitionDelay: collapsed ? '0ms' : '200ms'
                      }}
                    >
                      <span 
                        className="text-sm font-semibold flex-1 text-left transition-colors duration-300 whitespace-nowrap"
                        style={{ 
                          color: isActive ? '#FFFFFF' : colors.textPrimary
                        }}
                      >
                        {label}
                      </span>
                    </div>
                    
                    {/* Active Arrow */}
                    {isActive && !collapsed && (
                      <div 
                        className="transition-all duration-500 ease-in-out"
                        style={{ 
                          transitionDelay: '250ms',
                          opacity: collapsed ? 0 : 1
                        }}
                      >
                        <svg 
                          className="w-4 h-4 text-white" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Tooltip for collapsed */}
                  {collapsed && (
                    <div 
                      className="
                        absolute left-full ml-3 top-1/2 -translate-y-1/2
                        px-3 py-2 rounded-lg whitespace-nowrap
                        opacity-0 group-hover:opacity-100 pointer-events-none
                        transition-all duration-200 z-50
                      "
                      style={{ 
                        backgroundColor: colors.textPrimary,
                        color: colors.surface,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                      }}
                    >
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ══════════ BOTTOM: CONTROLS + USER ══════════ */}
        <div className="p-3 space-y-3" style={{ borderTop: `1px solid ${colors.border}` }}>
          
          {/* Quick Settings Row */}
          <div className={`flex ${collapsed ? 'flex-col' : 'flex-row'} gap-2`}>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`
                flex items-center justify-center gap-2 rounded-xl cursor-pointer
                transition-all duration-500 ease-in-out hover:scale-105 active:scale-95
                ${collapsed ? 'p-3' : 'flex-1 py-2.5 px-3'}
              `}
              style={{ 
                backgroundColor: isDarkMode ? `${COLORS.status.warning}15` : `${colors.primary}10`,
                color: isDarkMode ? COLORS.status.warning : colors.primary
              }}
            >
              <div className="w-4 h-4 transition-transform duration-500 ease-in-out">
                {isDarkMode ? NavIcons.sun : NavIcons.moon}
              </div>
              <span 
                className={`text-xs font-semibold transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap ${
                  collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                }`}
                style={{ 
                  transitionDelay: collapsed ? '0ms' : '100ms'
                }}
              >
                {isDarkMode ? 'Light' : 'Dark'}
              </span>
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className={`
                flex items-center justify-center gap-2 rounded-xl cursor-pointer
                transition-all duration-500 ease-in-out hover:scale-105 active:scale-95
                ${collapsed ? 'p-3' : 'flex-1 py-2.5 px-3'}
              `}
              style={{ 
                backgroundColor: `${colors.accent}10`,
                color: colors.accent
              }}
            >
              <div className="w-4 h-4 transition-transform duration-500 ease-in-out">
                {NavIcons.globe}
              </div>
              <span 
                className={`text-xs font-bold uppercase transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap ${
                  collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                }`}
                style={{ 
                  transitionDelay: collapsed ? '0ms' : '100ms'
                }}
              >
                {language}
              </span>
            </button>

            {/* Collapse Toggle */}
            <button
              onClick={onToggleCollapse}
              className={`
                flex items-center justify-center rounded-xl cursor-pointer
                transition-all duration-500 ease-in-out hover:scale-105 active:scale-95
                ${collapsed ? 'p-3' : 'py-2.5 px-3'}
              `}
              style={{ 
                backgroundColor: `${colors.textSecondary}10`,
                color: colors.textSecondary
              }}
            >
              <div className={`w-4 h-4 transition-transform duration-500 ease-in-out ${collapsed ? 'rotate-180' : ''}`}>
                {NavIcons.collapse}
              </div>
            </button>
          </div>

          {/* User Card - Animación suave al expandir/comprimir */}
          <div 
            className={`
              transition-all duration-500 ease-in-out overflow-hidden
              ${collapsed ? 'max-h-0 opacity-0' : 'max-h-32 opacity-100'}
            `}
            style={{ 
              transitionDelay: collapsed ? '0ms' : '300ms'
            }}
          >
            {!collapsed && (
              <div 
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ 
                  backgroundColor: `${colors.primary}05`,
                  border: `1px solid ${colors.border}`
                }}
              >
                {/* Avatar */}
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 transition-transform duration-500 ease-in-out"
                  style={{ 
                    backgroundColor: colors.accent,
                    boxShadow: `0 2px 10px ${colors.accent}30`,
                    transform: collapsed ? 'scale(0)' : 'scale(1)',
                    transitionDelay: collapsed ? '0ms' : '350ms'
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                
                <div 
                  className={`flex-1 min-w-0 transition-all duration-500 ease-in-out ${
                    collapsed ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
                  }`}
                  style={{ 
                    transitionDelay: collapsed ? '0ms' : '400ms'
                  }}
                >
                  <p className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>
                    {user?.name || 'Usuario Demo'}
                  </p>
                  <p className="text-xs truncate" style={{ color: colors.textSecondary }}>
                    {user?.email || 'demo@parkintia.com'}
                  </p>
                </div>

                {/* Logout Button integrado */}
                <button
                  onClick={logout}
                  className="p-2 rounded-lg transition-all duration-300 hover:scale-110 cursor-pointer"
                  style={{ 
                    color: colors.textSecondary,
                    transform: collapsed ? 'scale(0)' : 'scale(1)',
                    transitionDelay: collapsed ? '0ms' : '450ms'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${COLORS.status.error}15`;
                    e.currentTarget.style.color = COLORS.status.error;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = colors.textSecondary;
                  }}
                >
                  <div className="w-4 h-4">
                    {NavIcons.logout}
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Logout cuando está comprimido - Animación suave */}
          <div 
            className={`
              transition-all duration-500 ease-in-out overflow-hidden
              ${collapsed ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}
            `}
            style={{ 
              transitionDelay: collapsed ? '200ms' : '0ms'
            }}
          >
            {collapsed && (
              <button
                onClick={logout}
                className="w-full p-3 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer"
                style={{ 
                  backgroundColor: `${COLORS.status.error}08`,
                  color: COLORS.status.error,
                  transform: 'scale(1)',
                  transitionDelay: '250ms'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${COLORS.status.error}20`;
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${COLORS.status.error}08`;
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div className="w-5 h-5">
                  {NavIcons.logout}
                </div>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
