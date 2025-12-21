import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 shadow-sm rounded-r-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-900">
              Sandbox Environment Active
            </p>
            <p className="text-sm text-amber-700">
              You are viewing the Live Demo. Actions are simulated and data will not be saved.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/signup')}
          className="flex-shrink-0 bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
        >
          Create Real Account <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};