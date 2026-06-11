/**
 * Site content (CMS) — every piece of admin-editable writing and page photo
 * outside the menu items themselves.
 *
 * DEFAULT_SITE_CONTENT below is a verbatim extraction of the copy that used
 * to be hardcoded in HomePage / AboutPage / VisitPage / FAQ / CategoryLanding.
 * A fresh install (server content = {}) renders pixel-identical to the
 * pre-CMS site, because the page components fall back to these defaults per
 * field. The default prose lives ONLY here — the server stores published
 * overrides opaquely and never duplicates this text.
 *
 * Lifecycle (mirrors config/schedule.ts, with a draft layer on top):
 *   - live cache, hydrated synchronously from localStorage, refreshed from
 *     GET /site_setting at boot, broadcast via StorageEvent on change
 *   - drafts are saved server-side (cross-device) via the content_draft
 *     endpoints; publishing swaps draft → live server-side and the response
 *     refreshes the live cache here
 *   - PREVIEW: entering preview stores the draft under a second localStorage
 *     key. While that key exists, getSiteContent() serves the draft instead
 *     of live — in EVERY tab of this browser — so the admin can browse the
 *     real site with unpublished content. Visitors are unaffected (the key
 *     only exists in the admin's own browser). Boot hydration writes only
 *     the live key, so a hard refresh mid-preview stays in preview.
 *
 * Multi-paragraph fields use plain text where a blank line = new paragraph;
 * `**bold**` renders as <strong>; About chapter bodies additionally linkify
 * phone numbers and @handles (see components/ContentText.tsx).
 */

import {
  fetchSiteSetting,
  saveSiteContentDraft,
  fetchSiteContentDraft,
  discardSiteContentDraft,
  publishSiteContent,
  revertSiteContent,
} from "../api/siteSetting";
import { ALBUM1_PHOTOS } from "../assets/photos/album1";
import { API_URL } from "./api";

/* ============================================================
   Types
   ============================================================ */

export interface LocalizedText {
  en: string;
  el: string;
}

/** A page photo: a bundled album slug, or an uploaded manifest. */
export type ContentPhotoRef =
  | { kind: "bundled"; slug: string }
  | {
      kind: "custom";
      url: string;
      srcset?: { "640": string; "1280": string; "1920": string };
      width?: number;
      height?: number;
    };

/** An illustration slot: the shipped /public asset, or a custom upload. */
export type IllustrationRef =
  | { kind: "default" }
  | {
      kind: "custom";
      url: string;
      srcset?: { "640": string; "1280": string; "1920": string };
      width?: number;
      height?: number;
    };

export interface HoursRow {
  id: string;
  day: LocalizedText;
  time: string; // shared between languages, e.g. "09:00 – 00:00"
}

export interface AboutChapter {
  id: string;
  title: LocalizedText;
  body: LocalizedText; // blank line = paragraph break
  photo: ContentPhotoRef;
  photoAlt: LocalizedText;
}

export interface FaqItem {
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
}

export interface VisitChoice {
  title: LocalizedText;
  description: LocalizedText;
}

export type CategoryContentSlug = "coffee" | "cocktails" | "spirits" | "food";

export interface CategoryContent {
  /** Doubles as the page <title> via useDocumentMeta. */
  metaTitle: LocalizedText;
  /** Doubles as the meta description. */
  metaDescription: LocalizedText;
  h1: LocalizedText;
  body: LocalizedText; // paragraphs; supports **bold**
}

export interface SiteContent {
  home: {
    heroSubtitle: LocalizedText;
    journeyTitle: LocalizedText;
    about: { title: LocalizedText; body: LocalizedText; ctaLabel: LocalizedText };
    visit: { title: LocalizedText; body: LocalizedText; ctaLabel: LocalizedText };
    hours: { title: LocalizedText; rows: HoursRow[] };
    contactTitle: LocalizedText;
  };
  about: {
    eyebrow: LocalizedText;
    title: LocalizedText;
    lede: LocalizedText;
    heroPhoto: ContentPhotoRef;
    heroAlt: LocalizedText;
    chapters: AboutChapter[];
  };
  visit: {
    eyebrow: LocalizedText;
    title: LocalizedText;
    lede: LocalizedText;
    instagramSubtitle: LocalizedText;
    choices: {
      google: VisitChoice;
      tripadvisor: VisitChoice;
      private: VisitChoice;
    };
  };
  faq: {
    title: LocalizedText;
    items: FaqItem[];
  };
  categories: Record<CategoryContentSlug, CategoryContent>;
  venue: {
    address: string;
    phone: string;
    email: string;
    /** e.g. "@home_seaside" — the Instagram URL is derived, never stored. */
    instagramHandle: string;
    mapsLink: string;
    lat: number;
    lng: number;
  };
  illustrations: {
    homeAbout: IllustrationRef; // default file: /illustration-centaur.webp
    homeVisit: IllustrationRef; // default file: /illustration-vase.webp
    menuEmpty: IllustrationRef; // default file: /illustration-vase.webp
  };
}

/* ============================================================
   Defaults — verbatim, the pre-CMS hardcoded copy
   ============================================================ */

export const DEFAULT_SITE_CONTENT: SiteContent = {
  home: {
    heroSubtitle: {
      en: "Drinks, food, and a chair by the sea, in Rethymno.",
      el: "Ποτά, φαγητό, και μια καρέκλα δίπλα στη θάλασσα, στο Ρέθυμνο.",
    },
    journeyTitle: {
      en: "A Day at Home Seaside",
      el: "Μια μέρα στο Home Seaside",
    },
    about: {
      title: {
        en: "An Ordinary Day, Slowed Down",
        el: "Μια συνηθισμένη μέρα, σε αργό ρυθμό",
      },
      body: {
        en: "Home Seaside sits on the Rethymno seafront. The hour drifts here. Cappuccinos at ten. Mango juice and a long lunch at one. A glass of something cold when the sky turns pink. Made carefully, served generously, for as long as you want to stay.",
        el: "Το Home Seaside βρίσκεται στην παραλιακή του Ρεθύμνου. Η ώρα κυλά αργά εδώ. Cappuccino στις δέκα. Χυμός μάνγκο και μεσημεριανό στη μία. Ένα ποτήρι κάτι κρύο όσο ο ουρανός γίνεται ροζ. Φτιαγμένα με προσοχή, σερβιρισμένα με γενναιοδωρία, για όσο θέλεις να μείνεις.",
      },
      ctaLabel: {
        en: "Read more about us →",
        el: "Διάβασε περισσότερα για εμάς →",
      },
    },
    visit: {
      title: {
        en: "Come See Us",
        el: "Έλα να μας βρεις",
      },
      body: {
        en: "We open at nine. We close when the night is done. Walk in, pick a chair, stay as long as you like. The terrace catches the breeze in summer. The window seat keeps you close to the sea any time of year.",
        el: "Ανοίγουμε στις εννιά. Κλείνουμε όταν τελειώσει η νύχτα. Μπες, διάλεξε καρέκλα, μείνε όσο θέλεις. Η βεράντα πιάνει το αεράκι το καλοκαίρι. Το παράθυρο σε κρατάει κοντά στη θάλασσα όλο τον χρόνο.",
      },
      ctaLabel: {
        en: "Plan your visit →",
        el: "Σχεδίασε την επίσκεψή σου →",
      },
    },
    hours: {
      title: { en: "Hours & Location", el: "Ώρες & Τοποθεσία" },
      rows: [
        { id: "mon-thu", day: { en: "Monday – Thursday", el: "Δευτέρα – Πέμπτη" }, time: "09:00 – 00:00" },
        { id: "fri-sat", day: { en: "Friday – Saturday", el: "Παρασκευή – Σάββατο" }, time: "09:00 – 02:00" },
        { id: "sun", day: { en: "Sunday", el: "Κυριακή" }, time: "10:00 – 00:00" },
      ],
    },
    contactTitle: { en: "Say Hello", el: "Πες ένα γεια" },
  },

  about: {
    eyebrow: { en: "Home Seaside, Rethymno", el: "Home Seaside, Ρέθυμνο" },
    title: {
      en: "An ordinary day on the Rethymno seafront",
      el: "Μια συνηθισμένη μέρα στην παραλιακή του Ρεθύμνου",
    },
    lede: {
      en: "Home Seaside Bar & More is a seafront café and cocktail bar on the Rethymno promenade in Crete. Two minutes' walk from the Fortezza and the Old Venetian Harbour. We open at nine for coffee and stay until the night feels finished.",
      el: "Το Home Seaside Bar & More είναι ένα παραθαλάσσιο café και cocktail bar στην παραλιακή του Ρεθύμνου, δύο λεπτά με τα πόδια από τη Φορτέτζα και το Παλιό Ενετικό Λιμάνι. Ανοίγουμε στις εννιά για καφέ και μένουμε όσο νιώθει η νύχτα.",
    },
    heroPhoto: { kind: "bundled", slug: "food-session-70" },
    heroAlt: {
      en: "Home Seaside at night, lit up on the Rethymno seafront",
      el: "Το Home Seaside τη νύχτα, φωτισμένο στην παραλιακή του Ρεθύμνου",
    },
    chapters: [
      {
        id: "chapter-1",
        title: { en: "Mornings start slow", el: "Τα πρωινά ξεκινούν αργά" },
        body: {
          en: "The espresso machine starts at nine. Fresh juice on the bar before the sun finds the terrace. The first regulars come in for a cortado and the newspaper, and we are happy to leave them to it.\n\nWe take coffee seriously without making a fuss about it. Fresh beans, careful temperatures, latte art that arrives without comment. Brunch carries the morning. Eggs cooked how you ask, honeycomb spooned over thick yogurt, toast that smells of the kitchen. If you want to nurse a long flat white by the window, this is the place for it.",
          el: "Η μηχανή του espresso ξεκινάει στις εννιά. Φρέσκος χυμός στο μπαρ πριν ο ήλιος βρει τη βεράντα. Οι πρώτοι θαμώνες έρχονται για έναν cortado και την εφημερίδα, και τους αφήνουμε ευχαρίστως στην ησυχία τους.\n\nΠαίρνουμε τον καφέ στα σοβαρά χωρίς να το κάνουμε θέμα. Φρέσκοι κόκκοι, σωστές θερμοκρασίες, latte art χωρίς φιγούρες. Το brunch κρατάει το πρωί. Αυγά όπως τα ζητάς, κηρήθρα πάνω σε πηχτό γιαούρτι, τοστ που μυρίζει κουζίνα. Αν θες να αργήσεις πάνω από έναν flat white δίπλα στο παράθυρο, εδώ είναι το μέρος.",
        },
        photo: { kind: "bundled", slug: "food-session-6" },
        photoAlt: {
          en: "Espresso and brunch on a sunny morning at Home Seaside",
          el: "Espresso και brunch ένα ηλιόλουστο πρωινό στο Home Seaside",
        },
      },
      {
        id: "chapter-2",
        title: { en: "A bar built on rum and time", el: "Ένα μπαρ χτισμένο στο ρούμι και τον χρόνο" },
        body: {
          en: "The back of the bar is one of the deepest rum selections on the island. Agricoles from Martinique. Aged Jamaicans. Single-estate bottlings from Guatemala, Barbados, the Philippines. Some are for sipping neat with a slice of dark chocolate. Some we use in cocktails our bartenders have been refining for years.\n\nOrder a classic and we will build it properly. Order something signature and we will tell you what is in it. Ask for a recommendation. That is what we like best. The night unfolds at whatever pace you want; we keep the shaker moving until it stops feeling right.",
          el: "Πίσω από το μπαρ βρίσκεται μία από τις μεγαλύτερες συλλογές ρουμιού στο νησί. Agricoles από τη Μαρτινίκα. Παλαιωμένα της Τζαμάικα. Single-estate εμφιαλώσεις από Γουατεμάλα, Μπαρμπέιντος, Φιλιππίνες. Άλλα τα πίνεις σκέτα με μια φέτα μαύρη σοκολάτα. Άλλα μπαίνουν σε cocktails που οι bartender μας τελειοποιούν χρόνια.\n\nΠαράγγειλε ένα κλασικό και θα φτιαχτεί σωστά. Παράγγειλε κάτι signature και θα σου πούμε τι έχει μέσα. Ζήτα μια πρόταση. Αυτό μας αρέσει περισσότερο. Η βραδιά ξεδιπλώνεται στον ρυθμό σου· κρατάμε το shaker σε κίνηση όσο νιώθει σωστό.",
        },
        photo: { kind: "bundled", slug: "food-session-64" },
        photoAlt: {
          en: "The bar at Home Seaside, lined with rum bottles, in the early evening",
          el: "Το μπαρ του Home Seaside με μπουκάλια ρουμιού, νωρίς το βράδυ",
        },
      },
      {
        id: "chapter-3",
        title: { en: "Food that doesn't rush", el: "Φαγητό χωρίς βιασύνη" },
        body: {
          en: "The kitchen runs from opening to close, which means there is no awkward gap between meals. Brunch carries into lunch. Lunch slides into long plates and snacks. Dinner arrives with pizza from the oven and Mediterranean small plates meant to share. The menu changes a little with the season; the spirit of it does not.\n\nSourcing is local where it should be. Cretan olive oil, cheeses from the mountain villages, fish landed at the harbour up the road. The plates are generous, the portions unfussy. Stay through three courses or just split a salad with a glass of wine. Both are welcome.",
          el: "Η κουζίνα δουλεύει από το άνοιγμα μέχρι το κλείσιμο, που σημαίνει ότι δεν υπάρχει νεκρή ώρα ανάμεσα στα γεύματα. Το brunch γίνεται μεσημέρι. Το μεσημέρι κυλάει σε μεγάλα πιάτα και σνακ. Το βράδυ έρχεται με πίτσα από τον φούρνο και μεσογειακούς μεζέδες για να μοιραστούν. Το μενού αλλάζει λίγο με την εποχή· ο χαρακτήρας του όχι.\n\nΠρώτες ύλες από εδώ όπου ταιριάζει. Κρητικό λάδι, τυριά από τα ορεινά χωριά, ψάρι από το λιμάνι πιο πάνω. Τα πιάτα είναι γενναιόδωρα, οι μερίδες ανεπιτήδευτες. Μείνε για τρία πιάτα ή μοιράσου μια σαλάτα με ένα ποτήρι κρασί. Και τα δύο ευπρόσδεκτα.",
        },
        photo: { kind: "bundled", slug: "food-session-36" },
        photoAlt: {
          en: "A toasted sandwich and side salad at Home Seaside, mid-afternoon",
          el: "Ψητό σάντουιτς και σαλάτα στο Home Seaside, μεσημεριανές ώρες",
        },
      },
      {
        id: "chapter-4",
        title: { en: "The room", el: "Ο χώρος" },
        body: {
          en: "Most of the tables face the sea. A covered terrace handles breezier afternoons; shaded seats catch the summer instead of the sun. Inside, the room turns warm in winter and stays cool in August. Cappuccinos at ten, spritzes by five, the room shifts with the light.\n\nThe crowd is a mix. Locals on long lunches, travellers who walked over from the Old Town, families who come back every summer and ask about the dog. We are happy to host any of them, for as long as they would like to stay. No one is going to rush you out.",
          el: "Τα περισσότερα τραπέζια κοιτούν τη θάλασσα. Η σκεπαστή βεράντα δουλεύει στα πιο δροσερά απογεύματα· τα σκιαζόμενα τραπέζια κρατούν το καλοκαίρι μακριά από τον ήλιο. Μέσα, ο χώρος γίνεται ζεστός τον χειμώνα και μένει δροσερός τον Αύγουστο. Καπουτσίνο στις δέκα, spritz στις πέντε, ο χώρος αλλάζει με το φως.\n\nΟ κόσμος είναι ένα μείγμα. Ντόπιοι σε μεγάλα μεσημέρια, ταξιδιώτες που περπάτησαν από την Παλιά Πόλη, οικογένειες που έρχονται κάθε καλοκαίρι και ρωτούν για τον σκύλο. Φιλοξενούμε ευχαρίστως όλους τους, για όσο θέλουν να μείνουν. Κανείς δεν θα σε βιάσει να φύγεις.",
        },
        photo: { kind: "bundled", slug: "food-session-69" },
        photoAlt: {
          en: "The interior of Home Seaside in the late afternoon light",
          el: "Ο εσωτερικός χώρος του Home Seaside στο απογευματινό φως",
        },
      },
      {
        id: "chapter-5",
        title: { en: "Finding us", el: "Πώς μας βρίσκεις" },
        body: {
          en: "Leof. Emmanouil Kefalogianni 18, on the Rethymno seafront promenade, two minutes' walk from the Fortezza and the Old Venetian Harbour. From the Old Town, follow the water east. You will see us before you arrive.\n\nWalk-ins are always welcome. For larger groups or weekend evenings, a quick call ahead is the kind move: +30 2831 022782. For the daily rhythm (new arrivals on the bar, what came out of the kitchen this morning), follow @home_seaside.",
          el: "Λεωφ. Εμμανουήλ Κεφαλογιάννη 18, στην παραλιακή του Ρεθύμνου, δύο λεπτά με τα πόδια από τη Φορτέτζα και το Παλιό Ενετικό Λιμάνι. Από την Παλιά Πόλη, ακολούθα τη θάλασσα ανατολικά. Θα μας δεις πριν φτάσεις.\n\nWalk-ins πάντα ευπρόσδεκτα. Για μεγαλύτερες παρέες ή βράδια Σαββατοκύριακου, μια γρήγορη κλήση εκ των προτέρων είναι καλή κίνηση: +30 2831 022782. Για την καθημερινή ροή (τι νέο μπήκε στο μπαρ, τι βγήκε από την κουζίνα σήμερα), ακολούθα μας στο @home_seaside.",
        },
        photo: { kind: "bundled", slug: "food-session-34" },
        photoAlt: {
          en: "The Rethymno seafront promenade leading to Home Seaside",
          el: "Η παραλιακή του Ρεθύμνου που οδηγεί στο Home Seaside",
        },
      },
    ],
  },

  visit: {
    eyebrow: { en: "Home Seaside · Rethymno", el: "Home Seaside · Ρέθυμνο" },
    title: { en: "Thanks for visiting today", el: "Ευχαριστούμε για την επίσκεψη" },
    lede: {
      en: "Tell us how it went. Whichever option you pick, it lands with us, not a third party.",
      el: "Πες μας πώς πέρασες. Όποια επιλογή κι αν διαλέξεις, έρχεται σε εμάς, όχι σε κάποιον τρίτο.",
    },
    instagramSubtitle: {
      en: "Daily stories, drinks, sunset photos. The life of the bar.",
      el: "Καθημερινές στιγμές, ποτά, ηλιοβασιλέματα. Η ζωή του μπαρ.",
    },
    choices: {
      google: {
        title: { en: "Leave a Google review", el: "Άφησε αξιολόγηση στο Google" },
        description: {
          en: "Public, on our Google listing. The first place travellers check before they pick where to eat in Rethymno.",
          el: "Δημόσια, στο Google listing μας. Το πρώτο μέρος που κοιτούν οι ταξιδιώτες πριν αποφασίσουν πού θα φάνε στο Ρέθυμνο.",
        },
      },
      tripadvisor: {
        title: { en: "Leave a TripAdvisor review", el: "Άφησε αξιολόγηση στο TripAdvisor" },
        description: {
          en: "Public, on TripAdvisor. The first place a lot of guests look before they arrive in Rethymno.",
          el: "Δημόσια, στο TripAdvisor. Το πρώτο μέρος που κοιτάζουν πολλοί επισκέπτες πριν φτάσουν στο Ρέθυμνο.",
        },
      },
      private: {
        title: { en: "Send us private feedback", el: "Στείλε μας ιδιωτικά τη γνώμη σου" },
        description: {
          en: "Goes straight to the manager. Anything you'd rather keep off the public record, or just a quick note for us.",
          el: "Πάει απευθείας στον υπεύθυνο. Ό,τι προτιμάς να μην ειπωθεί δημόσια, ή απλά ένα μήνυμα για εμάς.",
        },
      },
    },
  },

  faq: {
    title: { en: "Frequently Asked", el: "Συχνές ερωτήσεις" },
    items: [
      {
        id: "faq-1",
        question: { en: "Where exactly is Home Seaside?", el: "Πού ακριβώς βρίσκεται το Home Seaside;" },
        answer: {
          en: "On the Rethymno seafront, at Leof. Emmanouil Kefalogianni 18. Two minutes' walk from the Fortezza and the Old Venetian Harbour. The terrace looks straight out at the water.",
          el: "Στην παραλιακή του Ρεθύμνου, στη Λεωφ. Εμμανουήλ Κεφαλογιάννη 18. Δύο λεπτά με τα πόδια από τη Φορτέτζα και το Παλιό Ενετικό Λιμάνι. Η βεράντα κοιτάζει κατευθείαν στη θάλασσα.",
        },
      },
      {
        id: "faq-2",
        question: { en: "What is Home Seaside best known for?", el: "Για τι είναι γνωστό το Home Seaside;" },
        answer: {
          en: "Specialty coffee in the morning. One of the deepest rum selections in Rethymno after dark. Cocktails made with care, comfort food in between. The same kitchen running all day.",
          el: "Specialty καφέ το πρωί. Μία από τις βαθύτερες συλλογές ρουμιού στο Ρέθυμνο όταν πέφτει η νύχτα. Cocktails φτιαγμένα με προσοχή, comfort food στο ενδιάμεσο. Η ίδια κουζίνα δουλεύει όλη μέρα.",
        },
      },
      {
        id: "faq-3",
        question: { en: "When are you open?", el: "Ποιες ώρες είστε ανοιχτά;" },
        answer: {
          en: "Monday to Thursday, nine in the morning until midnight. Friday and Saturday, nine until two. Sunday, ten until midnight. Same rhythm, all year round.",
          el: "Δευτέρα έως Πέμπτη, εννιά το πρωί μέχρι τα μεσάνυχτα. Παρασκευή και Σάββατο, εννιά μέχρι δύο. Κυριακή, δέκα μέχρι τα μεσάνυχτα. Ίδιος ρυθμός, όλο τον χρόνο.",
        },
      },
      {
        id: "faq-4",
        question: { en: "Do you take reservations?", el: "Δέχεστε κρατήσεις;" },
        answer: {
          en: "Yes. Call +30 2831 022782 or write to home_seaside_rethimno@hotmail.com. Weekend evenings and larger tables fill up, so it's worth booking ahead.",
          el: "Ναι. Καλέστε στο +30 2831 022782 ή γράψτε στο home_seaside_rethimno@hotmail.com. Σαββατοκύριακα το βράδυ και μεγαλύτερες παρέες γεμίζουν, οπότε αξίζει να κλείσετε από πριν.",
        },
      },
      {
        id: "faq-5",
        question: { en: "Do you serve breakfast and food all day?", el: "Σερβίρετε πρωινό και φαγητό όλη μέρα;" },
        answer: {
          en: "Yes. The kitchen opens when we do and closes when we close. Brunch starts the morning. Lunch runs into a long afternoon. By evening it shifts to pizza and small plates.",
          el: "Ναι. Η κουζίνα ανοίγει όταν ανοίγουμε και κλείνει όταν κλείνουμε. Το brunch ξεκινάει το πρωί. Το μεσημεριανό κυλάει σε ένα μακρύ απόγευμα. Το βράδυ γυρνάει σε πίτσα και μεζέδες.",
        },
      },
      {
        id: "faq-6",
        question: { en: "Is there outdoor seating with a sea view?", el: "Υπάρχει εξωτερικό κάθισμα με θέα στη θάλασσα;" },
        answer: {
          en: "Most tables face the water. A covered terrace for the breeze. Shaded seats for the summer afternoon. The window inside, if you'd rather stay close to the sea but out of the wind.",
          el: "Τα περισσότερα τραπέζια κοιτούν τη θάλασσα. Σκεπαστή βεράντα για το αεράκι. Σκιαζόμενα τραπέζια για το καλοκαιρινό απόγευμα. Το παράθυρο μέσα, αν προτιμάς να μένεις κοντά στη θάλασσα χωρίς αέρα.",
        },
      },
    ],
  },

  categories: {
    coffee: {
      metaTitle: {
        en: "Specialty Coffee in Rethymno — Home Seaside",
        el: "Specialty καφές στο Ρέθυμνο — Home Seaside",
      },
      metaDescription: {
        en: "Specialty coffee on the Rethymno seafront. Freshly brewed espresso, flat whites, pour-overs, and seasonal coffee drinks at Home Seaside.",
        el: "Specialty καφές στην παραλιακή του Ρεθύμνου. Φρέσκος espresso, flat white, pour-over και εποχιακά coffee drinks στο Home Seaside.",
      },
      h1: {
        en: "Specialty Coffee in Rethymno",
        el: "Specialty καφές στο Ρέθυμνο",
      },
      body: {
        en: "Our coffee programme is built around fresh beans, careful brew temperatures, and the kind of patience that doesn't rush a drink out the door. Espresso is the backbone — pulled short, dialled in daily — and from there we build flat whites, cappuccinos, long blacks, cortados, and the seasonal iced menu that gets us through a Cretan summer.\n\nIf you're looking for **specialty coffee in Rethymno**, this is one of the spots locals come back to. Sit by the window, take an hour, watch the sea while the cup goes cold. Pair with brunch from the kitchen or the honeycomb-on-yogurt that's been on the menu since day one.",
        el: "Το coffee programme μας είναι χτισμένο γύρω από φρέσκους κόκκους, σωστές θερμοκρασίες brewing και υπομονή που δεν βιάζει τον καφέ να φύγει. Ο espresso είναι η ραχοκοκαλιά — short, ρυθμισμένος καθημερινά — και από εκεί χτίζουμε flat whites, cappuccinos, long blacks, cortados και την εποχιακή κρύα κάρτα για το καλοκαίρι.\n\nΑν ψάχνεις **specialty καφέ στο Ρέθυμνο**, είμαστε ένα από τα μέρη όπου επιστρέφουν οι ντόπιοι. Κάτσε δίπλα στο παράθυρο, πάρε μία ώρα, κοίτα τη θάλασσα ενώ ο καφές κρυώνει. Συνδύασε με brunch ή με την κηρήθρα-με-γιαούρτι που μένει στο μενού από την πρώτη μέρα.",
      },
    },
    cocktails: {
      metaTitle: {
        en: "Cocktails in Rethymno — Advanced Techniques at Home Seaside",
        el: "Cocktails στο Ρέθυμνο — Εξελιγμένες τεχνικές στο Home Seaside",
      },
      metaDescription: {
        en: "Handcrafted cocktails on the Rethymno seafront. Classics built properly and signature drinks using advanced techniques at Home Seaside Bar & More.",
        el: "Handcrafted cocktails στην παραλιακή του Ρεθύμνου. Κλασικά φτιαγμένα σωστά και signature ποτά με εξελιγμένες τεχνικές στο Home Seaside Bar & More.",
      },
      h1: {
        en: "Handcrafted cocktails by the sea",
        el: "Handcrafted cocktails δίπλα στη θάλασσα",
      },
      body: {
        en: "Cocktails at Home Seaside are made the slow way. Fresh juices pressed to order, syrups built in-house, ice cut to fit the glass. Our bartenders have spent years on these recipes — both the classics (a properly built Negroni, a balanced Old Fashioned, a Daiquiri with our preferred rum) and signature drinks that lean into **advanced cocktail techniques**: fat-washing, clarified juices, controlled dilution, smoke, considered garnishes.\n\nIf you're hunting for **high quality cocktails in Rethymno**, sit at the bar, tell us what you like, and let the team build something for you. The cocktail list is a starting point, not a cage.",
        el: "Τα cocktails στο Home Seaside φτιάχνονται με την αργή μέθοδο. Φρέσκοι χυμοί στιγμής, σιρόπια εσωτερικής παρασκευής, πάγος κομμένος στο μέγεθος του ποτηριού. Οι bartender μας δουλεύουν χρόνια αυτές τις συνταγές — τόσο τα κλασικά (σωστά φτιαγμένο Negroni, ισορροπημένο Old Fashioned, Daiquiri με το αγαπημένο μας ρούμι) όσο και signature ποτά που αξιοποιούν **εξελιγμένες τεχνικές cocktail**: fat-washing, διαυγασμένους χυμούς, ελεγχόμενη αραίωση, καπνισμό, μελετημένα garnish.\n\nΑν ψάχνεις **cocktails υψηλής ποιότητας στο Ρέθυμνο**, κάτσε στο μπαρ, πες μας τι σου αρέσει και άφησε την ομάδα να φτιάξει κάτι για σένα. Η λίστα cocktails είναι αφετηρία, όχι φυλακή.",
      },
    },
    spirits: {
      metaTitle: {
        en: "Rum & Spirits in Rethymno — Home Seaside",
        el: "Ρούμι & spirits στο Ρέθυμνο — Home Seaside",
      },
      metaDescription: {
        en: "One of the deepest rum selections in Rethymno alongside aged whisky, gin, mezcal and agave spirits. Home Seaside Bar & More on the seafront.",
        el: "Μία από τις μεγαλύτερες συλλογές ρουμιού στο Ρέθυμνο, μαζί με παλαιωμένα whisky, gin, mezcal και agave spirits. Home Seaside Bar & More.",
      },
      h1: {
        en: "Rum selection & fine spirits at Home Seaside",
        el: "Συλλογή ρουμιού & εκλεκτά spirits στο Home Seaside",
      },
      body: {
        en: "We're a **rum bar at heart**. Home Seaside keeps one of the deepest rum selections in Rethymno — Jamaican funk, French agricoles, Spanish-style aged sippers, Demerara classics, and single-estate bottlings tucked in for the people who know. If you've been chasing a particular expression on Crete, this is the short list of places worth checking.\n\nAround the rum live the rest of the spirits programme: aged whiskies, a serious gin shelf, mezcal and tequila for the agave crowd, and small-batch finds we picked up because they were good. Tell us what you're after; we'll either pour it or recommend the next best thing on the shelf.",
        el: "Είμαστε **rum bar στην καρδιά μας**. Το Home Seaside διατηρεί μία από τις μεγαλύτερες συλλογές ρουμιού στο Ρέθυμνο — Jamaican funk, French agricoles, ισπανικού στυλ παλαιωμένα, Demerara classics και single-estate εμφιαλώσεις για όσους ξέρουν. Αν ψάχνεις κάποια συγκεκριμένη εμφιάλωση στην Κρήτη, είμαστε στη σύντομη λίστα μερών που αξίζει να ελέγξεις.\n\nΓύρω από το ρούμι ζει το υπόλοιπο spirits programme: παλαιωμένα whisky, σοβαρό ράφι gin, mezcal και tequila για τους λάτρεις της agave, και small-batch ευρήματα που φέραμε γιατί ήταν καλά. Πες μας τι θες — θα σου σερβίρουμε ή θα προτείνουμε το επόμενο καλύτερο.",
      },
    },
    food: {
      metaTitle: {
        en: "Comfort Food on the Rethymno Seafront — Home Seaside",
        el: "Comfort φαγητό στην παραλιακή του Ρεθύμνου — Home Seaside",
      },
      metaDescription: {
        en: "Comfort food at Home Seaside Bar & More, on the Rethymno seafront in Crete. Brunch, salads, sandwiches, pizza, Mediterranean small plates — served all day.",
        el: "Comfort φαγητό στο Home Seaside Bar & More, στην παραλιακή του Ρεθύμνου στην Κρήτη. Brunch, σαλάτες, σάντουιτς, πίτσα, μεσογειακοί μεζέδες όλη μέρα.",
      },
      h1: {
        en: "Comfort food on the Rethymno seafront",
        el: "Comfort φαγητό στην παραλιακή του Ρεθύμνου",
      },
      body: {
        en: "The kitchen at Home Seaside runs from opening to close, and the menu leans into **comfort food** done well: brunch plates in the morning, salads and toasted sandwiches through lunch, Mediterranean small plates in the afternoon, and pizza with the rest of the dinner crowd into the night.\n\nSourcing is local where it should be — Cretan produce, olive oil, cheese — and generous everywhere it can be. If you're after **comfort food in Rethymno** that pairs with sea views and a long afternoon, this is the right spot.",
        el: "Η κουζίνα στο Home Seaside δουλεύει από το άνοιγμα μέχρι το κλείσιμο και το μενού δίνει βαρύτητα στο **comfort φαγητό** φτιαγμένο σωστά: πιάτα brunch το πρωί, σαλάτες και ψητά σάντουιτς το μεσημέρι, μεσογειακοί μεζέδες το απόγευμα και πίτσα μαζί με τη βραδινή παρέα.\n\nΟι πρώτες ύλες είναι τοπικές όπου ταιριάζει — κρητικά προϊόντα, ελαιόλαδο, τυρί — και πάντα γενναιόδωρες. Αν ψάχνεις **comfort φαγητό στο Ρέθυμνο** που συνοδεύεται με θέα θάλασσα και ένα μεγάλο απόγευμα, αυτό είναι το μέρος.",
      },
    },
  },

  venue: {
    address: "Leof. Emmanouil Kefalogianni 18, Rethymno 741 31, Greece",
    phone: "+30 2831 022782",
    email: "home_seaside_rethimno@hotmail.com",
    instagramHandle: "@home_seaside",
    mapsLink: "https://maps.app.goo.gl/Bni5sF7oQSpCuB2w8",
    lat: 35.3718449,
    lng: 24.4742788,
  },

  illustrations: {
    homeAbout: { kind: "default" },
    homeVisit: { kind: "default" },
    menuEmpty: { kind: "default" },
  },
};

/* ============================================================
   Helpers
   ============================================================ */

export function pickText(lt: LocalizedText, language: "EN" | "EL"): string {
  return language === "EN" ? lt.en : lt.el;
}

/** "@home_seaside" → "https://www.instagram.com/home_seaside" */
export function instagramUrl(handle: string): string {
  return `https://www.instagram.com/${handle.replace(/^@/, "")}`;
}

/** "+30 2831 022782" → "tel:+302831022782" */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/\s/g, "")}`;
}

/**
 * OpenStreetMap embed URL derived from coordinates. Reproduces the original
 * hardcoded VENUE.mapsEmbed byte-for-byte for the default lat/lng (~600m
 * bbox: lng±0.003, lat±0.002).
 */
export function mapsEmbedUrl(lat: number, lng: number): string {
  const f = (n: number) => n.toFixed(7).replace(/0+$/, "").replace(/\.$/, "");
  // The original string keeps full 7-decimal precision; toFixed(7) on the
  // default coords yields exactly the original digits, and the trailing-zero
  // strip keeps admin-entered coarse coords (e.g. 35.37) tidy.
  return (
    `https://www.openstreetmap.org/export/embed.html` +
    `?bbox=${f(lng - 0.003)}%2C${f(lat - 0.002)}%2C${f(lng + 0.003)}%2C${f(lat + 0.002)}` +
    `&layer=mapnik&marker=${f(lat)}%2C${f(lng)}`
  );
}

/** Resolve a possibly-relative upload URL against the API origin. */
function resolveUploadUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${API_URL}${url}`;
  return url;
}

/**
 * The <img src> for an illustration slot: the shipped /public asset for
 * "default", or the uploaded image (preferring the 1280w rendition).
 */
export function illustrationSrc(ref: IllustrationRef, defaultPath: string): string {
  if (ref.kind === "custom") {
    return resolveUploadUrl(ref.srcset?.["1280"] ?? ref.url);
  }
  return defaultPath;
}

/* ============================================================
   Normalization — deep per-field merge over the defaults
   ============================================================ */

function isObj(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

function normText(raw: unknown, fallback: LocalizedText): LocalizedText {
  if (!isObj(raw)) return { ...fallback };
  return {
    en: typeof raw.en === "string" ? raw.en : fallback.en,
    el: typeof raw.el === "string" ? raw.el : fallback.el,
  };
}

/** Like normText but for entries inside admin-managed lists, where a missing
 *  string means "not written yet", not "use the bundled default". */
function normTextLoose(raw: unknown): LocalizedText {
  if (!isObj(raw)) return { en: "", el: "" };
  return {
    en: typeof raw.en === "string" ? raw.en : "",
    el: typeof raw.el === "string" ? raw.el : "",
  };
}

function normPhotoRef(raw: unknown, fallback: ContentPhotoRef): ContentPhotoRef {
  if (!isObj(raw)) return { ...fallback };
  if (raw.kind === "bundled" && typeof raw.slug === "string") {
    return { kind: "bundled", slug: raw.slug };
  }
  if (raw.kind === "custom" && typeof raw.url === "string") {
    const srcset = isObj(raw.srcset) &&
      typeof raw.srcset["640"] === "string" &&
      typeof raw.srcset["1280"] === "string" &&
      typeof raw.srcset["1920"] === "string"
      ? { "640": raw.srcset["640"], "1280": raw.srcset["1280"], "1920": raw.srcset["1920"] }
      : undefined;
    return {
      kind: "custom",
      url: raw.url,
      srcset,
      width: typeof raw.width === "number" ? raw.width : undefined,
      height: typeof raw.height === "number" ? raw.height : undefined,
    };
  }
  return { ...fallback };
}

function normIllustration(raw: unknown): IllustrationRef {
  if (isObj(raw) && raw.kind === "custom" && typeof raw.url === "string") {
    const photo = normPhotoRef(raw, { kind: "bundled", slug: "" });
    if (photo.kind === "custom") return photo;
  }
  return { kind: "default" };
}

function normNumber(raw: unknown, fallback: number): number {
  return typeof raw === "number" && Number.isFinite(raw) ? raw : fallback;
}

function normString(raw: unknown, fallback: string): string {
  return typeof raw === "string" ? raw : fallback;
}

/**
 * Merge raw (server/localStorage) content over DEFAULT_SITE_CONTENT.
 * Objects merge per field; admin-managed lists (chapters, FAQ items, hours
 * rows) replace wholesale when present and valid. Garbage at any level falls
 * back to the default at that level — this function never throws.
 */
export function normalizeSiteContent(raw: unknown): SiteContent {
  const d = DEFAULT_SITE_CONTENT;
  if (!isObj(raw)) return JSON.parse(JSON.stringify(d)) as SiteContent;

  const home = isObj(raw.home) ? raw.home : {};
  const homeAbout = isObj(home.about) ? home.about : {};
  const homeVisit = isObj(home.visit) ? home.visit : {};
  const homeHours = isObj(home.hours) ? home.hours : {};
  const about = isObj(raw.about) ? raw.about : {};
  const visit = isObj(raw.visit) ? raw.visit : {};
  const visitChoices = isObj(visit.choices) ? visit.choices : {};
  const faq = isObj(raw.faq) ? raw.faq : {};
  const categories = isObj(raw.categories) ? raw.categories : {};
  const venue = isObj(raw.venue) ? raw.venue : {};
  const illustrations = isObj(raw.illustrations) ? raw.illustrations : {};

  const normChoice = (rawChoice: unknown, fallback: VisitChoice): VisitChoice => {
    const c = isObj(rawChoice) ? rawChoice : {};
    return {
      title: normText(c.title, fallback.title),
      description: normText(c.description, fallback.description),
    };
  };

  const normCategory = (rawCat: unknown, fallback: CategoryContent): CategoryContent => {
    const c = isObj(rawCat) ? rawCat : {};
    return {
      metaTitle: normText(c.metaTitle, fallback.metaTitle),
      metaDescription: normText(c.metaDescription, fallback.metaDescription),
      h1: normText(c.h1, fallback.h1),
      body: normText(c.body, fallback.body),
    };
  };

  return {
    home: {
      heroSubtitle: normText(home.heroSubtitle, d.home.heroSubtitle),
      journeyTitle: normText(home.journeyTitle, d.home.journeyTitle),
      about: {
        title: normText(homeAbout.title, d.home.about.title),
        body: normText(homeAbout.body, d.home.about.body),
        ctaLabel: normText(homeAbout.ctaLabel, d.home.about.ctaLabel),
      },
      visit: {
        title: normText(homeVisit.title, d.home.visit.title),
        body: normText(homeVisit.body, d.home.visit.body),
        ctaLabel: normText(homeVisit.ctaLabel, d.home.visit.ctaLabel),
      },
      hours: {
        title: normText(homeHours.title, d.home.hours.title),
        rows: Array.isArray(homeHours.rows)
          ? homeHours.rows.filter(isObj).map((row, i) => ({
              id: normString(row.id, `row-${i + 1}`),
              day: normTextLoose(row.day),
              time: normString(row.time, ""),
            }))
          : d.home.hours.rows.map((r) => ({ ...r, day: { ...r.day } })),
      },
      contactTitle: normText(home.contactTitle, d.home.contactTitle),
    },
    about: {
      eyebrow: normText(about.eyebrow, d.about.eyebrow),
      title: normText(about.title, d.about.title),
      lede: normText(about.lede, d.about.lede),
      heroPhoto: normPhotoRef(about.heroPhoto, d.about.heroPhoto),
      heroAlt: normText(about.heroAlt, d.about.heroAlt),
      chapters: Array.isArray(about.chapters)
        ? about.chapters.filter(isObj).map((ch, i) => ({
            id: normString(ch.id, `chapter-${i + 1}`),
            title: normTextLoose(ch.title),
            body: normTextLoose(ch.body),
            photo: normPhotoRef(ch.photo, { kind: "bundled", slug: "" }),
            photoAlt: normTextLoose(ch.photoAlt),
          }))
        : d.about.chapters.map((c) => JSON.parse(JSON.stringify(c)) as AboutChapter),
    },
    visit: {
      eyebrow: normText(visit.eyebrow, d.visit.eyebrow),
      title: normText(visit.title, d.visit.title),
      lede: normText(visit.lede, d.visit.lede),
      instagramSubtitle: normText(visit.instagramSubtitle, d.visit.instagramSubtitle),
      choices: {
        google: normChoice(visitChoices.google, d.visit.choices.google),
        tripadvisor: normChoice(visitChoices.tripadvisor, d.visit.choices.tripadvisor),
        private: normChoice(visitChoices.private, d.visit.choices.private),
      },
    },
    faq: {
      title: normText(faq.title, d.faq.title),
      items: Array.isArray(faq.items)
        ? faq.items.filter(isObj).map((item, i) => ({
            id: normString(item.id, `faq-${i + 1}`),
            question: normTextLoose(item.question),
            answer: normTextLoose(item.answer),
          }))
        : d.faq.items.map((f) => ({ ...f, question: { ...f.question }, answer: { ...f.answer } })),
    },
    categories: {
      coffee: normCategory(categories.coffee, d.categories.coffee),
      cocktails: normCategory(categories.cocktails, d.categories.cocktails),
      spirits: normCategory(categories.spirits, d.categories.spirits),
      food: normCategory(categories.food, d.categories.food),
    },
    venue: {
      address: normString(venue.address, d.venue.address),
      phone: normString(venue.phone, d.venue.phone),
      email: normString(venue.email, d.venue.email),
      instagramHandle: normString(venue.instagramHandle, d.venue.instagramHandle),
      mapsLink: normString(venue.mapsLink, d.venue.mapsLink),
      lat: normNumber(venue.lat, d.venue.lat),
      lng: normNumber(venue.lng, d.venue.lng),
    },
    illustrations: {
      homeAbout: normIllustration(illustrations.homeAbout),
      homeVisit: normIllustration(illustrations.homeVisit),
      menuEmpty: normIllustration(illustrations.menuEmpty),
    },
  };
}

/* ============================================================
   Cache + storage plumbing
   ============================================================ */

const STORAGE_KEY = "homeseaside_site_content_v1";
const PREVIEW_KEY = "homeseaside_site_content_preview_v1";

export const SITE_CONTENT_STORAGE_KEY = STORAGE_KEY;
export const SITE_CONTENT_PREVIEW_KEY = PREVIEW_KEY;

/**
 * localStorage holds the RAW server overrides hash (sparse), not the merged
 * result — so fields the admin never touched keep tracking code defaults
 * across deploys instead of freezing at whatever the defaults were when the
 * cache was last written.
 */
function readRaw(key: string): unknown | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

let liveCache: SiteContent = normalizeSiteContent(readRaw(STORAGE_KEY));
let previewCache: SiteContent | null = (() => {
  const raw = readRaw(PREVIEW_KEY);
  return raw === null ? null : normalizeSiteContent(raw);
})();

function broadcast(key: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new StorageEvent("storage", { key }));
}

/**
 * Re-read both keys from localStorage into the module caches. Storage-event
 * subscribers (useSiteContent) call this so OTHER tabs pick up changes —
 * a real cross-tab StorageEvent doesn't update this module's caches by
 * itself.
 */
export function refreshSiteContentFromStorage(): void {
  liveCache = normalizeSiteContent(readRaw(STORAGE_KEY));
  const raw = readRaw(PREVIEW_KEY);
  previewCache = raw === null ? null : normalizeSiteContent(raw);
}

/** Current content: the preview draft while previewing, else live. */
export function getSiteContent(): SiteContent {
  return previewCache ?? liveCache;
}

/** Always the live/published content — editor seeding must not be
 *  contaminated by an active preview. */
export function getPublishedSiteContent(): SiteContent {
  return liveCache;
}

function writeLive(raw: unknown): void {
  liveCache = normalizeSiteContent(raw);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(raw ?? {}));
  }
  broadcast(STORAGE_KEY);
}

/* ── Preview ─────────────────────────────────────────────────────────── */

export function isContentPreviewActive(): boolean {
  return previewCache !== null;
}

export function enterContentPreview(draft: SiteContent): void {
  previewCache = normalizeSiteContent(draft);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(PREVIEW_KEY, JSON.stringify(draft));
  }
  broadcast(PREVIEW_KEY);
}

export function exitContentPreview(): void {
  previewCache = null;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(PREVIEW_KEY);
  }
  broadcast(PREVIEW_KEY);
}

/* ── Server lifecycle ────────────────────────────────────────────────── */

/**
 * Hydrate the live cache from the server. Called once at app boot. Writes
 * ONLY the live key — an active preview survives hard refreshes. Silent on
 * failure (cached/default values keep rendering).
 */
export async function loadSiteContentFromServer(): Promise<void> {
  try {
    const payload = await fetchSiteSetting();
    writeLive(payload.site_content ?? {});
  } catch {
    // Stay on cached/default values silently.
  }
}

export interface ContentDraftState {
  draft: SiteContent | null;
  hasPrevious: boolean;
  draftSavedAt: string | null;
  publishedAt: string | null;
}

export async function fetchContentDraft(): Promise<ContentDraftState> {
  const payload = await fetchSiteContentDraft();
  return {
    draft: payload.site_content_draft == null ? null : normalizeSiteContent(payload.site_content_draft),
    hasPrevious: payload.has_previous,
    draftSavedAt: payload.draft_saved_at,
    publishedAt: payload.published_at,
  };
}

export async function saveContentDraft(content: SiteContent): Promise<ContentDraftState> {
  const payload = await saveSiteContentDraft(content);
  return {
    draft: payload.site_content_draft == null ? null : normalizeSiteContent(payload.site_content_draft),
    hasPrevious: payload.has_previous,
    draftSavedAt: payload.draft_saved_at,
    publishedAt: payload.published_at,
  };
}

export async function discardContentDraft(): Promise<void> {
  await discardSiteContentDraft();
  exitContentPreview();
}

/** Publish the server draft. On success the live cache (and every open page
 *  in this browser) updates immediately, and preview mode ends. */
export async function publishContent(): Promise<{ hasPrevious: boolean }> {
  const payload = await publishSiteContent();
  writeLive(payload.site_content ?? {});
  exitContentPreview();
  return { hasPrevious: payload.has_previous };
}

/** Swap live ↔ previous on the server and refresh the live cache. */
export async function revertContent(): Promise<{ hasPrevious: boolean }> {
  const payload = await revertSiteContent();
  writeLive(payload.site_content ?? {});
  return { hasPrevious: payload.has_previous };
}

/* ============================================================
   Publish validation — both languages required, photos resolvable
   ============================================================ */

export interface PublishError {
  /** Machine path, e.g. "about.chapters[1].title" */
  path: string;
  /** Human label, e.g. "About · Chapter 2 · Title" */
  label: string;
  problem: string;
}

function checkText(errors: PublishError[], lt: LocalizedText, path: string, label: string): void {
  const enBlank = lt.en.trim() === "";
  const elBlank = lt.el.trim() === "";
  if (enBlank && elBlank) errors.push({ path, label, problem: "missing both languages" });
  else if (enBlank) errors.push({ path, label, problem: "missing English" });
  else if (elBlank) errors.push({ path, label, problem: "missing Greek" });
}

function checkPhoto(errors: PublishError[], ref: ContentPhotoRef, path: string, label: string): void {
  if (ref.kind === "bundled") {
    if (!ref.slug || !ALBUM1_PHOTOS[ref.slug]) {
      errors.push({ path, label, problem: "photo not selected" });
    }
  } else if (!ref.url) {
    errors.push({ path, label, problem: "photo upload incomplete" });
  }
}

export function validateForPublish(c: SiteContent): PublishError[] {
  const errors: PublishError[] = [];

  // Home
  checkText(errors, c.home.heroSubtitle, "home.heroSubtitle", "Home · Hero subtitle");
  checkText(errors, c.home.journeyTitle, "home.journeyTitle", "Home · Journey title");
  checkText(errors, c.home.about.title, "home.about.title", "Home · About block · Title");
  checkText(errors, c.home.about.body, "home.about.body", "Home · About block · Text");
  checkText(errors, c.home.about.ctaLabel, "home.about.ctaLabel", "Home · About block · Link label");
  checkText(errors, c.home.visit.title, "home.visit.title", "Home · Visit block · Title");
  checkText(errors, c.home.visit.body, "home.visit.body", "Home · Visit block · Text");
  checkText(errors, c.home.visit.ctaLabel, "home.visit.ctaLabel", "Home · Visit block · Link label");
  checkText(errors, c.home.hours.title, "home.hours.title", "Home · Hours · Title");
  if (c.home.hours.rows.length === 0) {
    errors.push({ path: "home.hours.rows", label: "Home · Hours", problem: "needs at least one row" });
  }
  c.home.hours.rows.forEach((row, i) => {
    checkText(errors, row.day, `home.hours.rows[${i}].day`, `Home · Hours · Row ${i + 1} · Day`);
    if (row.time.trim() === "") {
      errors.push({ path: `home.hours.rows[${i}].time`, label: `Home · Hours · Row ${i + 1} · Time`, problem: "empty value" });
    }
  });
  checkText(errors, c.home.contactTitle, "home.contactTitle", "Home · Contact title");

  // About
  checkText(errors, c.about.eyebrow, "about.eyebrow", "About · Eyebrow");
  checkText(errors, c.about.title, "about.title", "About · Title");
  checkText(errors, c.about.lede, "about.lede", "About · Intro");
  checkPhoto(errors, c.about.heroPhoto, "about.heroPhoto", "About · Hero photo");
  checkText(errors, c.about.heroAlt, "about.heroAlt", "About · Hero photo alt text");
  if (c.about.chapters.length === 0) {
    errors.push({ path: "about.chapters", label: "About · Chapters", problem: "needs at least one chapter" });
  }
  c.about.chapters.forEach((ch, i) => {
    checkText(errors, ch.title, `about.chapters[${i}].title`, `About · Chapter ${i + 1} · Title`);
    checkText(errors, ch.body, `about.chapters[${i}].body`, `About · Chapter ${i + 1} · Text`);
    checkPhoto(errors, ch.photo, `about.chapters[${i}].photo`, `About · Chapter ${i + 1} · Photo`);
    checkText(errors, ch.photoAlt, `about.chapters[${i}].photoAlt`, `About · Chapter ${i + 1} · Photo alt text`);
  });

  // Visit
  checkText(errors, c.visit.eyebrow, "visit.eyebrow", "Visit · Eyebrow");
  checkText(errors, c.visit.title, "visit.title", "Visit · Title");
  checkText(errors, c.visit.lede, "visit.lede", "Visit · Intro");
  checkText(errors, c.visit.instagramSubtitle, "visit.instagramSubtitle", "Visit · Instagram subtitle");
  (
    [
      ["google", "Google review block"],
      ["tripadvisor", "TripAdvisor review block"],
      ["private", "Private feedback block"],
    ] as const
  ).forEach(([key, label]) => {
    checkText(errors, c.visit.choices[key].title, `visit.choices.${key}.title`, `Visit · ${label} · Title`);
    checkText(errors, c.visit.choices[key].description, `visit.choices.${key}.description`, `Visit · ${label} · Description`);
  });

  // FAQ
  checkText(errors, c.faq.title, "faq.title", "FAQ · Section title");
  if (c.faq.items.length === 0) {
    errors.push({ path: "faq.items", label: "FAQ", problem: "needs at least one question" });
  }
  c.faq.items.forEach((item, i) => {
    checkText(errors, item.question, `faq.items[${i}].question`, `FAQ · Question ${i + 1}`);
    checkText(errors, item.answer, `faq.items[${i}].answer`, `FAQ · Answer ${i + 1}`);
  });

  // Categories
  (
    [
      ["coffee", "Coffee"],
      ["cocktails", "Cocktails"],
      ["spirits", "Spirits"],
      ["food", "Food"],
    ] as const
  ).forEach(([key, label]) => {
    const cat = c.categories[key];
    checkText(errors, cat.metaTitle, `categories.${key}.metaTitle`, `Categories · ${label} · Browser title`);
    checkText(errors, cat.metaDescription, `categories.${key}.metaDescription`, `Categories · ${label} · Search description`);
    checkText(errors, cat.h1, `categories.${key}.h1`, `Categories · ${label} · Heading`);
    checkText(errors, cat.body, `categories.${key}.body`, `Categories · ${label} · Text`);
  });

  // Venue
  (
    [
      ["address", "Address"],
      ["phone", "Phone"],
      ["email", "Email"],
      ["instagramHandle", "Instagram handle"],
      ["mapsLink", "Google Maps link"],
    ] as const
  ).forEach(([key, label]) => {
    if (c.venue[key].trim() === "") {
      errors.push({ path: `venue.${key}`, label: `Business info · ${label}`, problem: "empty value" });
    }
  });
  if (!Number.isFinite(c.venue.lat) || c.venue.lat < -90 || c.venue.lat > 90) {
    errors.push({ path: "venue.lat", label: "Business info · Latitude", problem: "invalid coordinates" });
  }
  if (!Number.isFinite(c.venue.lng) || c.venue.lng < -180 || c.venue.lng > 180) {
    errors.push({ path: "venue.lng", label: "Business info · Longitude", problem: "invalid coordinates" });
  }

  return errors;
}
