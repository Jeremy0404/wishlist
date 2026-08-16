import { defineStore } from "pinia";
import type { Router } from "vue-router";
import api, { onUnauthorized, type User } from "../services/api.ts";
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
    isLogged(state): boolean {
      return !!state.user?.id;
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
    async requestMagicLink(email: string) {
      await api.requestMagicLink(email);
    },
    async signInWithMagicLink(token: string) {
      const user = await api.consumeMagicLink(token);
      this.user = user ?? null;
      this.hydrated = true;
      await this.refreshFamilies();
      return this.user;
    },
    async logout() {
      // Cleared first: signing out is deliberate, so a 401 on the way out is
      // not a session that expired under the user.
      this.user = null;
      this.myFamily = null;
      this.hydrated = true;
      try {
        await api.logout();
      } catch {
        // the local session is gone whether or not the server answered
      }
    },
    async register(name: string, email: string, password: string) {
      const res = await api.register(name, email, password);
      // @todo rework res type
      const user =
        res && typeof res === "object" && "user" in res ? res.user : res;
      this.user = user ?? null;
      await this.refreshFamilies();
      return this.user;
    },
    async rotateFamilyInvite() {
      if (!this.user) return null;

      const fam = await api.rotateInviteCode();
      this.myFamily = fam;
      return fam;
    },
    /** A 401 is the ordinary answer for a guest, so only a session that was
     *  signed in a moment ago counts as one that expired. */
    installApiGuards(router: Router) {
      onUnauthorized(() => {
        const wasSignedIn = this.isLogged;
        this.user = null;
        this.myFamily = null;
        this.hydrated = true;

        if (wasSignedIn) void router.push("/oops");
      });
    },
  },
});
