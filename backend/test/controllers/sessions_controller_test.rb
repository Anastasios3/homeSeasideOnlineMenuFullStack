require "test_helper"

class SessionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @admin = AdminUser.create!(username: "owner", password: "longenough1", password_confirmation: "longenough1")
  end

  # ── POST /admin/login ─────────────────────────────────────────────────

  test "logs in with correct credentials and returns a JWT" do
    post "/admin/login", params: { username: "owner", password: "longenough1" }, as: :json
    assert_response :ok
    body = JSON.parse(response.body)
    assert body["token"].is_a?(String)
    assert_operator body["token"].length, :>, 20
  end

  test "rejects wrong password" do
    post "/admin/login", params: { username: "owner", password: "wrongpassword1" }, as: :json
    assert_response :unauthorized
    assert_equal "Invalid credentials", JSON.parse(response.body)["error"]
  end

  test "rejects unknown username" do
    post "/admin/login", params: { username: "ghost", password: "anything" }, as: :json
    assert_response :unauthorized
  end

  test "rejects blank credentials" do
    post "/admin/login", params: { username: "", password: "" }, as: :json
    assert_response :unauthorized
  end

  test "issued token decodes back to the admin's id" do
    post "/admin/login", params: { username: "owner", password: "longenough1" }, as: :json
    token = JSON.parse(response.body)["token"]
    payload = JWT.decode(token, Rails.application.secret_key_base, true, algorithm: "HS256").first
    assert_equal @admin.id.to_s, payload["user_id"]
    assert payload["exp"].is_a?(Integer)
    assert_operator payload["exp"], :>, Time.now.to_i
  end

  # ── DELETE /admin/logout ──────────────────────────────────────────────

  test "logout returns no content" do
    delete "/admin/logout"
    assert_response :no_content
  end

  # ── GET /admin/verify ─────────────────────────────────────────────────

  test "verify accepts a valid token" do
    get "/admin/verify", headers: admin_auth_headers(@admin)
    assert_response :ok
    assert_equal true, JSON.parse(response.body)["valid"]
  end

  test "verify rejects missing token" do
    get "/admin/verify"
    assert_response :unauthorized
  end

  test "verify rejects garbage token" do
    get "/admin/verify", headers: { "Authorization" => "Bearer not.a.real.jwt" }
    assert_response :unauthorized
  end

  test "verify rejects token signed with a different secret" do
    bogus = JWT.encode({ user_id: @admin.id.to_s, exp: 24.hours.from_now.to_i }, "totally-wrong-secret", "HS256")
    get "/admin/verify", headers: { "Authorization" => "Bearer #{bogus}" }
    assert_response :unauthorized
  end

  test "verify rejects expired token" do
    expired = JWT.encode({ user_id: @admin.id.to_s, exp: 1.hour.ago.to_i }, Rails.application.secret_key_base, "HS256")
    get "/admin/verify", headers: { "Authorization" => "Bearer #{expired}" }
    assert_response :unauthorized
    assert_equal "Token expired", JSON.parse(response.body)["error"]
  end

  test "verify rejects token pointing at a deleted admin" do
    ghost_id = AdminUser.create!(username: "ghost", password: "longenough1", password_confirmation: "longenough1").id.to_s
    token = JWT.encode({ user_id: ghost_id, exp: 24.hours.from_now.to_i }, Rails.application.secret_key_base, "HS256")
    AdminUser.find(ghost_id).destroy
    get "/admin/verify", headers: { "Authorization" => "Bearer #{token}" }
    assert_response :unauthorized
  end
end
