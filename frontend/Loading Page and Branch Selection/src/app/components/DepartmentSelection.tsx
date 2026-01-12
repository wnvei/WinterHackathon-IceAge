import { useState } from 'react';
import { Code, Brain, Database, BarChart3, Cpu, Zap, Cog, Building } from 'lucide-react';

interface DepartmentSelectionProps {
  onSelect: (deptId: string) => void;
}

const departments = [
  { id: 'cse', name: 'CSE', fullName: 'Computer Science & Engineering', icon: Code, animation: 'cse', stickyColor: 'bg-blue-200' },
  { id: 'aiml', name: 'AIML', fullName: 'AI & Machine Learning', icon: Brain, animation: 'aiml', stickyColor: 'bg-purple-200' },
  { id: 'csbs', name: 'CSBS', fullName: 'CS & Business Systems', icon: BarChart3, animation: 'csbs', stickyColor: 'bg-green-200' },
  { id: 'csds', name: 'CSDS', fullName: 'CS & Data Science', icon: Database, animation: 'csds', stickyColor: 'bg-orange-200' },
  { id: 'ece', name: 'ECE', fullName: 'Electronics & Communication', icon: Cpu, animation: 'ece', stickyColor: 'bg-yellow-200' },
  { id: 'eee', name: 'EEE', fullName: 'Electrical & Electronics', icon: Zap, animation: 'eee', stickyColor: 'bg-red-200' },
  { id: 'mech', name: 'MECH', fullName: 'Mechanical Engineering', icon: Cog, animation: 'mech', stickyColor: 'bg-gray-200' },
  { id: 'civil', name: 'CIVIL', fullName: 'Civil Engineering', icon: Building, animation: 'civil', stickyColor: 'bg-amber-200' },
];

function CSEAnimation() {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-4xl font-bold text-blue-400 opacity-20 animate-pulse absolute top-4 left-4" style={{ animationDuration: '2s' }}>{'<'}</div>
        <div className="text-4xl font-bold text-cyan-400 opacity-20 animate-pulse absolute bottom-4 right-4" style={{ animationDuration: '2s', animationDelay: '1s' }}>{'>'}</div>
      </div>
      <div className="text-5xl animate-pulse" style={{ animationDuration: '2s' }}>💻</div>
    </div>
  );
}

function AIMLAnimation() {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center overflow-hidden">
      <div className="absolute w-2 h-2 bg-purple-400 rounded-full top-12 left-12 animate-ping" style={{ animationDuration: '2s' }}></div>
      <div className="absolute w-2 h-2 bg-pink-400 rounded-full top-16 right-16 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}></div>
      <div className="text-5xl animate-pulse" style={{ animationDuration: '2s' }}>🧠</div>
    </div>
  );
}

function CSBSAnimation() {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center overflow-hidden">
      <div className="absolute w-3 h-3 bg-green-400 rounded-full top-8 left-8 animate-bounce"></div>
      <div className="absolute w-3 h-3 bg-emerald-400 rounded-full bottom-8 right-8 animate-bounce" style={{ animationDelay: '0.5s' }}></div>
      <div className="text-5xl animate-pulse" style={{ animationDuration: '2s' }}>📊</div>
    </div>
  );
}

function CSDSAnimation() {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center overflow-hidden">
      <div className="absolute w-2 h-8 bg-orange-300 rounded top-4 left-8 animate-pulse"></div>
      <div className="absolute w-2 h-12 bg-amber-300 rounded top-8 left-12 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
      <div className="absolute w-2 h-6 bg-orange-300 rounded top-6 left-16 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
      <div className="text-5xl animate-pulse" style={{ animationDuration: '2s' }}>📈</div>
    </div>
  );
}

function ECEAnimation() {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center overflow-hidden">
      <div className="absolute w-16 h-16 border-2 border-yellow-400 rounded-full top-4 left-4 animate-ping" style={{ animationDuration: '3s' }}></div>
      <div className="text-5xl animate-pulse" style={{ animationDuration: '2s' }}>📡</div>
    </div>
  );
}

function EEEAnimation() {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center overflow-hidden">
      <div className="absolute w-1 h-8 bg-yellow-400 top-8 left-12 animate-pulse"></div>
      <div className="absolute w-1 h-8 bg-yellow-400 top-8 right-12 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      <div className="text-5xl animate-pulse" style={{ animationDuration: '2s' }}>⚡</div>
    </div>
  );
}

function MECHAnimation() {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-gray-100 to-slate-100 flex items-center justify-center overflow-hidden">
      <div className="absolute w-8 h-8 border-4 border-gray-400 rounded-full top-8 left-8 animate-spin" style={{ animationDuration: '3s' }}></div>
      <div className="text-5xl animate-pulse" style={{ animationDuration: '2s' }}>⚙️</div>
    </div>
  );
}

function CIVILAnimation() {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center overflow-hidden">
      <div className="absolute bottom-4 left-4 right-4 flex gap-1 items-end">
        <div className="w-6 h-8 bg-amber-300 rounded-t animate-pulse"></div>
        <div className="w-6 h-12 bg-amber-400 rounded-t animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-6 h-10 bg-amber-300 rounded-t animate-pulse" style={{ animationDelay: '0.4s' }}></div>
      </div>
      <div className="text-5xl animate-pulse" style={{ animationDuration: '2s' }}>🏗️</div>
    </div>
  );
}

const animationComponents: Record<string, () => JSX.Element> = {
  cse: CSEAnimation,
  aiml: AIMLAnimation,
  csbs: CSBSAnimation,
  csds: CSDSAnimation,
  ece: ECEAnimation,
  eee: EEEAnimation,
  mech: MECHAnimation,
  civil: CIVILAnimation,
};

export function DepartmentSelection({ onSelect }: DepartmentSelectionProps) {
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const handleDeptClick = (deptId: string) => {
    setSelectedDept(deptId);
    setTimeout(() => {
      onSelect(deptId);
    }, 500);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 px-4 w-full max-w-7xl animate-fade-in z-10 py-8 overflow-y-auto max-h-full">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-5xl md:text-7xl font-black text-gray-900 mb-3 leading-tight">
          CHOOSE YOUR
          <br />
          <span className="text-4xl md:text-6xl">DEPARTMENT</span>
        </h2>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
        {departments.map((dept, index) => {
          const Icon = dept.icon;
          const AnimationComponent = animationComponents[dept.animation];
          const isSelected = selectedDept === dept.id;
          const rotations = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', 'rotate-1', '-rotate-2', 'rotate-2', '-rotate-1'];
          const rotation = rotations[index % rotations.length];
          
          return (
            <button
              key={dept.id}
              onClick={() => handleDeptClick(dept.id)}
              className={`
                group relative
                transform transition-all duration-500 hover:scale-110 hover:z-20
                ${rotation} hover:rotate-0
                ${isSelected ? 'scale-110 z-20 rotate-0' : ''}
              `}
            >
              {/* Binder clip */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <div className="w-10 h-6 bg-gray-800 rounded-sm shadow-lg opacity-60"></div>
              </div>

              {/* Polaroid */}
              <div className="bg-white p-3 pb-12 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <div className="relative w-full aspect-square bg-gray-200 overflow-hidden mb-3">
                  <AnimationComponent />
                  
                  {/* Icon sticker */}
                  <div className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow-md">
                    <Icon className="w-4 h-4 text-gray-900" />
                  </div>
                </div>

                {/* Caption */}
                <div className="text-center">
                  <h3 className="text-2xl font-black text-gray-900 mb-1">{dept.name}</h3>
                  <p className="text-xs text-gray-600 font-medium">{dept.fullName}</p>
                </div>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute -top-4 -right-4 bg-yellow-400 rounded-full p-2 shadow-lg animate-bounce">
                  <svg className="w-6 h-6 text-white fill-white" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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
