import {defineStore} from 'pinia';
import {api} from '../services/api';

export const useAuth = defineStore('auth', {
    state: () => ({
        user: null as null | { id: string; email: string; name?: string },
        families: [] as Array<{ id: string; name: string; invite_code: string; role: string }>,
        loading: false,
    }),
    getters: {
        isLogged: (s) => !!s.user,
        inFamily: (s) => s.families.length > 0,
        myFamily: (s) => s.families[0] ?? null,
        inviteCode: (s) => s.families[0]?.invite_code ?? null
    },
    actions: {
        async hydrate() {
            try {
                this.user = await api.me();
                this.families = await api.myFamilies().catch(() => []);
            } catch {
                this.user = null;
                this.families = [];
            }
        },
        async register(email: string, password: string, name: string) {
            this.loading = true;
            try {
                this.user = await api.register({email, password, name});
                await this.hydrate();
            } finally { this.loading = false; }
        },
        async login(email: string, password: string) {
            this.loading = true;
            try {
                this.user = await api.login({email, password});
                await this.hydrate();
            } finally { this.loading = false; }
        },
        async logout() {
            await api.logout();
            this.user = null;
            this.families = [];
        },
        async refreshFamilies() {
            this.families = await api.myFamilies().catch(() => []);
        }
    }
});
