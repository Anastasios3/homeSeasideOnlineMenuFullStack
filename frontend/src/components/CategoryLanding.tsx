import { type FC } from "react";
import { Link, Navigate } from "react-router-dom";
import MenuSection from "./MenuSection";
import { useDocumentMeta } from "../seo";
import "../styles/CategoryLanding.css";

type Language = "EN" | "EL";
type CategorySlug = "coffee" | "cocktails" | "spirits" | "food";

interface CategoryLandingProps {
  language: Language;
  category: string;
}

/** Maps a public URL slug to the backend's main_category id. */
const SLUG_TO_MAIN: Record<CategorySlug, "coffee" | "cocktails" | "spirits" | "food"> = {
  coffee: "coffee",
  cocktails: "cocktails",
  spirits: "spirits",
  food: "food",
};

interface Copy {
  title: string;
  description: string;
  h1: string;
  body: React.ReactNode;
}

const COPY: Record<CategorySlug, { EN: Copy; EL: Copy }> = {
  coffee: {
    EN: {
      title: "Specialty Coffee in Rethymno — Home Seaside",
      description: "Specialty coffee on the Rethymno seafront. Freshly brewed espresso, flat whites, pour-overs, and seasonal coffee drinks at Home Seaside.",
      h1: "Specialty Coffee in Rethymno",
      body: (
        <>
          <p>
            Our coffee programme is built around fresh beans, careful brew
            temperatures, and the kind of patience that doesn't rush a drink
            out the door. Espresso is the backbone — pulled short, dialled in
            daily — and from there we build flat whites, cappuccinos, long
            blacks, cortados, and the seasonal iced menu that gets us through
            a Cretan summer.
          </p>
          <p>
            If you're looking for <strong>specialty coffee in Rethymno</strong>,
            this is one of the spots locals come back to. Sit by the window,
            take an hour, watch the sea while the cup goes cold. Pair with
            brunch from the kitchen or the honeycomb-on-yogurt that's been on
            the menu since day one.
          </p>
        </>
      ),
    },
    EL: {
      title: "Specialty καφές στο Ρέθυμνο — Home Seaside",
      description: "Specialty καφές στην παραλιακή του Ρεθύμνου. Φρέσκος espresso, flat white, pour-over και εποχιακά coffee drinks στο Home Seaside.",
      h1: "Specialty καφές στο Ρέθυμνο",
      body: (
        <>
          <p>
            Το coffee programme μας είναι χτισμένο γύρω από φρέσκους κόκκους,
            σωστές θερμοκρασίες brewing και υπομονή που δεν βιάζει τον καφέ
            να φύγει. Ο espresso είναι η ραχοκοκαλιά — short, ρυθμισμένος
            καθημερινά — και από εκεί χτίζουμε flat whites, cappuccinos, long
            blacks, cortados και την εποχιακή κρύα κάρτα για το καλοκαίρι.
          </p>
          <p>
            Αν ψάχνεις <strong>specialty καφέ στο Ρέθυμνο</strong>, είμαστε
            ένα από τα μέρη όπου επιστρέφουν οι ντόπιοι. Κάτσε δίπλα στο
            παράθυρο, πάρε μία ώρα, κοίτα τη θάλασσα ενώ ο καφές κρυώνει.
            Συνδύασε με brunch ή με την κηρήθρα-με-γιαούρτι που μένει στο
            μενού από την πρώτη μέρα.
          </p>
        </>
      ),
    },
  },
  cocktails: {
    EN: {
      title: "Cocktails in Rethymno — Advanced Techniques at Home Seaside",
      description: "Handcrafted cocktails on the Rethymno seafront. Classics built properly and signature drinks using advanced techniques at Home Seaside Bar & More.",
      h1: "Handcrafted cocktails by the sea",
      body: (
        <>
          <p>
            Cocktails at Home Seaside are made the slow way. Fresh juices
            pressed to order, syrups built in-house, ice cut to fit the glass.
            Our bartenders have spent years on these recipes — both the
            classics (a properly built Negroni, a balanced Old Fashioned, a
            Daiquiri with our preferred rum) and signature drinks that lean
            into <strong>advanced cocktail techniques</strong>: fat-washing,
            clarified juices, controlled dilution, smoke, considered garnishes.
          </p>
          <p>
            If you're hunting for <strong>high quality cocktails in Rethymno</strong>,
            sit at the bar, tell us what you like, and let the team build
            something for you. The cocktail list is a starting point, not a
            cage.
          </p>
        </>
      ),
    },
    EL: {
      title: "Cocktails στο Ρέθυμνο — Εξελιγμένες τεχνικές στο Home Seaside",
      description: "Handcrafted cocktails στην παραλιακή του Ρεθύμνου. Κλασικά φτιαγμένα σωστά και signature ποτά με εξελιγμένες τεχνικές στο Home Seaside Bar & More.",
      h1: "Handcrafted cocktails δίπλα στη θάλασσα",
      body: (
        <>
          <p>
            Τα cocktails στο Home Seaside φτιάχνονται με την αργή μέθοδο.
            Φρέσκοι χυμοί στιγμής, σιρόπια εσωτερικής παρασκευής, πάγος κομμένος
            στο μέγεθος του ποτηριού. Οι bartender μας δουλεύουν χρόνια αυτές
            τις συνταγές — τόσο τα κλασικά (σωστά φτιαγμένο Negroni, ισορροπημένο
            Old Fashioned, Daiquiri με το αγαπημένο μας ρούμι) όσο και signature
            ποτά που αξιοποιούν <strong>εξελιγμένες τεχνικές cocktail</strong>:
            fat-washing, διαυγασμένους χυμούς, ελεγχόμενη αραίωση, καπνισμό,
            μελετημένα garnish.
          </p>
          <p>
            Αν ψάχνεις <strong>cocktails υψηλής ποιότητας στο Ρέθυμνο</strong>,
            κάτσε στο μπαρ, πες μας τι σου αρέσει και άφησε την ομάδα να
            φτιάξει κάτι για σένα. Η λίστα cocktails είναι αφετηρία, όχι
            φυλακή.
          </p>
        </>
      ),
    },
  },
  spirits: {
    EN: {
      title: "Rum & Spirits in Rethymno — Home Seaside",
      description: "One of the deepest rum selections in Rethymno alongside aged whisky, gin, mezcal and agave spirits. Home Seaside Bar & More on the seafront.",
      h1: "Rum selection & fine spirits at Home Seaside",
      body: (
        <>
          <p>
            We're a <strong>rum bar at heart</strong>. Home Seaside keeps one
            of the deepest rum selections in Rethymno — Jamaican funk, French
            agricoles, Spanish-style aged sippers, Demerara classics, and
            single-estate bottlings tucked in for the people who know. If
            you've been chasing a particular expression on Crete, this is the
            short list of places worth checking.
          </p>
          <p>
            Around the rum live the rest of the spirits programme: aged
            whiskies, a serious gin shelf, mezcal and tequila for the agave
            crowd, and small-batch finds we picked up because they were good.
            Tell us what you're after; we'll either pour it or recommend the
            next best thing on the shelf.
          </p>
        </>
      ),
    },
    EL: {
      title: "Ρούμι & spirits στο Ρέθυμνο — Home Seaside",
      description: "Μία από τις μεγαλύτερες συλλογές ρουμιού στο Ρέθυμνο, μαζί με παλαιωμένα whisky, gin, mezcal και agave spirits. Home Seaside Bar & More.",
      h1: "Συλλογή ρουμιού & εκλεκτά spirits στο Home Seaside",
      body: (
        <>
          <p>
            Είμαστε <strong>rum bar στην καρδιά μας</strong>. Το Home Seaside
            διατηρεί μία από τις μεγαλύτερες συλλογές ρουμιού στο Ρέθυμνο —
            Jamaican funk, French agricoles, ισπανικού στυλ παλαιωμένα,
            Demerara classics και single-estate εμφιαλώσεις για όσους ξέρουν.
            Αν ψάχνεις κάποια συγκεκριμένη εμφιάλωση στην Κρήτη, είμαστε στη
            σύντομη λίστα μερών που αξίζει να ελέγξεις.
          </p>
          <p>
            Γύρω από το ρούμι ζει το υπόλοιπο spirits programme: παλαιωμένα
            whisky, σοβαρό ράφι gin, mezcal και tequila για τους λάτρεις της
            agave, και small-batch ευρήματα που φέραμε γιατί ήταν καλά. Πες μας
            τι θες — θα σου σερβίρουμε ή θα προτείνουμε το επόμενο καλύτερο.
          </p>
        </>
      ),
    },
  },
  food: {
    EN: {
      title: "Comfort Food on the Rethymno Seafront — Home Seaside",
      description: "Comfort food at Home Seaside Bar & More, on the Rethymno seafront in Crete. Brunch, salads, sandwiches, pizza, Mediterranean small plates — served all day.",
      h1: "Comfort food on the Rethymno seafront",
      body: (
        <>
          <p>
            The kitchen at Home Seaside runs from opening to close, and the
            menu leans into <strong>comfort food</strong> done well: brunch
            plates in the morning, salads and toasted sandwiches through
            lunch, Mediterranean small plates in the afternoon, and pizza
            with the rest of the dinner crowd into the night.
          </p>
          <p>
            Sourcing is local where it should be — Cretan produce, olive oil,
            cheese — and generous everywhere it can be. If you're after
            <strong> comfort food in Rethymno</strong> that pairs with sea
            views and a long afternoon, this is the right spot.
          </p>
        </>
      ),
    },
    EL: {
      title: "Comfort φαγητό στην παραλιακή του Ρεθύμνου — Home Seaside",
      description: "Comfort φαγητό στο Home Seaside Bar & More, στην παραλιακή του Ρεθύμνου στην Κρήτη. Brunch, σαλάτες, σάντουιτς, πίτσα, μεσογειακοί μεζέδες όλη μέρα.",
      h1: "Comfort φαγητό στην παραλιακή του Ρεθύμνου",
      body: (
        <>
          <p>
            Η κουζίνα στο Home Seaside δουλεύει από το άνοιγμα μέχρι το
            κλείσιμο και το μενού δίνει βαρύτητα στο <strong>comfort φαγητό</strong>{" "}
            φτιαγμένο σωστά: πιάτα brunch το πρωί, σαλάτες και ψητά σάντουιτς
            το μεσημέρι, μεσογειακοί μεζέδες το απόγευμα και πίτσα μαζί με
            τη βραδινή παρέα.
          </p>
          <p>
            Οι πρώτες ύλες είναι τοπικές όπου ταιριάζει — κρητικά προϊόντα,
            ελαιόλαδο, τυρί — και πάντα γενναιόδωρες. Αν ψάχνεις{" "}
            <strong>comfort φαγητό στο Ρέθυμνο</strong> που συνοδεύεται με θέα
            θάλασσα και ένα μεγάλο απόγευμα, αυτό είναι το μέρος.
          </p>
        </>
      ),
    },
  },
};

const isCategorySlug = (s: string): s is CategorySlug =>
  s === "coffee" || s === "cocktails" || s === "spirits" || s === "food";

/** Inner content — only mounts when the slug is known. Hooks live here so
 * the early-return guard in the parent doesn't violate rules-of-hooks. */
const CategoryLandingContent: FC<{ language: Language; category: CategorySlug }> = ({
  language, category,
}) => {
  const copy = COPY[category][language];

  useDocumentMeta({
    title: copy.title,
    description: copy.description,
    canonicalPath: `/menu/${category}`,
  });

  return (
    <article className="category-landing">
      <header className="category-landing__header">
        <h1 className="category-landing__title">{copy.h1}</h1>
        <div className="category-landing__prose">{copy.body}</div>
      </header>

      <section className="category-landing__menu" aria-label={language === "EN" ? "Menu items" : "Είδη μενού"}>
        <MenuSection language={language} activeCategory={SLUG_TO_MAIN[category]} />
      </section>

      <nav className="category-landing__related" aria-label={language === "EN" ? "Related categories" : "Σχετικές κατηγορίες"}>
        {(["coffee", "cocktails", "spirits", "food"] as const)
          .filter((c) => c !== category)
          .map((c) => (
            <Link key={c} to={`/menu/${c}`}>
              {COPY[c][language].h1} →
            </Link>
          ))}
      </nav>
    </article>
  );
};

/** Top-level component — validates the slug, then mounts the inner content
 * (which is where the hooks live). Unknown slugs redirect to /menu, so Google
 * sees a single canonical menu URL instead of soft 404s. */
const CategoryLanding: FC<CategoryLandingProps> = ({ language, category }) => {
  if (!isCategorySlug(category)) {
    return <Navigate to="/menu" replace />;
  }
  return <CategoryLandingContent language={language} category={category} />;
};

export default CategoryLanding;
