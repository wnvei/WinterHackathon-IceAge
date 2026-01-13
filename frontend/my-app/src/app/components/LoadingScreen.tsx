import React, { useState, useEffect } from 'react';
import { GraduationCap, Loader2, Sparkles } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#fafafa] z-[100] overflow-hidden">
      {/* Background Ambience */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(#4f46e5 1.5px, transparent 1.5px)`,
          backgroundSize: '40px 40px'
        }}
      ></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white via-transparent to-white/60 pointer-events-none"></div>

      {/* Modern Aesthetic Frame */}
      <div className="absolute top-12 left-12 w-8 h-8 border-t-[1px] border-l-[1px] border-slate-200"></div>
      <div className="absolute top-12 right-12 w-8 h-8 border-t-[1px] border-r-[1px] border-slate-200"></div>
      <div className="absolute bottom-12 left-12 w-8 h-8 border-b-[1px] border-l-[1px] border-slate-200"></div>
      <div className="absolute bottom-12 right-12 w-8 h-8 border-b-[1px] border-r-[1px] border-slate-200"></div>

      {/* Main Core Assembly */}
      <div className="flex flex-col items-center gap-16 relative z-10">

        {/* 3D Wireframe Globe Complex */}
        <div className="relative w-56 h-56" style={{ perspective: '1500px' }}>
          {/* Orbital Outer Rings */}
          <div className="absolute inset-[-15%] border-[0.5px] border-indigo-100 rounded-full opacity-50 animate-pulse"></div>
          <div className="absolute inset-[-30%] border-[0.5px] border-slate-100 rounded-full opacity-30 animate-ping" style={{ animationDuration: '4s' }}></div>

          {/* Rotating Wireframe Assembly */}
          <div
            className="w-full h-full relative"
            style={{
              transformStyle: 'preserve-3d',
              animation: 'spin-3d 10s linear infinite'
            }}
          >
            {/* Core Knowledge Sphere */}
            <div className="absolute inset-[10%] bg-indigo-600/5 rounded-full blur-2xl transform-gpu" style={{ transform: 'translateZ(-10px)' }}></div>

            {/* Vertical Latitudes */}
            <div className="absolute inset-0 border-[1px] border-slate-300 rounded-full opacity-80" style={{ transform: 'rotateY(0deg)' }}></div>
            <div className="absolute inset-0 border-[1px] border-slate-200 rounded-full opacity-40" style={{ transform: 'rotateY(60deg)' }}></div>
            <div className="absolute inset-0 border-[1px] border-slate-200 rounded-full opacity-40" style={{ transform: 'rotateY(120deg)' }}></div>

            {/* Horizontal Longitudes */}
            <div className="absolute inset-0 border-[1.5px] border-indigo-500 rounded-full opacity-100" style={{ transform: 'rotateX(90deg)' }}></div>
            <div className="absolute inset-[15%] border-[1px] border-slate-300 rounded-full opacity-60" style={{ transform: 'rotateX(75deg)' }}></div>
            <div className="absolute inset-[15%] border-[1px] border-slate-300 rounded-full opacity-60" style={{ transform: 'rotateX(105deg)' }}></div>
          </div>

          {/* Floating Data Point */}
          <div
            className="absolute inset-[-10%] rounded-full"
            style={{
              transformStyle: 'preserve-3d',
              animation: 'spin-reverse-3d 15s linear infinite'
            }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200 border-2 border-white"></div>
          </div>
        </div>

        {/* Branding Section */}
        <div className="text-center space-y-6">
          <div className="space-y-1">
            <h1 className="text-7xl md:text-8xl font-black tracking-tighter text-slate-900 leading-none">
              SJEC <span className="text-indigo-600"> LEARN</span>
            </h1>
            <div className="flex items-center justify-center pt-5 gap-4 text-[11px] font-black tracking-[0.6em] text-slate-400 uppercase">
              <span className="w-12 h-[1px] bg-slate-200"></span>
              <span className="animate-pulse">For Students, By Students</span>
              <span className="w-12 h-[1px] bg-slate-200"></span>
            </div>
          </div>

          {/* Modern Progress Bar */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-64 h-[2px] bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 w-full animate-loading-slide"></div>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>
        </div>
      </div>


      <style>{`
        @keyframes spin-3d {
          0% { transform: rotateX(20deg) rotateY(0deg); }
          100% { transform: rotateX(20deg) rotateY(360deg); }
        }
        @keyframes spin-reverse-3d {
          0% { transform: rotateX(-15deg) rotateY(360deg); }
          100% { transform: rotateX(-15deg) rotateY(0deg); }
        }
        @keyframes loading-slide {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        .animate-loading-slide {
          animation: loading-slide 3s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
