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
  # Three slot collections. Each slot has an id (stable key the frontend
  # references), url (override path/CDN URL), alt_en/alt_el, position.
  # Null url means "use the bundled default" so the frontend falls back.
  #
  # Shape:
  # {
  #   "hero":    { "url": "https://...", "alt_en": "...", "alt_el": "..." },
  #   "journey": [ { "id": "morning-1", "url": "...", "alt_en": "...",
  #                  "alt_el": "...", "caption_en": "...", "caption_el": "...",
  #                  "position": 0 }, ... 16 entries ],
  #   "gallery": [ { "id": "g1", "url": "...", "alt_en": "...",
  #                  "alt_el": "...", "position": 0 }, ... ]
  # }
  field :homepage_photos, type: Hash, default: -> { { "hero" => nil, "journey" => [], "gallery" => [] } }

  def self.current
    first || create!
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
