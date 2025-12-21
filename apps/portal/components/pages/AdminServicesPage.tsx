import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Server,
    Loader2,
    RefreshCw,
    Database,
    Globe,
    Box,
    CheckCircle,
    XCircle,
    Monitor,
    ChevronRight,
    Search,
} from "lucide-react";
import { adminService, DockerService, DockerNode } from "../../src/lib/admin";

type ServiceType = "wordpress" | "mysql" | "traefik" | "other";
type FilterType = "all" | ServiceType;

const getServiceType = (service: DockerService): ServiceType => {
    const name = service.name.toLowerCase();
    if (name.startsWith("wp_")) return "wordpress";
    if (name.includes("mysql")) return "mysql";
    if (name.includes("traefik")) return "traefik";
    return "other";
};

const ServiceIcon = ({ type, className = "w-5 h-5" }: { type: ServiceType; className?: string }) => {
    const icons = {
        wordpress: <Globe className={`${className} text-blue-500`} />,
        mysql: <Database className={`${className} text-orange-500`} />,
        traefik: <Server className={`${className} text-purple-500`} />,
        other: <Box className={`${className} text-slate-500`} />,
    };
    return icons[type];
};

export const AdminServicesPage: React.FC = () => {
    const navigate = useNavigate();
    const [services, setServices] = useState<DockerService[]>([]);
    const [nodes, setNodes] = useState<DockerNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>("all");
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await adminService.getAllServices();
            setServices(data.services);
            setNodes(data.nodes);
        } catch (err) {
            console.error("Failed to fetch services:", err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = services.filter(s => {
        const type = getServiceType(s);
        const matchesFilter = filter === "all" || type === filter;
        const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const counts = {
        all: services.length,
        wordpress: services.filter(s => getServiceType(s) === "wordpress").length,
        mysql: services.filter(s => getServiceType(s) === "mysql").length,
        traefik: services.filter(s => getServiceType(s) === "traefik").length,
        other: services.filter(s => getServiceType(s) === "other").length,
    };

    const healthyNodes = nodes.filter(n => n.status === "ready").length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Container Management</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        {services.length} services • {nodes.length} nodes ({healthyNodes} healthy)
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Cluster Health */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 mb-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                    <Monitor className="w-5 h-5 text-indigo-400" />
                    <h2 className="font-medium">Cluster Nodes</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {nodes.map(node => (
                        <div key={node.id} className="bg-white/5 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                                {node.status === "ready"
                                    ? <CheckCircle className="w-4 h-4 text-green-400" />
                                    : <XCircle className="w-4 h-4 text-red-400" />
                                }
                                <span className="text-sm font-medium truncate">{node.hostname}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${node.role === "manager" ? "bg-purple-500/30 text-purple-300" : "bg-slate-500/30 text-slate-400"
                                    }`}>
                                    {node.role}
                                </span>
                                <span className="text-xs text-slate-400">{node.address}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex bg-slate-100 rounded-lg p-1">
                    {(["all", "wordpress", "mysql", "traefik", "other"] as FilterType[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f
                                    ? "bg-white text-slate-900 shadow"
                                    : "text-slate-500 hover:text-slate-700"
                                }`}>
                            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                            <span className="ml-1.5 text-slate-400">({counts[f]})</span>
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search services..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Services List */}
            <div className="space-y-2">
                {filtered.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                        <Box className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No services found</p>
                    </div>
                ) : (
                    filtered.map(service => {
                        const type = getServiceType(service);
                        const running = service.tasks.filter(t => t.state === "running").length;
                        const hasErrors = service.tasks.some(t => t.error || t.state === "failed");
                        const healthy = running === service.replicas && running > 0;

                        return (
                            <div
                                key={service.id}
                                onClick={() => navigate(`/admin/services/${service.id}`)}
                                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 cursor-pointer transition-all group">

                                {/* Icon */}
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${type === "wordpress" ? "bg-blue-50" :
                                        type === "mysql" ? "bg-orange-50" :
                                            type === "traefik" ? "bg-purple-50" : "bg-slate-50"
                                    }`}>
                                    <ServiceIcon type={type} />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                                        {service.name}
                                    </p>
                                    <p className="text-xs text-slate-400 font-mono truncate">
                                        {service.image.split("@")[0].split(":")[0]}
                                    </p>
                                </div>

                                {/* Status */}
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-slate-900">
                                            {running}/{service.replicas}
                                        </p>
                                        <p className="text-xs text-slate-400">replicas</p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${hasErrors ? "bg-red-100 text-red-700" :
                                            healthy ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                        }`}>
                                        {hasErrors ? "Error" : healthy ? "Healthy" : "Degraded"}
                                    </span>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
