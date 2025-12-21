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
    RotateCcw,
    Terminal,
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
    const [rebuilding, setRebuilding] = useState(false);
    const [rebuildSuccess, setRebuildSuccess] = useState(false);
    const [rebuildError, setRebuildError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string>("");
    const [logsLoading, setLogsLoading] = useState(false);
    const [showLogs, setShowLogs] = useState(false);

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

    const fetchLogs = async () => {
        if (!id) return;
        setLogsLoading(true);
        try {
            const data = await adminService.getTenantLogs(id, 100);
            setLogs(data.logs);
        } catch (err: any) {
            setLogs("Failed to fetch logs: " + (err.message || "Unknown error"));
        } finally {
            setLogsLoading(false);
        }
    };

    const handleToggleLogs = () => {
        if (!showLogs) {
            fetchLogs();
        }
        setShowLogs(!showLogs);
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

    const handleRebuild = async () => {
        if (!tenant || rebuilding) return;

        setRebuilding(true);
        setRebuildError(null);
        setRebuildSuccess(false);

        try {
            const result = await adminService.rebuildTenant(tenant.id);
            if (result.success) {
                setRebuildSuccess(true);
                setTimeout(() => {
                    fetchTenant();
                    setRebuildSuccess(false);
                }, 3000);
            }
        } catch (err: any) {
            setRebuildError(err.message || "Failed to rebuild container");
            setTimeout(() => setRebuildError(null), 5000);
        } finally {
            setRebuilding(false);
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

            {/* Container Logs Section */}
            <div className='bg-white rounded-xl border border-slate-200 overflow-hidden'>
                <div className='px-6 py-4 border-b border-slate-100 flex items-center justify-between'>
                    <div>
                        <h2 className='font-medium text-slate-900'>Container Logs</h2>
                        <p className='text-sm text-slate-500 mt-1'>
                            View latest logs from the WordPress container
                        </p>
                    </div>
                    <button
                        onClick={handleToggleLogs}
                        className='px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2'>
                        <Terminal className='w-4 h-4' />
                        {showLogs ? "Hide Logs" : "Show Logs"}
                    </button>
                </div>
                {showLogs && (
                    <div className='p-4'>
                        {logsLoading ? (
                            <div className='flex items-center justify-center py-8'>
                                <Loader2 className='w-6 h-6 animate-spin text-slate-400' />
                            </div>
                        ) : (
                            <>
                                <div className='flex justify-end mb-2'>
                                    <button
                                        onClick={fetchLogs}
                                        className='text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1'>
                                        <RefreshCw className='w-3 h-3' />
                                        Refresh
                                    </button>
                                </div>
                                <pre className='bg-slate-900 text-green-400 p-4 rounded-lg text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap'>
                                    {logs || "No logs available"}
                                </pre>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Rebuild Section */}
            <div className='bg-white rounded-xl border border-slate-200 overflow-hidden'>
                <div className='px-6 py-4 border-b border-slate-100'>
                    <h2 className='font-medium text-slate-900'>Rebuild Container</h2>
                    <p className='text-sm text-slate-500 mt-1'>
                        Force recreate containers with the latest Docker image. Data is preserved.
                    </p>
                </div>
                <div className='p-6'>
                    <div className='flex items-center justify-between'>
                        <div className='text-sm text-slate-600'>
                            <p>Current image: <code className='text-xs bg-slate-100 px-2 py-1 rounded'>{tenant.docker?.image || "N/A"}</code></p>
                        </div>
                        <button
                            onClick={handleRebuild}
                            disabled={rebuilding}
                            className='px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2'>
                            {rebuilding ? (
                                <>
                                    <Loader2 className='w-4 h-4 animate-spin' />
                                    Rebuilding...
                                </>
                            ) : rebuildSuccess ? (
                                <>
                                    <CheckCircle className='w-4 h-4' />
                                    Rebuild Started!
                                </>
                            ) : (
                                <>
                                    <RotateCcw className='w-4 h-4' />
                                    Rebuild Container
                                </>
                            )}
                        </button>
                    </div>

                    {rebuildSuccess && (
                        <div className='mt-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-3 rounded-lg'>
                            <CheckCircle className='w-4 h-4' />
                            Container rebuild initiated successfully.
                        </div>
                    )}

                    {rebuildError && (
                        <div className='mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg'>
                            <AlertTriangle className='w-4 h-4' />
                            {rebuildError}
                        </div>
                    )}
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
                    href={`http://10.28.85.212${tenant.urls.admin}/`}
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
