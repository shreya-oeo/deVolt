"use client";

import React, { useEffect, useState } from 'react';
import BrandIcon from '@/components/icons/brand';

export default function HowItWorks() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const sections = document.querySelectorAll('[data-step]');
      let current = 0;
      sections.forEach((s, i) => {
        const rect = s.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.6) current = i;
      });
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const steps = [
    { title: 'Find a station', body: 'Browse nearby charge points on the map and pick one.' },
    { title: 'Start charging', body: 'Authenticate and start a session with one tap.' },
    { title: 'Earn rewards', body: 'Receive DECH tokens based on green energy usage.' },
    { title: 'Finish & verify', body: 'Session finalization writes a memo on-chain for transparency.' },
  ];

  return (
    <main className="min-h-screen bg-black text-white py-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex items-center justify-center mb-6">
          <BrandIcon className="w-14 h-14" />
        </div>
        <h1 className="text-4xl font-bold mb-4">How it works</h1>
        <p className="text-gray-300 mb-8">Scroll to explore a simple 4-step flow.</p>

        <div className="space-y-20">
          {steps.map((s, i) => (
            <section
              key={s.title}
              data-step
              className={`transition-all duration-500 ease-out py-12 px-6 rounded-lg border border-gray-800 ${i === active ? 'bg-blue-900/60 scale-105' : 'bg-transparent'}`}>
              <h2 className="text-2xl font-semibold mb-2">{s.title}</h2>
              <p className="text-gray-300">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
