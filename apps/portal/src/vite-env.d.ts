/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_ORCHESTRATOR_URL: string;
	readonly VITE_SERVER_IP?: string;
	readonly GEMINI_API_KEY?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
