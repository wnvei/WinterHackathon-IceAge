import { useState, useEffect } from 'react';
import { DepartmentSelection } from './components/DepartmentSelection';
import { SemesterSelection } from './components/SemesterSelection';
import { SubjectSelection } from './components/SubjectSelection';
import { ModuleTabs } from './components/ModuleTabs';
import { LoadingScreen } from './components/LoadingScreen';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<{ code: string; name: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleDepartmentSelect = (deptId: string) => {
    setSelectedDepartment(deptId);
  };

  const handleSemesterSelect = (semester: number) => {
    setSelectedSemester(semester);
  };

  const handleSubjectSelect = (subject: { code: string; name: string }) => {
    setSelectedSubject(subject);
  };

  const handleBack = () => {
    if (selectedSubject !== null) {
      setSelectedSubject(null);
    } else if (selectedSemester !== null) {
      setSelectedSemester(null);
    } else if (selectedDepartment !== null) {
      setSelectedDepartment(null);
    }
  };

  return (
    <div className="size-full flex items-center justify-center bg-[#f5f5f0] overflow-hidden relative">
      {/* Grid pattern background */}
      <div 
        className="absolute inset-0" 
        style={{
          backgroundImage: `
            linear-gradient(to right, #d0d0c8 1px, transparent 1px),
            linear-gradient(to bottom, #d0d0c8 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      ></div>
      
      {isLoading ? (
        <LoadingScreen />
      ) : selectedDepartment === null ? (
        <DepartmentSelection onSelect={handleDepartmentSelect} />
      ) : selectedSemester === null ? (
        <SemesterSelection onSelect={handleSemesterSelect} onBack={handleBack} department={selectedDepartment} />
      ) : selectedSubject === null ? (
        <SubjectSelection 
          department={selectedDepartment} 
          semester={selectedSemester} 
          onBack={handleBack}
          onSelect={handleSubjectSelect}
        />
      ) : (
        <ModuleTabs 
          subject={selectedSubject}
          department={selectedDepartment}
          semester={selectedSemester}
          onBack={handleBack}
        />
      )}
    </div>
  );
}