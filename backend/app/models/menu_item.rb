class MenuItem
  include Mongoid::Document
  include Mongoid::Timestamps

  MAIN_CATEGORIES = %w[coffee spirits cocktails beer&wine food].freeze
  PRICING_TYPES = %w[single single_double glass_bottle].freeze

  field :name, type: String, localize: true
  field :description, type: String, localize: true
  field :main_category, type: String
  field :category, type: String, localize: true
  field :price, type: Float
  field :pricing_type, type: String, default: "single"
  field :price_secondary, type: Float
  field :available, type: Mongoid::Boolean, default: true
  field :allergens, type: Array, default: []
  field :image_url, type: String

  validates :price, presence: true, numericality: { greater_than: 0 }
  validates :main_category, inclusion: { in: MAIN_CATEGORIES }, allow_nil: false
  validates :pricing_type, inclusion: { in: PRICING_TYPES }
  validates :price_secondary, numericality: { greater_than: 0 }, allow_nil: true
  validate :name_present_in_at_least_one_locale

  private

  def name_present_in_at_least_one_locale
    translations = name_translations || {}
    if translations.values.all?(&:blank?)
      errors.add(:name, "must be provided in at least one language")
    end
  end
end
