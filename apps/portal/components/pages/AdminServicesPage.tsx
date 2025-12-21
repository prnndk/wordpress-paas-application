import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Server,
    Loader2,
    RefreshCw,
    Cpu,
    Database,
    Globe,
    Box,
    CheckCircle,
    XCircle,
    AlertCircle,
    ChevronDown,
    ChevronRight,
    Monitor,
} from "lucide-react";
import { adminService, DockerService, DockerNode } from "../../src/lib/admin";

type ServiceType = "wordpress" | "mysql" | "traefik" | "other";

const getServiceType = (service: DockerService): ServiceType => {
    const name = service.name.toLowerCase();
    const image = service.image.toLowerCase();

    if (name.startsWith("wp_") || service.labels["wp-paas.type"] === "wordpress") {
        return "wordpress";
    }
    if (name.includes("mysql") || image.includes("mysql")) {
        return "mysql";
    }
    if (name.includes("traefik") || image.includes("traefik")) {
        return "traefik";
    }
    return "other";
};

const getServiceIcon = (type: ServiceType) => {
    switch (type) {
        case "wordpress":
            return <Globe className="w-5 h-5 text-blue-500" />;
        case "mysql":
            return <Database className="w-5 h-5 text-orange-500" />;
        case "traefik":
            return <Server className="w-5 h-5 text-purple-500" />;
        default:
            return <Box className="w-5 h-5 text-slate-500" />;
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case "running":
            return "bg-green-100 text-green-700";
        case "pending":
        case "preparing":
            return "bg-yellow-100 text-yellow-700";
        case "failed":
        case "rejected":
        case "shutdown":
            return "bg-red-100 text-red-700";
        default:
            return "bg-slate-100 text-slate-600";
    }
};

const getNodeStatusIcon = (status: string) => {
    switch (status) {
        case "ready":
            return <CheckCircle className="w-4 h-4 text-green-500" />;
        case "down":
            return <XCircle className="w-4 h-4 text-red-500" />;
        default:
            return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
};

export const AdminServicesPage: React.FC = () => {
    const navigate = useNavigate();
    const [services, setServices] = useState<DockerService[]>([]);
    const [nodes, setNodes] = useState<DockerNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState<ServiceType | "all">("all");

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await adminService.getAllServices();
            setServices(data.services);
            setNodes(data.nodes);
        } catch (err: any) {
            setError(err.message || "Failed to fetch services");
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (serviceId: string) => {
        const newExpanded = new Set(expandedServices);
        if (newExpanded.has(serviceId)) {
            newExpanded.delete(serviceId);
        } else {
            newExpanded.add(serviceId);
        }
        setExpandedServices(newExpanded);
    };

    const filteredServices = services.filter(svc => {
        if (filter === "all") return true;
        return getServiceType(svc) === filter;
    });

    const serviceCounts = {
        all: services.length,
        wordpress: services.filter(s => getServiceType(s) === "wordpress").length,
        mysql: services.filter(s => getServiceType(s) === "mysql").length,
        traefik: services.filter(s => getServiceType(s) === "traefik").length,
        other: services.filter(s => getServiceType(s) === "other").length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <p className="text-red-500">{error}</p>
                <button
                    onClick={fetchServices}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Container Management</h1>
                    <p className="text-slate-500 mt-1">
                        {services.length} services across {nodes.length} nodes
                    </p>
                </div>
                <button
                    onClick={fetchServices}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Nodes Overview */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-indigo-500" />
                    Cluster Nodes
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {nodes.map(node => (
                        <div
                            key={node.id}
                            className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-3">
                                {getNodeStatusIcon(node.status)}
                                <div>
                                    <p className="font-medium text-slate-900">{node.hostname}</p>
                                    <p className="text-sm text-slate-500">{node.address}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span
                                    className={`inline-block px-2 py-1 text-xs rounded-full ${node.role === "manager"
                                            ? "bg-purple-100 text-purple-700"
                                            : "bg-slate-100 text-slate-600"
                                        }`}>
                                    {node.role}
                                </span>
                                <p className="text-xs text-slate-400 mt-1">{node.availability}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
                {(["all", "wordpress", "mysql", "traefik", "other"] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}>
                        {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                            {serviceCounts[f]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Services List */}
            <div className="space-y-3">
                {filteredServices.map(service => {
                    const type = getServiceType(service);
                    const isExpanded = expandedServices.has(service.id);
                    const runningTasks = service.tasks.filter(t => t.state === "running");
                    const failedTasks = service.tasks.filter(t => t.state === "failed" || t.error);

                    return (
                        <div
                            key={service.id}
                            className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            {/* Service Header */}
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                                onClick={() => toggleExpand(service.id)}>
                                <div className="flex items-center gap-4">
                                    {isExpanded ? (
                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                    )}
                                    {getServiceIcon(type)}
                                    <div>
                                        <p className="font-medium text-slate-900">{service.name}</p>
                                        <p className="text-sm text-slate-500 truncate max-w-md">
                                            {service.image.split("@")[0]}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {/* Replicas */}
                                    <div className="text-right">
                                        <p className="text-sm text-slate-500">Replicas</p>
                                        <p className={`font-medium ${runningTasks.length === service.replicas
                                                ? "text-green-600"
                                                : "text-orange-600"
                                            }`}>
                                            {runningTasks.length} / {service.replicas}
                                        </p>
                                    </div>
                                    {/* Status Badge */}
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-medium ${failedTasks.length > 0
                                                ? "bg-red-100 text-red-700"
                                                : runningTasks.length === service.replicas
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-yellow-100 text-yellow-700"
                                            }`}>
                                        {failedTasks.length > 0
                                            ? "Error"
                                            : runningTasks.length === service.replicas
                                                ? "Healthy"
                                                : "Degraded"}
                                    </span>
                                </div>
                            </div>

                            {/* Tasks Detail */}
                            {isExpanded && (
                                <div className="border-t border-slate-100 p-4 bg-slate-50">
                                    <h4 className="text-sm font-medium text-slate-700 mb-3">
                                        Tasks ({service.tasks.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {service.tasks.map(task => (
                                            <div
                                                key={task.id}
                                                className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={`w-2 h-2 rounded-full ${task.state === "running"
                                                                ? "bg-green-500"
                                                                : task.state === "pending" || task.state === "preparing"
                                                                    ? "bg-yellow-500"
                                                                    : "bg-red-500"
                                                            }`}
                                                    />
                                                    <div>
                                                        <p className="text-sm font-mono text-slate-600">
                                                            {task.id.substring(0, 12)}
                                                        </p>
                                                        {task.error && (
                                                            <p className="text-xs text-red-500 mt-1">{task.error}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-sm text-slate-500">Node</p>
                                                        <p className="text-sm font-medium text-slate-900">
                                                            {task.nodeName}
                                                        </p>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.state)}`}>
                                                        {task.state}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Labels */}
                                    {Object.keys(service.labels).length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="text-sm font-medium text-slate-700 mb-2">Labels</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(service.labels).slice(0, 10).map(([key, value]) => (
                                                    <span
                                                        key={key}
                                                        className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded font-mono">
                                                        {key}={value.length > 30 ? value.substring(0, 30) + "..." : value}
                                                    </span>
                                                ))}
                                                {Object.keys(service.labels).length > 10 && (
                                                    <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded">
                                                        +{Object.keys(service.labels).length - 10} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {filteredServices.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    No services found for the selected filter.
                </div>
            )}
        </div>
    );
};
