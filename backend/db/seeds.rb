# backend/db/seeds.rb

# Wipe existing data to prevent duplicates
MenuItem.delete_all

# Localization Helper
def localized(en, el)
  { en: en, el: el }
end

items = [
  # --- Category: Espresso ---
  { name: localized("Espresso", "Εσπρέσο"), price: 3.50, category: localized("Espresso", "Εσπρέσο") },
  { name: localized("Espresso Doppio", "Εσπρέσο Διπλό"), price: 3.50, category: localized("Espresso", "Εσπρέσο") },
  { name: localized("Freddo Espresso", "Φρέντο Εσπρέσο"), price: 3.80, category: localized("Espresso", "Εσπρέσο") },
  { 
    name: localized("Espresso Affogato", "Εσπρέσο Αφογκάτο"), 
    description: localized("Double hot espresso with vanilla ice cream", "Διπλός ζεστός εσπρέσο με παγωτό βανίλια"), 
    price: 5.00, category: localized("Espresso", "Εσπρέσο"), 
    allergens: ["Dairy"] 
  },
  { 
    name: localized("Freddo Espresso Affogato", "Φρέντο Εσπρέσο Αφογκάτο"), 
    description: localized("Double espresso iced with vanilla ice cream", "Διπλός παγωμένος εσπρέσο με παγωτό βανίλια"), 
    price: 5.50, category: localized("Espresso", "Εσπρέσο"), 
    allergens: ["Dairy"] 
  },
  { name: localized("Americano", "Αμερικάνο"), price: 3.50, category: localized("Espresso", "Εσπρέσο") },
  { 
    name: localized("Americano Doppio", "Αμερικάνο Διπλό"), 
    description: localized("Double espresso with hot water", "Διπλός εσπρέσο με ζεστό νερό"), 
    price: 3.50, category: localized("Espresso", "Εσπρέσο") 
  },
  { 
    name: localized("Espresso Tonic", "Εσπρέσο Τόνικ"), 
    description: localized("Double espresso with premium tonic", "Διπλός εσπρέσο με premium τόνικ"), 
    price: 5.00, category: localized("Espresso", "Εσπρέσο") 
  },

  # --- Category: Espresso with Milk ---
  { 
    name: localized("Cappuccino", "Καπουτσίνο"), 
    description: localized("Espresso with steamed milk", "Εσπρέσο με ζεστό αφρόγαλα"), 
    price: 4.00, category: localized("Espresso with Milk", "Εσπρέσο με Γάλα"), 
    allergens: ["Dairy"] 
  },
  { 
    name: localized("Cappuccino Doppio", "Καπουτσίνο Διπλό"), 
    description: localized("Espresso double with steamed milk", "Διπλός εσπρέσο με ζεστό αφρόγαλα"), 
    price: 4.50, category: localized("Espresso with Milk", "Εσπρέσο με Γάλα"), 
    allergens: ["Dairy"] 
  },
  { 
    name: localized("Freddo Cappuccino", "Φρέντο Καπουτσίνο"), 
    description: localized("Double espresso iced and cold milk froth", "Διπλός παγωμένος εσπρέσο και κρύο αφρόγαλα"), 
    price: 4.00, category: localized("Espresso with Milk", "Εσπρέσο με Γάλα"), 
    allergens: ["Dairy"] 
  },
  { 
    name: localized("Espresso Macchiato", "Εσπρέσο Μακιάτο"), 
    description: localized("Espresso with spoonful hot milk froth", "Εσπρέσο με μια κουταλιά ζεστό αφρόγαλα"), 
    price: 3.00, category: localized("Espresso with Milk", "Εσπρέσο με Γάλα"), 
    allergens: ["Dairy"] 
  },
  { 
    name: localized("Latte", "Λάτε"), 
    description: localized("Espresso with hot steamed milk", "Εσπρέσο με ζεστό γάλα"), 
    price: 4.50, category: localized("Espresso with Milk", "Εσπρέσο με Γάλα"), 
    allergens: ["Dairy"] 
  },
  { 
    name: localized("Ice Latte", "Παγωμένο Λάτε"), 
    description: localized("Espresso with iced milk and cold milk froth", "Εσπρέσο με κρύο γάλα και κρύο αφρόγαλα"), 
    price: 4.50, category: localized("Espresso with Milk", "Εσπρέσο με Γάλα"), 
    allergens: ["Dairy"] 
  },
  { 
    name: localized("Goth Latte Black & White", "Goth Λάτε Black & White"), 
    description: localized("Espresso with activated carbon and steamed milk", "Εσπρέσο με ενεργό άνθρακα και ζεστό γάλα"), 
    price: 5.00, category: localized("Espresso with Milk", "Εσπρέσο με Γάλα"), 
    allergens: ["Dairy"] 
  },
  { 
    name: localized("Flat White", "Φλατ Γουάιτ"), 
    description: localized("Double espresso stretto with steamed milk", "Διπλός εσπρέσο στρέτο με ζεστό γάλα"), 
    price: 4.00, category: localized("Espresso with Milk", "Εσπρέσο με Γάλα"), 
    allergens: ["Dairy"] 
  },
  { 
    name: localized("Ice Flat White", "Παγωμένο Φλατ Γουάιτ"), 
    description: localized("Double espresso stretto with iced light milk and cold milk froth", "Διπλός εσπρέσο στρέτο με κρύο ελαφρύ γάλα και κρύο αφρόγαλα"), 
    price: 4.50, category: localized("Espresso with Milk", "Εσπρέσο με Γάλα"), 
    allergens: ["Dairy"] 
  },
  { 
    name: localized("Maroccino", "Μαροκίνο"), 
    description: localized("Double espresso with steamed milk in a glass with Nutella", "Διπλός εσπρέσο με ζεστό γάλα σε ποτήρι με Nutella"), 
    price: 6.00, category: localized("Espresso with Milk", "Εσπρέσο με Γάλα"), 
    allergens: ["Dairy", "Nuts"] 
  },

  # --- Category: More Kinds of Coffee ---
  { name: localized("Greek Coffee", "Ελληνικός Καφές"), price: 4.00, category: localized("More Kinds of Coffee", "Άλλα Είδη Καφέ") },
  { name: localized("Nescafe/Frappe", "Νεσκαφέ/Φραπέ"), price: 4.00, category: localized("More Kinds of Coffee", "Άλλα Είδη Καφέ") },
  { name: localized("Frappe Affogato", "Φραπέ Αφογκάτο"), price: 5.50, category: localized("More Kinds of Coffee", "Άλλα Είδη Καφέ"), allergens: ["Dairy"] },
  { name: localized("Irish Coffee", "Ιρλανδέζικος Καφές"), price: 6.00, category: localized("More Kinds of Coffee", "Άλλα Είδη Καφέ"), allergens: ["Alcohol"] },

  # --- Category: Drinks & Tea ---
  { 
    name: localized("Hot Chocolate", "Ζεστή Σοκολάτα"), 
    description: localized("White, bitter & cacao", "Λευκή, μαύρη & κακάο"), 
    price: 4.50, category: localized("Drinks & Tea", "Ροφήματα & Τσάι"), 
    allergens: ["Dairy"] 
  },
  { 
    name: localized("Cold Chocolate", "Κρύα Σοκολάτα"), 
    description: localized("Extra syrup coconut, vanilla, caramel, strawberry & hazelnut +0.50€", "Έξτρα σιρόπι καρύδα, βανίλια, καραμέλα, φράουλα & φουντούκι +0.50€"), 
    price: 4.50, category: localized("Drinks & Tea", "Ροφήματα & Τσάι"), 
    allergens: ["Dairy"] 
  },
  { name: localized("Organic Women’s Tea", "Βιολογικό Γυναικείο Τσάι"), description: localized("Ginger, orange peel & camomile flowers", "Πιπερόριζα, φλούδα πορτοκαλιού & άνθη χαμομηλιού"), price: 4.00, category: localized("Drinks & Tea", "Ροφήματα & Τσάι") },
  { name: localized("Organic Men’s Tea", "Βιολογικό Ανδρικό Τσάι"), description: localized("Ayurvedic blend with ginger, ginseng & chili", "Αγιουρβεδικό μείγμα με πιπερόριζα, τζίνσενγκ & τσίλι"), price: 4.00, category: localized("Drinks & Tea", "Ροφήματα & Τσάι") },
  { name: localized("Organic Green Chai", "Βιολογικό Πράσινο Τσάι Τσάι"), price: 4.00, category: localized("Drinks & Tea", "Ροφήματα & Τσάι") },
  { name: localized("Cretan Herbs", "Κρητικά Βότανα"), price: 4.00, category: localized("Drinks & Tea", "Ροφήματα & Τσάι") },
  { name: localized("Iced Tea", "Κρύο Τσάι"), description: localized("Green, peach or lemon", "Πράσινο, ροδάκινο ή λεμόνι"), price: 4.00, category: localized("Drinks & Tea", "Ροφήματα & Τσάι") },

  # --- Category: Homemade ---
  { name: localized("Homemade Lemonade", "Σπιτική Λεμονάδα"), description: localized("From local lemons", "Από ντόπια λεμόνια"), price: 4.50, category: localized("Homemade", "Σπιτικά") },
  { name: localized("Homemade Strawberry Drink", "Σπιτικό Ρόφημα Φράουλας"), description: localized("From local strawberries", "Από ντόπιες φράουλες"), price: 4.50, category: localized("Homemade", "Σπιτικά") },
  { name: localized("Homemade Strawberry-Lemonade", "Σπιτική Φραουλάδα-Λεμονάδα"), price: 5.00, category: localized("Homemade", "Σπιτικά") },

  # --- Category: Fresh Juice ---
  { name: localized("Fresh Orange Juice", "Φρέσκος Χυμός Πορτοκάλι"), price: 4.00, category: localized("Fresh Juice", "Φρέσκοι Χυμοί") },
  { name: localized("Fresh Mixed Juice", "Φρέσκος Ανάμικτος Χυμός"), description: localized("With orange, apple, banana & pear", "Με πορτοκάλι, μήλο, μπανάνα & αχλάδι"), price: 5.00, category: localized("Fresh Juice", "Φρέσκοι Χυμοί") },

  # --- Category: Soft Drinks ---
  { name: localized("Coca Cola / Coca Cola Zero", "Coca Cola / Coca Cola Zero"), price: 3.50, category: localized("Soft Drinks", "Αναψυκτικά") },
  { name: localized("Three Cents", "Three Cents"), description: localized("Pink grapefruit & ginger beer", "Pink grapefruit & ginger beer"), price: 5.00, category: localized("Soft Drinks", "Αναψυκτικά") },

  # --- Category: Beers ---
  { 
    name: localized("Seaside Beer", "Seaside Μπύρα"), 
    description: localized("Homemade pilsner with citron & Cretan honey", "Σπιτική pilsner με κίτρο & Κρητικό μέλι"), 
    price: 6.00, category: localized("Beers", "Μπύρες"), 
    allergens: ["Gluten"] 
  },
  { name: localized("Fix", "Fix"), price: 4.50, category: localized("Beers", "Μπύρες"), allergens: ["Gluten"] },

  # --- Category: Wine List ---
  { name: localized("His Queen Sauvignon Blanc", "His Queen Sauvignon Blanc"), price: 6.00, category: localized("Wine List", "Λίστα Κρασιών"), allergens: ["Alcohol"] },
  { name: localized("Sangria", "Σανγκρία"), price: 6.00, category: localized("Wine List", "Λίστα Κρασιών"), allergens: ["Alcohol"] },

  # --- 20 NEW FOOD ITEMS ---
  { 
    name: localized("Greek Salad (Dakos)", "Κρητικός Ντάκος"), 
    description: localized("Barley rusk with tomato, feta, and oregano", "Κριθαροκούλουρο με ντομάτα, φέτα και ρίγανη"), 
    price: 9.00, category: localized("Food", "Φαγητό"), 
    allergens: ["Gluten", "Dairy"] 
  },
  { 
    name: localized("Seafood Linguine", "Λινγκουίνι Θαλασσινών"), 
    description: localized("Fresh pasta with shrimp and mussels", "Φρέσκα ζυμαρικά με γαρίδες και μύδια"), 
    price: 19.00, category: localized("Food", "Φαγητό"), 
    allergens: ["Gluten", "Shellfish", "Seafood"] 
  },
  { 
    name: localized("Grilled Octopus", "Χταπόδι Σχάρας"), 
    description: localized("Served with fava and olive oil", "Σερβίρεται με φάβα και ελαιόλαδο"), 
    price: 18.50, category: localized("Food", "Φαγητό"), 
    allergens: ["Seafood"] 
  },
  { 
    name: localized("Seaside Club Sandwich", "Seaside Club Sandwich"), 
    description: localized("Chicken, bacon, avocado, and fries", "Κοτόπουλο, μπέικον, αβοκάντο και πατάτες"), 
    price: 12.00, category: localized("Food", "Φαγητό"), 
    allergens: ["Gluten", "Dairy", "Eggs"] 
  },
  { 
    name: localized("Beef Burger", "Μπιφτέκι Μοσχαρίσιο"), 
    description: localized("100% Black Angus beef with cheddar", "100% Black Angus μοσχάρι με τσένταρ"), 
    price: 15.00, category: localized("Food", "Φαγητό"), 
    allergens: ["Gluten", "Dairy"] 
  },
  { 
    name: localized("Fried Calamari", "Καλαμαράκια Τηγανητά"), 
    price: 14.00, category: localized("Food", "Φαγητό"), 
    allergens: ["Seafood", "Gluten"] 
  },
  { 
    name: localized("Spinach Pie", "Σπανακόπιτα"), 
    description: localized("Handmade phyllo with feta", "Χειροποίητο φύλλο με φέτα"), 
    price: 7.50, category: localized("Food", "Φαγητό"), 
    allergens: ["Gluten", "Dairy"] 
  },
  { 
    name: localized("Grilled Sea Bass", "Λαβράκι Σχάρας"), 
    description: localized("Fresh local fish with greens", "Φρέσκο ψάρι με χόρτα"), 
    price: 24.00, category: localized("Food", "Φαγητό"), 
    allergens: ["Seafood"] 
  },
  { 
    name: localized("Tzatziki Dip", "Τζατζίκι"), 
    description: localized("Greek yogurt, cucumber, and garlic", "Ελληνικό γιαούρτι, αγγούρι και σκόρδο"), 
    price: 5.50, category: localized("Food", "Φαγητό"), 
    allergens: ["Dairy"] 
  },
  { 
    name: localized("Chicken Souvlaki", "Σουβλάκι Κοτόπουλο"), 
    description: localized("Two skewers with pita and tzatziki", "Δύο καλαμάκια με πίτα και τζατζίκι"), 
    price: 13.00, category: localized("Food", "Φαγητό"), 
    allergens: ["Gluten", "Dairy"] 
  },
  { 
    name: localized("Meatballs (Keftedakia)", "Κεφτεδάκια"), 
    description: localized("Traditional fried meatballs with herbs", "Παραδοσιακά κεφτεδάκια με βότανα"), 
    price: 10.00, category: localized("Food", "Φαγητό"), 
    allergens: ["Gluten", "Eggs"] 
  },
  { 
    name: localized("Saganaki Cheese", "Τυρί Σαγανάκι"), 
    description: localized("Fried graviera cheese with lemon", "Τηγανητή γραβιέρα με λεμόνι"), 
    price: 8.50, category: localized("Food", "Φαγητό"), 
    allergens: ["Dairy", "Gluten"] 
  },
  { 
    name: localized("Shrimp Saganaki", "Γαρίδες Σαγανάκι"), 
    description: localized("Shrimp with feta and tomato sauce", "Γαρίδες με φέτα και σάλτσα ντομάτας"), 
    price: 17.00, category: localized("Food", "Φαγητό"), 
    allergens: ["Shellfish", "Dairy"] 
  },
  { 
    name: localized("Moussaka", "Μουσακάς"), 
    description: localized("Layers of eggplant, meat and bechamel", "Στρώσεις μελιτζάνας, κιμά και μπεσαμέλ"), 
    price: 16.00, category: localized("Food", "Φαγητό"), 
    allergens: ["Gluten", "Dairy", "Eggs"] 
  },
  { 
    name: localized("Avocado Toast", "Αβοκάντο Τοστ"), 
    description: localized("Sourdough bread with poached egg", "Ψωμί προζυμένιο με αυγό ποσέ"), 
    price: 11.00, category: localized("Food", "Φαγητό"), 
    allergens: ["Gluten", "Eggs"] 
  },
  { 
    name: localized("Greek Yogurt & Honey", "Γιαούρτι με Μέλι"), 
    description: localized("Strained yogurt with walnuts", "Στραγγιστό γιαούρτι με καρύδια"), 
    price: 7.00, category: localized("Food", "Φαγητό"), 
    allergens: ["Dairy", "Nuts"] 
  },
  { 
    name: localized("Chocolate Lava Cake", "Σουφλέ Σοκολάτας"), 
    price: 8.50, category: localized("Food", "Φαγητό"), 
    allergens: ["Gluten", "Dairy", "Eggs"] 
  },
  { 
    name: localized("Grilled Halloumi", "Χαλούμι Σχάρας"), 
    price: 9.00, category: localized("Food", "Φαγητό"), 
    allergens: ["Dairy"] 
  },
  { 
    name: localized("Fried Potatoes", "Πατάτες Τηγανητές"), 
    description: localized("Fresh hand-cut potatoes", "Φρέσκιες πατάτες κομμένες στο χέρι"), 
    price: 5.50, category: localized("Food", "Φαγητό") 
  },
  { 
    name: localized("Seasonal Fruit Platter", "Ποικιλία Φρούτων Εποχής"), 
    price: 10.00, category: localized("Food", "Φαγητό") 
  }
]

items.each { |data| MenuItem.create!(data) }

puts "Success: Database seeded with \#{MenuItem.count} bilingual items."