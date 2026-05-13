# backend/db/seeds.rb
# Home Seaside Bar & More — Rethymno
# Real menu, EN + EL bilingual. Wipes MenuItem and re-seeds. Safe to re-run.

# --- Admin user ---
admin_password = ENV.fetch("ADMIN_PASSWORD", "homeseaside2025")
admin = AdminUser.find_or_initialize_by(username: "admin")
admin.password = admin_password
admin.password_confirmation = admin_password
admin.save!
puts "Admin user ready (username: admin)"

MenuItem.delete_all

# ------------------------------------------------------------
# Helper: create a menu item with localized fields
# ------------------------------------------------------------
def item(name_en:, name_el:, cat_en:, cat_el:, price:, main_category:,
         desc_en: nil, desc_el: nil, allergens: [], available: true,
         pricing_type: "single", price_secondary: nil)
  i = MenuItem.new
  i.price = price
  i.main_category = main_category
  i.pricing_type = pricing_type
  i.price_secondary = price_secondary
  i.available = available
  i.allergens = allergens

  I18n.with_locale(:en) do
    i.name = name_en
    i.description = desc_en
    i.category = cat_en
  end
  I18n.with_locale(:el) do
    i.name = name_el
    i.description = desc_el
    i.category = cat_el
  end
  i.save!
end

# Common allergen sets
DAIRY   = %w[Dairy].freeze
GLUTEN  = %w[Gluten].freeze
EGGS    = %w[Eggs].freeze
NUTS    = %w[Nuts].freeze
SEAFOOD = %w[Seafood].freeze
ALCOHOL = %w[Alcohol].freeze

# ============================================================
# COFFEE — Espresso
# ============================================================
ESPRESSO_EN = "Espresso".freeze
ESPRESSO_EL = "Espresso".freeze

item(name_en: "Espresso", name_el: "Εσπρέσσο",
     cat_en: ESPRESSO_EN, cat_el: ESPRESSO_EL,
     price: 3.50, main_category: "coffee")

item(name_en: "Espresso Doppio", name_el: "Εσπρέσσο Doppio",
     cat_en: ESPRESSO_EN, cat_el: ESPRESSO_EL,
     price: 3.50, main_category: "coffee",
     desc_en: "Double shot of espresso", desc_el: "Διπλή δόση εσπρέσσο")

item(name_en: "Freddo Espresso", name_el: "Φρέντο Εσπρέσσο",
     cat_en: ESPRESSO_EN, cat_el: ESPRESSO_EL,
     price: 3.80, main_category: "coffee")

item(name_en: "Espresso Affogato", name_el: "Εσπρέσσο Affogato",
     cat_en: ESPRESSO_EN, cat_el: ESPRESSO_EL,
     price: 5.00, main_category: "coffee",
     desc_en: "Double hot espresso with vanilla ice cream",
     desc_el: "Διπλός ζεστός εσπρέσσο με παγωτό βανίλια",
     allergens: DAIRY)

item(name_en: "Freddo Espresso Affogato", name_el: "Φρέντο Εσπρέσσο Affogato",
     cat_en: ESPRESSO_EN, cat_el: ESPRESSO_EL,
     price: 5.50, main_category: "coffee",
     desc_en: "Double espresso iced with vanilla ice cream",
     desc_el: "Διπλός εσπρέσσο κρύος με παγωτό βανίλια",
     allergens: DAIRY)

item(name_en: "Americano", name_el: "Americano",
     cat_en: ESPRESSO_EN, cat_el: ESPRESSO_EL,
     price: 3.50, main_category: "coffee")

item(name_en: "Americano Doppio", name_el: "Americano Doppio",
     cat_en: ESPRESSO_EN, cat_el: ESPRESSO_EL,
     price: 3.50, main_category: "coffee",
     desc_en: "Double espresso with hot water",
     desc_el: "Διπλός εσπρέσσο με ζεστό νερό")

item(name_en: "Espresso Tonic", name_el: "Espresso Tonic",
     cat_en: ESPRESSO_EN, cat_el: ESPRESSO_EL,
     price: 5.00, main_category: "coffee",
     desc_en: "Double espresso with premium tonic",
     desc_el: "Διπλός εσπρέσσο με premium tonic")

# ============================================================
# COFFEE — Espresso with Milk
# ============================================================
MILK_EN = "Espresso with Milk".freeze
MILK_EL = "Εσπρέσσο με Γάλα".freeze

item(name_en: "Cappuccino", name_el: "Καπουτσίνο",
     cat_en: MILK_EN, cat_el: MILK_EL,
     price: 4.00, main_category: "coffee",
     desc_en: "Espresso with steamed milk",
     desc_el: "Εσπρέσσο με αφρόγαλα",
     allergens: DAIRY)

item(name_en: "Cappuccino Doppio", name_el: "Καπουτσίνο Doppio",
     cat_en: MILK_EN, cat_el: MILK_EL,
     price: 4.50, main_category: "coffee",
     desc_en: "Double espresso with steamed milk",
     desc_el: "Διπλός εσπρέσσο με αφρόγαλα",
     allergens: DAIRY)

item(name_en: "Freddo Cappuccino", name_el: "Φρέντο Καπουτσίνο",
     cat_en: MILK_EN, cat_el: MILK_EL,
     price: 4.00, main_category: "coffee",
     desc_en: "Double espresso iced and cold milk froth",
     desc_el: "Διπλός εσπρέσσο παγωμένος με κρύο αφρόγαλα",
     allergens: DAIRY)

item(name_en: "Espresso Macchiato", name_el: "Εσπρέσσο Macchiato",
     cat_en: MILK_EN, cat_el: MILK_EL,
     price: 3.00, main_category: "coffee",
     desc_en: "Espresso with a spoonful of hot milk froth",
     desc_el: "Εσπρέσσο με μια κουταλιά ζεστό αφρόγαλα",
     allergens: DAIRY)

item(name_en: "Latte", name_el: "Latte",
     cat_en: MILK_EN, cat_el: MILK_EL,
     price: 4.50, main_category: "coffee",
     desc_en: "Espresso with hot steamed milk",
     desc_el: "Εσπρέσσο με ζεστό αφρόγαλα",
     allergens: DAIRY)

item(name_en: "Ice Latte", name_el: "Ice Latte",
     cat_en: MILK_EN, cat_el: MILK_EL,
     price: 4.50, main_category: "coffee",
     desc_en: "Espresso with iced milk and cold milk froth",
     desc_el: "Εσπρέσσο με παγωμένο γάλα και κρύο αφρόγαλα",
     allergens: DAIRY)

item(name_en: "Goth Latte Black & White", name_el: "Goth Latte Black & White",
     cat_en: MILK_EN, cat_el: MILK_EL,
     price: 5.00, main_category: "coffee",
     desc_en: "Espresso with activated carbon and steamed milk",
     desc_el: "Εσπρέσσο με ενεργό άνθρακα και αφρόγαλα",
     allergens: DAIRY)

item(name_en: "Flat White", name_el: "Flat White",
     cat_en: MILK_EN, cat_el: MILK_EL,
     price: 4.00, main_category: "coffee",
     desc_en: "Double espresso stretto with steamed milk",
     desc_el: "Διπλός εσπρέσσο stretto με αφρόγαλα",
     allergens: DAIRY)

item(name_en: "Ice Flat White", name_el: "Ice Flat White",
     cat_en: MILK_EN, cat_el: MILK_EL,
     price: 4.50, main_category: "coffee",
     desc_en: "Double espresso stretto with iced light milk and cold milk froth",
     desc_el: "Διπλός εσπρέσσο stretto με παγωμένο light γάλα και κρύο αφρόγαλα",
     allergens: DAIRY)

item(name_en: "Maroccino", name_el: "Maroccino",
     cat_en: MILK_EN, cat_el: MILK_EL,
     price: 6.00, main_category: "coffee",
     desc_en: "Double espresso with steamed milk in a glass with Nutella",
     desc_el: "Διπλός εσπρέσσο με αφρόγαλα σε ποτήρι με Nutella",
     allergens: DAIRY + NUTS)

# ============================================================
# COFFEE — More Coffee
# ============================================================
MORE_EN = "More Coffee".freeze
MORE_EL = "Άλλοι Καφέδες".freeze

item(name_en: "Greek Coffee", name_el: "Ελληνικός Καφές",
     cat_en: MORE_EN, cat_el: MORE_EL,
     price: 3.50, main_category: "coffee",
     pricing_type: "single_double", price_secondary: 4.00,
     desc_en: "Single or double", desc_el: "Μονός ή διπλός")

item(name_en: "Nescafé / Frappé", name_el: "Νεσκαφέ / Φραπέ",
     cat_en: MORE_EN, cat_el: MORE_EL,
     price: 4.00, main_category: "coffee",
     allergens: DAIRY)

item(name_en: "Frappé Affogato", name_el: "Φραπέ Affogato",
     cat_en: MORE_EN, cat_el: MORE_EL,
     price: 5.50, main_category: "coffee",
     allergens: DAIRY)

item(name_en: "Irish Coffee", name_el: "Irish Coffee",
     cat_en: MORE_EN, cat_el: MORE_EL,
     price: 6.00, main_category: "coffee",
     allergens: DAIRY + ALCOHOL)

# ============================================================
# COFFEE — Drinks & Tea
# ============================================================
TEA_EN = "Drinks & Tea".freeze
TEA_EL = "Ροφήματα & Τσάι".freeze

item(name_en: "Hot Chocolate", name_el: "Ζεστή Σοκολάτα",
     cat_en: TEA_EN, cat_el: TEA_EL,
     price: 4.50, main_category: "coffee",
     desc_en: "White, bitter & cacao",
     desc_el: "Λευκή, πικρή & κακάο",
     allergens: DAIRY)

item(name_en: "Cold Chocolate", name_el: "Κρύα Σοκολάτα",
     cat_en: TEA_EN, cat_el: TEA_EL,
     price: 4.50, main_category: "coffee",
     desc_en: "Add syrup: coconut, vanilla, caramel, strawberry or hazelnut +0.50€",
     desc_el: "Προσθήκη σιροπιού: καρύδα, βανίλια, καραμέλα, φράουλα ή φουντούκι +0.50€",
     allergens: DAIRY)

item(name_en: "Organic Women's Tea", name_el: "Οργανικό Women's Tea",
     cat_en: TEA_EN, cat_el: TEA_EL,
     price: 4.00, main_category: "coffee",
     desc_en: "Ginger, orange peel & camomile flowers",
     desc_el: "Τζίντζερ, φλούδα πορτοκαλιού & άνθη χαμομηλιού")

item(name_en: "Organic Men's Tea", name_el: "Οργανικό Men's Tea",
     cat_en: TEA_EN, cat_el: TEA_EL,
     price: 4.00, main_category: "coffee",
     desc_en: "Ayurvedic blend with ginger, ginseng & chili",
     desc_el: "Αγιουρβεδικό μείγμα με τζίντζερ, τζίνσενγκ & τσίλι")

item(name_en: "Organic Green Chai", name_el: "Οργανικό Green Chai",
     cat_en: TEA_EN, cat_el: TEA_EL,
     price: 4.00, main_category: "coffee",
     desc_en: "Green tea, cinnamon & ginger",
     desc_el: "Πράσινο τσάι, κανέλα & τζίντζερ")

item(name_en: "Organic Stomach Ease", name_el: "Οργανικό Stomach Ease",
     cat_en: TEA_EN, cat_el: TEA_EL,
     price: 4.00, main_category: "coffee",
     desc_en: "Cardamom, fennel and ginger",
     desc_el: "Κάρδαμο, μάραθος και τζίντζερ")

item(name_en: "Organic Matcha Lemon", name_el: "Οργανικό Matcha Lemon",
     cat_en: TEA_EN, cat_el: TEA_EL,
     price: 4.00, main_category: "coffee",
     desc_en: "Green tea, matcha, lemongrass & lime",
     desc_el: "Πράσινο τσάι, matcha, λεμονόχορτο & lime")

item(name_en: "Organic Feel Pure", name_el: "Οργανικό Feel Pure",
     cat_en: TEA_EN, cat_el: TEA_EL,
     price: 4.00, main_category: "coffee",
     desc_en: "Liquorice, dandelion & cinnamon",
     desc_el: "Γλυκόριζα, ταραξάκο & κανέλα")

item(name_en: "Organic Himalayan", name_el: "Οργανικό Himalayan",
     cat_en: TEA_EN, cat_el: TEA_EL,
     price: 4.00, main_category: "coffee",
     desc_en: "Ginger, fennel & cinnamon",
     desc_el: "Τζίντζερ, μάραθος & κανέλα")

item(name_en: "Black Tea", name_el: "Μαύρο Τσάι",
     cat_en: TEA_EN, cat_el: TEA_EL,
     price: 4.00, main_category: "coffee")

item(name_en: "Cretan Herbs", name_el: "Κρητικά Βότανα",
     cat_en: TEA_EN, cat_el: TEA_EL,
     price: 4.00, main_category: "coffee")

item(name_en: "Iced Tea", name_el: "Iced Tea",
     cat_en: TEA_EN, cat_el: TEA_EL,
     price: 4.00, main_category: "coffee",
     desc_en: "Green, peach or lemon",
     desc_el: "Πράσινο, ροδάκινο ή λεμόνι")

# ============================================================
# COFFEE — Homemade
# ============================================================
HOME_EN = "Homemade".freeze
HOME_EL = "Σπιτικά".freeze

item(name_en: "Homemade Lemonade", name_el: "Σπιτική Λεμονάδα",
     cat_en: HOME_EN, cat_el: HOME_EL,
     price: 4.50, main_category: "coffee",
     desc_en: "From local lemons", desc_el: "Από ντόπια λεμόνια")

item(name_en: "Homemade Strawberry Drink", name_el: "Σπιτικό Ρόφημα Φράουλας",
     cat_en: HOME_EN, cat_el: HOME_EL,
     price: 4.50, main_category: "coffee",
     desc_en: "From local strawberries", desc_el: "Από ντόπιες φράουλες")

item(name_en: "Homemade Strawberry-Lemonade", name_el: "Σπιτική Φραουλο-Λεμονάδα",
     cat_en: HOME_EN, cat_el: HOME_EL,
     price: 5.00, main_category: "coffee")

# ============================================================
# COFFEE — Fresh Juice
# ============================================================
JUICE_EN = "Fresh Juice".freeze
JUICE_EL = "Φρέσκοι Χυμοί".freeze

item(name_en: "Fresh Orange Juice", name_el: "Φρέσκος Χυμός Πορτοκάλι",
     cat_en: JUICE_EN, cat_el: JUICE_EL,
     price: 4.00, main_category: "coffee")

item(name_en: "Fresh Juice — 2 Fruits", name_el: "Φρέσκος Χυμός — 2 Φρούτα",
     cat_en: JUICE_EN, cat_el: JUICE_EL,
     price: 4.50, main_category: "coffee")

item(name_en: "Fresh Mixed Juice", name_el: "Φρέσκος Μικτός Χυμός",
     cat_en: JUICE_EN, cat_el: JUICE_EL,
     price: 5.00, main_category: "coffee",
     desc_en: "With orange, apple, banana & pear",
     desc_el: "Με πορτοκάλι, μήλο, μπανάνα & αχλάδι")

# ============================================================
# COFFEE — Soft Drinks
# ============================================================
SOFT_EN = "Soft Drinks".freeze
SOFT_EL = "Αναψυκτικά".freeze

item(name_en: "Sparkling Water", name_el: "Ανθρακούχο Νερό",
     cat_en: SOFT_EN, cat_el: SOFT_EL,
     price: 4.00, main_category: "coffee")

item(name_en: "Coca Cola / Coca Cola Zero", name_el: "Coca Cola / Coca Cola Zero",
     cat_en: SOFT_EN, cat_el: SOFT_EL,
     price: 3.50, main_category: "coffee")

item(name_en: "Fanta Lemon / Orange", name_el: "Fanta Λεμόνι / Πορτοκάλι",
     cat_en: SOFT_EN, cat_el: SOFT_EL,
     price: 3.50, main_category: "coffee")

item(name_en: "Schweppes Soda / Tonic", name_el: "Schweppes Soda / Tonic",
     cat_en: SOFT_EN, cat_el: SOFT_EL,
     price: 3.50, main_category: "coffee")

item(name_en: "Three Cents Pink Grapefruit & Ginger Beer",
     name_el: "Three Cents Pink Grapefruit & Ginger Beer",
     cat_en: SOFT_EN, cat_el: SOFT_EL,
     price: 5.00, main_category: "coffee")

item(name_en: "Red Bull", name_el: "Red Bull",
     cat_en: SOFT_EN, cat_el: SOFT_EL,
     price: 6.00, main_category: "coffee")

# ============================================================
# BEER & WINE — Beers
# ============================================================
BEER_EN = "Beers".freeze
BEER_EL = "Μπύρες".freeze

item(name_en: "Seaside", name_el: "Seaside",
     cat_en: BEER_EN, cat_el: BEER_EL,
     price: 6.00, main_category: "beer&wine",
     desc_en: "Homemade pilsner with citron & Cretan honey",
     desc_el: "Σπιτική pilsner με κίτρο & κρητικό μέλι",
     allergens: ALCOHOL + GLUTEN)

item(name_en: "Peroni Draught 300ml", name_el: "Peroni Βαρελίσια 300ml",
     cat_en: BEER_EN, cat_el: BEER_EL,
     price: 5.00, main_category: "beer&wine",
     allergens: ALCOHOL + GLUTEN)

item(name_en: "Peroni 0.0% Alcohol", name_el: "Peroni 0.0% Αλκοόλ",
     cat_en: BEER_EN, cat_el: BEER_EL,
     price: 5.00, main_category: "beer&wine",
     allergens: GLUTEN)

item(name_en: "Hofbräu München Original", name_el: "Hofbräu München Original",
     cat_en: BEER_EN, cat_el: BEER_EL,
     price: 6.00, main_category: "beer&wine",
     allergens: ALCOHOL + GLUTEN)

item(name_en: "Hofbräu München Weisse", name_el: "Hofbräu München Weisse",
     cat_en: BEER_EN, cat_el: BEER_EL,
     price: 6.00, main_category: "beer&wine",
     allergens: ALCOHOL + GLUTEN)

item(name_en: "Flaros", name_el: "Φλάρος",
     cat_en: BEER_EN, cat_el: BEER_EL,
     price: 6.00, main_category: "beer&wine",
     allergens: ALCOHOL + GLUTEN)

item(name_en: "Fix", name_el: "Fix",
     cat_en: BEER_EN, cat_el: BEER_EL,
     price: 4.50, main_category: "beer&wine",
     allergens: ALCOHOL + GLUTEN)

item(name_en: "Fix Dark", name_el: "Fix Dark",
     cat_en: BEER_EN, cat_el: BEER_EL,
     price: 5.00, main_category: "beer&wine",
     allergens: ALCOHOL + GLUTEN)

# ============================================================
# BEER & WINE — Wines
# ============================================================
WINE_EN = "Wine".freeze
WINE_EL = "Κρασιά".freeze

item(name_en: "His Queen — Sauvignon Blanc", name_el: "His Queen — Sauvignon Blanc",
     cat_en: WINE_EN, cat_el: WINE_EL,
     price: 6.00, main_category: "beer&wine",
     pricing_type: "glass_bottle", price_secondary: 25.00,
     desc_en: "Klados Winery — white", desc_el: "Klados Winery — λευκό",
     allergens: ALCOHOL)

item(name_en: "Her King — Cabernet Sauvignon",
     name_el: "Her King — Cabernet Sauvignon",
     cat_en: WINE_EN, cat_el: WINE_EL,
     price: 6.00, main_category: "beer&wine",
     pricing_type: "glass_bottle", price_secondary: 25.00,
     desc_en: "Klados Winery — red", desc_el: "Klados Winery — κόκκινο",
     allergens: ALCOHOL)

item(name_en: "Dione — Demi-sec Red or White",
     name_el: "Δίωνη — Ημίξηρο Κόκκινο ή Λευκό",
     cat_en: WINE_EN, cat_el: WINE_EL,
     price: 6.00, main_category: "beer&wine",
     pricing_type: "glass_bottle", price_secondary: 25.00,
     desc_en: "Dourakis Winery", desc_el: "Οινοποιείο Δουράκη",
     allergens: ALCOHOL)

item(name_en: "Sangria", name_el: "Sangria",
     cat_en: WINE_EN, cat_el: WINE_EL,
     price: 6.00, main_category: "beer&wine",
     allergens: ALCOHOL)

item(name_en: "Bianconero White Moschato", name_el: "Bianconero White Moschato",
     cat_en: WINE_EN, cat_el: WINE_EL,
     price: 7.00, main_category: "beer&wine",
     allergens: ALCOHOL)

item(name_en: "Bianconero Pink Moschato", name_el: "Bianconero Pink Moschato",
     cat_en: WINE_EN, cat_el: WINE_EL,
     price: 7.00, main_category: "beer&wine",
     allergens: ALCOHOL)

# ============================================================
# COCKTAILS — Home Classic
# ============================================================
CLASSIC_EN = "Home Classic".freeze
CLASSIC_EL = "Home Classic".freeze

item(name_en: "Tiki Rum Punch", name_el: "Tiki Rum Punch",
     cat_en: CLASSIC_EN, cat_el: CLASSIC_EL,
     price: 10.00, main_category: "cocktails",
     desc_en: "Blend of rum, lime, pineapple, passion, falernum, peach bitter",
     desc_el: "Μείγμα ρουμιού, lime, ανανά, passion, falernum, peach bitter",
     allergens: ALCOHOL)

item(name_en: "Letter of Maroque (aka \"Zombie\")",
     name_el: "Letter of Maroque (aka \"Zombie\")",
     cat_en: CLASSIC_EN, cat_el: CLASSIC_EL,
     price: 12.00, main_category: "cocktails",
     desc_en: "Blend of rum, orange curaçao, lime, orange, grenadine, maraschino LQR, aromatic lavender bitter",
     desc_el: "Μείγμα ρουμιού, orange curaçao, lime, πορτοκάλι, γρεναδίνη, maraschino LQR, αρωματικό lavender bitter",
     allergens: ALCOHOL)

item(name_en: "Creole Piña Colada", name_el: "Creole Piña Colada",
     cat_en: CLASSIC_EN, cat_el: CLASSIC_EL,
     price: 11.00, main_category: "cocktails",
     desc_en: "Finalist of Bacardi Piña Colada Challenge 2023. Rum, lime, pineapple, salty caramelised coconut, aromatic & spice bitter",
     desc_el: "Φιναλίστ του Bacardi Piña Colada Challenge 2023. Ρούμι, lime, ανανάς, αλατισμένη καραμελωμένη καρύδα, aromatic & spice bitter",
     allergens: ALCOHOL)

item(name_en: "Voyager", name_el: "Voyager",
     cat_en: CLASSIC_EN, cat_el: CLASSIC_EL,
     price: 10.00, main_category: "cocktails",
     desc_en: "Rum, lemonade, strawberry, aromatic bitter",
     desc_el: "Ρούμι, λεμονάδα, φράουλα, aromatic bitter",
     allergens: ALCOHOL)

# ============================================================
# COCKTAILS — Home Signature
# ============================================================
SIG_EN = "Home Signature".freeze
SIG_EL = "Home Signature".freeze

item(name_en: "Rock On", name_el: "Rock On",
     cat_en: SIG_EN, cat_el: SIG_EL,
     price: 10.00, main_category: "cocktails",
     desc_en: "Argiole, Cuban-style rum, black cardamom, aromatic bitter",
     desc_el: "Argiole, Cuban-style ρούμι, μαύρο κάρδαμο, aromatic bitter",
     allergens: ALCOHOL)

item(name_en: "Hitching", name_el: "Hitching",
     cat_en: SIG_EN, cat_el: SIG_EL,
     price: 11.00, main_category: "cocktails",
     desc_en: "Blend of rum, orange LQR, lime, macadamia, aromatic bitter",
     desc_el: "Μείγμα ρουμιού, orange LQR, lime, macadamia, aromatic bitter",
     allergens: ALCOHOL + NUTS)

item(name_en: "Bang Bang", name_el: "Bang Bang",
     cat_en: SIG_EN, cat_el: SIG_EL,
     price: 10.00, main_category: "cocktails",
     desc_en: "Reserve rum, spiced Poplandia LQR, lime, strawberry, black cardamom, aromatic bitter",
     desc_el: "Reserve ρούμι, spiced Poplandia LQR, lime, φράουλα, μαύρο κάρδαμο, aromatic bitter",
     allergens: ALCOHOL)

item(name_en: "Okey Donkey", name_el: "Okey Donkey",
     cat_en: SIG_EN, cat_el: SIG_EL,
     price: 10.00, main_category: "cocktails",
     desc_en: "Gin, cucumber, lemongrass",
     desc_el: "Gin, αγγούρι, λεμονόχορτο",
     allergens: ALCOHOL)

item(name_en: "High Five", name_el: "High Five",
     cat_en: SIG_EN, cat_el: SIG_EL,
     price: 10.00, main_category: "cocktails",
     desc_en: "Blend of gin, red bitter LQR, sweet vermouth, beetroot",
     desc_el: "Μείγμα από gin, red bitter LQR, sweet vermouth, παντζάρι",
     allergens: ALCOHOL)

item(name_en: "Pinky Promise", name_el: "Pinky Promise",
     cat_en: SIG_EN, cat_el: SIG_EL,
     price: 10.00, main_category: "cocktails",
     desc_en: "Vodka, mastiha LQR, lime, blueberry, aromatic bitter",
     desc_el: "Vodka, μαστίχα LQR, lime, blueberry, aromatic bitter",
     allergens: ALCOHOL)

item(name_en: "Shaka", name_el: "Shaka",
     cat_en: SIG_EN, cat_el: SIG_EL,
     price: 10.00, main_category: "cocktails",
     desc_en: "Blend of rum, orange LQR, blueberry, pineapple, lime, aromatic bitter",
     desc_el: "Μείγμα ρουμιού, orange LQR, blueberry, ανανάς, lime, aromatic bitter",
     allergens: ALCOHOL)

# ============================================================
# FOOD — Snack & Brunch
# ============================================================
SNACK_EN = "Snack & Brunch".freeze
SNACK_EL = "Snack & Brunch".freeze

item(name_en: "Panini Salami", name_el: "Panini Σαλάμι",
     cat_en: SNACK_EN, cat_el: SNACK_EL,
     price: 6.00, main_category: "food",
     desc_en: "Smoked salami, light Cretan graviera, handmade cream from local cheese with dill, cherry tomato, fresh salad, mustard and toasted bread",
     desc_el: "Καπνιστό σαλάμι αέρος, γραβιέρα Κρήτης light, χειροποίητη κρέμα γαλομυζήθρας με άνηθο, τοματίνια, νεαρή σαλάτα και μουστάρδα σε τραγανό χωριάτικο ψωμάκι",
     allergens: GLUTEN + DAIRY)

item(name_en: "Bomba Pinsa Toast", name_el: "Bomba Pinsa Toast",
     cat_en: SNACK_EN, cat_el: SNACK_EL,
     price: 7.50, main_category: "food",
     desc_en: "Smoked pork shoulder, smoked salami, light Cretan graviera, tomato, cucumber pappardella, fresh salad with aromatic lemon-olive oil and honey dressing, and tropical sauce",
     desc_el: "Καπνιστή χοιρινή ωμοπλάτη, καπνιστό σαλάμι αέρος, γραβιέρα Κρήτης light, τομάτα, αγγούρι παπαρδέλα, νεαρή σαλάτα και tropical sauce",
     allergens: GLUTEN + DAIRY)

item(name_en: "Toast", name_el: "Τοστ",
     cat_en: SNACK_EN, cat_el: SNACK_EL,
     price: 4.00, main_category: "food",
     desc_en: "Ham or turkey, light Cretan graviera",
     desc_el: "Ζαμπόν ή γαλοπούλα, γραβιέρα Κρήτης light",
     allergens: GLUTEN + DAIRY)

item(name_en: "Toast Home", name_el: "Τοστ Home",
     cat_en: SNACK_EN, cat_el: SNACK_EL,
     price: 7.00, main_category: "food",
     desc_en: "Ham or turkey, light Cretan graviera, tomato, lola, mayonnaise and handmade potato chips",
     desc_el: "Ζαμπόν ή γαλοπούλα, γραβιέρα Κρήτης light, τομάτα, μαρούλι, μαγιονέζα και χειροποίητα chips πατάτας",
     allergens: GLUTEN + DAIRY + EGGS)

item(name_en: "Toast Home Chicken", name_el: "Τοστ Home Chicken",
     cat_en: SNACK_EN, cat_el: SNACK_EL,
     price: 9.00, main_category: "food",
     desc_en: "Chicken, light Cretan graviera, tomato, lola, mayonnaise and handmade potato chips",
     desc_el: "Κοτόπουλο, γραβιέρα Κρήτης light, τομάτα, μαρούλι, μαγιονέζα και χειροποίητα chips πατάτας",
     allergens: GLUTEN + DAIRY + EGGS)

item(name_en: "Open Smash Avocado Toast", name_el: "Open Smash Avocado Toast",
     cat_en: SNACK_EN, cat_el: SNACK_EL,
     price: 8.50, main_category: "food",
     desc_en: "Sourdough bread with avocado, hard-boiled egg, cherry tomato, olive oil and black-white sesame",
     desc_el: "Φέτες προζυμένιου ψωμιού αργής ωρίμανσης με αβοκάντο, αυγό βραστό, τοματίνια, παρθένο ελαιόλαδο και ασπρόμαυρο σουσάμι",
     allergens: GLUTEN + EGGS)

item(name_en: "Chicken Lobsterroll", name_el: "Chicken Lobsterroll",
     cat_en: SNACK_EN, cat_el: SNACK_EL,
     price: 8.00, main_category: "food",
     desc_en: "Chicken fillet, cherry tomato, iceberg, parmesan, tropical sauce, relish mango pineapple and handmade chips potato",
     desc_el: "Φιλέτο κοτόπουλο, τοματίνια, iceberg, παρμεζάνα, tropical sauce, ρελίς μάνγκο ανανά και χειροποίητα chips πατάτας",
     allergens: GLUTEN + DAIRY)

item(name_en: "Cretan Tacos", name_el: "Cretan Tacos",
     cat_en: SNACK_EN, cat_el: SNACK_EL,
     price: 10.00, main_category: "food",
     desc_en: "Chicken, Greek salad tartare, yogurt sauce with cumin-lime and handmade potato chips",
     desc_el: "Κοτόπουλο, ταρτάρ χωριάτικης, σως γιαουρτιού με κύμινο-lime και χειροποίητα chips πατάτας",
     allergens: GLUTEN + DAIRY)

item(name_en: "Chicken Nuggets — 6 / 10 pieces",
     name_el: "Chicken Nuggets — 6 / 10 τεμάχια",
     cat_en: SNACK_EN, cat_el: SNACK_EL,
     price: 7.00, main_category: "food",
     pricing_type: "single_double", price_secondary: 10.00,
     desc_en: "Handmade chicken nuggets from chicken fillet with panko and tropical sauce. With potato fries or salad",
     desc_el: "Χειροποίητες κοτομπουκιές από φιλέτο κοτόπουλο με panko και tropical sauce. Συνοδεύεται από πατάτες ή σαλάτα",
     allergens: GLUTEN + EGGS)

item(name_en: "Eggs with Staka", name_el: "Αυγά με Στάκα",
     cat_en: SNACK_EN, cat_el: SNACK_EL,
     price: 8.00, main_category: "food",
     desc_en: "Fried egg with staka, sesame and toasted sourdough bread with olive oil and sea salt",
     desc_el: "Αυγά μάτια τηγανισμένα με στάκα, σουσάμι και φρυγανισμένο ψωμί αργής ωρίμανσης με ελαιόλαδο και ανθό αλατιού",
     allergens: GLUTEN + EGGS + DAIRY)

# ============================================================
# FOOD — Omelets
# ============================================================
OMELET_EN = "Omelets".freeze
OMELET_EL = "Ομελέτες".freeze

item(name_en: "Salmon Avocado Omelet", name_el: "Ομελέτα Σολωμός Αβοκάντο",
     cat_en: OMELET_EN, cat_el: OMELET_EL,
     price: 11.00, main_category: "food",
     desc_en: "Smoked salmon, avocado, fresh salad with aromatic lemon-olive oil and honey dressing, cherry tomato, cucumber pappardella, parmesan and toasted sourdough bread",
     desc_el: "Καπνιστός σολωμός, αβοκάντο, νεαρή σαλάτα με αρωματικό λαδολέμονο και μέλι, τοματίνια, αγγούρι παπαρδέλα, παρμεζάνα και φρυγανισμένο ψωμί αργής ωρίμανσης",
     allergens: EGGS + SEAFOOD + GLUTEN + DAIRY)

item(name_en: "Chicken Omelet", name_el: "Ομελέτα Κοτόπουλο",
     cat_en: OMELET_EN, cat_el: OMELET_EL,
     price: 9.00, main_category: "food",
     desc_en: "Chicken fillet, fresh salad with aromatic lemon-olive oil and honey dressing, cucumber pappardella, parmesan and sourdough bread",
     desc_el: "Φιλέτο κοτόπουλο, νεαρή σαλάτα με αρωματικό λαδολέμονο και μέλι, αγγούρι παπαρδέλα, παρμεζάνα και φρυγανισμένο ψωμί αργής ωρίμανσης",
     allergens: EGGS + GLUTEN + DAIRY)

item(name_en: "Prosciutto Omelet", name_el: "Ομελέτα Prosciutto",
     cat_en: OMELET_EN, cat_el: OMELET_EL,
     price: 9.00, main_category: "food",
     desc_en: "Prosciutto, fresh salad with aromatic lemon-olive oil and honey dressing, cherry tomato, cucumber pappardella, parmesan and toasted sourdough bread",
     desc_el: "Prosciutto, νεαρή σαλάτα με αρωματικό λαδολέμονο και μέλι, τοματίνια, αγγούρι παπαρδέλα, παρμεζάνα και φρυγανισμένο ψωμί αργής ωρίμανσης",
     allergens: EGGS + GLUTEN + DAIRY)

# ============================================================
# FOOD — Healthy
# ============================================================
HEALTHY_EN = "Healthy".freeze
HEALTHY_EL = "Healthy".freeze

item(name_en: "Hazelnut Butter Toast", name_el: "Toast με Φουντουκοβούτυρο",
     cat_en: HEALTHY_EN, cat_el: HEALTHY_EL,
     price: 7.50, main_category: "food",
     desc_en: "Toasted sourdough bread with handmade hazelnut butter, honey, tahini, linseed, almond, walnut, hazelnut, honeycomb and pollen",
     desc_el: "Φρυγανισμένο ψωμί αργής ωρίμανσης με χειροποίητο φουντουκοβούτυρο, μέλι, ταχίνι, λιναρόσπορο, αμύγδαλα, καρύδια, φουντούκια, κηρήθρα και γύρη",
     allergens: GLUTEN + NUTS)

item(name_en: "Chia Porridge", name_el: "Chia Porridge",
     cat_en: HEALTHY_EN, cat_el: HEALTHY_EL,
     price: 7.50, main_category: "food",
     desc_en: "Chia seeds in oat milk with banana, linseed, almond, walnut, hazelnut, tahini and agave syrup",
     desc_el: "Σπόροι Chia σε ρόφημα βρώμης με μπανάνα, λιναρόσπορο, αμύγδαλα, καρύδια, φουντούκια, ταχίνι και σιρόπι αγαύης",
     allergens: NUTS)

item(name_en: "Yogurt with Honey", name_el: "Γιαούρτι με Μέλι",
     cat_en: HEALTHY_EN, cat_el: HEALTHY_EL,
     price: 5.50, main_category: "food",
     desc_en: "Yogurt with thyme honey and roasted almonds",
     desc_el: "Γιαούρτι με θυμαρίσιο μέλι και καβουρντισμένα αμύγδαλα",
     allergens: DAIRY + NUTS)

# ============================================================
# FOOD — Salads
# ============================================================
SALAD_EN = "Salads".freeze
SALAD_EL = "Σαλάτες".freeze

item(name_en: "Chicken Salad", name_el: "Σαλάτα Κοτόπουλο",
     cat_en: SALAD_EN, cat_el: SALAD_EL,
     price: 8.50, main_category: "food",
     desc_en: "Chicken fillet, fresh salad with aromatic lemon-olive oil and honey dressing, cherry tomato, cucumber pappardella, relish mango pineapple with sweet chilli and flakes parmesan",
     desc_el: "Φιλέτο κοτόπουλο, νεαρή σαλάτα με αρωματικό λαδολέμονο και μέλι, τοματίνια, αγγούρι παπαρδέλα, ρελίς μάνγκο ανανά με sweet chilli και flakes παρμεζάνα",
     allergens: DAIRY)

item(name_en: "Salmon Salad", name_el: "Σαλάτα Σολωμός",
     cat_en: SALAD_EN, cat_el: SALAD_EL,
     price: 9.50, main_category: "food",
     desc_en: "Smoked salmon, fresh salad with aromatic lemon-olive oil and honey dressing, green apple, zucchini pappardella, pickles sauce and flakes parmesan",
     desc_el: "Καπνιστός σολωμός, νεαρή σαλάτα με αρωματικό λαδολέμονο και μέλι, τοματίνια, αγγούρι παπαρδέλα, πράσινο μήλο, κολοκύθι παπαρδέλα, pickle sauce και flakes παρμεζάνας",
     allergens: SEAFOOD + DAIRY)

item(name_en: "Cretan Ntakos", name_el: "Κρητικός Ντάκος",
     cat_en: SALAD_EN, cat_el: SALAD_EL,
     price: 9.00, main_category: "food",
     desc_en: "Olive rusks with fresh grated tomato, cherry tomato, roasted eggplant, olive oil, homemade cream from local cheese and caper flower",
     desc_el: "Παξιμάδι ελιάς με φρέσκια τριμμένη τομάτα, τοματίνια, ψητή μελιτζάνα, παρθένο ελαιόλαδο, κρέμα γαλομυζήθρας και καπαρόφυλλα",
     allergens: GLUTEN + DAIRY)

item(name_en: "Tabbouleh", name_el: "Tabbouleh",
     cat_en: SALAD_EN, cat_el: SALAD_EL,
     price: 8.50, main_category: "food",
     desc_en: "Soaked uncooked bulgur with tricolore peppers, tomato, cucumber, fresh onion, olive oil and handmade cream from local cheese",
     desc_el: "Πλιγούρι με πολύχρωμες πιπεριές, τομάτα, αγγούρι, φρέσκο κρεμμύδι, ελαιόλαδο και κρέμα γαλομυζήθρας",
     allergens: GLUTEN + DAIRY)

# ============================================================
# FOOD — Burgers
# ============================================================
BURGER_EN = "Burgers".freeze
BURGER_EL = "Burgers".freeze

item(name_en: "Classic Cheeseburger", name_el: "Classic Cheeseburger",
     cat_en: BURGER_EN, cat_el: BURGER_EL,
     price: 10.00, main_category: "food",
     desc_en: "Fresh brioche bun with 200g of fresh 100% ground beef, cheddar, iceberg, tomato, burger sauce, ketchup, mustard, onions and pickled cucumbers",
     desc_el: "Μοσχαρίσιο μπιφτέκι 200gr, cheddar, τομάτα, iceberg, πίκλα κρεμμύδι, πίκλες, burger sauce, κέτσαπ και μουστάρδα σε φρέσκο brioche bun",
     allergens: GLUTEN + DAIRY + EGGS)

item(name_en: "Bacon Cheeseburger", name_el: "Bacon Cheeseburger",
     cat_en: BURGER_EN, cat_el: BURGER_EL,
     price: 11.00, main_category: "food",
     desc_en: "Fresh brioche bun with 200g of fresh 100% ground beef, cheddar, bacon, iceberg, tomato, burger sauce, ketchup, mustard, onions and pickled cucumbers",
     desc_el: "Μοσχαρίσιο μπιφτέκι 200gr, τραγανό μπέικον, cheddar, τομάτα, iceberg, πίκλες κρεμμύδι, πίκλες, burger sauce, κέτσαπ και μουστάρδα σε φρέσκο brioche bun",
     allergens: GLUTEN + DAIRY + EGGS)

item(name_en: "Jack Daniel's Burger", name_el: "Jack Daniel's Burger",
     cat_en: BURGER_EN, cat_el: BURGER_EL,
     price: 12.00, main_category: "food",
     desc_en: "Fresh brioche bun with 200g of fresh 100% ground beef, cheddar, mushrooms, homemade caramelised onions, BBQ sauce and homemade Jack Daniel's sauce",
     desc_el: "Μοσχαρίσιο μπιφτέκι 200gr, cheddar, μανιτάρια, καραμελωμένο κρεμμύδι, BBQ sauce και χειροποίητη Jack Daniel's sauce σε φρέσκο brioche bun",
     allergens: GLUTEN + DAIRY + EGGS + ALCOHOL)

item(name_en: "Chicken Burger", name_el: "Chicken Burger",
     cat_en: BURGER_EN, cat_el: BURGER_EL,
     price: 10.00, main_category: "food",
     desc_en: "Fresh brioche bun with chicken breast fillet, cheddar, iceberg, tomato, tropical sauce and pickled cucumbers",
     desc_el: "Ψητό φιλέτο κοτόπουλο, cheddar, τομάτα, iceberg, πίκλες κρεμμύδι, πίκλες και tropical sauce σε φρέσκο brioche bun",
     allergens: GLUTEN + DAIRY + EGGS)

# ============================================================
# FOOD — Pinsa
# ============================================================
PINSA_EN = "Pinsa".freeze
PINSA_EL = "Πίντσα".freeze

item(name_en: "Pomodori", name_el: "Pomodori",
     cat_en: PINSA_EN, cat_el: PINSA_EL,
     price: 9.00, main_category: "food",
     desc_en: "Pomodori sauce, mozzarella, baby rocket, cherry tomato and parmesan",
     desc_el: "Σάλτσα pomodori, mozzarella, ρόκα, τοματίνι, ημίλιαστα κόκκινα και κίτρινα τοματίνια και παρμεζάνα",
     allergens: GLUTEN + DAIRY)

item(name_en: "Bianca", name_el: "Bianca",
     cat_en: PINSA_EN, cat_el: PINSA_EL,
     price: 10.00, main_category: "food",
     desc_en: "Porcini mushrooms, black truffle, camembert, pistachio and parmesan",
     desc_el: "Μανιτάρια porcini, μαύρη τρούφα, τυρί camembert, φιστίκια Αιγίνης και παρμεζάνα",
     allergens: GLUTEN + DAIRY + NUTS)

item(name_en: "Prosciutto Pesto", name_el: "Prosciutto Pesto",
     cat_en: PINSA_EN, cat_el: PINSA_EL,
     price: 9.50, main_category: "food",
     desc_en: "Pomodori sauce, prosciutto, basil pesto, fresh zucchini pappardella and parmesan",
     desc_el: "Σάλτσα pomodori, prosciutto, pesto βασιλικού, φρέσκο κολοκύθι παπαρδέλα και παρμεζάνα",
     allergens: GLUTEN + DAIRY + NUTS)

# ============================================================
# FOOD — Sweet
# ============================================================
SWEET_EN = "Sweet".freeze
SWEET_EL = "Γλυκά".freeze

item(name_en: "Sweet Dog", name_el: "Sweet Dog",
     cat_en: SWEET_EN, cat_el: SWEET_EL,
     price: 6.50, main_category: "food",
     desc_en: "Butter bread lobsterroll, banana, chocolate praline, handmade vanilla cream, chocolate wafer, feuilletine, almond, walnut, hazelnut and fermented red fruits",
     desc_el: "Ψωμάκι βουτύρου lobsterroll, μπανάνα, πραλίνα σοκολάτας, χειροποίητη κρέμα βανίλιας, σοκοφρέτα, φεγεντίν, αμύγδαλα, καρύδια, φουντούκια και κόκκινα φρούτα σε όσμωση",
     allergens: GLUTEN + DAIRY + EGGS + NUTS)

item(name_en: "Chocolate Lava Cake", name_el: "Chocolate Lava Cake",
     cat_en: SWEET_EN, cat_el: SWEET_EL,
     price: 6.50, main_category: "food",
     desc_en: "Chocolate cake with red fruits, grated white chocolate and vanilla ice cream with feuilletine and chocolate syrup",
     desc_el: "Ζουμερό κέικ σοκολάτας με κόκκινα φρούτα σε όσμωση και τριμμένη λευκή σοκολάτα. Συνοδεύεται από παγωτό βανίλια, φεγεντίν και σιρόπι σοκολάτας",
     allergens: GLUTEN + DAIRY + EGGS)

item(name_en: "Tortilla Mpougatsa", name_el: "Tortilla Μπουγάτσα",
     cat_en: SWEET_EN, cat_el: SWEET_EL,
     price: 6.00, main_category: "food",
     desc_en: "Handmade vanilla cream, vanilla ice cream, fried tortilla with sugar and cinnamon",
     desc_el: "Χειροποίητη κρέμα βανίλιας, παγωτό βανίλια με τηγανητές tortilla και άχνη κανέλα",
     allergens: GLUTEN + DAIRY + EGGS)

item(name_en: "Cheesecake", name_el: "Cheesecake",
     cat_en: SWEET_EN, cat_el: SWEET_EL,
     price: 6.00, main_category: "food",
     desc_en: "Handmade cream cheese with white chocolate and yogurt, crispy biscuit base and fermented red fruits",
     desc_el: "Χειροποίητη κρέμα τυρί με λευκή σοκολάτα και γιαούρτι, τραγανή βάση μπισκότου και κόκκινα φρούτα σε όσμωση",
     allergens: GLUTEN + DAIRY + EGGS)

item(name_en: "Sfakiani Pita", name_el: "Σφακιανή Πίτα",
     cat_en: SWEET_EN, cat_el: SWEET_EL,
     price: 7.00, main_category: "food",
     desc_en: "Local sfakiani cheese pie with thyme honey, nuts, fermented red fruits and honeycomb",
     desc_el: "Σφακιανή πίτα με θυμαρίσιο μέλι, ξηρούς καρπούς, κόκκινα φρούτα σε όσμωση και κηρήθρα",
     allergens: GLUTEN + DAIRY + NUTS)

# ============================================================
# FOOD — Charcuterie
# ============================================================
CHARC_EN = "Charcuterie".freeze
CHARC_EL = "Πιατέλες".freeze

item(name_en: "Charcuterie Board — Small", name_el: "Πιατέλα Αλλαντικών — Μικρή",
     cat_en: CHARC_EN, cat_el: CHARC_EL,
     price: 12.00, main_category: "food",
     desc_en: "Selection of cold cuts and cheeses",
     desc_el: "Ποικιλία αλλαντικών και τυριών",
     allergens: DAIRY)

item(name_en: "Charcuterie Board — Big", name_el: "Πιατέλα Αλλαντικών — Μεγάλη",
     cat_en: CHARC_EN, cat_el: CHARC_EL,
     price: 20.00, main_category: "food",
     desc_en: "Selection of cold cuts and cheeses",
     desc_el: "Ποικιλία αλλαντικών και τυριών",
     allergens: DAIRY)

# ============================================================
# Summary
# ============================================================
total = MenuItem.count
puts "Seeded #{total} menu items"
puts "  Coffee:    #{MenuItem.where(main_category: 'coffee').count}"
puts "  Cocktails: #{MenuItem.where(main_category: 'cocktails').count}"
puts "  Beer&Wine: #{MenuItem.where(main_category: 'beer&wine').count}"
puts "  Food:      #{MenuItem.where(main_category: 'food').count}"
