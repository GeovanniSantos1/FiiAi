'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function TopLoadingBar() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    // Detectar início de navegação
    setLoading(true);
    setProgress(0);

    // Simular progresso
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 200);

    // Completar ao carregar nova rota
    const completeTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 300);
    }, 500);

    return () => {
      clearInterval(timer);
      clearTimeout(completeTimer);
    };
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-[#212121]/20">
      <div
        className="h-full bg-gradient-to-r from-[#6d3a05] via-[#edd2a3] to-[#6d3a05] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: '0 0 15px rgba(237, 210, 163, 0.6), 0 0 30px rgba(109, 58, 5, 0.4)',
        }}
      />
    </div>
  );
}
