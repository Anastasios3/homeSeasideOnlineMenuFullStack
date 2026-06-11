require "test_helper"

class SiteSettingTest < ActiveSupport::TestCase
  test "current creates exactly one document when none exists" do
    assert_equal 0, SiteSetting.count
    SiteSetting.current
    assert_equal 1, SiteSetting.count
  end

  test "current returns the existing document on subsequent calls" do
    first = SiteSetting.current
    second = SiteSetting.current
    assert_equal first.id, second.id
    assert_equal 1, SiteSetting.count
  end

  test "fresh document has the default schedule" do
    s = SiteSetting.current
    assert_equal SiteSetting.default_schedule, s.schedule
  end

  test "fresh document has the default homepage_photos" do
    s = SiteSetting.current
    assert_equal SiteSetting.default_homepage_photos, s.homepage_photos
  end

  test "subcategories defaults to an empty hash" do
    s = SiteSetting.current
    assert_equal({}, s.subcategories)
  end

  test "schedule overrides persist" do
    s = SiteSetting.current
    custom = { "cutoffs" => { "morning" => 5, "afternoon" => 12 }, "categoryOrder" => {} }
    s.schedule = custom
    s.save!
    assert_equal 5, SiteSetting.current.schedule["cutoffs"]["morning"]
  end

  test "default_schedule cutoffs are ascending" do
    cutoffs = SiteSetting.default_schedule["cutoffs"].values
    assert_equal cutoffs.sort, cutoffs, "phase cutoffs should be strictly ascending"
  end

  test "default_schedule has the 5 expected phases" do
    expected = %w[morning afternoon golden evening night]
    assert_equal expected, SiteSetting.default_schedule["cutoffs"].keys
  end

  test "default homepage_photos has hero, hero_picks, curation" do
    photos = SiteSetting.default_homepage_photos
    assert photos.key?("hero")
    assert photos.key?("hero_picks")
    assert photos["curation"].is_a?(Array)
    assert_operator photos["curation"].size, :>, 0
  end

  test "every default curated entry has the required shape" do
    SiteSetting.default_curation.each do |entry|
      assert_equal "bundled", entry["kind"]
      assert entry["slug"].is_a?(String)
      assert entry["phases"].is_a?(Array)
      assert_includes [true, false], entry["hidden"]
      assert entry["position"].is_a?(Integer)
    end
  end

  # ── Site content (CMS) lifecycle fields ───────────────────────────────

  test "fresh document has empty live content and no draft or previous" do
    s = SiteSetting.current
    assert_equal({}, s.site_content)
    assert_nil s.site_content_draft
    assert_nil s.site_content_previous
    assert_nil s.site_content_draft_saved_at
    assert_nil s.site_content_published_at
  end

  test "site content fields persist arbitrary nested hashes" do
    s = SiteSetting.current
    s.site_content_draft = { "faq" => { "items" => [ { "id" => "faq-1", "question" => { "en" => "Q", "el" => "Ε" } } ] } }
    s.save!
    reloaded = SiteSetting.current
    assert_equal "Ε", reloaded.site_content_draft.dig("faq", "items", 0, "question", "el")
  end
end
