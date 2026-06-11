require "test_helper"

class SiteSettingsControllerTest < ActionDispatch::IntegrationTest
  setup { @auth = admin_auth_headers }

  test "show is public and returns defaults when no document exists" do
    get "/site_setting"
    assert_response :ok
    body = JSON.parse(response.body)
    assert body["schedule"].is_a?(Hash)
    assert body["homepage_photos"].is_a?(Hash)
    assert body["subcategories"].is_a?(Hash)
  end

  test "show backfills missing curation and hero_picks for legacy docs" do
    setting = SiteSetting.create!(homepage_photos: { "hero" => nil })  # no curation key
    assert_nil setting.homepage_photos["curation"]
    get "/site_setting"
    body = JSON.parse(response.body)
    assert body["homepage_photos"]["curation"].is_a?(Array)
    assert body["homepage_photos"]["hero_picks"].is_a?(Hash)
  end

  test "update rejects unauthenticated requests" do
    patch "/site_setting", params: { schedule: { "cutoffs" => {} } }, as: :json
    assert_response :unauthorized
  end

  test "update replaces a single section without touching the others" do
    SiteSetting.create!(subcategories: { "coffee" => [ { "slug" => "Espresso" } ] })
    new_schedule = { "cutoffs" => { "morning" => 5 }, "categoryOrder" => {} }
    patch "/site_setting", params: { schedule: new_schedule }, headers: @auth, as: :json
    assert_response :ok
    body = JSON.parse(response.body)
    assert_equal 5, body["schedule"]["cutoffs"]["morning"]
    assert_equal [ { "slug" => "Espresso" } ], body["subcategories"]["coffee"]
  end

  test "update accepts homepage_photos with nested curation" do
    payload = {
      homepage_photos: {
        "hero" => nil,
        "curation" => [
          { "kind" => "custom", "slug" => "custom-1", "url" => "/uploads/x.webp",
            "srcset" => { "640" => "/uploads/x-640.webp" },
            "phases" => [ "morning" ], "subjects" => [], "hidden" => false, "position" => 0 }
        ]
      }
    }
    patch "/site_setting", params: payload, headers: @auth, as: :json
    assert_response :ok
    body = JSON.parse(response.body)
    assert_equal "custom-1", body["homepage_photos"]["curation"].first["slug"]
  end

  test "update ignores unknown section keys" do
    patch "/site_setting", params: { not_a_section: "wat" }, headers: @auth, as: :json
    assert_response :ok
  end

  # ── Site-content CMS lifecycle ────────────────────────────────────────

  DRAFT = { "home" => { "heroSubtitle" => { "en" => "New subtitle", "el" => "Νέος υπότιτλος" } } }.freeze

  test "public GET exposes null site_content before any publish and never leaks draft or previous" do
    SiteSetting.current.update!(site_content_draft: DRAFT.dup, site_content_previous: { "x" => 1 })
    get "/site_setting"
    assert_response :ok
    body = JSON.parse(response.body)
    assert body.key?("site_content")
    assert_nil body["site_content"]
    refute body.key?("site_content_draft")
    refute body.key?("site_content_previous")
  end

  test "all five lifecycle endpoints require auth" do
    get "/site_setting/content_draft"
    assert_response :unauthorized
    put "/site_setting/content_draft", params: { site_content: DRAFT }, as: :json
    assert_response :unauthorized
    delete "/site_setting/content_draft"
    assert_response :unauthorized
    post "/site_setting/content/publish"
    assert_response :unauthorized
    post "/site_setting/content/revert"
    assert_response :unauthorized
  end

  test "PATCH /site_setting cannot change live site_content (not a generic section)" do
    patch "/site_setting", params: { site_content: DRAFT }, headers: @auth, as: :json
    assert_response :ok
    assert_equal({}, SiteSetting.current.site_content)
  end

  test "save_draft round-trips and stamps draft_saved_at" do
    put "/site_setting/content_draft", params: { site_content: DRAFT }, headers: @auth, as: :json
    assert_response :ok
    body = JSON.parse(response.body)
    assert_equal "New subtitle", body.dig("site_content_draft", "home", "heroSubtitle", "en")
    assert_not_nil body["draft_saved_at"]
    assert_equal false, body["has_previous"]
  end

  test "save_draft rejects non-object payloads" do
    put "/site_setting/content_draft", params: { site_content: "just a string" }, headers: @auth, as: :json
    assert_response :bad_request
  end

  test "show_draft returns the saved draft" do
    put "/site_setting/content_draft", params: { site_content: DRAFT }, headers: @auth, as: :json
    get "/site_setting/content_draft", headers: @auth
    assert_response :ok
    assert_equal "Νέος υπότιτλος", JSON.parse(response.body).dig("site_content_draft", "home", "heroSubtitle", "el")
  end

  test "discard_draft clears the draft and is idempotent" do
    put "/site_setting/content_draft", params: { site_content: DRAFT }, headers: @auth, as: :json
    delete "/site_setting/content_draft", headers: @auth
    assert_response :ok
    assert_nil JSON.parse(response.body)["site_content_draft"]
    delete "/site_setting/content_draft", headers: @auth
    assert_response :ok
  end

  test "publish without a draft returns 422" do
    post "/site_setting/content/publish", headers: @auth
    assert_response :unprocessable_entity
    assert_match(/No draft/, JSON.parse(response.body)["error"])
  end

  test "publish moves draft to live, snapshots previous, clears draft" do
    put "/site_setting/content_draft", params: { site_content: DRAFT }, headers: @auth, as: :json
    post "/site_setting/content/publish", headers: @auth
    assert_response :ok
    body = JSON.parse(response.body)
    assert_equal "New subtitle", body.dig("site_content", "home", "heroSubtitle", "en")
    assert_equal true, body["has_previous"]

    setting = SiteSetting.current
    assert_equal "New subtitle", setting.site_content.dig("home", "heroSubtitle", "en")
    assert_equal({}, setting.site_content_previous, "first publish snapshots the empty pre-CMS state")
    assert_nil setting.site_content_draft
    assert_not_nil setting.site_content_published_at

    get "/site_setting"
    assert_equal "New subtitle", JSON.parse(response.body).dig("site_content", "home", "heroSubtitle", "en")
  end

  test "revert without a previous version returns 422" do
    post "/site_setting/content/revert", headers: @auth
    assert_response :unprocessable_entity
  end

  test "revert swaps live and previous; reverting twice restores" do
    put "/site_setting/content_draft", params: { site_content: DRAFT }, headers: @auth, as: :json
    post "/site_setting/content/publish", headers: @auth

    post "/site_setting/content/revert", headers: @auth
    assert_response :ok
    setting = SiteSetting.current
    assert_equal({}, setting.site_content, "revert restores the pre-publish state")
    assert_equal "New subtitle", setting.site_content_previous.dig("home", "heroSubtitle", "en")

    post "/site_setting/content/revert", headers: @auth
    assert_response :ok
    assert_equal "New subtitle", SiteSetting.current.site_content.dig("home", "heroSubtitle", "en"), "double revert = redo"
  end

  test "publish does not disturb a draft saved after publishing" do
    put "/site_setting/content_draft", params: { site_content: DRAFT }, headers: @auth, as: :json
    post "/site_setting/content/publish", headers: @auth
    newer = { "home" => { "heroSubtitle" => { "en" => "Even newer", "el" => "Ακόμα νεότερος" } } }
    put "/site_setting/content_draft", params: { site_content: newer }, headers: @auth, as: :json

    post "/site_setting/content/revert", headers: @auth
    assert_response :ok
    assert_equal "Even newer", SiteSetting.current.site_content_draft.dig("home", "heroSubtitle", "en"),
                 "revert must leave the in-progress draft alone"
  end
end
