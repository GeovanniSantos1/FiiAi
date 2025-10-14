'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function RouteTransition() {
  const [show, setShow] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Mostrar imediatamente ao iniciar navegação
    setShow(true);

    // Esconder após carregamento
    const hideTimer = setTimeout(() => {
      setShow(false);
    }, 600);

    return () => {
      clearTimeout(hideTimer);
    };
  }, [pathname]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-40 bg-[#212121]/95 backdrop-blur-md flex items-center justify-center transition-opacity duration-300">
      <div className="flex flex-col items-center gap-8">
        {/* Spinner Container */}
        <div className="relative" style={{ width: '80px', height: '80px' }}>
          {/* Círculo externo com gradiente */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#6d3a05] via-[#edd2a3] to-[#6d3a05] animate-spin" />

          {/* Círculo interno (fundo escuro) */}
          <div className="absolute inset-[3px] rounded-full bg-[#212121] flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-[#edd2a3] animate-spin"
                     style={{ animationDuration: '1.5s' }} />
          </div>

          {/* Pulse rings */}
          <div className="absolute inset-0 rounded-full border-2 border-[#6d3a05] animate-ping opacity-20"
               style={{ animationDuration: '2s' }} />
          <div className="absolute inset-0 rounded-full border-2 border-[#edd2a3] animate-ping opacity-10"
               style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
        </div>

        {/* Texto Carregando */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-xl text-[#edd2a3] font-bold tracking-wider uppercase">
            Carregando
          </p>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#6d3a05] animate-bounce"
                 style={{ animationDelay: '0s', animationDuration: '1s' }} />
            <div className="w-2.5 h-2.5 rounded-full bg-[#edd2a3] animate-bounce"
                 style={{ animationDelay: '0.2s', animationDuration: '1s' }} />
            <div className="w-2.5 h-2.5 rounded-full bg-[#6d3a05] animate-bounce"
                 style={{ animationDelay: '0.4s', animationDuration: '1s' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
