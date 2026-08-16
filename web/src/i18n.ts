import { createI18n } from "vue-i18n";

const fr = {
  app: { title: "Wishlist" },
  common: {
    share: "Partager…",
    copy: "Copier",
    close: "Fermer",
    cancel: "Annuler",
    copied: "Copié !",
    loading: "Chargement…",
  },
  nav: {
    wishlist: "Wishlist",
    myList: "Ma liste",
    others: "Parcourir",
    invite: "Inviter",
    joinFamily: "Rejoindre une famille",
    logout: "Déconnexion",
    profile: "Profil",
  },
  family: {
    badge: "Famille",
    optional: "Optionnel",
    maybeLater: "Plus tard",
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
    body:
      "Une famille sert à voir les listes des autres. Tu peux continuer à utiliser " +
      "Wishlist en solo, aussi longtemps que tu veux.",
    nameLabel: "Nom de la famille",
    namePlaceholder: "Les Martin",
    createBtn: "Créer la famille",
    haveCode: "J’ai déjà un code",
    error: "Impossible de créer la famille.",
    createdTitle: "C’est fait",
    createdBody:
      "{name} existe. Partage ce code aux personnes que tu veux voir arriver.",
    inviteCode: "Code d’invitation",
    goInvite: "Inviter des proches",
    goMyList: "Aller à ma liste",
  },
  familyJoin: {
    title: "Rejoindre une famille",
    body:
      "Entre le code qu’on t’a transmis. Ta liste te suit, et rien ne t’oblige " +
      "à rejoindre qui que ce soit.",
    codeLabel: "Code d’invitation",
    codePlaceholder: "MAR-7F2K9B",
    joinBtn: "Rejoindre",
    noCode: "Je n’ai pas de code — créer la mienne",
    joined: "Tu as rejoint {name}.",
    error: "Échec de la jonction",
  },
  familyInvite: {
    title: "Inviter dans ta famille",
    body: "Partage le code, ou le lien — les deux mènent au même endroit.",
    codeLabel: "Code d’invitation",
    linkLabel: "Lien d’invitation",
    rotate: "Générer un nouveau code",
    rotateConfirm:
      "L’ancien code sera retiré — les personnes qui ne s’en sont pas encore " +
      "servies auront besoin du nouveau.",
    rotateConfirmBtn: "Générer",
    codeRotated: "Nouveau code d’invitation généré.",
    rotateError: "Impossible de régénérer le code.",
    membersTitle: "Membres",
    refresh: "Actualiser",
    noMembers: "Aucun membre pour l’instant.",
    membersError: "Impossible de charger les membres de la famille.",
    noFamily: "Crée ou rejoins d’abord une famille.",
    noFamilyAction: "Créer une famille",
  },
  signIn: {
    kicker: "Sans mot de passe",
    title: "Qu’est-ce qui vous ferait plaisir ? Dites-le, tout simplement.",
    subtitle:
      "Ajoutez ce dont vous avez envie. Partagez votre liste quand vous le sentez.",
    getStarted: "On commence",
    sampleLink: "Voir une liste d’exemple",
    props: {
      quick: {
        title: "Une ligne suffit",
        body: "Collez un lien, le titre et le prix se remplissent tout seuls.",
      },
      familyOptional: {
        title: "La famille est optionnelle",
        body: "Votre liste vous attend dès maintenant, même sans personne autour.",
      },
      noDuplicates: {
        title: "Jamais deux fois le même cadeau",
        body: "Les autres voient ce qui est déjà réservé. Vous, non.",
      },
    },
  },
  sample: {
    title: "Une liste, en aperçu",
    badge: "Exemple",
    disclaimer: "Liste fictive, montrée à titre d’illustration.",
    pageTitle: "La liste d’{name}",
    pageSubtitle:
      "Voilà à quoi ressemble une liste partagée. Celle-ci est inventée.",
    start: "Créer la mienne",
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
    haveAccount: "J’ai déjà un compte",
    noAccount: "Je n’ai pas encore de compte",
    magic: {
      title: "Continuer avec l’e-mail",
      send: "Envoyez-moi un lien",
      fineprint:
        "Lien à usage unique, valable 15 minutes. Aucun mot de passe à inventer ni à retenir.",
      passwordInstead: "Utiliser un mot de passe",
      sentTitle: "Regardez votre boîte mail",
      sentTo: "Nous avons envoyé un lien à {email}.",
      sentHint: "Il expire dans 15 minutes.",
      resend: "Renvoyer le lien",
      signingIn: "Connexion en cours…",
      expiredTitle: "Lien expiré",
      expiredHint:
        "Les liens ne fonctionnent qu’une fois, et seulement pendant 15 minutes.",
      requestNew: "En demander un nouveau",
    },
  },
  priority: {
    none: "Sans priorité",
    high: "Priorité haute",
    medium: "J’aimerais beaucoup",
    low: "Ça me ferait plaisir",
  },
  my: {
    title: "Ma wishlist",
    export: {
      action: "Exporter",
      pdf: "Télécharger le PDF",
      markdown: "Télécharger le Markdown",
      docTitle: "La wishlist de {name}",
      exportedOn: "Exporté le {date}",
      footer: "Exporté depuis Wishlist le {date}",
      photoColumn: "Photo",
      itemColumn: "Article",
      priceColumn: "Prix",
      priorityColumn: "Priorité",
      success: "PDF téléchargé",
      error: "Impossible de générer le PDF",
      markdownSuccess: "Markdown téléchargé",
      markdownError: "Impossible de générer le Markdown",
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
      makePrivate: "Rendre privée",
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
    form: {
      title: "Titre",
      url: "Lien (optionnel)",
      price: "Prix (€)",
      priority: "Priorité",
      notes: "Notes",
      image: "Photo (optionnel)",
      imageHint: "Dépose une photo, ou laisse vide",
      imagePick: "Choisir une photo",
      imageRemove: "Retirer",
      imageUrl: "Ou colle le lien d’une image",
      imageType: "Formats acceptés : PNG, JPEG, WebP ou GIF.",
      imageTooLarge: "Photo trop lourde (2 Mo maximum).",
    },
    addBtn: "Ajouter",
    confirmDelete: "Supprimer cet article ?",
    edit: "Modifier",
    save: "Enregistrer",
    cancel: "Annuler",
    validation: {
      titleRequired: "Le titre est obligatoire.",
    },
    empty: "Rien ici pour l’instant.",
    emptyAction: "Ajoute ta première envie",
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
    empty: "Invite des proches pour commencer à parcourir.",
    emptyAction: "Inviter des proches",
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
    empty: "Rien sur cette liste pour l’instant.",
  },
  public: {
    title: "La liste de {name}",
    subtitle: "Partagée publiquement · lecture seule",
    empty: "Rien sur cette liste pour l’instant.",
    someone: "un·e proche",
    missing: "Cette liste n’est pas disponible ou a été retirée.",
    convert: {
      title: "Envie de ta propre liste ?",
      body: "Ça prend une dizaine de secondes, sans mot de passe à retenir.",
      action: "Créer ma liste",
    },
    footer: "Propulsé par Wishlist",
  },
  notFound: {
    title: "Cette page n’existe pas",
    body: "Le lien est peut-être ancien, ou mal recopié.",
    action: "Retour à ma liste",
  },
  sessionExpired: {
    title: "Quelque chose s’est mal passé",
    body: "Ta session a peut-être expiré. Reconnecte-toi pour continuer.",
    action: "Se reconnecter",
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
