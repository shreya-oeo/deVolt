"use client";

import React from 'react';
import BrandIcon from '@/components/icons/brand';

export default function OurGoalPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-start py-20 px-6 bg-black text-white">
      <div className="max-w-4xl w-full text-center">
        <div className="flex items-center justify-center mb-6">
          <BrandIcon className="w-16 h-16" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Our Goal</h1>
        <p className="text-gray-300 leading-relaxed">
          DeVolt builds simple, transparent charging infrastructure and rewards riders for the energy they contribute back to the grid.
          This page explains the mission and how the platform aims to accelerate adoption of clean transport.
        </p>

        <section className="mt-8 text-left text-gray-200">
          <h2 className="text-2xl font-semibold mb-2">What we believe</h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>Charging should be affordable and predictable.</li>
            <li>Users should be rewarded for green behavior.</li>
            <li>Open data and easy UX grow adoption.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
