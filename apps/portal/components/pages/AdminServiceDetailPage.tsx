import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Server,
    Loader2,
    RefreshCw,
    Cpu,
    HardDrive,
    Network,
    Key,
    Activity,
    CheckCircle,
    XCircle,
    Globe,
    Database,
    Box,
    Copy,
    Check,
    FileText,
    Monitor,
    MoreVertical,
    Play,
    Square,
    X,
    Eye,
    Search,
} from "lucide-react";
import { adminService, DockerService, DockerNode } from "../../src/lib/admin";

const formatBytes = (bytes?: number) => {
    if (!bytes) return "-";
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb.toFixed(0)} MB`;
};

const formatCPU = (nanoCpu?: number) => {
    if (!nanoCpu) return "-";
    return `${(nanoCpu / 1e9).toFixed(1)}`;
};

const getServiceType = (service: DockerService) => {
    const name = service.name.toLowerCase();
    if (name.startsWith("wp_")) return "wordpress";
    if (name.includes("mysql")) return "mysql";
    if (name.includes("traefik")) return "traefik";
    return "other";
};

const ServiceIcon = ({ type }: { type: string }) => {
    const icons: Record<string, React.ReactNode> = {
        wordpress: <Globe className="w-5 h-5" />,
        mysql: <Database className="w-5 h-5" />,
        traefik: <Server className="w-5 h-5" />,
        other: <Box className="w-5 h-5" />,
    };
    return <>{icons[type] || icons.other}</>;
};

export const AdminServiceDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [service, setService] = useState<DockerService | null>(null);
    const [nodes, setNodes] = useState<DockerNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<"overview" | "logs">("overview");
    const [logs, setLogs] = useState<string[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [showEnvModal, setShowEnvModal] = useState(false);
    const [envSearch, setEnvSearch] = useState("");

    useEffect(() => {
        if (id) fetchService();
    }, [id]);

    const fetchService = async () => {
        setLoading(true);
        try {
            const data = await adminService.getAllServices();
            const found = data.services.find(s => s.id === id || s.name === id);
            if (found) {
                setService(found);
                setNodes(data.nodes);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        if (!service) return;
        setLogsLoading(true);
        try {
            console.log(`Fetching logs for service: ${service.name}`);
            const data = await adminService.getServiceLogs(service.name, 200);
            console.log(`Received ${data.logs?.length || 0} log lines`);
            setLogs(data.logs || []);
        } catch (err: any) {
            console.error("Failed to load logs:", err);
            setLogs([`[Error] Failed to load logs: ${err.message || 'Unknown error'}`, `Service: ${service.name}`]);
        } finally {
            setLogsLoading(false);
        }
    };

    useEffect(() => {
        if (activeSection === "logs" && service && logs.length === 0) {
            fetchLogs();
        }
    }, [activeSection, service]);

    const copy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 1500);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!service) {
        return (
            <div className="max-w-4xl mx-auto p-8">
                <button onClick={() => navigate("/admin/services")} className="text-slate-500 hover:text-indigo-600 flex items-center gap-2 mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="bg-red-50 text-red-600 p-6 rounded-xl text-center">Service not found</div>
            </div>
        );
    }

    const type = getServiceType(service);
    const running = service.tasks.filter(t => t.state === "running").length;
    const healthy = running === service.replicas && running > 0;

    // Group tasks by node
    const nodeTaskMap = service.tasks.reduce((acc, task) => {
        if (!acc[task.nodeId]) acc[task.nodeId] = [];
        acc[task.nodeId].push(task);
        return acc;
    }, {} as Record<string, typeof service.tasks>);

    return (
        <div className="max-w-5xl mx-auto pb-12">
            {/* Back Button */}
            <button
                onClick={() => navigate("/admin/services")}
                className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6 text-sm font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" />
                All Services
            </button>

            {/* Header Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 mb-6 text-white">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${type === "wordpress" ? "bg-blue-500" :
                            type === "mysql" ? "bg-orange-500" :
                                type === "traefik" ? "bg-purple-500" : "bg-slate-600"
                            }`}>
                            <ServiceIcon type={type} />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">{service.name}</h1>
                            <p className="text-sm text-slate-400 font-mono">{service.image.split("@")[0].split(":")[0]}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${healthy ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                            }`}>
                            {running}/{service.replicas} Running
                        </span>
                        <button onClick={fetchService} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4 mt-6">
                    <div className="bg-white/5 rounded-xl p-3">
                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                            <Cpu className="w-3.5 h-3.5" /> CPU
                        </div>
                        <p className="text-lg font-semibold">{formatCPU(service.resources?.cpuLimit)} <span className="text-sm text-slate-400">cores</span></p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                            <HardDrive className="w-3.5 h-3.5" /> Memory
                        </div>
                        <p className="text-lg font-semibold">{formatBytes(service.resources?.memoryLimit)}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                            <Network className="w-3.5 h-3.5" /> Networks
                        </div>
                        <p className="text-lg font-semibold">{service.networks?.length || 0}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                            <HardDrive className="w-3.5 h-3.5" /> Mounts
                        </div>
                        <p className="text-lg font-semibold">{service.mounts?.length || 0}</p>
                    </div>
                </div>
            </div>

            {/* Section Toggle */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveSection("overview")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === "overview"
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}>
                    <Activity className="w-4 h-4 inline-block mr-2" />
                    Overview
                </button>
                <button
                    onClick={() => setActiveSection("logs")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === "logs"
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}>
                    <FileText className="w-4 h-4 inline-block mr-2" />
                    Logs
                </button>
            </div>

            {activeSection === "overview" && (
                <div className="space-y-6">
                    {/* Node & Tasks Grid */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="font-medium text-slate-900 flex items-center gap-2">
                                <Monitor className="w-4 h-4 text-indigo-500" />
                                Containers by Node
                            </h2>
                            <span className="text-xs text-slate-400">{service.tasks.length} task(s) across {nodes.length} node(s)</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {nodes.map(node => {
                                const tasks = nodeTaskMap[node.id] || [];
                                return (
                                    <div key={node.id} className="p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${node.status === "ready" ? "bg-green-100" : "bg-red-100"
                                                }`}>
                                                {node.status === "ready"
                                                    ? <CheckCircle className="w-4 h-4 text-green-600" />
                                                    : <XCircle className="w-4 h-4 text-red-600" />
                                                }
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900 text-sm">{node.hostname}</p>
                                                <p className="text-xs text-slate-400">{node.address} • {node.role}</p>
                                            </div>
                                            <span className="text-xs font-medium text-slate-500">
                                                {tasks.filter(t => t.state === "running").length} running
                                            </span>
                                        </div>
                                        {tasks.length > 0 ? (
                                            <div className="grid gap-2 ml-11">
                                                {tasks.map(task => (
                                                    <div key={task.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg text-sm">
                                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${task.state === "running" ? "bg-green-500" :
                                                            task.state === "pending" ? "bg-yellow-500 animate-pulse" : "bg-red-500"
                                                            }`} />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-slate-700 text-xs truncate">
                                                                    {task.containerStatus?.containerId?.substring(0, 12) || task.id.substring(0, 12)}
                                                                </span>
                                                                <button
                                                                    onClick={() => copy(task.containerStatus?.containerId || task.id, task.id)}
                                                                    className="text-slate-400 hover:text-slate-600">
                                                                    {copied === task.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                                                </button>
                                                            </div>
                                                            {task.error && <p className="text-xs text-red-500 mt-0.5 truncate">{task.error}</p>}
                                                        </div>
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${task.state === "running" ? "bg-green-100 text-green-700" :
                                                            task.state === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                                                            }`}>
                                                            {task.state}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 ml-11">No containers on this node</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Environment & Config */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Environment Variables */}
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="font-medium text-slate-900 flex items-center gap-2">
                                    <Key className="w-4 h-4 text-indigo-500" />
                                    Environment ({service.env?.length || 0})
                                </h2>
                                {service.env && service.env.length > 0 && (
                                    <button
                                        onClick={() => setShowEnvModal(true)}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                        <Eye className="w-3.5 h-3.5" />
                                        View All
                                    </button>
                                )}
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {service.env && service.env.length > 0 ? (
                                    <div className="divide-y divide-slate-50">
                                        {service.env.slice(0, 8).map((env, i) => (
                                            <div key={i} className="px-5 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 group">
                                                <span className="font-mono text-slate-600 truncate max-w-[40%]">{env.key}</span>
                                                <div className="flex items-center gap-2 max-w-[55%]">
                                                    <span className={`font-mono truncate ${env.masked ? "text-yellow-600 italic" : "text-slate-900"}`}>
                                                        {env.value}
                                                    </span>
                                                    {!env.masked && (
                                                        <button
                                                            onClick={() => copy(env.value, `env-${i}`)}
                                                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity">
                                                            {copied === `env-${i}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {service.env.length > 8 && (
                                            <button
                                                onClick={() => setShowEnvModal(true)}
                                                className="w-full px-5 py-3 text-xs text-indigo-600 hover:bg-indigo-50 font-medium">
                                                Show {service.env.length - 8} more variables...
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <p className="p-5 text-sm text-slate-400 text-center">No environment variables</p>
                                )}
                            </div>
                        </div>

                        {/* Networks & Mounts */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100">
                                    <h2 className="font-medium text-slate-900 flex items-center gap-2">
                                        <Network className="w-4 h-4 text-indigo-500" />
                                        Networks
                                    </h2>
                                </div>
                                <div className="p-4 flex flex-wrap gap-2">
                                    {service.networks && service.networks.length > 0 ? (
                                        service.networks.map((net, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-mono">
                                                {net}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-slate-400">No networks</span>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100">
                                    <h2 className="font-medium text-slate-900 flex items-center gap-2">
                                        <HardDrive className="w-4 h-4 text-indigo-500" />
                                        Mounts
                                    </h2>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {service.mounts && service.mounts.length > 0 ? (
                                        service.mounts.map((mount, i) => (
                                            <div key={i} className="px-5 py-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium uppercase">
                                                        {mount.type}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-mono text-slate-500 truncate">{mount.source || "N/A"}</p>
                                                <p className="text-xs font-mono text-slate-800 truncate">→ {mount.target}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="p-5 text-sm text-slate-400 text-center">No mounts</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeSection === "logs" && (
                <div className="bg-slate-900 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                        <span className="text-sm text-slate-400">Service Logs</span>
                        <button
                            onClick={fetchLogs}
                            disabled={logsLoading}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-300 disabled:opacity-50 transition-colors">
                            {logsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                            Refresh
                        </button>
                    </div>
                    <div className="p-4 font-mono text-xs text-slate-300 max-h-[500px] overflow-y-auto">
                        {logsLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                            </div>
                        ) : logs.length > 0 ? (
                            <div className="space-y-0.5">
                                {logs.map((line, i) => (
                                    <div key={i} className="flex hover:bg-slate-800/50 px-2 py-0.5 rounded">
                                        <span className="w-10 text-slate-600 flex-shrink-0 select-none text-right mr-4">{i + 1}</span>
                                        <span className="whitespace-pre-wrap break-all">{line}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-slate-500 py-20">No logs available</p>
                        )}
                    </div>
                </div>
            )}

            {/* Environment Variables Modal */}
            {showEnvModal && service?.env && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowEnvModal(false)}>
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Environment Variables</h2>
                                <p className="text-sm text-slate-500">{service.env.length} variables • {service.name}</p>
                            </div>
                            <button
                                onClick={() => setShowEnvModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="px-6 py-3 border-b border-slate-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search variables..."
                                    value={envSearch}
                                    onChange={(e) => setEnvSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Variables List */}
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 bg-slate-50">
                                    <tr>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Key</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Value</th>
                                        <th className="w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {service.env
                                        .filter(env =>
                                            envSearch === "" ||
                                            env.key.toLowerCase().includes(envSearch.toLowerCase()) ||
                                            env.value.toLowerCase().includes(envSearch.toLowerCase())
                                        )
                                        .map((env, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-6 py-3">
                                                    <span className="font-mono text-sm text-slate-700">{env.key}</span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className={`font-mono text-sm break-all ${env.masked ? "text-yellow-600 italic" : "text-slate-900"}`}>
                                                        {env.value}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3">
                                                    {!env.masked && (
                                                        <button
                                                            onClick={() => copy(env.value, `modal-env-${i}`)}
                                                            className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors">
                                                            {copied === `modal-env-${i}` ? (
                                                                <Check className="w-4 h-4 text-green-500" />
                                                            ) : (
                                                                <Copy className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                            {service.env.filter(env =>
                                envSearch === "" ||
                                env.key.toLowerCase().includes(envSearch.toLowerCase()) ||
                                env.value.toLowerCase().includes(envSearch.toLowerCase())
                            ).length === 0 && (
                                    <p className="text-center text-slate-400 py-8">No matching variables found</p>
                                )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
                            <button
                                onClick={() => setShowEnvModal(false)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
