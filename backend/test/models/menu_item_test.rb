require "test_helper"

class MenuItemTest < ActiveSupport::TestCase
  # ── Defaults ───────────────────────────────────────────────────────────

  test "pricing_type defaults to single" do
    item = MenuItem.new(main_category: "coffee", price: 3.5, name: "Espresso")
    assert_equal "single", item.pricing_type
  end

  test "available defaults to true" do
    item = MenuItem.new(main_category: "coffee", price: 3.5, name: "Espresso")
    assert_equal true, item.available
  end

  test "allergens defaults to empty array" do
    item = MenuItem.new(main_category: "coffee", price: 3.5, name: "Espresso")
    assert_equal [], item.allergens
  end

  # ── Persistence ────────────────────────────────────────────────────────

  test "saves with required fields" do
    item = MenuItem.new(main_category: "coffee", price: 3.5, name: "Espresso")
    assert item.save, item.errors.full_messages.to_sentence
    assert_equal "Espresso", item.reload.name
  end

  test "image_url round-trips" do
    item = MenuItem.create!(main_category: "coffee", price: 3.5, name: "Cappuccino", image_url: "/uploads/abc.webp")
    assert_equal "/uploads/abc.webp", MenuItem.find(item.id).image_url
  end

  # ── Price validation ───────────────────────────────────────────────────

  test "rejects missing price" do
    item = MenuItem.new(main_category: "coffee", name: "X")
    assert_not item.save
    assert_includes item.errors[:price], "can't be blank"
  end

  test "rejects zero price" do
    item = MenuItem.new(main_category: "coffee", price: 0, name: "X")
    assert_not item.save
  end

  test "rejects negative price" do
    item = MenuItem.new(main_category: "coffee", price: -1, name: "X")
    assert_not item.save
  end

  # ── Main category validation ──────────────────────────────────────────

  test "accepts each main category" do
    MenuItem::MAIN_CATEGORIES.each do |cat|
      item = MenuItem.new(main_category: cat, price: 1, name: "X")
      assert item.save, "category #{cat} should be valid: #{item.errors.full_messages.to_sentence}"
    end
  end

  test "rejects unknown main category" do
    item = MenuItem.new(main_category: "tea", price: 1, name: "X")
    assert_not item.save
  end

  test "rejects nil main category" do
    item = MenuItem.new(price: 1, name: "X")
    assert_not item.save
  end

  # ── Pricing type ──────────────────────────────────────────────────────

  test "accepts each pricing_type" do
    %w[single single_double glass_bottle].each do |pt|
      item = MenuItem.new(main_category: "coffee", price: 1, pricing_type: pt, name: "X")
      assert item.save, "pricing_type #{pt} should be valid"
    end
  end

  test "rejects unknown pricing_type" do
    item = MenuItem.new(main_category: "coffee", price: 1, pricing_type: "bottomless", name: "X")
    assert_not item.save
  end

  test "price_secondary may be nil" do
    item = MenuItem.new(main_category: "coffee", price: 1, name: "X", price_secondary: nil)
    assert item.save
  end

  test "price_secondary must be positive when set" do
    item = MenuItem.new(main_category: "coffee", price: 1, name: "X", price_secondary: -1)
    assert_not item.save
  end

  test "price_secondary persists for dual pricing" do
    item = MenuItem.create!(main_category: "beer&wine", price: 6, pricing_type: "glass_bottle", price_secondary: 24, name: "House White")
    assert_in_delta 24.0, item.reload.price_secondary
  end

  # ── Localized name validation ─────────────────────────────────────────

  test "requires name in at least one locale" do
    item = MenuItem.new(main_category: "coffee", price: 1)
    assert_not item.save
    assert_includes item.errors[:name], "must be provided in at least one language"
  end

  test "accepts name in EN only" do
    item = MenuItem.new(main_category: "coffee", price: 1)
    I18n.with_locale(:en) { item.name = "Filter" }
    assert item.save
  end

  test "accepts name in EL only" do
    item = MenuItem.new(main_category: "coffee", price: 1)
    I18n.with_locale(:el) { item.name = "Φραπέ" }
    assert item.save
  end

  test "stores name per locale independently" do
    item = MenuItem.new(main_category: "coffee", price: 1)
    I18n.with_locale(:en) { item.name = "Espresso" }
    I18n.with_locale(:el) { item.name = "Εσπρέσσο" }
    item.save!
    item.reload
    assert_equal "Espresso", I18n.with_locale(:en) { item.name }
    assert_equal "Εσπρέσσο", I18n.with_locale(:el) { item.name }
  end

  test "blank-only names in every locale are still rejected" do
    item = MenuItem.new(main_category: "coffee", price: 1)
    I18n.with_locale(:en) { item.name = "  " }
    I18n.with_locale(:el) { item.name = "" }
    assert_not item.save
  end

  # ── Timestamps ────────────────────────────────────────────────────────

  test "records timestamps" do
    item = MenuItem.create!(main_category: "coffee", price: 1, name: "X")
    assert_not_nil item.created_at
    assert_not_nil item.updated_at
  end
end
