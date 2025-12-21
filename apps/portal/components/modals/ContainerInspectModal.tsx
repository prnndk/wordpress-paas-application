import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    X,
    Loader2,
    Server,
    HardDrive,
    Cpu,
    Network,
    Activity,
    ChevronDown,
    ChevronRight,
    RefreshCw,
} from "lucide-react";
import { dashboardService } from "../../src/lib/dashboard";

interface ContainerInspectData {
    id: string;
    name: string;
    image: string;
    replicas: number;
    runningReplicas: number;
    createdAt: string;
    updatedAt: string;
    env: { key: string; value: string; masked?: boolean }[];
    mounts: { source: string; target: string; type: string }[];
    networks: string[];
    labels: Record<string, string>;
    resources: {
        cpuLimit?: number;
        memoryLimit?: number;
        cpuReservation?: number;
        memoryReservation?: number;
    };
    tasks: {
        id: string;
        nodeId: string;
        state: string;
        desiredState: string;
        error?: string;
        containerStatus?: {
            containerId?: string;
            pid?: number;
            exitCode?: number;
        };
    }[];
}

interface ContainerInspectModalProps {
    isOpen: boolean;
    onClose: () => void;
    instanceId: string;
    instanceName: string;
}

export const ContainerInspectModal: React.FC<ContainerInspectModalProps> = ({
    isOpen,
    onClose,
    instanceId,
    instanceName,
}) => {
    const [data, setData] = useState<ContainerInspectData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        env: true,
        mounts: true,
        resources: true,
        networks: true,
        tasks: true,
    });

    const fetchInspect = async () => {
        if (!instanceId) return;
        setLoading(true);
        setError(null);
        try {
            const result = await dashboardService.getContainerInspect(instanceId);
            setData(result);
        } catch (err: any) {
            setError(err.message || "Failed to fetch container details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && instanceId) {
            fetchInspect();
        }
    }, [isOpen, instanceId]);

    const toggleSection = (section: string) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const formatBytes = (bytes?: number) => {
        if (!bytes) return "N/A";
        const mb = bytes / (1024 * 1024);
        if (mb >= 1024) {
            return `${(mb / 1024).toFixed(2)} GB`;
        }
        return `${mb.toFixed(0)} MB`;
    };

    const formatNanoCPU = (nanoCpu?: number) => {
        if (!nanoCpu) return "N/A";
        return `${(nanoCpu / 1e9).toFixed(2)} cores`;
    };

    if (!isOpen) return null;

    return createPortal(
        <div className='fixed inset-0 flex items-center justify-center z-[9999]'>
            <div
                className='absolute inset-0 bg-black/50 backdrop-blur-sm'
                onClick={onClose}></div>
            <div className='relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden animate-in zoom-in-95 fade-in duration-200'>
                {/* Header */}
                <div className='flex items-center justify-between px-6 py-4 border-b border-slate-100'>
                    <div>
                        <h2 className='text-xl font-bold text-slate-900'>
                            Container Details
                        </h2>
                        <p className='text-sm text-slate-500'>{instanceName}</p>
                    </div>
                    <div className='flex items-center gap-2'>
                        <button
                            onClick={fetchInspect}
                            disabled={loading}
                            className='p-2 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-50 transition-colors'>
                            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                        </button>
                        <button
                            onClick={onClose}
                            className='p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors'>
                            <X className='w-5 h-5' />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className='p-6 overflow-y-auto max-h-[calc(90vh-80px)]'>
                    {loading && !data && (
                        <div className='flex items-center justify-center py-12'>
                            <Loader2 className='w-8 h-8 animate-spin text-indigo-600' />
                        </div>
                    )}

                    {error && (
                        <div className='bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm'>
                            {error}
                        </div>
                    )}

                    {data && (
                        <div className='space-y-4'>
                            {/* Environment Variables */}
                            <div className='bg-slate-50 rounded-xl border border-slate-200 overflow-hidden'>
                                <button
                                    onClick={() => toggleSection("env")}
                                    className='w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-100 transition-colors'>
                                    <div className='flex items-center gap-2'>
                                        <Server className='w-5 h-5 text-slate-500' />
                                        <span className='font-semibold text-slate-900'>
                                            Environment Variables
                                        </span>
                                        <span className='text-xs text-slate-400'>
                                            ({data.env.length})
                                        </span>
                                    </div>
                                    {expandedSections.env ? (
                                        <ChevronDown className='w-5 h-5 text-slate-400' />
                                    ) : (
                                        <ChevronRight className='w-5 h-5 text-slate-400' />
                                    )}
                                </button>
                                {expandedSections.env && (
                                    <div className='px-4 pb-4'>
                                        <div className='bg-slate-900 rounded-lg p-4 max-h-64 overflow-y-auto'>
                                            <table className='w-full text-xs font-mono'>
                                                <thead>
                                                    <tr className='text-slate-400 border-b border-slate-700'>
                                                        <th className='text-left py-2 px-2'>Key</th>
                                                        <th className='text-left py-2 px-2'>Value</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.env.map((env, idx) => (
                                                        <tr
                                                            key={idx}
                                                            className='border-b border-slate-800'>
                                                            <td className='py-2 px-2 text-cyan-400'>
                                                                {env.key}
                                                            </td>
                                                            <td
                                                                className={`py-2 px-2 ${env.masked
                                                                        ? "text-yellow-500 italic"
                                                                        : "text-green-400"
                                                                    }`}>
                                                                {env.value}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Volume Mounts */}
                            <div className='bg-slate-50 rounded-xl border border-slate-200 overflow-hidden'>
                                <button
                                    onClick={() => toggleSection("mounts")}
                                    className='w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-100 transition-colors'>
                                    <div className='flex items-center gap-2'>
                                        <HardDrive className='w-5 h-5 text-slate-500' />
                                        <span className='font-semibold text-slate-900'>
                                            Volume Mounts
                                        </span>
                                        <span className='text-xs text-slate-400'>
                                            ({data.mounts.length})
                                        </span>
                                    </div>
                                    {expandedSections.mounts ? (
                                        <ChevronDown className='w-5 h-5 text-slate-400' />
                                    ) : (
                                        <ChevronRight className='w-5 h-5 text-slate-400' />
                                    )}
                                </button>
                                {expandedSections.mounts && (
                                    <div className='px-4 pb-4 space-y-2'>
                                        {data.mounts.map((mount, idx) => (
                                            <div
                                                key={idx}
                                                className='bg-white rounded-lg p-3 border border-slate-200'>
                                                <span className='px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-600 font-medium'>
                                                    {mount.type}
                                                </span>
                                                <div className='mt-2 grid grid-cols-2 gap-2 text-xs font-mono'>
                                                    <div>
                                                        <span className='text-slate-400'>Source: </span>
                                                        <span className='text-slate-700'>
                                                            {mount.source || "N/A"}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className='text-slate-400'>Target: </span>
                                                        <span className='text-slate-700'>{mount.target}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Resource Limits */}
                            <div className='bg-slate-50 rounded-xl border border-slate-200 overflow-hidden'>
                                <button
                                    onClick={() => toggleSection("resources")}
                                    className='w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-100 transition-colors'>
                                    <div className='flex items-center gap-2'>
                                        <Cpu className='w-5 h-5 text-slate-500' />
                                        <span className='font-semibold text-slate-900'>
                                            Resource Limits
                                        </span>
                                    </div>
                                    {expandedSections.resources ? (
                                        <ChevronDown className='w-5 h-5 text-slate-400' />
                                    ) : (
                                        <ChevronRight className='w-5 h-5 text-slate-400' />
                                    )}
                                </button>
                                {expandedSections.resources && (
                                    <div className='px-4 pb-4'>
                                        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                                            <div className='bg-white rounded-lg p-3 border border-slate-200'>
                                                <div className='text-xs text-slate-400 mb-1'>CPU Limit</div>
                                                <div className='font-semibold text-slate-900'>
                                                    {formatNanoCPU(data.resources.cpuLimit)}
                                                </div>
                                            </div>
                                            <div className='bg-white rounded-lg p-3 border border-slate-200'>
                                                <div className='text-xs text-slate-400 mb-1'>CPU Reserved</div>
                                                <div className='font-semibold text-slate-900'>
                                                    {formatNanoCPU(data.resources.cpuReservation)}
                                                </div>
                                            </div>
                                            <div className='bg-white rounded-lg p-3 border border-slate-200'>
                                                <div className='text-xs text-slate-400 mb-1'>Memory Limit</div>
                                                <div className='font-semibold text-slate-900'>
                                                    {formatBytes(data.resources.memoryLimit)}
                                                </div>
                                            </div>
                                            <div className='bg-white rounded-lg p-3 border border-slate-200'>
                                                <div className='text-xs text-slate-400 mb-1'>Memory Reserved</div>
                                                <div className='font-semibold text-slate-900'>
                                                    {formatBytes(data.resources.memoryReservation)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Networks */}
                            <div className='bg-slate-50 rounded-xl border border-slate-200 overflow-hidden'>
                                <button
                                    onClick={() => toggleSection("networks")}
                                    className='w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-100 transition-colors'>
                                    <div className='flex items-center gap-2'>
                                        <Network className='w-5 h-5 text-slate-500' />
                                        <span className='font-semibold text-slate-900'>Networks</span>
                                        <span className='text-xs text-slate-400'>
                                            ({data.networks.length})
                                        </span>
                                    </div>
                                    {expandedSections.networks ? (
                                        <ChevronDown className='w-5 h-5 text-slate-400' />
                                    ) : (
                                        <ChevronRight className='w-5 h-5 text-slate-400' />
                                    )}
                                </button>
                                {expandedSections.networks && (
                                    <div className='px-4 pb-4 flex flex-wrap gap-2'>
                                        {data.networks.map((network, idx) => (
                                            <span
                                                key={idx}
                                                className='px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-600 font-mono'>
                                                {network}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Tasks */}
                            <div className='bg-slate-50 rounded-xl border border-slate-200 overflow-hidden'>
                                <button
                                    onClick={() => toggleSection("tasks")}
                                    className='w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-100 transition-colors'>
                                    <div className='flex items-center gap-2'>
                                        <Activity className='w-5 h-5 text-slate-500' />
                                        <span className='font-semibold text-slate-900'>Tasks</span>
                                        <span className='text-xs text-slate-400'>
                                            ({data.tasks.length})
                                        </span>
                                    </div>
                                    {expandedSections.tasks ? (
                                        <ChevronDown className='w-5 h-5 text-slate-400' />
                                    ) : (
                                        <ChevronRight className='w-5 h-5 text-slate-400' />
                                    )}
                                </button>
                                {expandedSections.tasks && (
                                    <div className='px-4 pb-4 space-y-2'>
                                        {data.tasks.map((task, idx) => (
                                            <div
                                                key={idx}
                                                className='bg-white rounded-lg p-3 border border-slate-200'>
                                                <div className='flex items-center justify-between mb-2'>
                                                    <span className='font-mono text-xs text-slate-500'>
                                                        {task.id.substring(0, 12)}...
                                                    </span>
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${task.state === "running"
                                                                ? "bg-green-100 text-green-600"
                                                                : task.state === "failed"
                                                                    ? "bg-red-100 text-red-600"
                                                                    : "bg-yellow-100 text-yellow-600"
                                                            }`}>
                                                        {task.state}
                                                    </span>
                                                </div>
                                                <div className='text-xs space-y-1'>
                                                    <div>
                                                        <span className='text-slate-400'>Node: </span>
                                                        <span className='font-mono text-slate-700'>
                                                            {task.nodeId.substring(0, 12)}...
                                                        </span>
                                                    </div>
                                                    {task.containerStatus?.containerId && (
                                                        <div>
                                                            <span className='text-slate-400'>Container: </span>
                                                            <span className='font-mono text-slate-700'>
                                                                {task.containerStatus.containerId.substring(0, 12)}...
                                                            </span>
                                                        </div>
                                                    )}
                                                    {task.error && (
                                                        <div className='text-red-500'>
                                                            <span className='text-slate-400'>Error: </span>
                                                            {task.error}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Image Info */}
                            <div className='bg-slate-100 rounded-lg p-4 text-sm'>
                                <div className='flex items-center justify-between'>
                                    <span className='text-slate-500'>Image:</span>
                                    <span className='font-mono text-xs text-slate-700 truncate max-w-[400px]'>
                                        {data.image}
                                    </span>
                                </div>
                                <div className='flex items-center justify-between mt-2'>
                                    <span className='text-slate-500'>Service ID:</span>
                                    <span className='font-mono text-xs text-slate-700'>
                                        {data.id}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
