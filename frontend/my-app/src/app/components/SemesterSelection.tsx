
import { useState } from 'react';
import { ArrowLeft, GraduationCap, Calendar, CheckCircle2 } from 'lucide-react';

interface SemesterSelectionProps {
  onSelect: (semester: number) => void;
  onBack: () => void;
  department: string;
}

const semesters = [
  { num: 1, label: '1st', color: 'from-amber-100 to-amber-200 border-amber-300 text-amber-900' },
  { num: 2, label: '2nd', color: 'from-rose-100 to-rose-200 border-rose-300 text-rose-900' },
  { num: 3, label: '3rd', color: 'from-sky-100 to-sky-200 border-sky-300 text-sky-900' },
  { num: 4, label: '4th', color: 'from-emerald-100 to-emerald-200 border-emerald-300 text-emerald-900' },
  { num: 5, label: '5th', color: 'from-violet-100 to-violet-200 border-violet-300 text-violet-900' },
  { num: 6, label: '6th', color: 'from-indigo-100 to-indigo-200 border-indigo-300 text-indigo-900' },
  { num: 7, label: '7th', color: 'from-orange-100 to-orange-200 border-orange-300 text-orange-900' },
  { num: 8, label: '8th', color: 'from-blue-100 to-blue-200 border-blue-300 text-blue-900' },
];

export function SemesterSelection({ onSelect, onBack, department }: SemesterSelectionProps) {
  const [selectedSem, setSelectedSem] = useState<number | null>(null);

  const handleSemClick = (semNum: number) => {
    setSelectedSem(semNum);
    setTimeout(() => {
      onSelect(semNum);
    }, 400);
  };

  return (
    <div className="relative min-h-screen bg-slate-50 overflow-y-auto w-full py-16 px-6">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-40 left-1/4 w-96 h-96 bg-indigo-200 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-rose-200 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Navigation */}
        <button
          onClick={onBack}
          className="group mb-12 flex items-center gap-2 px-3 py-3 bg-white border border-slate-200 rounded-full shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
        >
          <ArrowLeft className="w-5 h-5 text-slate-900 group-hover:-translate-x-1 transition-transform" />
        </button>

        {/* Header Section */}
        <header className="mb-16 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white text-xs font-black rounded-full uppercase tracking-widest shadow-lg shadow-indigo-100 mb-6">
            <GraduationCap className="w-4 h-4" />
            {department}
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[0.9] tracking-tighter mb-4">
            SELECT <br /> <span className="text-indigo-600 uppercase">Semester</span>
          </h1>
          <p className="text-slate-500 font-bold text-lg max-w-md">
            Choose your current academic term to browse relevant subject modules.
          </p>
        </header>

        {/* Semester Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6">
          {semesters.map((sem) => {
            const isSelected = selectedSem === sem.num;
            const isActive = sem.num === 5;

            return (
              <button
                key={sem.num}
                onClick={() => handleSemClick(sem.num)}
                disabled={!isActive || selectedSem !== null}
                className={`
                  relative group text-left transition-all duration-300 
                  ${isActive ? 'hover:-translate-y-2' : 'opacity-40 cursor-default grayscale-[0.05]'} 
                  focus:outline-none
                  ${isSelected ? 'scale-105 z-20' : 'hover:z-10'}
                `}
              >
                <div className={`
                  aspect-[4/5] p-6 rounded-3xl border-2 shadow-sm flex flex-col items-center justify-center overflow-hidden transition-all duration-300 bg-gradient-to-br
                  ${sem.color}
                  ${isSelected ? 'shadow-2xl ring-4 ring-white ring-offset-2' : isActive ? 'hover:shadow-lg hover:border-white/50' : ''}
                `}>
                  {/* Decorative Icon */}
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                    <Calendar className="w-12 h-12 rotate-12" />
                  </div>

                  <div className="relative z-10 text-center">
                    <div className="text-5xl font-black mb-1 leading-none tracking-tighter">
                      {sem.num}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-80">
                      {sem.label} Term
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute bottom-4 animate-bounce">
                      <CheckCircle2 className="w-6 h-6 text-indigo-700" />
                    </div>
                  )}

                  {/* Hover effect highlight */}
                  {isActive && !isSelected && (
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Academic Details Footer */}
        <footer className="mt-20 border-t border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-slate-400">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
            SJEC Learn &bull; By Students, For Students
          </p>
        </footer>
      </div>
    </div>
  );
}
