import { defineStore } from "pinia";
import { api, type Family, type User } from "../services/api";

export const useAuth = defineStore("auth", {
  state: () => ({
    user: undefined as User | null | undefined,
    myFamily: null as Family | null,
    hydrated: false as boolean,
  }),

  getters: {
    inFamily(state): boolean {
      return !!state.myFamily;
    },
    inviteCode(state): string {
      return state.myFamily?.invite_code ?? "";
    },
  },

  actions: {
    /** Load current session and family (tolerant to /auth/me shape) */
    async hydrate(): Promise<void> {
      try {
        this.user = await api.me();
      } catch {
        this.user = null;
      } finally {
        this.hydrated = true;
      }

      if (this.user) {
        try {
          this.myFamily = await api.getMyFamily();
        } catch {
          this.myFamily = null;
        }
      } else {
        this.myFamily = null;
      }
    },

    async refreshFamilies(): Promise<void> {
      if (!this.user) {
        this.myFamily = null;
        return;
      }
      try {
        this.myFamily = await api.getMyFamily();
      } catch {
        this.myFamily = null;
      }
    },

    setUser(user: User | null) {
      this.user = user;
      if (!user) this.myFamily = null;
    },

    async login(email: string, password: string) {
      const res = await api.login(email, password);
      const user = (
        res && typeof res === "object" && "user" in res
          ? (res as any).user
          : res
      ) as User;
      this.user = user ?? null;
      await this.refreshFamilies();
      return this.user;
    },

    async register(name: string, email: string, password: string) {
      const res = await api.register(name, email, password);
      const user = (
        res && typeof res === "object" && "user" in res
          ? (res as any).user
          : res
      ) as User;
      this.user = user ?? null;
      await this.refreshFamilies();
      return this.user;
    },

    async logout(): Promise<void> {
      try {
        await api.logout();
      } catch {
        // ignore
      }
      this.user = null;
      this.myFamily = null;
      this.hydrated = true;
    },
  },
});
