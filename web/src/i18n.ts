import { createI18n } from "vue-i18n";

const fr = {
  app: { title: "🎄 Liste de Noël" },
  nav: {
    myList: "Ma liste",
    others: "Les autres",
    invite: "Inviter",
    logout: "Déconnexion",
  },
  landing: {
    helloAnon: "Bienvenue !",
    helloUser: "Salut {name} 👋",
    subAnon: "Une petite app pour préparer les cadeaux sans se spoiler.",
    subUser: "Ravi de te revoir. On s’organise pour Noël ?",

    // états
    youAreIn: "Tu es dans la famille {fam}.",
    yourInviteCode: "Ton code d’invitation",
    copy: "Copier",
    copied: "Code copié",
    share: "Partager…",

    // actions
    start: "Créer un compte",
    login: "Se connecter",
    goMyList: "Aller à ma liste",
    createFamily: "Créer une famille",
    joinFamily: "Rejoindre une famille",

    // petites features très simples
    fPrivacyT: "Pas de spoiler",
    fPrivacyD: "Le propriétaire ne voit jamais les réservations.",
    fSimpleT: "Juste ce qu’il faut",
    fSimpleD: "Un titre, un lien, une note, un prix. Et voilà.",
    fFamilyT: "Pensé pour la famille",
    fFamilyD: "Un code à partager, et tout le monde est dedans.",

    // footer
    footer: "Fait maison pour la famille • {github}",
  },
  family: {
    badge: "Famille",
    code: "Code",
    copied: "Code copié",
    shareTitle: "Rejoins ma famille sur Wishlist",
    shareText: "Famille: {name}\nCode: {code}",
  },

  // --- PAGES ---
  familyCreate: {
    title: "Créer une famille",
    nameLabel: "Nom de la famille",
    createBtn: "Créer",
    created: "Famille créée.",
    inviteCode: "Code d’invitation",
    goMyList: "Aller à ma liste",
  },
  familyJoin: {
    title: "Rejoindre une famille",
    codeLabel: "Code d’invitation",
    joinBtn: "Rejoindre",
    joined: "Tu as rejoint {name}.",
    error: "Échec de la jonction",
  },
  familyInvite: {
    title: "Inviter dans ta famille",
    famLabel: "Famille",
    codeLabel: "Code d’invitation",
    copy: "Copier",
    share: "Partager…",
    copied: "Code copié",
    noFamily: "Crée ou rejoins d’abord une famille.",
  },

  // Existant
  auth: {
    login: "Connexion",
    register: "Inscription",
    email: "E-mail",
    password: "Mot de passe",
    name: "Nom",
    create: "Créer le compte",
  },
  my: {
    title: "Ma wishlist",
    addTitle: "Ajouter un article",
    form: {
      title: "Titre",
      url: "Lien (optionnel)",
      price: "Prix (€)",
      priority: "Priorité (1–5)",
      notes: "Notes",
    },
    addBtn: "Ajouter",
    empty:
      "Aucun article — ajoute ton premier pour débloquer les listes des autres.",
    delete: "Supprimer",
  },
  others: {
    title: "Listes de la famille",
    hint: "Tu peux voir les autres quand ta liste contient au moins un article.",
    open: "Ouvrir",
    empty: "Aucune autre liste pour l’instant.",
  },
  view: {
    title: "Liste de {name}",
    reserved: "Réservé",
    by: "par {name}",
    unreserve: "Annuler",
    purchase: "Marquer acheté",
    reserve: "Réserver",
    empty: "Aucun article ici pour le moment.",
  },
  toast: {
    added: "Article ajouté",
    removed: "Article supprimé",
    reserved: "Réservé",
    unreserved: "Réservation annulée",
    purchased: "Acheté",
  },
};

export const i18n = createI18n({
  legacy: false,
  locale: "fr",
  fallbackLocale: "fr",
  messages: { fr },
});
