'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  showInlineLoader?: boolean;
  prefetch?: boolean;
}

export function LoadingLink({
  href,
  children,
  className,
  showInlineLoader = false,
  prefetch = true,
}: LoadingLinkProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    if (showInlineLoader) {
      e.preventDefault();
      setIsLoading(true);
      router.push(href);
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      prefetch={prefetch}
      className={cn(
        'inline-flex items-center gap-2 transition-opacity',
        isLoading && 'opacity-50 pointer-events-none',
        className
      )}
    >
      {children}
      {isLoading && showInlineLoader && (
        <Loader2 className="w-4 h-4 animate-spin" />
      )}
    </Link>
  );
}
