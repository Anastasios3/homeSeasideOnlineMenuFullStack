require "test_helper"

class MenuItemsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @auth = admin_auth_headers
    @valid_payload = {
      menu_item: {
        name: { en: "Espresso", el: "Εσπρέσσο" },
        description: { en: "Strong shot", el: "Δυνατό σφηνάκι" },
        main_category: "coffee",
        category: { en: "Hot", el: "Ζεστά" },
        price: 3.5,
        pricing_type: "single",
        available: true,
        allergens: [ "Dairy" ],
        image_url: "/uploads/espresso.webp"
      }
    }
  end

  # ── GET /menu_items ───────────────────────────────────────────────────

  test "index returns only available items by default" do
    available = MenuItem.create!(main_category: "coffee", price: 3, name: "Public", available: true)
    hidden = MenuItem.create!(main_category: "coffee", price: 3, name: "Hidden", available: false)

    get "/menu_items"
    assert_response :ok
    ids = JSON.parse(response.body).map { |it| it["_id"] }
    assert_includes ids, available.id.to_s
    refute_includes ids, hidden.id.to_s
  end

  test "index?all=true returns every item without auth" do
    # Note: the current implementation does NOT gate ?all behind auth.
    # If that changes, this test should change with it.
    MenuItem.create!(main_category: "coffee", price: 3, name: "A", available: true)
    MenuItem.create!(main_category: "coffee", price: 3, name: "B", available: false)
    get "/menu_items", params: { all: "true" }
    assert_response :ok
    assert_equal 2, JSON.parse(response.body).length
  end

  test "index serializes localized fields as { en, el }" do
    item = MenuItem.new(main_category: "coffee", price: 3)
    I18n.with_locale(:en) { item.name = "Filter" }
    I18n.with_locale(:el) { item.name = "Φίλτρου" }
    item.save!
    get "/menu_items"
    record = JSON.parse(response.body).first
    assert_equal({ "en" => "Filter", "el" => "Φίλτρου" }, record["name"])
  end

  test "index returns image_url verbatim" do
    MenuItem.create!(main_category: "coffee", price: 3, name: "X", image_url: "/uploads/x.webp")
    get "/menu_items"
    assert_equal "/uploads/x.webp", JSON.parse(response.body).first["image_url"]
  end

  test "index orders by created_at ascending" do
    first = MenuItem.create!(main_category: "coffee", price: 3, name: "First")
    sleep 0.01
    second = MenuItem.create!(main_category: "coffee", price: 3, name: "Second")
    get "/menu_items"
    ids = JSON.parse(response.body).map { |it| it["_id"] }
    assert_equal [ first.id.to_s, second.id.to_s ], ids
  end

  # ── GET /menu_items/:id ───────────────────────────────────────────────

  test "show returns the requested item" do
    item = MenuItem.create!(main_category: "coffee", price: 3, name: "X")
    get "/menu_items/#{item.id}"
    assert_response :ok
    assert_equal item.id.to_s, JSON.parse(response.body)["_id"]
  end

  test "show 404s an unknown id" do
    get "/menu_items/000000000000000000000000"
    assert_response :not_found
  end

  test "show handles malformed id gracefully" do
    get "/menu_items/not-a-real-id"
    # Mongoid raises BSON::InvalidObjectId, caught by ApplicationController as 500.
    # If we tightened that, both 400 and 404 would be reasonable. For now we just
    # make sure the API doesn't crash mid-response.
    refute_equal 500, response.status, "controller should handle bad ids without 500ing"
  end

  # ── POST /menu_items (auth) ───────────────────────────────────────────

  test "create rejects unauthenticated requests" do
    post "/menu_items", params: @valid_payload, as: :json
    assert_response :unauthorized
  end

  test "create persists a valid item" do
    post "/menu_items", params: @valid_payload, headers: @auth, as: :json
    assert_response :created
    body = JSON.parse(response.body)
    assert_equal "Espresso", body["name"]["en"]
    assert_equal "Εσπρέσσο", body["name"]["el"]
    assert_equal "coffee", body["main_category"]
    assert_in_delta 3.5, body["price"]
    assert_equal "single", body["pricing_type"]
    assert_equal "/uploads/espresso.webp", body["image_url"]
  end

  test "create persists image_url end-to-end (regression for photo-not-showing bug)" do
    post "/menu_items", params: @valid_payload, headers: @auth, as: :json
    assert_response :created
    id = JSON.parse(response.body)["_id"]
    item = MenuItem.find(id)
    assert_equal "/uploads/espresso.webp", item.image_url, "image_url must be persisted to the document"

    get "/menu_items/#{id}"
    assert_response :ok
    assert_equal "/uploads/espresso.webp", JSON.parse(response.body)["image_url"], "image_url must be serialized back to clients"
  end

  test "create accepts dual pricing" do
    payload = @valid_payload.deep_dup
    payload[:menu_item][:pricing_type] = "glass_bottle"
    payload[:menu_item][:price_secondary] = 24
    post "/menu_items", params: payload, headers: @auth, as: :json
    assert_response :created
    body = JSON.parse(response.body)
    assert_equal "glass_bottle", body["pricing_type"]
    assert_in_delta 24.0, body["price_secondary"]
  end

  test "create returns 422 with errors on invalid payload" do
    payload = { menu_item: { main_category: "coffee", price: 1 } }  # no name
    post "/menu_items", params: payload, headers: @auth, as: :json
    assert_response :unprocessable_entity
    assert JSON.parse(response.body)["errors"].any?
  end

  test "create rejects an unknown main_category" do
    payload = @valid_payload.deep_dup
    payload[:menu_item][:main_category] = "tea"
    post "/menu_items", params: payload, headers: @auth, as: :json
    assert_response :unprocessable_entity
  end

  # ── PATCH /menu_items/:id (auth) ──────────────────────────────────────

  test "update rejects unauthenticated requests" do
    item = MenuItem.create!(main_category: "coffee", price: 3, name: "X")
    patch "/menu_items/#{item.id}", params: { menu_item: { price: 4 } }, as: :json
    assert_response :unauthorized
  end

  test "update mutates fields" do
    item = MenuItem.create!(main_category: "coffee", price: 3, name: "Cap")
    patch "/menu_items/#{item.id}",
          params: { menu_item: { price: 4.25, available: false } },
          headers: @auth, as: :json
    assert_response :ok
    item.reload
    assert_in_delta 4.25, item.price
    assert_equal false, item.available
  end

  test "update can set image_url for the first time (regression for new-photo bug)" do
    item = MenuItem.create!(main_category: "coffee", price: 3, name: "Cap")
    assert_nil item.image_url
    patch "/menu_items/#{item.id}",
          params: { menu_item: { image_url: "/uploads/new.webp" } },
          headers: @auth, as: :json
    assert_response :ok
    assert_equal "/uploads/new.webp", item.reload.image_url
  end

  test "update can clear image_url by sending null" do
    item = MenuItem.create!(main_category: "coffee", price: 3, name: "Cap", image_url: "/uploads/old.webp")
    patch "/menu_items/#{item.id}",
          params: { menu_item: { image_url: nil } },
          headers: @auth, as: :json
    assert_response :ok
    assert_nil item.reload.image_url
  end

  test "update preserves untouched localized name" do
    item = MenuItem.new(main_category: "coffee", price: 3)
    I18n.with_locale(:en) { item.name = "Espresso" }
    I18n.with_locale(:el) { item.name = "Εσπρέσσο" }
    item.save!
    patch "/menu_items/#{item.id}",
          params: { menu_item: { price: 4 } },
          headers: @auth, as: :json
    assert_response :ok
    item.reload
    assert_equal "Espresso", I18n.with_locale(:en) { item.name }
    assert_equal "Εσπρέσσο", I18n.with_locale(:el) { item.name }
  end

  test "update returns 422 on invalid mutation" do
    item = MenuItem.create!(main_category: "coffee", price: 3, name: "X")
    patch "/menu_items/#{item.id}",
          params: { menu_item: { price: -1 } },
          headers: @auth, as: :json
    assert_response :unprocessable_entity
  end

  # ── DELETE /menu_items/:id (auth) ─────────────────────────────────────

  test "destroy rejects unauthenticated requests" do
    item = MenuItem.create!(main_category: "coffee", price: 3, name: "X")
    delete "/menu_items/#{item.id}"
    assert_response :unauthorized
  end

  test "destroy removes the item" do
    item = MenuItem.create!(main_category: "coffee", price: 3, name: "X")
    delete "/menu_items/#{item.id}", headers: @auth
    assert_response :no_content
    assert_nil MenuItem.where(id: item.id).first
  end

  test "destroy on unknown id returns 404" do
    delete "/menu_items/000000000000000000000000", headers: @auth
    assert_response :not_found
  end
end
