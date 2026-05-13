import { type FC } from "react";
import { Link } from "react-router-dom";
import { ALBUM1_PHOTOS, type PhotoMeta } from "../assets/photos/album1";
import { useDocumentMeta } from "../seo";
import Picture from "./Picture";
import "../styles/AboutPage.css";

interface AboutPageProps {
  language: "EN" | "EL";
}

interface Chapter {
  photo: PhotoMeta | undefined;
  altEN: string;
  altEL: string;
  titleEN: string;
  titleEL: string;
  bodyEN: React.ReactNode;
  bodyEL: React.ReactNode;
}

/**
 * /about — photo-led storytelling. The hero anchors the page in the
 * seafront, then alternating photo+text chapters carry the visitor through
 * a day at Home Seaside: coffee, the bar, the kitchen, the room, and how
 * to find us. Warm and understated copy in EN + EL. Roughly 700 words per
 * language. Plain-text paragraphs hold the E-E-A-T weight and the repeated
 * entity name; the photos do the rest of the talking.
 */
const AboutPage: FC<AboutPageProps> = ({ language }) => {
  useDocumentMeta({
    title: language === "EN"
      ? "About Home Seaside — Seafront Café & Bar in Rethymno"
      : "Σχετικά με το Home Seaside — Παραθαλάσσιο café & bar στο Ρέθυμνο",
    description: language === "EN"
      ? "The story behind Home Seaside Bar & More in Rethymno, Crete. A seafront café and cocktail bar known for specialty coffee, an extensive rum selection, and comfort food."
      : "Η ιστορία πίσω από το Home Seaside Bar & More στο Ρέθυμνο της Κρήτης. Παραθαλάσσιο café και cocktail bar γνωστό για specialty καφέ, μεγάλη συλλογή ρουμιού και comfort φαγητό.",
    canonicalPath: "/about",
  });

  const heroPhoto = ALBUM1_PHOTOS["food-session-6"]
    ?? ALBUM1_PHOTOS["food-session-36"]
    ?? ALBUM1_PHOTOS["food-session-69"];

  const heroAltEN = "The Home Seaside terrace on the Rethymno seafront, Crete";
  const heroAltEL = "Η βεράντα του Home Seaside στην παραλιακή του Ρεθύμνου";

  const chapters: Chapter[] = [
    {
      photo: ALBUM1_PHOTOS["food-session-8"] ?? ALBUM1_PHOTOS["food-session-15"],
      altEN: "Espresso and brunch on a sunny morning at Home Seaside",
      altEL: "Espresso και brunch ένα ηλιόλουστο πρωινό στο Home Seaside",
      titleEN: "Mornings start slow",
      titleEL: "Τα πρωινά ξεκινούν αργά",
      bodyEN: (
        <>
          <p>
            The espresso machine starts at nine. Fresh juice on the bar
            before the sun finds the terrace. The first regulars come in
            for a cortado and the newspaper, and we are happy to leave
            them to it.
          </p>
          <p>
            We take coffee seriously without making a fuss about it.
            Fresh beans, careful temperatures, latte art that arrives
            without comment. Brunch carries the morning — eggs cooked
            how you ask, honeycomb spooned over thick yogurt, toast that
            smells of the kitchen. If you want to nurse a long flat
            white by the window, this is the place for it.
          </p>
        </>
      ),
      bodyEL: (
        <>
          <p>
            Η μηχανή του espresso ξεκινάει στις εννιά. Φρέσκος χυμός
            στο μπαρ πριν ο ήλιος βρει τη βεράντα. Οι πρώτοι θαμώνες
            έρχονται για έναν cortado και την εφημερίδα, και τους
            αφήνουμε ευχαρίστως στην ησυχία τους.
          </p>
          <p>
            Παίρνουμε τον καφέ στα σοβαρά χωρίς να το κάνουμε θέμα.
            Φρέσκοι κόκκοι, σωστές θερμοκρασίες, latte art χωρίς
            φιγούρες. Το brunch κρατάει το πρωί — αυγά όπως τα ζητάς,
            κηρήθρα πάνω σε πηχτό γιαούρτι, τοστ που μυρίζει κουζίνα.
            Αν θες να αργήσεις πάνω από έναν flat white δίπλα στο
            παράθυρο, εδώ είναι το μέρος.
          </p>
        </>
      ),
    },
    {
      photo: ALBUM1_PHOTOS["food-session-64"] ?? ALBUM1_PHOTOS["food-session-69"],
      altEN: "The bar at Home Seaside, lined with rum bottles, in the early evening",
      altEL: "Το μπαρ του Home Seaside με μπουκάλια ρουμιού, νωρίς το βράδυ",
      titleEN: "A bar built on rum and time",
      titleEL: "Ένα μπαρ χτισμένο στο ρούμι και τον χρόνο",
      bodyEN: (
        <>
          <p>
            The back of the bar is one of the deepest rum selections on
            the island. Agricoles from Martinique. Aged Jamaicans.
            Single-estate bottlings from Guatemala, Barbados, the
            Philippines. Some are for sipping neat with a slice of dark
            chocolate. Some we use in cocktails our bartenders have
            been refining for years.
          </p>
          <p>
            Order a classic and we will build it properly. Order
            something signature and we will tell you what is in it.
            Ask for a recommendation — that is what we like best. The
            night unfolds at whatever pace you want; we keep the
            shaker moving until it stops feeling right.
          </p>
        </>
      ),
      bodyEL: (
        <>
          <p>
            Πίσω από το μπαρ βρίσκεται μία από τις μεγαλύτερες
            συλλογές ρουμιού στο νησί. Agricoles από τη Μαρτινίκα.
            Παλαιωμένα της Τζαμάικα. Single-estate εμφιαλώσεις από
            Γουατεμάλα, Μπαρμπέιντος, Φιλιππίνες. Άλλα τα πίνεις
            σκέτα με μια φέτα μαύρη σοκολάτα. Άλλα μπαίνουν σε
            cocktails που οι bartender μας τελειοποιούν χρόνια.
          </p>
          <p>
            Παράγγειλε ένα κλασικό και θα φτιαχτεί σωστά. Παράγγειλε
            κάτι signature και θα σου πούμε τι έχει μέσα. Ζήτα μια
            πρόταση — αυτό μας αρέσει περισσότερο. Η βραδιά
            ξεδιπλώνεται στον ρυθμό σου· κρατάμε το shaker σε
            κίνηση όσο νιώθει σωστό.
          </p>
        </>
      ),
    },
    {
      photo: ALBUM1_PHOTOS["food-session-15"] ?? ALBUM1_PHOTOS["food-session-34"],
      altEN: "A toasted sandwich and side salad at Home Seaside, mid-afternoon",
      altEL: "Ψητό σάντουιτς και σαλάτα στο Home Seaside, μεσημεριανές ώρες",
      titleEN: "Food that doesn't rush",
      titleEL: "Φαγητό χωρίς βιασύνη",
      bodyEN: (
        <>
          <p>
            The kitchen runs from opening to close, which means there
            is no awkward gap between meals. Brunch carries into
            lunch. Lunch slides into long plates and snacks. Dinner
            arrives with pizza from the oven and Mediterranean small
            plates meant to share. The menu changes a little with the
            season; the spirit of it does not.
          </p>
          <p>
            Sourcing is local where it should be — Cretan olive oil,
            cheeses from the mountain villages, fish landed at the
            harbour up the road. The plates are generous, the portions
            unfussy. Stay through three courses or just split a salad
            with a glass of wine. Both are welcome.
          </p>
        </>
      ),
      bodyEL: (
        <>
          <p>
            Η κουζίνα δουλεύει από το άνοιγμα μέχρι το κλείσιμο, που
            σημαίνει ότι δεν υπάρχει νεκρή ώρα ανάμεσα στα γεύματα.
            Το brunch γίνεται μεσημέρι. Το μεσημέρι κυλάει σε μεγάλα
            πιάτα και σνακ. Το βράδυ έρχεται με πίτσα από τον φούρνο
            και μεσογειακούς μεζέδες για να μοιραστούν. Το μενού
            αλλάζει λίγο με την εποχή· ο χαρακτήρας του όχι.
          </p>
          <p>
            Πρώτες ύλες από εδώ όπου ταιριάζει — κρητικό λάδι,
            τυριά από τα ορεινά χωριά, ψάρι από το λιμάνι πιο πάνω.
            Τα πιάτα είναι γενναιόδωρα, οι μερίδες ανεπιτήδευτες.
            Μείνε για τρία πιάτα ή μοιράσου μια σαλάτα με ένα ποτήρι
            κρασί. Και τα δύο ευπρόσδεκτα.
          </p>
        </>
      ),
    },
    {
      photo: ALBUM1_PHOTOS["food-session-69"] ?? ALBUM1_PHOTOS["food-session-36"],
      altEN: "The interior of Home Seaside in the late afternoon light",
      altEL: "Ο εσωτερικός χώρος του Home Seaside στο απογευματινό φως",
      titleEN: "The room",
      titleEL: "Ο χώρος",
      bodyEN: (
        <>
          <p>
            Most of the tables face the sea. A covered terrace handles
            breezier afternoons; shaded seats catch the summer
            instead of the sun. Inside, the room turns warm in winter
            and stays cool in August. Cappuccinos at ten, spritzes by
            five, the room shifts with the light.
          </p>
          <p>
            The crowd is a mix — locals on long lunches, travellers
            who walked over from the Old Town, families who come back
            every summer and ask about the dog. We are happy to host
            any of them, for as long as they would like to stay. No
            one is going to rush you out.
          </p>
        </>
      ),
      bodyEL: (
        <>
          <p>
            Τα περισσότερα τραπέζια κοιτούν τη θάλασσα. Η σκεπαστή
            βεράντα δουλεύει στα πιο δροσερά απογεύματα· τα
            σκιαζόμενα τραπέζια κρατούν το καλοκαίρι μακριά από τον
            ήλιο. Μέσα, ο χώρος γίνεται ζεστός τον χειμώνα και μένει
            δροσερός τον Αύγουστο. Καπουτσίνο στις δέκα, spritz
            στις πέντε — ο χώρος αλλάζει με το φως.
          </p>
          <p>
            Ο κόσμος είναι ένα μείγμα — ντόπιοι σε μεγάλα μεσημέρια,
            ταξιδιώτες που περπάτησαν από την Παλιά Πόλη,
            οικογένειες που έρχονται κάθε καλοκαίρι και ρωτούν για
            τον σκύλο. Φιλοξενούμε ευχαρίστως όλους τους, για όσο
            θέλουν να μείνουν. Κανείς δεν θα σε βιάσει να φύγεις.
          </p>
        </>
      ),
    },
    {
      photo: ALBUM1_PHOTOS["food-session-34"] ?? ALBUM1_PHOTOS["food-session-35"],
      altEN: "The Rethymno seafront promenade leading to Home Seaside",
      altEL: "Η παραλιακή του Ρεθύμνου που οδηγεί στο Home Seaside",
      titleEN: "Finding us",
      titleEL: "Πώς μας βρίσκεις",
      bodyEN: (
        <>
          <p>
            Leof. Emmanouil Kefalogianni 18, on the Rethymno seafront
            promenade, two minutes' walk from the Fortezza and the
            Old Venetian Harbour. From the Old Town, follow the water
            east — you will see us before you arrive.
          </p>
          <p>
            Walk-ins are always welcome. For larger groups or weekend
            evenings, a quick call ahead is the kind move:{" "}
            <a href="tel:+302831022782">+30 2831 022782</a>. For the
            daily rhythm — new arrivals on the bar, what came out of
            the kitchen this morning — follow{" "}
            <a
              href="https://www.instagram.com/home_seaside"
              target="_blank"
              rel="noopener noreferrer"
            >
              @home_seaside
            </a>
            .
          </p>
        </>
      ),
      bodyEL: (
        <>
          <p>
            Λεωφ. Εμμανουήλ Κεφαλογιάννη 18, στην παραλιακή του
            Ρεθύμνου, δύο λεπτά με τα πόδια από τη Φορτέτζα και το
            Παλιό Ενετικό Λιμάνι. Από την Παλιά Πόλη, ακολούθα τη
            θάλασσα ανατολικά — θα μας δεις πριν φτάσεις.
          </p>
          <p>
            Walk-ins πάντα ευπρόσδεκτα. Για μεγαλύτερες παρέες ή
            βράδια Σαββατοκύριακου, μια γρήγορη κλήση εκ των
            προτέρων είναι καλή κίνηση:{" "}
            <a href="tel:+302831022782">+30 2831 022782</a>. Για την
            καθημερινή ροή — τι νέο μπήκε στο μπαρ, τι βγήκε από την
            κουζίνα σήμερα — ακολούθα μας στο{" "}
            <a
              href="https://www.instagram.com/home_seaside"
              target="_blank"
              rel="noopener noreferrer"
            >
              @home_seaside
            </a>
            .
          </p>
        </>
      ),
    },
  ];

  if (language === "EN") {
    return (
      <article className="about">
        <header className="about__header">
          <p className="about__eyebrow">Home Seaside, Rethymno</p>
          <h1 className="about__title">An ordinary day on the Rethymno seafront</h1>
          <p className="about__lede">
            Home Seaside Bar &amp; More is a seafront café and cocktail bar
            on the Rethymno promenade in Crete — two minutes' walk from
            the Fortezza and the Old Venetian Harbour. We open at nine
            for coffee and stay until the night feels finished.
          </p>
        </header>

        {heroPhoto && (
          <figure className="about__hero">
            <Picture
              photo={heroPhoto}
              alt={heroAltEN}
              sizes="(min-width: 1200px) 1100px, 100vw"
            />
          </figure>
        )}

        <section className="about__story">
          {chapters.map((chapter, idx) => (
            <div
              key={chapter.titleEN}
              className={`about__chapter about__chapter--${idx % 2 === 0 ? "left" : "right"}`}
            >
              {chapter.photo && (
                <figure className="about__chapter-photo">
                  <Picture
                    photo={chapter.photo}
                    alt={chapter.altEN}
                    sizes="(min-width: 1024px) 50vw, 100vw"
                  />
                </figure>
              )}
              <div className="about__chapter-text">
                <h2>{chapter.titleEN}</h2>
                {chapter.bodyEN}
              </div>
            </div>
          ))}
        </section>

        <nav className="about__related" aria-label="Related menu pages">
          <Link to="/menu/coffee">Specialty coffee →</Link>
          <Link to="/menu/cocktails">Cocktails →</Link>
          <Link to="/menu/spirits">Rum &amp; spirits →</Link>
          <Link to="/menu/food">Comfort food →</Link>
        </nav>
      </article>
    );
  }

  // Greek
  return (
    <article className="about">
      <header className="about__header">
        <p className="about__eyebrow">Home Seaside, Ρέθυμνο</p>
        <h1 className="about__title">Μια συνηθισμένη μέρα στην παραλιακή του Ρεθύμνου</h1>
        <p className="about__lede">
          Το Home Seaside Bar &amp; More είναι ένα παραθαλάσσιο café και
          cocktail bar στην παραλιακή του Ρεθύμνου, δύο λεπτά με τα πόδια
          από τη Φορτέτζα και το Παλιό Ενετικό Λιμάνι. Ανοίγουμε στις
          εννιά για καφέ και μένουμε όσο νιώθει η νύχτα.
        </p>
      </header>

      {heroPhoto && (
        <figure className="about__hero">
          <Picture
            photo={heroPhoto}
            alt={heroAltEL}
            sizes="(min-width: 1200px) 1100px, 100vw"
          />
        </figure>
      )}

      <section className="about__story">
        {chapters.map((chapter, idx) => (
          <div
            key={chapter.titleEL}
            className={`about__chapter about__chapter--${idx % 2 === 0 ? "left" : "right"}`}
          >
            {chapter.photo && (
              <figure className="about__chapter-photo">
                <Picture
                  photo={chapter.photo}
                  alt={chapter.altEL}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
              </figure>
            )}
            <div className="about__chapter-text">
              <h2>{chapter.titleEL}</h2>
              {chapter.bodyEL}
            </div>
          </div>
        ))}
      </section>

      <nav className="about__related" aria-label="Σχετικές σελίδες μενού">
        <Link to="/menu/coffee">Specialty καφές →</Link>
        <Link to="/menu/cocktails">Cocktails →</Link>
        <Link to="/menu/spirits">Ρούμι &amp; spirits →</Link>
        <Link to="/menu/food">Comfort φαγητό →</Link>
      </nav>
    </article>
  );
};

export default AboutPage;
