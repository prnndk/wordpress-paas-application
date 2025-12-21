import { api } from "./api";
import { Announcement } from "./admin";

export const announcementService = {
	/**
	 * Get active announcements (public)
	 */
	getActiveAnnouncements: () => api.get<Announcement[]>("/announcements"),
};
