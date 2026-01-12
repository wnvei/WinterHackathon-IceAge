import { useState } from 'react';
import { ArrowLeft, X, BookOpen, FileText } from 'lucide-react';

interface ModuleTabsProps {
  subject: { code: string; name: string };
  department: string;
  semester: number;
  onBack: () => void;
}

interface ModuleTab {
  id: number;
  name: string;
  color: string;
}

const modules: ModuleTab[] = [
  { id: 1, name: 'Module 1', color: 'bg-red-200' },
  { id: 2, name: 'Module 2', color: 'bg-blue-200' },
  { id: 3, name: 'Module 3', color: 'bg-green-200' },
  { id: 4, name: 'Module 4', color: 'bg-yellow-200' },
  { id: 5, name: 'Module 5', color: 'bg-purple-200' },
];

export function ModuleTabs({ subject, department, semester, onBack }: ModuleTabsProps) {
  const [openTabs, setOpenTabs] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<number | null>(null);

  const handleTabClick = (moduleId: number) => {
    if (!openTabs.includes(moduleId)) {
      setOpenTabs([...openTabs, moduleId]);
      setActiveTab(moduleId);
    } else {
      setActiveTab(moduleId);
    }
  };

  const handleCloseTab = (moduleId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newOpenTabs = openTabs.filter(id => id !== moduleId);
    setOpenTabs(newOpenTabs);
    
    if (activeTab === moduleId) {
      setActiveTab(newOpenTabs.length > 0 ? newOpenTabs[newOpenTabs.length - 1] : null);
    }
  };

  const getModuleContent = (moduleId: number) => {
    return {
      title: `Module ${moduleId}`,
      description: `Content for Module ${moduleId} will be displayed here.`,
      topics: [
        'Topic 1: Introduction',
        'Topic 2: Key Concepts',
        'Topic 3: Advanced Topics',
        'Topic 4: Practical Applications',
        'Topic 5: Summary & Review',
      ]
    };
  };

  return (
    <div className="flex flex-col w-full h-full animate-fade-in z-10">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-gray-100 to-gray-200 border-b-4 border-gray-800 px-4 py-4 shadow-lg">
        <button
          onClick={onBack}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        >
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>

        <div className="text-center">
          <div className="flex gap-2 justify-center items-center mb-2 flex-wrap">
            <div className="bg-white px-4 py-1 rounded-full shadow-md text-xs font-bold text-gray-700">
              {department.toUpperCase()}
            </div>
            <div className="bg-white px-4 py-1 rounded-full shadow-md text-xs font-bold text-gray-700">
              SEM {semester}
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">{subject.code}</h1>
          <p className="text-sm text-gray-600 font-medium">{subject.name}</p>
        </div>
      </div>

      {/* Browser-style Tabs Bar */}
      <div className="bg-gray-300 border-b-2 border-gray-400 px-2 py-1 flex items-end gap-1 overflow-x-auto shadow-inner">
        {/* Module Buttons (Minimized Tabs) */}
        {modules.map((module) => {
          const isOpen = openTabs.includes(module.id);
          const isActive = activeTab === module.id;

          if (!isOpen) {
            return (
              <button
                key={module.id}
                onClick={() => handleTabClick(module.id)}
                className={`
                  ${module.color} px-3 py-1.5 rounded-t-lg border-2 border-gray-400 border-b-0
                  text-sm font-bold text-gray-800 hover:brightness-95 transition-all
                  flex items-center gap-2 whitespace-nowrap shadow-md hover:shadow-lg
                  transform hover:-translate-y-1
                `}
              >
                <BookOpen className="w-4 h-4" />
                M{module.id}
              </button>
            );
          }

          return null;
        })}
      </div>

      {/* Open Tabs Bar */}
      {openTabs.length > 0 && (
        <div className="bg-gray-200 border-b-2 border-gray-400 px-2 py-1 flex items-center gap-1 overflow-x-auto shadow-inner">
          {openTabs.map((moduleId) => {
            const module = modules.find(m => m.id === moduleId);
            if (!module) return null;
            
            const isActive = activeTab === moduleId;

            return (
              <button
                key={moduleId}
                onClick={() => setActiveTab(moduleId)}
                className={`
                  group relative px-4 py-2 rounded-t-lg border-2 border-gray-400
                  flex items-center gap-2 min-w-[180px] max-w-[220px]
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-white border-b-white -mb-[2px] z-10 shadow-lg' 
                    : 'bg-gray-100 hover:bg-gray-50 border-b-gray-400'
                  }
                `}
              >
                <div className={`w-3 h-3 rounded-full ${module.color.replace('bg-', 'bg-').replace('-200', '-400')}`}></div>
                <span className="text-sm font-bold text-gray-800 truncate flex-1">
                  {module.name}
                </span>
                <button
                  onClick={(e) => handleCloseTab(moduleId, e)}
                  className="p-0.5 hover:bg-red-500 hover:text-white rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </button>
            );
          })}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-white p-6">
        {activeTab !== null ? (
          <div className="max-w-4xl mx-auto animate-fade-in">
            {(() => {
              const module = modules.find(m => m.id === activeTab);
              const content = getModuleContent(activeTab);
              
              return (
                <div>
                  {/* Module Header */}
                  <div className="mb-6 pb-4 border-b-2 border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-12 h-12 ${module?.color} rounded-lg flex items-center justify-center shadow-md transform -rotate-3`}>
                        <span className="text-2xl font-black text-gray-800">{activeTab}</span>
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-gray-900">{content.title}</h2>
                        <p className="text-sm text-gray-600">{subject.code}</p>
                      </div>
                    </div>
                  </div>

                  {/* Module Content */}
                  <div className="space-y-6">
                    {/* Description Card */}
                    <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200 shadow-md transform -rotate-1">
                      <div className="flex items-start gap-3">
                        <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">Overview</h3>
                          <p className="text-gray-700">{content.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Topics List */}
                    <div className="bg-yellow-50 p-6 rounded-xl border-2 border-yellow-200 shadow-md transform rotate-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-yellow-600" />
                        Topics Covered
                      </h3>
                      <ul className="space-y-3">
                        {content.topics.map((topic, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-yellow-300 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-gray-800">{index + 1}</span>
                            </div>
                            <span className="text-gray-700 font-medium">{topic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Notes Section */}
                    <div className="bg-pink-50 p-6 rounded-xl border-2 border-pink-200 shadow-md transform -rotate-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">📝 Notes & Resources</h3>
                      <p className="text-gray-600 italic">
                        Study materials, notes, and additional resources for this module will be available here.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="bg-white p-8 rounded-2xl shadow-xl transform -rotate-2 border-4 border-gray-300">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-gray-900 mb-2">
                  Select a Module
                </h3>
                <p className="text-gray-600">
                  Click on any module button above to view its content
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
