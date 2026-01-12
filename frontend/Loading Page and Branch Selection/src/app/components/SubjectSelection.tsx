import { useState } from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';

interface SubjectSelectionProps {
  department: string;
  semester: number;
  onBack: () => void;
  onSelect: (subject: { code: string; name: string }) => void;
}

interface Subject {
  code: string;
  name: string;
}

const subjectData: Record<string, Record<number, Subject[]>> = {
  cse: {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [
      { code: 'CN', name: 'Computer Networks' },
      { code: 'FSD', name: 'Full Stack Development' },
      { code: 'RMIPR', name: 'Research Methodology and IPR' },
      { code: 'SEPM', name: 'Software Engineering & Project Management' },
      { code: 'ATC', name: 'Automata Theory and Computability' },
    ],
    6: [],
    7: [],
  },
  aiml: {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [
      { code: 'SEPM', name: 'Software Engineering & Project Management' },
      { code: 'CN', name: 'Computer Networks' },
      { code: 'FAIML', name: 'Fundamentals of AI and ML' },
      { code: 'TOC', name: 'Theory of Computation' },
      { code: 'RMIPR', name: 'Research Methodology and IPR' },
    ],
    6: [],
    7: [],
  },
  csbs: {
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [],
  },
  csds: {
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [],
  },
  ece: {
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [],
  },
  eee: {
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [],
  },
  mech: {
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [],
  },
  civil: {
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [],
  },
};

const stickyColors = [
  'bg-yellow-200',
  'bg-pink-200',
  'bg-blue-200',
  'bg-green-200',
  'bg-purple-200',
  'bg-orange-200',
  'bg-red-200',
];

export function SubjectSelection({ department, semester, onBack, onSelect }: SubjectSelectionProps) {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  
  const subjects = subjectData[department]?.[semester] || [];

  const handleSubjectClick = (subject: Subject) => {
    setSelectedSubject(subject.code);
    setTimeout(() => {
      onSelect(subject);
    }, 500);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 px-4 w-full max-w-6xl animate-fade-in z-10 py-8 overflow-y-auto max-h-full">
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-8 left-8 bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 transform -rotate-3 hover:rotate-0"
      >
        <ArrowLeft className="w-6 h-6 text-gray-900" />
      </button>

      {/* Header */}
      <div className="text-center">
        <div className="flex gap-3 justify-center mb-4">
          <div className="bg-white px-6 py-2 rounded-full shadow-md inline-block transform rotate-1">
            <p className="text-sm font-bold text-gray-700">{department.toUpperCase()}</p>
          </div>
          <div className="bg-white px-6 py-2 rounded-full shadow-md inline-block transform -rotate-2">
            <p className="text-sm font-bold text-gray-700">SEM {semester}</p>
          </div>
        </div>
        <h2 className="text-5xl md:text-7xl font-black text-gray-900 mb-3 leading-tight">
          CHOOSE YOUR
          <br />
          <span className="text-4xl md:text-6xl">SUBJECT</span>
        </h2>
      </div>

      {/* Subject Cards */}
      {subjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl">
          {subjects.map((subject, index) => {
            const isSelected = selectedSubject === subject.code;
            const rotations = ['-rotate-2', 'rotate-2', '-rotate-1', 'rotate-1', '-rotate-3', 'rotate-2'];
            const rotation = rotations[index % rotations.length];
            const stickyColor = stickyColors[index % stickyColors.length];
            
            return (
              <button
                key={subject.code}
                onClick={() => handleSubjectClick(subject)}
                className={`
                  group relative
                  transform transition-all duration-500 hover:scale-105 hover:z-20
                  ${rotation} hover:rotate-0
                  ${isSelected ? 'scale-105 z-20 rotate-0' : ''}
                `}
              >
                {/* Push pin */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                  <div className="w-6 h-6 bg-red-500 rounded-full shadow-lg"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-red-700 rounded-full"></div>
                </div>

                {/* Sticky note */}
                <div className={`${stickyColor} p-6 shadow-xl hover:shadow-2xl transition-shadow duration-300 min-h-[180px] flex flex-col justify-center`}>
                  <div className="flex items-start gap-2 mb-3">
                    <BookOpen className="w-5 h-5 text-gray-700 flex-shrink-0 mt-1" />
                    <h3 className="text-2xl font-black text-gray-900 text-left">{subject.code}</h3>
                  </div>
                  <p className="text-sm text-gray-700 font-medium text-left leading-tight">
                    {subject.name}
                  </p>
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 shadow-lg animate-bounce">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl shadow-xl transform -rotate-1 max-w-md">
          <p className="text-xl text-gray-700 text-center font-medium">
            📚 Subjects for this semester will be added soon!
          </p>
        </div>
      )}
    </div>
  );
}