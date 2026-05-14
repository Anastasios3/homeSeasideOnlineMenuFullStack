import { useState, type FC } from "react";
import { ChevronDown } from "lucide-react";
import "../styles/FAQ.css";

interface FAQProps {
  language: "EN" | "EL";
  className?: string;
}

interface QA {
  q: string;
  a: string;
}

const FAQ_EN: QA[] = [
  {
    q: "Where exactly is Home Seaside?",
    a: "On the Rethymno seafront, at Leof. Emmanouil Kefalogianni 18. Two minutes' walk from the Fortezza and the Old Venetian Harbour. The terrace looks straight out at the water.",
  },
  {
    q: "What is Home Seaside best known for?",
    a: "Specialty coffee in the morning. One of the deepest rum selections in Rethymno after dark. Cocktails made with care, comfort food in between. The same kitchen running all day.",
  },
  {
    q: "When are you open?",
    a: "Monday to Thursday, nine in the morning until midnight. Friday and Saturday, nine until two. Sunday, ten until midnight. Same rhythm, all year round.",
  },
  {
    q: "Do you take reservations?",
    a: "Yes. Call +30 2831 022782 or write to home_seaside_rethimno@hotmail.com. Weekend evenings and larger tables fill up, so it's worth booking ahead.",
  },
  {
    q: "Do you serve breakfast and food all day?",
    a: "Yes. The kitchen opens when we do and closes when we close. Brunch starts the morning. Lunch runs into a long afternoon. By evening it shifts to pizza and small plates.",
  },
  {
    q: "Is there outdoor seating with a sea view?",
    a: "Most tables face the water. A covered terrace for the breeze. Shaded seats for the summer afternoon. The window inside, if you'd rather stay close to the sea but out of the wind.",
  },
];

const FAQ_EL: QA[] = [
  {
    q: "Πού ακριβώς βρίσκεται το Home Seaside;",
    a: "Στην παραλιακή του Ρεθύμνου, στη Λεωφ. Εμμανουήλ Κεφαλογιάννη 18. Δύο λεπτά με τα πόδια από τη Φορτέτζα και το Παλιό Ενετικό Λιμάνι. Η βεράντα κοιτάζει κατευθείαν στη θάλασσα.",
  },
  {
    q: "Για τι είναι γνωστό το Home Seaside;",
    a: "Specialty καφέ το πρωί. Μία από τις βαθύτερες συλλογές ρουμιού στο Ρέθυμνο όταν πέφτει η νύχτα. Cocktails φτιαγμένα με προσοχή, comfort food στο ενδιάμεσο. Η ίδια κουζίνα δουλεύει όλη μέρα.",
  },
  {
    q: "Ποιες ώρες είστε ανοιχτά;",
    a: "Δευτέρα έως Πέμπτη, εννιά το πρωί μέχρι τα μεσάνυχτα. Παρασκευή και Σάββατο, εννιά μέχρι δύο. Κυριακή, δέκα μέχρι τα μεσάνυχτα. Ίδιος ρυθμός, όλο τον χρόνο.",
  },
  {
    q: "Δέχεστε κρατήσεις;",
    a: "Ναι. Καλέστε στο +30 2831 022782 ή γράψτε στο home_seaside_rethimno@hotmail.com. Σαββατοκύριακα το βράδυ και μεγαλύτερες παρέες γεμίζουν, οπότε αξίζει να κλείσετε από πριν.",
  },
  {
    q: "Σερβίρετε πρωινό και φαγητό όλη μέρα;",
    a: "Ναι. Η κουζίνα ανοίγει όταν ανοίγουμε και κλείνει όταν κλείνουμε. Το brunch ξεκινάει το πρωί. Το μεσημεριανό κυλάει σε ένα μακρύ απόγευμα. Το βράδυ γυρνάει σε πίτσα και μεζέδες.",
  },
  {
    q: "Υπάρχει εξωτερικό κάθισμα με θέα στη θάλασσα;",
    a: "Τα περισσότερα τραπέζια κοιτούν τη θάλασσα. Σκεπαστή βεράντα για το αεράκι. Σκιαζόμενα τραπέζια για το καλοκαιρινό απόγευμα. Το παράθυρο μέσα, αν προτιμάς να μένεις κοντά στη θάλασσα χωρίς αέρα.",
  },
];

/**
 * Plain-text FAQ on the homepage. Important: we deliberately do NOT emit
 * FAQPage JSON-LD — Google restricted FAQ rich results to government and
 * healthcare sites in August 2023, so a commercial FAQPage schema is at best
 * ignored and at worst flagged as schema spam. The plain HTML version still
 * earns AI Overviews citations and on-page topical authority.
 */
const FAQ: FC<FAQProps> = ({ language, className = "" }) => {
  const items = language === "EN" ? FAQ_EN : FAQ_EL;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className={`home-faq ${className}`.trim()} aria-label={language === "EN" ? "Frequently asked questions" : "Συχνές ερωτήσεις"}>
      <div className="home-faq__inner">
        <h2 className="home-faq__heading">
          {language === "EN" ? "Frequently Asked" : "Συχνές ερωτήσεις"}
        </h2>
        <ul className="home-faq__list">
          {items.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <li key={idx} className={`home-faq__item ${isOpen ? "home-faq__item--open" : ""}`}>
                <button
                  type="button"
                  className="home-faq__question"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                >
                  <span>{item.q}</span>
                  <ChevronDown size={18} strokeWidth={2} className="home-faq__chevron" />
                </button>
                <div className="home-faq__answer" hidden={!isOpen}>
                  <p>{item.a}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default FAQ;
