import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Box, Mail, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';

export const CheckEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  
  // Get email from navigation state or default
  const email = location.state?.email || 'your email address';

  const handleResend = () => {
    setResending(true);
    setResendSuccess(false);
    
    // Simulate resend API
    setTimeout(() => {
      setResending(false);
      setResendSuccess(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center gap-2 items-center cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center text-white">
            <Box className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">WPCube</h2>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-brand-100 mb-6">
            <Mail className="h-8 w-8 text-brand-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
          
          <p className="text-gray-600 mb-6">
            We've sent a password reset link to <span className="font-medium text-gray-900">{email}</span>. Please check your inbox and spam folder.
          </p>

          <div className="space-y-4">
            <a 
              href="mailto:" 
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors"
            >
              Open Email App
            </a>

            <div className="flex flex-col items-center gap-2 text-sm">
              <div className="flex items-center gap-1 text-gray-600">
                Didn't receive the email?
                <button 
                  onClick={handleResend} 
                  disabled={resending}
                  className="font-medium text-brand-600 hover:text-brand-500 flex items-center gap-1 disabled:opacity-50"
                >
                  {resending ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" /> Resending...
                    </>
                  ) : (
                    <>
                      Click to resend <RefreshCw className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
              {resendSuccess && (
                <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded">
                  Email resent successfully!
                </span>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <Link to="/login" className="font-medium text-gray-500 hover:text-gray-900 flex items-center justify-center gap-2 text-sm">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};