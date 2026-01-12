import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

interface SemesterSelectionProps {
  onSelect: (semester: number) => void;
  onBack: () => void;
  department: string;
}

const semesters = [
  { num: 1, label: '1st', color: 'bg-red-200' },
  { num: 2, label: '2nd', color: 'bg-orange-200' },
  { num: 3, label: '3rd', color: 'bg-yellow-200' },
  { num: 4, label: '4th', color: 'bg-green-200' },
  { num: 5, label: '5th', color: 'bg-blue-200' },
  { num: 6, label: '6th', color: 'bg-indigo-200' },
  { num: 7, label: '7th', color: 'bg-purple-200' },
];

export function SemesterSelection({ onSelect, onBack, department }: SemesterSelectionProps) {
  const [selectedSem, setSelectedSem] = useState<number | null>(null);

  const handleSemClick = (semNum: number) => {
    setSelectedSem(semNum);
    setTimeout(() => {
      onSelect(semNum);
    }, 500);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 px-4 w-full max-w-6xl animate-fade-in z-10 py-8">
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-8 left-8 bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 transform -rotate-3 hover:rotate-0"
      >
        <ArrowLeft className="w-6 h-6 text-gray-900" />
      </button>

      {/* Header */}
      <div className="text-center">
        <div className="bg-white px-6 py-2 rounded-full shadow-md mb-4 inline-block transform -rotate-1">
          <p className="text-sm font-bold text-gray-700">{department.toUpperCase()}</p>
        </div>
        <h2 className="text-5xl md:text-7xl font-black text-gray-900 mb-3 leading-tight">
          CHOOSE YOUR
          <br />
          <span className="text-4xl md:text-6xl">SEMESTER</span>
        </h2>
      </div>

      {/* Semester Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6 w-full">
        {semesters.map((sem, index) => {
          const isSelected = selectedSem === sem.num;
          const rotations = ['rotate-2', '-rotate-1', 'rotate-1', '-rotate-2', 'rotate-3', '-rotate-2', 'rotate-1'];
          const rotation = rotations[index];
          
          return (
            <button
              key={sem.num}
              onClick={() => handleSemClick(sem.num)}
              className={`
                group relative
                transform transition-all duration-500 hover:scale-110 hover:z-20
                ${rotation} hover:rotate-0
                ${isSelected ? 'scale-110 z-20 rotate-0' : ''}
              `}
            >
              {/* Pin at top */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <div className="w-8 h-8 bg-red-500 rounded-full shadow-lg"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-red-700 rounded-full"></div>
              </div>

              {/* Sticky note */}
              <div className={`${sem.color} p-6 pb-8 shadow-xl hover:shadow-2xl transition-shadow duration-300 min-h-[140px] flex flex-col items-center justify-center`}>
                <div className="text-center">
                  <div className="text-5xl font-black text-gray-900 mb-2">{sem.num}</div>
                  <p className="text-sm font-bold text-gray-700">{sem.label} SEM</p>
                </div>
              </div>

              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute -bottom-3 -right-3 bg-green-500 rounded-full p-2 shadow-lg animate-bounce">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
