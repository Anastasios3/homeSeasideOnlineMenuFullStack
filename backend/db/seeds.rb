# backend/db/seeds.rb

# --- Admin user ---
admin_password = ENV.fetch("ADMIN_PASSWORD", "homeseaside2025")
admin = AdminUser.find_or_initialize_by(username: "admin")
admin.password = admin_password
admin.password_confirmation = admin_password
admin.save!
puts "Admin user ready (username: admin)"

MenuItem.delete_all

# Helper: create a menu item with proper Mongoid localized fields
def create_item(name_en:, name_el:, cat_en:, cat_el:, price:, main_category: nil, desc_en: nil, desc_el: nil, allergens: [], available: true, pricing_type: "single", price_secondary: nil)
  item = MenuItem.new
  item.price = price
  item.main_category = main_category
  item.pricing_type = pricing_type
  item.price_secondary = price_secondary
  item.available = available
  item.allergens = allergens

  I18n.with_locale(:en) do
    item.name = name_en
    item.description = desc_en
    item.category = cat_en
  end
  I18n.with_locale(:el) do
    item.name = name_el
    item.description = desc_el
    item.category = cat_el
  end

  item.save!
end

# --- Espresso ---
create_item(name_en: "Espresso", name_el: "Εσπρέσο", price: 3.00, main_category: "coffee", cat_en: "Espresso", cat_el: "Εσπρέσο", pricing_type: "single_double", price_secondary: 3.50)
create_item(name_en: "Freddo Espresso", name_el: "Φρέντο Εσπρέσο", price: 3.50, main_category: "coffee", cat_en: "Espresso", cat_el: "Εσπρέσο", pricing_type: "single_double", price_secondary: 3.80)
create_item(name_en: "Espresso Affogato", name_el: "Εσπρέσο Αφογκάτο", desc_en: "Double hot espresso with vanilla ice cream", desc_el: "Διπλός ζεστός εσπρέσο με παγωτό βανίλια", price: 5.00, main_category: "coffee", cat_en: "Espresso", cat_el: "Εσπρέσο", allergens: ["Dairy"])
create_item(name_en: "Freddo Espresso Affogato", name_el: "Φρέντο Εσπρέσο Αφογκάτο", desc_en: "Double espresso iced with vanilla ice cream", desc_el: "Διπλός παγωμένος εσπρέσο με παγωτό βανίλια", price: 5.50, main_category: "coffee", cat_en: "Espresso", cat_el: "Εσπρέσο", allergens: ["Dairy"])
create_item(name_en: "Americano", name_el: "Αμερικάνο", price: 3.00, main_category: "coffee", cat_en: "Espresso", cat_el: "Εσπρέσο", pricing_type: "single_double", price_secondary: 3.50)
create_item(name_en: "Espresso Tonic", name_el: "Εσπρέσο Τόνικ", desc_en: "Double espresso with premium tonic", desc_el: "Διπλός εσπρέσο με premium τόνικ", price: 5.00, main_category: "coffee", cat_en: "Espresso", cat_el: "Εσπρέσο")

# --- Espresso with Milk ---
create_item(name_en: "Cappuccino", name_el: "Καπουτσίνο", desc_en: "Espresso with steamed milk", desc_el: "Εσπρέσο με ζεστό αφρόγαλα", price: 4.00, main_category: "coffee", cat_en: "Espresso with Milk", cat_el: "Εσπρέσο με Γάλα", allergens: ["Dairy"], pricing_type: "single_double", price_secondary: 4.50)
create_item(name_en: "Freddo Cappuccino", name_el: "Φρέντο Καπουτσίνο", desc_en: "Double espresso iced and cold milk froth", desc_el: "Διπλός παγωμένος εσπρέσο και κρύο αφρόγαλα", price: 4.00, main_category: "coffee", cat_en: "Espresso with Milk", cat_el: "Εσπρέσο με Γάλα", allergens: ["Dairy"], pricing_type: "single_double", price_secondary: 4.50)
create_item(name_en: "Espresso Macchiato", name_el: "Εσπρέσο Μακιάτο", desc_en: "Espresso with spoonful hot milk froth", desc_el: "Εσπρέσο με μια κουταλιά ζεστό αφρόγαλα", price: 3.00, main_category: "coffee", cat_en: "Espresso with Milk", cat_el: "Εσπρέσο με Γάλα", allergens: ["Dairy"])
create_item(name_en: "Latte", name_el: "Λάτε", desc_en: "Espresso with hot steamed milk", desc_el: "Εσπρέσο με ζεστό γάλα", price: 4.50, main_category: "coffee", cat_en: "Espresso with Milk", cat_el: "Εσπρέσο με Γάλα", allergens: ["Dairy"], pricing_type: "single_double", price_secondary: 5.00)
create_item(name_en: "Ice Latte", name_el: "Παγωμένο Λάτε", desc_en: "Espresso with iced milk and cold milk froth", desc_el: "Εσπρέσο με κρύο γάλα και κρύο αφρόγαλα", price: 4.50, main_category: "coffee", cat_en: "Espresso with Milk", cat_el: "Εσπρέσο με Γάλα", allergens: ["Dairy"], pricing_type: "single_double", price_secondary: 5.00)
create_item(name_en: "Goth Latte Black & White", name_el: "Goth Λάτε Black & White", desc_en: "Espresso with activated carbon and steamed milk", desc_el: "Εσπρέσο με ενεργό άνθρακα και ζεστό γάλα", price: 5.00, main_category: "coffee", cat_en: "Espresso with Milk", cat_el: "Εσπρέσο με Γάλα", allergens: ["Dairy"])
create_item(name_en: "Flat White", name_el: "Φλατ Γουάιτ", desc_en: "Double espresso stretto with steamed milk", desc_el: "Διπλός εσπρέσο στρέτο με ζεστό γάλα", price: 4.00, main_category: "coffee", cat_en: "Espresso with Milk", cat_el: "Εσπρέσο με Γάλα", allergens: ["Dairy"])
create_item(name_en: "Ice Flat White", name_el: "Παγωμένο Φλατ Γουάιτ", desc_en: "Double espresso stretto with iced light milk and cold milk froth", desc_el: "Διπλός εσπρέσο στρέτο με κρύο ελαφρύ γάλα και κρύο αφρόγαλα", price: 4.50, main_category: "coffee", cat_en: "Espresso with Milk", cat_el: "Εσπρέσο με Γάλα", allergens: ["Dairy"])
create_item(name_en: "Maroccino", name_el: "Μαροκίνο", desc_en: "Double espresso with steamed milk in a glass with Nutella", desc_el: "Διπλός εσπρέσο με ζεστό γάλα σε ποτήρι με Nutella", price: 6.00, main_category: "coffee", cat_en: "Espresso with Milk", cat_el: "Εσπρέσο με Γάλα", allergens: ["Dairy", "Nuts"])

# --- More Kinds of Coffee ---
create_item(name_en: "Greek Coffee", name_el: "Ελληνικός Καφές", price: 4.00, main_category: "coffee", cat_en: "More Kinds of Coffee", cat_el: "Άλλα Είδη Καφέ")
create_item(name_en: "Nescafe/Frappe", name_el: "Νεσκαφέ/Φραπέ", price: 4.00, main_category: "coffee", cat_en: "More Kinds of Coffee", cat_el: "Άλλα Είδη Καφέ")
create_item(name_en: "Frappe Affogato", name_el: "Φραπέ Αφογκάτο", price: 5.50, main_category: "coffee", cat_en: "More Kinds of Coffee", cat_el: "Άλλα Είδη Καφέ", allergens: ["Dairy"])
create_item(name_en: "Irish Coffee", name_el: "Ιρλανδέζικος Καφές", price: 6.00, main_category: "coffee", cat_en: "More Kinds of Coffee", cat_el: "Άλλα Είδη Καφέ", allergens: ["Alcohol"])

# --- Drinks & Tea ---
create_item(name_en: "Hot Chocolate", name_el: "Ζεστή Σοκολάτα", desc_en: "White, bitter & cacao", desc_el: "Λευκή, μαύρη & κακάο", price: 4.50, main_category: "coffee", cat_en: "Drinks & Tea", cat_el: "Ροφήματα & Τσάι", allergens: ["Dairy"])
create_item(name_en: "Cold Chocolate", name_el: "Κρύα Σοκολάτα", desc_en: "Extra syrup coconut, vanilla, caramel, strawberry & hazelnut +0.50€", desc_el: "Έξτρα σιρόπι καρύδα, βανίλια, καραμέλα, φράουλα & φουντούκι +0.50€", price: 4.50, main_category: "coffee", cat_en: "Drinks & Tea", cat_el: "Ροφήματα & Τσάι", allergens: ["Dairy"])
create_item(name_en: "Organic Women's Tea", name_el: "Βιολογικό Γυναικείο Τσάι", desc_en: "Ginger, orange peel & camomile flowers", desc_el: "Πιπερόριζα, φλούδα πορτοκαλιού & άνθη χαμομηλιού", price: 4.00, main_category: "coffee", cat_en: "Drinks & Tea", cat_el: "Ροφήματα & Τσάι")
create_item(name_en: "Organic Men's Tea", name_el: "Βιολογικό Ανδρικό Τσάι", desc_en: "Ayurvedic blend with ginger, ginseng & chili", desc_el: "Αγιουρβεδικό μείγμα με πιπερόριζα, τζίνσενγκ & τσίλι", price: 4.00, main_category: "coffee", cat_en: "Drinks & Tea", cat_el: "Ροφήματα & Τσάι")
create_item(name_en: "Organic Green Chai", name_el: "Βιολογικό Πράσινο Τσάι", price: 4.00, main_category: "coffee", cat_en: "Drinks & Tea", cat_el: "Ροφήματα & Τσάι")
create_item(name_en: "Cretan Herbs", name_el: "Κρητικά Βότανα", price: 4.00, main_category: "coffee", cat_en: "Drinks & Tea", cat_el: "Ροφήματα & Τσάι")
create_item(name_en: "Iced Tea", name_el: "Κρύο Τσάι", desc_en: "Green, peach or lemon", desc_el: "Πράσινο, ροδάκινο ή λεμόνι", price: 4.00, main_category: "coffee", cat_en: "Drinks & Tea", cat_el: "Ροφήματα & Τσάι")

# --- Homemade ---
create_item(name_en: "Homemade Lemonade", name_el: "Σπιτική Λεμονάδα", desc_en: "From local lemons", desc_el: "Από ντόπια λεμόνια", price: 4.50, main_category: "coffee", cat_en: "Homemade", cat_el: "Σπιτικά")
create_item(name_en: "Homemade Strawberry Drink", name_el: "Σπιτικό Ρόφημα Φράουλας", desc_en: "From local strawberries", desc_el: "Από ντόπιες φράουλες", price: 4.50, main_category: "coffee", cat_en: "Homemade", cat_el: "Σπιτικά")
create_item(name_en: "Homemade Strawberry-Lemonade", name_el: "Σπιτική Φραουλάδα-Λεμονάδα", price: 5.00, main_category: "coffee", cat_en: "Homemade", cat_el: "Σπιτικά")

# --- Fresh Juice ---
create_item(name_en: "Fresh Orange Juice", name_el: "Φρέσκος Χυμός Πορτοκάλι", price: 4.00, main_category: "coffee", cat_en: "Fresh Juice", cat_el: "Φρέσκοι Χυμοί")
create_item(name_en: "Fresh Mixed Juice", name_el: "Φρέσκος Ανάμικτος Χυμός", desc_en: "With orange, apple, banana & pear", desc_el: "Με πορτοκάλι, μήλο, μπανάνα & αχλάδι", price: 5.00, main_category: "coffee", cat_en: "Fresh Juice", cat_el: "Φρέσκοι Χυμοί")

# --- Soft Drinks ---
create_item(name_en: "Coca Cola / Coca Cola Zero", name_el: "Coca Cola / Coca Cola Zero", price: 3.50, main_category: "coffee", cat_en: "Soft Drinks", cat_el: "Αναψυκτικά")
create_item(name_en: "Three Cents", name_el: "Three Cents", desc_en: "Pink grapefruit & ginger beer", desc_el: "Pink grapefruit & ginger beer", price: 5.00, main_category: "coffee", cat_en: "Soft Drinks", cat_el: "Αναψυκτικά")

# --- Beers ---
create_item(name_en: "Seaside Beer", name_el: "Seaside Μπύρα", desc_en: "Homemade pilsner with citron & Cretan honey", desc_el: "Σπιτική pilsner με κίτρο & Κρητικό μέλι", price: 6.00, main_category: "beer&wine", cat_en: "Beers", cat_el: "Μπύρες", allergens: ["Gluten"])
create_item(name_en: "Fix", name_el: "Fix", price: 4.50, main_category: "beer&wine", cat_en: "Beers", cat_el: "Μπύρες", allergens: ["Gluten"])

# --- Wine List ---
create_item(name_en: "His Queen Sauvignon Blanc", name_el: "His Queen Sauvignon Blanc", price: 6.00, main_category: "beer&wine", cat_en: "Wine List", cat_el: "Λίστα Κρασιών", allergens: ["Alcohol"], pricing_type: "glass_bottle", price_secondary: 22.00)
create_item(name_en: "Sangria", name_el: "Σανγκρία", price: 6.00, main_category: "beer&wine", cat_en: "Wine List", cat_el: "Λίστα Κρασιών", allergens: ["Alcohol"])

# --- Food ---
create_item(name_en: "Greek Salad (Dakos)", name_el: "Κρητικός Ντάκος", desc_en: "Barley rusk with tomato, feta, and oregano", desc_el: "Κριθαροκούλουρο με ντομάτα, φέτα και ρίγανη", price: 9.00, main_category: "food", cat_en: "Food", cat_el: "Φαγητό", allergens: ["Gluten", "Dairy"])
create_item(name_en: "Seafood Linguine", name_el: "Λινγκουίνι Θαλασσινών", desc_en: "Fresh pasta with shrimp and mussels", desc_el: "Φρέσκα ζυμαρικά με γαρίδες και μύδια", price: 19.00, main_category: "food", cat_en: "Food", cat_el: "Φαγητό", allergens: ["Gluten", "Shellfish", "Seafood"])
create_item(name_en: "Grilled Octopus", name_el: "Χταπόδι Σχάρας", desc_en: "Served with fava and olive oil", desc_el: "Σερβίρεται με φάβα και ελαιόλαδο", price: 18.50, main_category: "food", cat_en: "Food", cat_el: "Φαγητό", allergens: ["Seafood"])
create_item(name_en: "Seaside Club Sandwich", name_el: "Seaside Club Sandwich", desc_en: "Chicken, bacon, avocado, and fries", desc_el: "Κοτόπουλο, μπέικον, αβοκάντο και πατάτες", price: 12.00, main_category: "food", cat_en: "Food", cat_el: "Φαγητό", allergens: ["Gluten", "Dairy", "Eggs"])
create_item(name_en: "Beef Burger", name_el: "Μπιφτέκι Μοσχαρίσιο", desc_en: "100% Black Angus beef with cheddar", desc_el: "100% Black Angus μοσχάρι με τσένταρ", price: 15.00, main_category: "food", cat_en: "Food", cat_el: "Φαγητό", allergens: ["Gluten", "Dairy"])
create_item(name_en: "Fried Calamari", name_el: "Καλαμαράκια Τηγανητά", price: 14.00, main_category: "food", cat_en: "Food", cat_el: "Φαγητό", allergens: ["Seafood", "Gluten"])
create_item(name_en: "Spinach Pie", name_el: "Σπανακόπιτα", desc_en: "Handmade phyllo with feta", desc_el: "Χειροποίητο φύλλο με φέτα", price: 7.50, main_category: "food", cat_en: "Food", cat_el: "Φαγητό", allergens: ["Gluten", "Dairy"])
create_item(name_en: "Grilled Sea Bass", name_el: "Λαβράκι Σχάρας", desc_en: "Fresh local fish with greens", desc_el: "Φρέσκο ψάρι με χόρτα", price: 24.00, main_category: "food", cat_en: "Food", cat_el: "Φαγητό", allergens: ["Seafood"])
create_item(name_en: "Tzatziki Dip", name_el: "Τζατζίκι", desc_en: "Greek yogurt, cucumber, and garlic", desc_el: "Ελληνικό γιαούρτι, αγγούρι και σκόρδο", price: 5.50, main_category: "food", cat_en: "Food", cat_el: "Φαγητό", allergens: ["Dairy"])
create_item(name_en: "Chicken Souvlaki", name_el: "Σουβλάκι Κοτόπουλο", desc_en: "Two skewers with pita and tzatziki", desc_el: "Δύο καλαμάκια με πίτα και τζατζίκι", price: 13.00, main_category: "food", cat_en: "Food", cat_el: "Φαγητό", allergens: ["Gluten", "Dairy"])
create_item(name_en: "Meatballs (Keftedakia)", name_el: "Κεφτεδάκια", desc_en: "Traditional fried meatballs with herbs", desc_el: "Παραδοσιακά κεφτεδάκια με βότανα", price: 10.00, main_category: "food", cat_en: "Food", cat_el: "Φαγητό", allergens: ["Gluten", "Eggs"])
create_item(name_en: "Saganaki Cheese", name_el: "Τυρί Σαγανάκι", desc_en: "Fried graviera cheese with lemon", desc_el: "Τηγανητή γραβιέρα με λεμόνι", price: 8.50, main_category: "food", cat_en: "Food", cat_el: "Φαγητό", allergens: ["Dairy", "Gluten"])
create_item(name_en: "Shrimp Saganaki", name_el: "Γαρίδες Σαγανάκι", desc_en: "Shrimp with feta and tomato sauce", desc_el: "Γαρίδες με φέτα και σάλτσα ντομάτας", price: 17.00, main_category: "food", cat_en: "Food", cat_el: "Φαγητό", allergens: ["Shellfish", "Dairy"])
create_item(name_en: "Moussaka", name_el: "Μουσακάς", desc_en: "Layers of eggplant, meat and bechamel", desc_el: "Στρώσεις μελιτζάνας, κιμά και μπεσαμέλ", price: 16.00, main_category: "food", cat_en: "Food", cat_el: "Φαγητό", allergens: ["Gluten", "Dairy", "Eggs"])
create_item(name_en: "Avocado Toast", name_el: "Αβοκάντο Τοστ", desc_en: "Sourdough bread with poached egg", desc_el: "Ψωμί προζυμένιο με αυγό ποσέ", price: 11.00, main_category: "food", cat_en: "Food", cat_el: "Φαγητό", allergens: ["Gluten", "Eggs"])
create_item(name_en: "Greek Yogurt & Honey", name_el: "Γιαούρτι με Μέλι", desc_en: "Strained yogurt with walnuts", desc_el: "Στραγγιστό γιαούρτι με καρύδια", price: 7.00, main_category: "food", cat_en: "Food", cat_el: "Φαγητό", allergens: ["Dairy", "Nuts"])
create_item(name_en: "Chocolate Lava Cake", name_el: "Σουφλέ Σοκολάτας", price: 8.50, main_category: "food", cat_en: "Food", cat_el: "Φαγητό", allergens: ["Gluten", "Dairy", "Eggs"])
create_item(name_en: "Grilled Halloumi", name_el: "Χαλούμι Σχάρας", price: 9.00, main_category: "food", cat_en: "Food", cat_el: "Φαγητό", allergens: ["Dairy"])
create_item(name_en: "Fried Potatoes", name_el: "Πατάτες Τηγανητές", desc_en: "Fresh hand-cut potatoes", desc_el: "Φρέσκιες πατάτες κομμένες στο χέρι", price: 5.50, main_category: "food", cat_en: "Food", cat_el: "Φαγητό")
create_item(name_en: "Seasonal Fruit Platter", name_el: "Ποικιλία Φρούτων Εποχής", price: 10.00, main_category: "food", cat_en: "Food", cat_el: "Φαγητό")

puts "Seeded #{MenuItem.count} bilingual items."
