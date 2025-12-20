import React from 'react';
import { User, Mail, Lock, Shield, Save } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Profile</h1>
        <p className="text-slate-500 mt-1">Manage your personal information and security settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6 text-center">
            <div className="mx-auto h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-3xl border-4 border-white shadow-sm">
              JD
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">John Doe</h2>
            <p className="text-sm text-slate-500">Senior Developer</p>
            <div className="mt-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Verified Account
              </span>
            </div>
          </div>
        </div>

        {/* Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Info */}
          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <User className="w-5 h-5 text-slate-400" />
              <h3 className="text-md font-bold text-slate-900">Personal Information</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">First Name</label>
                  <input type="text" defaultValue="John" className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Last Name</label>
                  <input type="text" defaultValue="Doe" className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Email Address</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input type="email" defaultValue="john@wpcube.io" className="block w-full rounded-md border border-slate-300 pl-10 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </button>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <Shield className="w-5 h-5 text-slate-400" />
              <h3 className="text-md font-bold text-slate-900">Security</h3>
            </div>
            <div className="p-6 space-y-6">
              
              {/* Password */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" /> Change Password
                </h4>
                <div className="grid grid-cols-1 gap-4">
                   <input type="password" placeholder="Current Password" className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                   <input type="password" placeholder="New Password" className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                   <input type="password" placeholder="Confirm New Password" className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Update Password</button>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">Two-Factor Authentication</h4>
                    <p className="text-sm text-slate-500 mt-1">Add an extra layer of security to your account.</p>
                  </div>
                  <div className="flex items-center">
                    {/* Toggle Switch */}
                    <button className="bg-slate-200 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      <span className="translate-x-0 pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"></span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};