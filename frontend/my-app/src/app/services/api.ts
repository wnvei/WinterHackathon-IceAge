const API_BASE_URL = 'http://localhost:8000';

export interface Subject {
    name: string;
}

export interface SyllabusData {
    // Define structure based on backend response, assuming standard JSON for now
    // Adjust field names as per actual JSON content from backend
    modules?: any[];
    topics?: any[];
    [key: string]: any;
}

export const api = {
    getSubjects: async (): Promise<Subject[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/subjects`);
            if (!response.ok) {
                throw new Error('Failed to fetch subjects');
            }
            const data = await response.json();
            // Backend returns a list of strings
            return data.map((name: string) => ({ name }));
        } catch (error) {
            console.error('Error fetching subjects:', error);
            return [];
        }
    },

    getSubjectSyllabus: async (subjectName: string): Promise<SyllabusData | null> => {
        try {
            const response = await fetch(`${API_BASE_URL}/subjects/${subjectName}/syllabus`);
            if (!response.ok) {
                throw new Error('Failed to fetch syllabus');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching syllabus:', error);
            return null;
        }
    },

    getSubjectQuestions: async (subjectName: string): Promise<any | null> => {
        try {
            const response = await fetch(`${API_BASE_URL}/subjects/${subjectName}/questions`);
            if (!response.ok) {
                throw new Error('Failed to fetch questions');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching questions:', error);
            return null;
        }
    }
};
