import React, { useState } from 'react';
import { 
  Users, Plus, Trash2, Mail, MoreHorizontal, 
  Shield, Check, X, Loader2, Send 
} from 'lucide-react';

export const TeamTab: React.FC = () => {
  const [members, setMembers] = useState([
    { id: 1, name: 'John Doe', email: 'john@acme.com', role: 'Owner', avatar: 'JD', status: 'Active' },
    { id: 2, name: 'Sarah Smith', email: 'sarah@acme.com', role: 'Admin', avatar: 'SS', status: 'Active' },
    { id: 3, name: 'Mike Jones', email: 'mike@acme.com', role: 'Viewer', avatar: 'MJ', status: 'Pending' },
  ]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Viewer');
  const [isInviting, setIsInviting] = useState(false);
  const [resendingId, setResendingId] = useState<number | null>(null);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setIsInviting(true);
    
    // Simulate API call
    setTimeout(() => {
      setMembers([
        ...members, 
        { 
          id: Date.now(), 
          name: '', 
          email: inviteEmail, 
          role: inviteRole, 
          avatar: inviteEmail.substring(0, 2).toUpperCase(), 
          status: 'Pending' 
        }
      ]);
      setInviteEmail('');
      setIsInviting(false);
    }, 1000);
  };

  const handleRemoveMember = (id: number) => {
    if (window.confirm('Are you sure you want to remove this member? They will lose access immediately.')) {
      setMembers(members.filter(m => m.id !== id));
    }
  };

  const handleRoleChange = (id: number, newRole: string) => {
    setMembers(members.map(m => m.id === id ? { ...m, role: newRole } : m));
  };

  const handleResendInvite = (id: number) => {
    setResendingId(id);
    setTimeout(() => {
        setResendingId(null);
        alert("Invitation resent successfully.");
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-left-2 duration-300">
      
      {/* 1. Header & Invite */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 pb-6 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Team Members</h3>
          <p className="text-sm text-slate-500 mt-1">Manage access to your workspace.</p>
        </div>
        
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="email" 
              placeholder="colleague@company.com"
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          <select 
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            title="Select Role"
          >
            <option value="Admin">Admin</option>
            <option value="Editor">Editor</option>
            <option value="Viewer">Viewer</option>
          </select>
          <button 
            type="submit"
            disabled={!inviteEmail || isInviting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isInviting ? 'Sending...' : 'Invite'}
          </button>
        </form>
      </div>

      {/* 2. Members List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs border border-indigo-200">
                      {member.avatar}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-bold text-slate-900">{member.name || 'Invited User'}</div>
                      <div className="text-xs text-slate-500">{member.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {member.role === 'Owner' ? (
                    <span className="flex items-center gap-1.5 text-sm font-bold text-slate-700 cursor-default" title="Owners have full access">
                      <Shield className="w-4 h-4 text-amber-500" /> Owner
                    </span>
                  ) : (
                    <select 
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      className="text-sm border-slate-200 rounded-md py-1 pl-2 pr-8 bg-slate-50 focus:ring-indigo-500 border cursor-pointer hover:border-slate-300"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Editor">Editor</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    member.status === 'Active' 
                      ? 'bg-green-100 text-green-700 border-green-200' 
                      : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                  }`}>
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end gap-2">
                    {member.status === 'Pending' && (
                        <button 
                            onClick={() => handleResendInvite(member.id)}
                            disabled={resendingId === member.id}
                            className="text-indigo-600 hover:text-indigo-800 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                            title="Resend Invitation"
                        >
                            {resendingId === member.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    )}
                    {member.role !== 'Owner' && (
                        <button 
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                        title="Remove Member"
                        >
                        <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 rounded-lg p-4 text-xs text-slate-500 border border-slate-200">
        <p><strong>Admin:</strong> Can manage billing, team members, and all instances.</p>
        <p><strong>Editor:</strong> Can create and manage instances but cannot access billing or team settings.</p>
        <p><strong>Viewer:</strong> Read-only access to dashboard statistics and settings.</p>
      </div>

    </div>
  );
};