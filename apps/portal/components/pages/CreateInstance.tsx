import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockApi } from '../../services/mockApi';
import { Box, Check, Loader2, ArrowLeft } from 'lucide-react';

export const CreateInstance: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    adminUser: 'admin',
    adminPass: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Auto-generate subdomain from name if subdomain is empty or matching prev name
    if (name === 'name' && (!formData.subdomain || formData.subdomain === formData.name.toLowerCase().replace(/\s+/g, '-'))) {
      setFormData(prev => ({
        ...prev,
        name: value,
        subdomain: value.toLowerCase().replace(/\s+/g, '-')
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    try {
      await mockApi.createInstance({ name: formData.name, subdomain: formData.subdomain });
      navigate('/dashboard');
    } catch (error) {
      console.error("Failed to create", error);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button 
        onClick={() => navigate('/dashboard')}
        className="mb-6 flex items-center text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </button>

      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Provision New Instance</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Configure your new WordPress container environment.
          </p>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Site Identity */}
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Box className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Plan: Standard Droplet</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Includes 1 vCPU, 2GB RAM, 10GB SSD Storage. Auto-scaling enabled.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Site Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-brand-500 focus:border-brand-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                    placeholder="My Awesome Blog"
                  />
                </div>
              </div>

              <div className="sm:col-span-4">
                <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700">
                  Subdomain
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    name="subdomain"
                    id="subdomain"
                    required
                    value={formData.subdomain}
                    onChange={handleChange}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md focus:ring-brand-500 focus:border-brand-500 sm:text-sm border-gray-300 border"
                  />
                  <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    .wpcube.local
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">Only lowercase letters, numbers, and hyphens.</p>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="adminUser" className="block text-sm font-medium text-gray-700">
                  WP Admin Username
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="adminUser"
                    id="adminUser"
                    required
                    value={formData.adminUser}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-brand-500 focus:border-brand-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="adminPass" className="block text-sm font-medium text-gray-700">
                  WP Admin Password
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    name="adminPass"
                    id="adminPass"
                    required
                    value={formData.adminPass}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-brand-500 focus:border-brand-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                  />
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-gray-200">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Provisioning Container...
                    </>
                  ) : (
                    <>
                      <Check className="-ml-1 mr-2 h-4 w-4" />
                      Create Instance
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};