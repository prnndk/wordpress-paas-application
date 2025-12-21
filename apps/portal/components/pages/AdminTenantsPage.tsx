import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Server,
    Loader2,
    ArrowLeft,
    Search,
    Activity,
    ChevronRight,
} from "lucide-react";
import { adminService, AdminTenant } from "../../src/lib/admin";

export const AdminTenantsPage: React.FC = () => {
    const navigate = useNavigate();
    const [tenants, setTenants] = useState<AdminTenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const data = await adminService.getAllTenants();
            setTenants(data);
        } catch (err: any) {
            setError(err.message || "Failed to fetch tenants");
        } finally {
            setLoading(false);
        }
    };

    const filteredTenants = tenants.filter((tenant) =>
        tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className='flex items-center justify-center min-h-[400px]'>
                <Loader2 className='w-6 h-6 animate-spin text-slate-400' />
            </div>
        );
    }

    if (error) {
        return (
            <div className='flex flex-col items-center justify-center min-h-[400px] gap-4'>
                <p className='text-slate-500'>{error}</p>
                <button
                    onClick={() => navigate("/admin")}
                    className='text-indigo-600 hover:underline'>
                    ← Back to admin
                </button>
            </div>
        );
    }

    return (
        <div className='max-w-5xl mx-auto space-y-8 pb-12'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                    <button
                        onClick={() => navigate("/admin")}
                        className='p-2 hover:bg-slate-100 rounded-lg transition-colors'>
                        <ArrowLeft className='w-5 h-5 text-slate-500' />
                    </button>
                    <div>
                        <h1 className='text-2xl font-semibold text-slate-900'>Tenants</h1>
                        <p className='text-slate-500 text-sm'>{tenants.length} instances</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className='relative'>
                <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400' />
                <input
                    type='text'
                    placeholder='Search tenants...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all'
                />
            </div>

            {/* Tenant List */}
            <div className='bg-white rounded-xl border border-slate-200 divide-y divide-slate-100'>
                {filteredTenants.map((tenant) => {
                    const currentReplicas = tenant.docker?.desiredReplicas ?? tenant.replicas ?? 1;
                    const runningReplicas = tenant.docker?.runningReplicas ?? 0;
                    const isHealthy = runningReplicas === currentReplicas;

                    return (
                        <button
                            key={tenant.id}
                            onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                            className='w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left'>
                            <div className='flex items-center gap-4'>
                                <div className='w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center'>
                                    <Server className='w-5 h-5 text-slate-600' />
                                </div>
                                <div>
                                    <h3 className='font-medium text-slate-900'>{tenant.name}</h3>
                                    <p className='text-sm text-slate-500'>/{tenant.subdomain}</p>
                                </div>
                            </div>
                            <div className='flex items-center gap-6'>
                                {/* Replicas */}
                                <div className='flex items-center gap-2'>
                                    <Activity
                                        className={`w-4 h-4 ${isHealthy ? "text-green-500" : "text-amber-500"
                                            }`}
                                    />
                                    <span className='text-sm font-medium text-slate-700'>
                                        {runningReplicas}/{currentReplicas}
                                    </span>
                                </div>
                                {/* Status */}
                                <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${tenant.status === "running"
                                            ? "bg-green-50 text-green-700"
                                            : tenant.status === "creating"
                                                ? "bg-blue-50 text-blue-700"
                                                : "bg-slate-100 text-slate-600"
                                        }`}>
                                    {tenant.status}
                                </span>
                                <ChevronRight className='w-5 h-5 text-slate-300' />
                            </div>
                        </button>
                    );
                })}

                {filteredTenants.length === 0 && (
                    <div className='py-12 text-center'>
                        <p className='text-slate-500'>No tenants found</p>
                    </div>
                )}
            </div>
        </div>
    );
};
