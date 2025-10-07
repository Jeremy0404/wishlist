import { defineStore } from "pinia";
import api, { type User } from "../services/api.ts";
import type { Family } from "../types.ts";

export const useAuth = defineStore("auth", {
  state: () => ({
    user: undefined as User | null | undefined,
    myFamily: null as Family | null,
    hydrated: false,
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
    async hydrate(): Promise<void> {
      if (this.hydrated) return;
      try {
        const me = await api.me();
        this.user = me ?? null;

        if (this.user) {
          try {
            this.myFamily = await api.getMyFamily();
          } catch {
            this.myFamily = null;
          }
        } else {
          this.myFamily = null;
        }
      } finally {
        this.hydrated = true;
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
    async logout() {
      try {
        await api.logout();
      } catch {}
      this.user = null;
      this.myFamily = null;
      this.hydrated = true;
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
  },
});
