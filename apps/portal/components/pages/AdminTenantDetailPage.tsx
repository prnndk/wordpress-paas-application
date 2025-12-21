import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Server,
    ArrowLeft,
    Loader2,
    Activity,
    Globe,
    User,
    Calendar,
    Database,
    Layers,
    ExternalLink,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
} from "lucide-react";
import { adminService, AdminTenant } from "../../src/lib/admin";

export const AdminTenantDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [tenant, setTenant] = useState<AdminTenant | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [replicas, setReplicas] = useState(1);
    const [scaling, setScaling] = useState(false);
    const [scaleSuccess, setScaleSuccess] = useState(false);

    useEffect(() => {
        fetchTenant();
    }, [id]);

    const fetchTenant = async () => {
        if (!id) return;
        try {
            const data = await adminService.getTenant(id);
            setTenant(data);
            setReplicas(data.docker?.desiredReplicas ?? data.replicas ?? 1);
        } catch (err: any) {
            setError(err.message || "Failed to fetch tenant");
        } finally {
            setLoading(false);
        }
    };

    const handleScale = async () => {
        if (!tenant || scaling) return;
        const currentReplicas = tenant.docker?.desiredReplicas ?? tenant.replicas ?? 1;
        if (replicas === currentReplicas) return;

        setScaling(true);
        try {
            const result = await adminService.scaleTenant(tenant.id, replicas);
            if (result.success) {
                setTenant({
                    ...tenant,
                    replicas: result.replicas,
                    docker: tenant.docker
                        ? { ...tenant.docker, desiredReplicas: result.replicas }
                        : undefined,
                });
                setScaleSuccess(true);
                setTimeout(() => setScaleSuccess(false), 3000);
            }
        } catch (err) {
            console.error("Failed to scale:", err);
        } finally {
            setScaling(false);
        }
    };

    if (loading) {
        return (
            <div className='flex items-center justify-center min-h-[400px]'>
                <Loader2 className='w-6 h-6 animate-spin text-slate-400' />
            </div>
        );
    }

    if (error || !tenant) {
        return (
            <div className='flex flex-col items-center justify-center min-h-[400px] gap-4'>
                <p className='text-slate-500'>{error || "Tenant not found"}</p>
                <button
                    onClick={() => navigate("/admin/tenants")}
                    className='text-indigo-600 hover:underline'>
                    ← Back to tenants
                </button>
            </div>
        );
    }

    const currentReplicas = tenant.docker?.desiredReplicas ?? tenant.replicas ?? 1;
    const runningReplicas = tenant.docker?.runningReplicas ?? 0;

    return (
        <div className='max-w-4xl mx-auto space-y-8 pb-12'>
            {/* Back Button */}
            <button
                onClick={() => navigate("/admin/tenants")}
                className='flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors'>
                <ArrowLeft className='w-4 h-4' />
                <span>Back to tenants</span>
            </button>

            {/* Header */}
            <div className='flex items-start justify-between'>
                <div className='flex items-center gap-4'>
                    <div className='w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center'>
                        <Server className='w-7 h-7 text-white' />
                    </div>
                    <div>
                        <h1 className='text-2xl font-semibold text-slate-900'>{tenant.name}</h1>
                        <p className='text-slate-500'>/{tenant.subdomain}</p>
                    </div>
                </div>
                <span
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${tenant.status === "running"
                            ? "bg-green-50 text-green-700"
                            : tenant.status === "creating"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-slate-100 text-slate-600"
                        }`}>
                    {tenant.status}
                </span>
            </div>

            {/* Stats Grid */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='bg-white rounded-xl p-5 border border-slate-200'>
                    <div className='flex items-center gap-3 mb-3'>
                        <Activity className='w-5 h-5 text-green-500' />
                        <span className='text-sm text-slate-500'>Running</span>
                    </div>
                    <p className='text-2xl font-semibold text-slate-900'>
                        {runningReplicas}/{currentReplicas}
                    </p>
                </div>
                <div className='bg-white rounded-xl p-5 border border-slate-200'>
                    <div className='flex items-center gap-3 mb-3'>
                        <Layers className='w-5 h-5 text-indigo-500' />
                        <span className='text-sm text-slate-500'>Plan</span>
                    </div>
                    <p className='text-2xl font-semibold text-slate-900 capitalize'>
                        {tenant.planId}
                    </p>
                </div>
                <div className='bg-white rounded-xl p-5 border border-slate-200'>
                    <div className='flex items-center gap-3 mb-3'>
                        <User className='w-5 h-5 text-purple-500' />
                        <span className='text-sm text-slate-500'>Owner</span>
                    </div>
                    <p className='text-lg font-semibold text-slate-900 truncate'>
                        {tenant.user?.email || "—"}
                    </p>
                </div>
                <div className='bg-white rounded-xl p-5 border border-slate-200'>
                    <div className='flex items-center gap-3 mb-3'>
                        <Calendar className='w-5 h-5 text-orange-500' />
                        <span className='text-sm text-slate-500'>Created</span>
                    </div>
                    <p className='text-lg font-semibold text-slate-900'>
                        {new Date(tenant.createdAt).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* Scale Section */}
            <div className='bg-white rounded-xl border border-slate-200 overflow-hidden'>
                <div className='px-6 py-4 border-b border-slate-100'>
                    <h2 className='font-medium text-slate-900'>Scale Replicas</h2>
                    <p className='text-sm text-slate-500 mt-1'>
                        Adjust the number of running instances
                    </p>
                </div>
                <div className='p-6 space-y-6'>
                    {/* Slider */}
                    <div>
                        <div className='flex items-center justify-between mb-2'>
                            <span className='text-sm text-slate-500'>Replicas</span>
                            <span className='text-sm font-medium text-slate-900'>{replicas}</span>
                        </div>
                        <input
                            type='range'
                            min='1'
                            max='10'
                            value={replicas}
                            onChange={(e) => setReplicas(parseInt(e.target.value))}
                            className='w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer'
                            disabled={scaling}
                        />
                        <div className='flex justify-between mt-1 text-xs text-slate-400'>
                            <span>1</span>
                            <span>5</span>
                            <span>10</span>
                        </div>
                    </div>

                    {/* Action Row */}
                    <div className='flex items-center justify-between'>
                        <div className='text-sm text-slate-500'>
                            {replicas !== currentReplicas ? (
                                <span>
                                    Change from <strong>{currentReplicas}</strong> to{" "}
                                    <strong className='text-indigo-600'>{replicas}</strong>
                                </span>
                            ) : (
                                <span>No changes</span>
                            )}
                        </div>
                        <button
                            onClick={handleScale}
                            disabled={scaling || replicas === currentReplicas}
                            className='px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2'>
                            {scaling ? (
                                <>
                                    <Loader2 className='w-4 h-4 animate-spin' />
                                    Applying...
                                </>
                            ) : scaleSuccess ? (
                                <>
                                    <CheckCircle className='w-4 h-4' />
                                    Applied!
                                </>
                            ) : (
                                "Apply"
                            )}
                        </button>
                    </div>

                    {/* Warning */}
                    {replicas > 5 && (
                        <div className='flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-4 py-3 rounded-lg'>
                            <AlertTriangle className='w-4 h-4' />
                            High replica count may increase resource usage
                        </div>
                    )}
                </div>
            </div>

            {/* Info Section */}
            <div className='bg-white rounded-xl border border-slate-200'>
                <div className='px-6 py-4 border-b border-slate-100'>
                    <h2 className='font-medium text-slate-900'>Instance Details</h2>
                </div>
                <div className='divide-y divide-slate-100'>
                    <div className='px-6 py-4 flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                            <Globe className='w-5 h-5 text-slate-400' />
                            <span className='text-slate-600'>Subdomain</span>
                        </div>
                        <span className='font-mono text-sm text-slate-900'>/{tenant.subdomain}</span>
                    </div>
                    <div className='px-6 py-4 flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                            <Database className='w-5 h-5 text-slate-400' />
                            <span className='text-slate-600'>Database</span>
                        </div>
                        <span className='font-mono text-sm text-slate-900'>{tenant.dbName}</span>
                    </div>
                    <div className='px-6 py-4 flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                            <User className='w-5 h-5 text-slate-400' />
                            <span className='text-slate-600'>Owner Email</span>
                        </div>
                        <span className='text-sm text-slate-900'>{tenant.user?.email || "—"}</span>
                    </div>
                    <div className='px-6 py-4 flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                            <Server className='w-5 h-5 text-slate-400' />
                            <span className='text-slate-600'>Docker Image</span>
                        </div>
                        <span className='font-mono text-sm text-slate-500 truncate max-w-[300px]'>
                            {tenant.docker?.image || "—"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className='flex items-center gap-3'>
                <button
                    onClick={fetchTenant}
                    className='flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors'>
                    <RefreshCw className='w-4 h-4' />
                    Refresh
                </button>
                <a
                    href={`http://${window.location.hostname}/${tenant.subdomain}/wp-admin/`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors'>
                    <ExternalLink className='w-4 h-4' />
                    Open WP Admin
                </a>
            </div>
        </div>
    );
};
