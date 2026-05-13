# Singleton document holding everything the admin panel manages outside
# of the menu items themselves: schedule (time-of-day phases + per-phase
# category ordering), subcategory metadata (rename/reorder/hide), and
# homepage photos (hero, journey cards, gallery).
#
# There is only ever one document. Access via `SiteSetting.current` —
# never .first.create_or_find_by random shenanigans.
class SiteSetting
  include Mongoid::Document
  include Mongoid::Timestamps

  # ----- Schedule -----
  # Cutoffs are hours-of-day integers in [0, 23] — the START of each
  # phase. Strictly ascending. Matches the existing
  # frontend/src/config/schedule.ts contract, so the frontend can swap
  # localStorage for the API without changing its validation logic.
  #
  # categoryOrder is a 5-element list per phase — the order in which the
  # 5 main categories appear in CategoryNav for that time of day.
  #
  # Shape:
  # {
  #   "cutoffs": { "morning": 6, "afternoon": 11, "golden": 16,
  #                "evening": 19, "night": 23 },
  #   "categoryOrder": {
  #     "morning":   ["coffee","food","beer&wine","cocktails","spirits"],
  #     "afternoon": [...], "golden": [...], "evening": [...], "night": [...]
  #   }
  # }
  field :schedule, type: Hash, default: -> { SiteSetting.default_schedule }

  # ----- Subcategories -----
  # Per-(main_category, slug) metadata. Slug is the canonical English
  # category string from MenuItem.category_translations["en"]. Frontend
  # uses these overrides to display localized names, reorder, hide.
  #
  # Shape:
  # {
  #   "coffee": [
  #     { "slug": "Espresso", "label_en": "Espresso", "label_el": "Εσπρέσσο",
  #       "position": 0, "hidden": false, "icon": null },
  #     ...
  #   ],
  #   "cocktails": [...], "beer&wine": [...], "food": [...], "spirits": [...]
  # }
  field :subcategories, type: Hash, default: -> { {} }

  # ----- Homepage photos -----
  # Structure:
  #   hero     — single optional override (full-bleed homepage photo).
  #              null = use bundled curated photo for current phase.
  #   journey  — legacy override slots (kept for back-compat; the new UI
  #              ignores them in favour of `curation`).
  #   gallery  — same legacy story as `journey`.
  #   curation — UNIFIED LIBRARY. Each entry is either a `bundled` photo
  #              from album1.ts (referenced by slug) or a `custom` upload
  #              (with its own url + srcset). Curation drives BOTH the
  #              hero rotation (highest priority for current phase) and
  #              the journey strip (ordered by `position`).
  #
  # CuratedEntry shape:
  #   { "kind": "bundled" | "custom",
  #     "slug": "food-session-30",                # bundled: album slug; custom: any stable id
  #     "url": "/uploads/abc.jpg",                # custom only
  #     "srcset": { "640": "...", "1280": "...", "1920": "..." },  # custom only
  #     "width": 1920, "height": 1080,            # custom only
  #     "phases": ["morning", "afternoon"],
  #     "subjects": ["venue", "detail"],          # advisory tags
  #     "captionEN": "Morning light, fresh menu",
  #     "captionEL": "Πρωινό φως, φρέσκο μενού",
  #     "altEN": "...", "altEL": "...",
  #     "priority": 9,
  #     "hidden": false,
  #     "position": 0 }
  field :homepage_photos, type: Hash, default: -> { SiteSetting.default_homepage_photos }

  def self.current
    first || create!
  end

  # Mirrors frontend/src/assets/photos/curation.ts so a fresh install shows
  # the same homepage photos as the bundled fallback. Admins can then edit
  # captions, phase tags, priorities, add/remove entries from this list,
  # or upload custom photos that join the same curation feed.
  def self.default_homepage_photos
    {
      "hero" => nil,
      "hero_picks" => default_hero_picks,
      "journey" => [],
      "gallery" => [],
      "curation" => default_curation
    }
  end

  # Per-phase locked hero. Each value is either a slug present in the
  # curation list, or nil = "auto-pick highest-priority matching photo".
  # Five fixed slots, one per phase — the admin sees them as five hero
  # cards in the Hero Override tab.
  def self.default_hero_picks
    {
      "morning"   => nil,
      "afternoon" => nil,
      "golden"    => nil,
      "evening"   => nil,
      "night"     => nil
    }
  end

  def self.default_curation
    bundled = [
      ["food-session-30", %w[morning afternoon],         %w[venue detail],   "Morning light, fresh menu",                  "Πρωινό φως, φρέσκο μενού",                          9],
      ["food-session-5",  %w[morning],                   %w[coffee food],    "Espresso, latte art, and what's next",       "Espresso, latte art, και τι ακολουθεί",             8],
      ["food-session-10", %w[morning afternoon],         %w[coffee food],    "Slow breakfast by the window",               "Αργό πρωινό δίπλα στο παράθυρο",                    7],
      ["food-session-40", %w[morning],                   %w[food detail],    "Honeycomb, walnuts, microgreens",            "Κηρήθρα, καρύδια, μικροφύλλα",                       0],
      ["food-session-15", %w[afternoon],                 %w[food],           "Toasted sandwich, embossed tile, quiet hours","Ψητό σάντουιτς, ανάγλυφο πλακάκι, ήσυχες ώρες",     0],
      ["food-session-20", %w[afternoon],                 %w[food],           "Stacked, layered, plenty",                   "Στρώσεις και ποικιλία",                              0],
      ["food-session-25", %w[afternoon],                 %w[drink food],     "Fresh mango, salad, and a long lunch",       "Φρέσκο μάνγκο, σαλάτα, και ένα μεγάλο μεσημέρι",    0],
      ["food-session-45", %w[afternoon],                 %w[food],           "Smoked salmon, garden greens",               "Καπνιστός σολομός, λαχανικά",                        0],
      ["food-session-50", %w[golden],                    %w[dessert],        "Sweet endings as the light turns",           "Γλυκό κλείσιμο όσο το φως αλλάζει",                 7],
      ["food-session-55", %w[golden],                    %w[dessert detail], "Chia, banana, berry — slow afternoon",       "Chia, μπανάνα, μούρα — αργό απόγευμα",              0],
      ["food-session-67", %w[golden evening],            %w[ocean],          "The sea at golden hour",                     "Η θάλασσα στη χρυσή ώρα",                            10],
      ["food-session-65", %w[golden evening],            %w[ocean],          "Pink skies, salt air",                       "Ρόδινος ουρανός, αλμυρός αέρας",                    0],
      ["food-session-60", %w[evening night],             %w[food drink],     "Pizza, red wine, no rush",                   "Πίτσα, κόκκινο κρασί, χωρίς βιασύνη",               8],
      ["food-session-58", %w[evening],                   %w[food],           "Late dinner, perfect crust",                 "Όψιμο δείπνο, τέλεια κρούστα",                       0],
      ["food-session-70", %w[evening night],             %w[venue],          "Home Seaside, after dark",                   "Home Seaside, μετά το ηλιοβασίλεμα",                10],
      ["food-session-1",  %w[evening night],             %w[venue detail],   "Glass, plant, the house bottle",             "Ποτήρι, φυτό, το μπουκάλι του σπιτιού",             0]
    ]
    bundled.each_with_index.map do |(slug, phases, subjects, en, el, pri), idx|
      {
        "kind"      => "bundled",
        "slug"      => slug,
        "phases"    => phases,
        "subjects"  => subjects,
        "captionEN" => en,
        "captionEL" => el,
        "altEN"     => en,
        "altEL"     => el,
        "priority"  => pri,
        "hidden"    => false,
        "position"  => idx
      }
    end
  end

  # Defaults that match the existing hardcoded values in
  # frontend/src/config/schedule.ts so the site behaves identically on
  # a brand-new install.
  def self.default_schedule
    {
      "cutoffs" => {
        "morning"   => 6,
        "afternoon" => 11,
        "golden"    => 16,
        "evening"   => 19,
        "night"     => 23
      },
      "categoryOrder" => {
        "morning"   => %w[coffee food beer&wine cocktails spirits],
        "afternoon" => %w[food coffee beer&wine spirits cocktails],
        "golden"    => %w[cocktails beer&wine food coffee spirits],
        "evening"   => %w[cocktails spirits beer&wine food coffee],
        "night"     => %w[spirits cocktails beer&wine food coffee]
      }
    }
  end
end
