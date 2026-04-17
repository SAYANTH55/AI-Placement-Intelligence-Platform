import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Phase 1 Dummy Data
  const initialData = {
    scores: { match: 78, resume: 72 },
    skills: { missing: ["AWS", "Docker"], present: ["Python", "React", "SQL"] },
    recommendations: ["Learn AWS core services", "Build a small Docker project"],
    placement_probability: 81,
    companies: ["Google", "Microsoft", "Amazon"],
    
    // Simulating future dynamic fields that might be added by AI
    dynamic_scores: {
      interview_confidence: 65,
      communication: 88,
      technical_depth: 75
    }
  };

  const [result, setResult] = useState(initialData);
  const [loading, setLoading] = useState(false);
  
  // Auth state initialized from localStorage for persistence
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('ai_placement_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Sync user state to localStorage whenever it changes
  React.useEffect(() => {
    if (user) {
      localStorage.setItem('ai_placement_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ai_placement_user');
    }
  }, [user]);

  return (
    <AppContext.Provider value={{ result, setResult, loading, setLoading, user, setUser }}>
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => useContext(AppContext);
