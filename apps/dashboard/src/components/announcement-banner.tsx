'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Info, Wrench, X } from 'lucide-react';

interface Announcement {
    id: string;
    title: string;
    message: string;
    type: string;
}

export function AnnouncementBanner() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const res = await fetch('/api/v1/announcements');
                if (res.ok) {
                    const data = await res.json();
                    setAnnouncements(data);
                }
            } catch (error) {
                console.error('Failed to fetch announcements:', error);
            }
        };

        fetchAnnouncements();
        // Refresh every 5 minutes
        const interval = setInterval(fetchAnnouncements, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const dismissAnnouncement = (id: string) => {
        setDismissed(prev => new Set([...prev, id]));
    };

    const visibleAnnouncements = announcements.filter(a => !dismissed.has(a.id));

    if (visibleAnnouncements.length === 0) return null;

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'warning':
                return {
                    bg: 'bg-yellow-500/10 border-yellow-500/30',
                    text: 'text-yellow-700 dark:text-yellow-400',
                    icon: AlertTriangle,
                };
            case 'maintenance':
                return {
                    bg: 'bg-orange-500/10 border-orange-500/30',
                    text: 'text-orange-700 dark:text-orange-400',
                    icon: Wrench,
                };
            default:
                return {
                    bg: 'bg-blue-500/10 border-blue-500/30',
                    text: 'text-blue-700 dark:text-blue-400',
                    icon: Info,
                };
        }
    };

    return (
        <div className="space-y-2">
            {visibleAnnouncements.map((announcement) => {
                const styles = getTypeStyles(announcement.type);
                const Icon = styles.icon;

                return (
                    <div
                        key={announcement.id}
                        className={`relative px-4 py-3 rounded-lg border ${styles.bg} ${styles.text}`}
                    >
                        <div className="flex items-start gap-3">
                            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium">{announcement.title}</p>
                                <p className="text-sm opacity-90">{announcement.message}</p>
                            </div>
                            <button
                                onClick={() => dismissAnnouncement(announcement.id)}
                                className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
