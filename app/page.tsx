'use client';

import { DJMixer } from '@/components/DJMixer';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-black relative">
      <DJMixer />
      
      {/* Bolt badge in bottom-right corner */}
      <div className="fixed bottom-4 right-4 z-50">
        <Image
          src="/bolt_badge.svg"
          alt="Bolt Badge"
          width={48}
          height={48}
          className="opacity-80 hover:opacity-100 transition-opacity duration-200"
        />
      </div>
    </div>
  );
}