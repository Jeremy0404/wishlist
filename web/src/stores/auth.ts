import { defineStore } from "pinia";
import type { Router } from "vue-router";
import api, { onUnauthorized, type User } from "../services/api.ts";
import type { Family } from "../types.ts";

export const useAuth = defineStore("auth", {
  state: () => ({
    user: undefined as User | null | undefined,
    myFamily: null as Family | null,
    familyLoadFailed: false,
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
    isAdmin(state): boolean {
      return !!state.user?.isAdmin;
    },
  },
  actions: {
    async hydrate(): Promise<void> {
      if (this.hydrated) return;
      try {
        const me = await api.me();
        this.user = me ?? null;
        await this.refreshFamilies();
      } finally {
        this.hydrated = true;
      }
    },
    /** A failed load keeps the family last known, so an outage never reads as
     *  having left it. */
    async refreshFamilies(): Promise<void> {
      if (!this.user) {
        this.myFamily = null;
        this.familyLoadFailed = false;
        return;
      }
      try {
        this.myFamily = await api.getMyFamily();
        this.familyLoadFailed = false;
      } catch {
        this.familyLoadFailed = true;
      }
    },
    async login(identifier: string, password: string) {
      const res = await api.login(identifier, password);
      const user = (
        res && typeof res === "object" && "user" in res
          ? (res as any).user
          : res
      ) as User;
      this.user = user ?? null;
      await this.refreshFamilies();
      return this.user;
    },
    async requestMagicLink(email: string, redirect: string) {
      await api.requestMagicLink(email, redirect);
    },
    async signInWithMagicLink(token: string) {
      const { created, ...user } = await api.consumeMagicLink(token);
      this.user = user;
      this.hydrated = true;
      await this.refreshFamilies();
      return { user: this.user, created };
    },
    /** A magic-link account never chose the name it is shown under, so the
     *  name stays writable for the account's whole life. */
    async updateName(name: string) {
      this.user = await api.updateMyName(name);
      return this.user;
    },
    async logout() {
      // Cleared first: signing out is deliberate, so a 401 on the way out is
      // not a session that expired under the user.
      this.user = null;
      this.myFamily = null;
      this.familyLoadFailed = false;
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
    /** A 401 is the ordinary answer for a guest, so only a session that was
     *  signed in a moment ago counts as one that expired. */
    installApiGuards(router: Router) {
      onUnauthorized(() => {
        const wasSignedIn = this.isLogged;
        this.user = null;
        this.myFamily = null;
        this.familyLoadFailed = false;
        this.hydrated = true;

        if (wasSignedIn) void router.push("/oops");
      });
    },
  },
});
