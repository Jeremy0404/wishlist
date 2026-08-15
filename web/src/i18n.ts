import { createI18n } from "vue-i18n";

const fr = {
  app: { title: "🎄 Liste de Noël" },
  common: {
    share: "Partager…",
    copy: "Copier",
    close: "Fermer",
    loading: "Chargement…",
    createdAt: "Créé le",
  },
  nav: {
    wishlist: "Wishlist",
    home: "Accueil",
    myList: "Ma liste",
    others: "Les listes de ma famille",
    invite: "Inviter",
    joinFamily: "Rejoindre une famille",
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
    export: {
      action: "Exporter",
      pdf: "Exporter en PDF",
      markdown: "Exporter en Markdown",
      generatedAt: "Généré le {date}",
      subtitle: "Ma liste de cadeaux ✨",
      success: "PDF téléchargé",
      error: "Impossible de générer le PDF",
      markdownSuccess: "Markdown téléchargé",
      markdownError: "Impossible de générer le Markdown",
      noFamily: "Famille mystérieuse",
      linkLabel: "Lien",
      priceLabel: "Prix",
      priorityLabel: "Priorité",
      notesLabel: "Notes",
      createdLabel: "Ajouté le",
      none: "Non renseigné",
      itemsCount: "Articles : {count}",
    },
    share: {
      label: "Ton lien",
      placeholder: "Ton lien apparaîtra ici",
      shared: "Partagée",
      private: "Privée",
      privateHint:
        "Ta liste est privée : personne ne peut ouvrir ce lien pour l’instant.",
      privateConfirm:
        "Rendre ta liste privée ? Le lien cessera de fonctionner.",
      nowShared: "Ta liste est partagée.",
      nowPrivate: "Ta liste est redevenue privée.",
      copy: "Copier",
      copied: "Copié !",
    },
    nudge: {
      question: "Envie que ta famille ou tes proches voient cette liste ?",
      invite: "Invite-les",
      reassurance: "— ça prend dix secondes, et c’est facultatif.",
      action: "Inviter des proches",
      dismiss: "Masquer",
    },
    quick: {
      label: "Colle un lien ou décris ce que tu veux",
      placeholder: "un lien produit, ou « plaid tout doux »",
      showDetails: "Ajouter un prix, des notes ou une priorité",
      hideDetails: "Masquer les détails",
      resolving: "On regarde ce que dit la page…",
    },
    priority: {
      high: "Priorité haute",
      nice: "Ça me ferait plaisir",
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
  browse: {
    title: "Parcourir et réserver",
    subtitle:
      "Vois ce qui fait envie autour de toi — réserve un cadeau pour éviter les doublons.",
    open: "Ouvrir la liste",
    itemCount: "{count} article | {count} articles",
    reservedCount: "{count} réservé par toi | {count} réservés par toi",
    reservedNone: "rien de réservé",
    hint: "Tu peux voir les autres quand ta liste contient au moins un article.",
    empty: "Aucune autre liste pour l’instant.",
    noFamily:
      "Rejoins une famille — ou crées-en une — pour voir les listes des autres et réserver.",
    inviteCard: {
      title: "Inviter quelqu’un",
      body: "Fais venir d’autres personnes — quand tu veux, sans pression.",
      action: "Inviter",
    },
    invite: {
      title: "Inviter dans ta famille",
      description:
        "Partage ce code : la personne le saisira à l’inscription pour rejoindre ta famille.",
      codeLabel: "Code d’invitation",
      copied: "Code copié",
      noFamily: "Crée ou rejoins d’abord une famille.",
    },
  },
  view: {
    title: "Liste de {name}",
    back: "Retour aux listes",
    counter: "{remaining} sur {total} encore à prendre",
    reserve: "Réserver",
    purchase: "Marquer acheté",
    unreserve: "Annuler",
    reservedByYou: "Réservé par toi",
    purchasedByYou: "Acheté — bien joué",
    reservedByOther: "Réservé par {name}",
    link: "Voir le cadeau",
    empty: "Aucun article ici pour le moment.",
  },
  public: {
    eyebrow: "Lettre au Père Noël",
    title: "La liste de {name}",
    subtitle: "",
    stamp: "Cachet officiel du Pôle Nord",
    online: "Lettre publiée",
    back: "Découvrir l’application",
    priority: "Priorité : {value}/5",
    link: "Voir le cadeau",
    empty: "La liste est encore vide pour le moment.",
    signature: "Bisous, {name}",
    footer: "Joyeuses fêtes ✨",
    someone: "un·e proche",
    missing: "Cette lettre n'est pas disponible ou a été retirée.",
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
  pluralRules: {
    fr: (choice: number) => (choice > 1 ? 1 : 0),
  },
});
