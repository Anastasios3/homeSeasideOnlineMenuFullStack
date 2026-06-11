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
end
