import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/", icon: "fas fa-tachometer-alt", current: location === "/" },
    { name: "Temperatura", href: "/temperature", icon: "fas fa-thermometer-half", current: false },
    { name: "Humedad", href: "/humidity", icon: "fas fa-tint", current: false },
    { name: "Iluminación", href: "/lighting", icon: "fas fa-sun", current: false },
  ];

  const controlNavigation = [
    { name: "Riego", href: "/irrigation", icon: "fas fa-shower", current: false },
    { name: "Ventilación", href: "/ventilation", icon: "fas fa-fan", current: false },
    { name: "Configuración", href: "/config", icon: "fas fa-cog", current: false },
  ];

  const systemNavigation = [
    { name: "Alertas", href: "/alerts", icon: "fas fa-bell", current: false, badge: 2 },
    { name: "Historial", href: "/history", icon: "fas fa-history", current: false },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 lg:hidden z-20"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-30 p-2 text-gray-500 hover:text-gray-700 bg-white rounded-lg shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        <i className="fas fa-bars text-xl" />
      </button>

      {/* Sidebar */}
      <aside className={cn(
        "w-64 bg-white shadow-lg border-r border-gray-200 fixed h-full z-10 lg:relative lg:z-0 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-greenhouse-500 rounded-xl flex items-center justify-center">
              <i className="fas fa-seedling text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Vivero</h1>
              <p className="text-sm text-gray-500">Automatizado</p>
            </div>
          </div>
        </div>

        <nav className="mt-6">
          <div className="px-6 mb-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Monitoreo</h2>
          </div>
          <ul className="space-y-1 px-3">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    item.current
                      ? "text-white bg-greenhouse-500"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <i className={`${item.icon} mr-3`} />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>

          <div className="px-6 mt-8 mb-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Control</h2>
          </div>
          <ul className="space-y-1 px-3">
            {controlNavigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    item.current
                      ? "text-white bg-greenhouse-500"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <i className={`${item.icon} mr-3`} />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>

          <div className="px-6 mt-8 mb-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sistema</h2>
          </div>
          <ul className="space-y-1 px-3">
            {systemNavigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    item.current
                      ? "text-white bg-greenhouse-500"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <i className={`${item.icon} mr-3`} />
                  {item.name}
                  {item.badge && (
                    <span className="ml-auto bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* System Status */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <div>
              <p className="text-sm font-medium text-gray-900">Sistema Activo</p>
              <p className="text-xs text-gray-500">Última actualización: hace 30s</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
