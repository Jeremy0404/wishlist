import { createI18n } from "vue-i18n";

const fr = {
  app: { title: "🎄 Liste de Noël" },
  common: {
    share: "Partager…",
    copy: "Copier",
    loading: "Chargement…",
    createdAt: "Créé le",
  },
  nav: {
    wishlist: "Wishlist",
    home: "Accueil",
    myList: "Ma liste",
    others: "Les listes de ma famille",
    invite: "Inviter",
    login: "Se connecter",
    register: "Créer un compte",
    logout: "Déconnexion",
    profile: "Profil",
  },
  landing: {
    helloAnon: "Bienvenue !",
    helloUser: "Salut {name} 👋",
    subAnon: "Une petite app pour préparer les cadeaux sans se spoiler.",
    subUser: "Ravi de te revoir. On s’organise pour Noël ?",

    // états
    youAreIn: "Tu es dans la famille {fam}.",
    yourInviteCode: "Ton code d’invitation",
    copied: "Code copié",

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
    footer: "Fait maison",
  },
  family: {
    badge: "Famille",
    code: "Code",
    copied: "Code copié",
    shareTitle: "Invitation à rejoindre {name}",
    shareSubject: "Rejoins la famille {name} sur Wishlist",
    shareCatchPhrase: "🧞‍♂️ Fais un vœu, on s'en charge !",
    shareBody:
      "Famille : {name}\n" +
      "Code d'invitation : {code}\n" +
      "Lien direct : {url}\n\n" +
      "{catchPhrase}",
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
    copied: "Code copié",
    rotate: "Régénérer le code",
    rotateConfirm:
      "Le code d’invitation actuel ne sera plus valide. Continuer ?",
    codeRotated: "Nouveau code d’invitation généré.",
    rotateError: "Impossible de régénérer le code.",
    membersTitle: "Membres de la famille",
    refresh: "Actualiser",
    loadingMembers: "Chargement des membres…",
    roleLabel: "Rôle : {role}",
    joinedAt: "Rejoint le {date}",
    noMembers: "Aucun membre trouvé.",
    membersError: "Impossible de charger les membres de la famille.",
    noFamily: "Crée ou rejoins d’abord une famille.",
  },
  auth: {
    login: "Connexion",
    loginSuccess: "Bienvenue 👋",
    register: "Inscription",
    registerSuccess: "Compte créé 🎉",
    email: "E-mail",
    password: "Mot de passe",
    name: "Nom",
    create: "Créer le compte",
  },
  my: {
    title: "Ma wishlist",
    addTitle: "Ajouter un article",
    export: {
      pdf: "Exporter en PDF",
      generatedAt: "Généré le {date}",
      subtitle: "Ma liste de cadeaux ✨",
      success: "PDF téléchargé",
      error: "Impossible de générer le PDF",
      noFamily: "Famille mystérieuse",
      linkLabel: "Lien",
      priceLabel: "Prix",
      priorityLabel: "Priorité",
      notesLabel: "Notes",
      createdLabel: "Ajouté le",
      none: "Non renseigné",
    },
    form: {
      title: "Titre",
      url: "Lien (optionnel)",
      price: "Prix (€)",
      priority: "Priorité (1–5)",
      notes: "Notes",
    },
    addBtn: "Ajouter",
    edit: "Modifier",
    save: "Enregistrer",
    cancel: "Annuler",
    validation: {
      titleRequired: "Le titre est obligatoire.",
    },
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
    by: "par {name}",
    unreserve: "Annuler",
    purchase: "Marquer acheté",
    reserve: "Réserver",
    empty: "Aucun article ici pour le moment.",
  },
  status: {
    reserved: "Réservé",
    purchased: "Acheté",
  },
  toast: {
    added: "Article ajouté",
    removed: "Article supprimé",
    reserved: "Réservé",
    unreserved: "Réservation annulée",
    purchased: "Acheté",
    updated: "Article mis à jour",
    error: "Une erreur est survenue.",
    bye: "À bientôt !",
  },
};

export const i18n = createI18n({
  legacy: false,
  locale: "fr",
  fallbackLocale: "fr",
  messages: { fr },
});
