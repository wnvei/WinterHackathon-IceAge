import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, GraduationCap, Star } from 'lucide-react';

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

const API_BASE = "http://localhost:8000";

const accentColors = [
  'from-amber-100 to-amber-200 border-amber-300 text-amber-900',
  'from-rose-100 to-rose-200 border-rose-300 text-rose-900',
  'from-sky-100 to-sky-200 border-sky-300 text-sky-900',
  'from-emerald-100 to-emerald-200 border-emerald-300 text-emerald-900',
  'from-violet-100 to-violet-200 border-violet-300 text-violet-900',
  'from-orange-100 to-orange-200 border-orange-300 text-orange-900',
];

export function SubjectSelection({
  department,
  semester,
  onBack,
  onSelect,
}: SubjectSelectionProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubjects() {
      try {
        const res = await fetch(`${API_BASE}/subjects`);
        if (!res.ok) throw new Error("Failed to fetch subjects");

        const data: string[] = await res.json();
        const formatted = data.map(code => ({
          code,
          name: code,
        }));

        setSubjects(formatted);
      } catch (err) {
        setError("Unable to load academic subjects");
      } finally {
        setLoading(false);
      }
    }

    fetchSubjects();
  }, []);

  const handleSubjectClick = (subject: Subject) => {
    setSelectedSubject(subject.code);
    setTimeout(() => {
      onSelect(subject);
    }, 400);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-bold tracking-tight animate-pulse">Initializing Portal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Connectivity Error</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all">
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 overflow-y-auto w-full py-16 px-6">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-20 right-20 w-64 h-64 bg-indigo-300 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-emerald-300 rounded-full blur-3xl"></div>
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
        <header className="mb-16 text-center md:text-left md:flex md:items-end md:justify-between gap-8">
          <div>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-6">
              <span className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white text-xs font-black rounded-full uppercase tracking-widest shadow-lg shadow-indigo-100">
                <GraduationCap className="w-4 h-4" />
                {department}
              </span>
              <span className="px-4 py-1.5 bg-white border-2 border-indigo-100 text-indigo-700 text-xs font-black rounded-full uppercase tracking-widest">
                Semester {semester}
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[0.9] tracking-tighter">
              CURRICULUM <br /> <span className="text-indigo-600">EXPLORER</span>
            </h1>
          </div>
          <div className="hidden md:block pb-2">
            <p className="text-slate-500 font-bold text-lg">Select a subject to begin <br /> your learning journey.</p>
          </div>
        </header>

        {/* Subject Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.length > 0 ? (
            subjects.map((subject, index) => {
              const isSelected = selectedSubject === subject.code;
              const colorClass = accentColors[index % accentColors.length];

              return (
                <button
                  key={subject.code}
                  onClick={() => handleSubjectClick(subject)}
                  disabled={!!selectedSubject}
                  className={`
                    relative group text-left transition-all duration-300 
                    hover:-translate-y-2 focus:outline-none disabled:cursor-default
                    ${isSelected ? 'scale-[1.02] z-20' : 'hover:z-10'}
                  `}
                >
                  <div className={`
                    h-full min-h-[180px] p-8 rounded-3xl border-2 shadow-sm flex flex-col justify-between overflow-hidden transition-all duration-300 bg-gradient-to-br
                    ${colorClass}
                    ${isSelected ? 'shadow-2xl ring-4 ring-white ring-offset-2' : 'hover:shadow-xl hover:border-white/50'}
                  `}>
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
                      <BookOpen className="w-24 h-24 rotate-12" />
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-6 bg-current rounded-full opacity-50"></div>
                        <span className="text-xs font-black uppercase tracking-[0.2em] opacity-60">Subject</span>
                      </div>
                      <h3 className="text-3xl font-black tracking-tight mb-4 group-hover:tracking-normal transition-all duration-300">
                        {subject.code}
                      </h3>
                    </div>

                    <div className="relative z-10 flex items-center justify-between mt-4">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3].map(i => (
                          <Star key={i} className="w-3 h-3 fill-current opacity-30" />
                        ))}
                      </div>
                      <div className={`
                        px-4 py-1.5 bg-white/40 backdrop-blur-sm rounded-full text-[10px] font-black uppercase tracking-widest transition-all
                        ${isSelected ? 'bg-white shadow-md scale-110' : 'opacity-0 group-hover:opacity-100'}
                      `}>
                        {isSelected ? 'Redirecting...' : 'View Modules'}
                      </div>
                    </div>

                    {/* Active State Ring */}
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <div className="relative flex items-center justify-center w-8 h-8">
                          <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-75"></div>
                          <div className="relative w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center">
              <div className="inline-flex flex-col items-center">
                <BookOpen className="w-16 h-16 text-slate-200 mb-4" />
                <p className="text-xl text-slate-400 font-bold">No subjects cataloged for this criteria.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Detail */}
        <footer className="mt-24 text-center">
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em]">
            SJEC Learn &copy; {new Date().getFullYear()} &bull; For Students, By Students
          </p>
        </footer>
      </div>
    </div>
  );
}