require "test_helper"

class UploadsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @auth = admin_auth_headers
    @uploads_dir = Rails.root.join("public", "uploads")
    @before_files = Dir.exist?(@uploads_dir) ? Dir.children(@uploads_dir) : []
  end

  teardown do
    # Remove anything this test created so the dev environment stays clean.
    if Dir.exist?(@uploads_dir)
      (Dir.children(@uploads_dir) - @before_files).each do |f|
        File.delete(@uploads_dir.join(f))
      end
    end
  end

  # ── Helpers ───────────────────────────────────────────────────────────

  # A tiny 1x1 JPEG, PNG, WebP, GIF — just enough bytes to satisfy the
  # magic-byte sniffer in the controller.
  def jpeg_bytes
    "\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00".b + ("\x00".b * 32) + "\xFF\xD9".b
  end

  def png_bytes
    "\x89PNG\r\n\x1A\n".b + ("\x00".b * 64)
  end

  def webp_bytes
    "RIFF\x00\x00\x00\x00WEBPVP8 ".b + ("\x00".b * 64)
  end

  def gif_bytes
    "GIF89a".b + ("\x00".b * 32)
  end

  def upload_fixture(bytes, mime, filename)
    path = Rails.root.join("tmp", "fixture-#{SecureRandom.hex(4)}-#{filename}")
    File.binwrite(path, bytes)
    Rack::Test::UploadedFile.new(path, mime, true)
  end

  # ── Auth ──────────────────────────────────────────────────────────────

  test "rejects unauthenticated upload" do
    post "/uploads", params: { file: upload_fixture(jpeg_bytes, "image/jpeg", "x.jpg") }
    assert_response :unauthorized
  end

  test "rejects upload from token with bad secret" do
    bad_token = JWT.encode({ user_id: "ffffffffffffffffffffffff", exp: 24.hours.from_now.to_i }, "wrong-secret", "HS256")
    post "/uploads",
         params: { file: upload_fixture(jpeg_bytes, "image/jpeg", "x.jpg") },
         headers: { "Authorization" => "Bearer #{bad_token}" }
    assert_response :unauthorized
  end

  # ── Content type / shape ──────────────────────────────────────────────

  test "rejects request with no file" do
    post "/uploads", params: {}, headers: @auth
    assert_response :unprocessable_entity
    assert_equal "No file provided", JSON.parse(response.body)["error"]
  end

  test "rejects disallowed mime type" do
    post "/uploads",
         params: { file: upload_fixture("hello", "text/plain", "x.txt") },
         headers: @auth
    assert_response :unprocessable_entity
    assert_match(/Invalid file type/, JSON.parse(response.body)["error"])
  end

  test "rejects file claiming image/jpeg but with non-image bytes" do
    post "/uploads",
         params: { file: upload_fixture("PK\x03\x04this-is-actually-a-zip".b, "image/jpeg", "fake.jpg") },
         headers: @auth
    assert_response :unprocessable_entity
    assert_match(/does not match a valid image format/, JSON.parse(response.body)["error"])
  end

  test "rejects oversized file" do
    big = "\xFF\xD8\xFF".b + ("\x00".b * (5 * 1024 * 1024 + 1))
    post "/uploads",
         params: { file: upload_fixture(big, "image/jpeg", "big.jpg") },
         headers: @auth
    assert_response :unprocessable_entity
    assert_match(/too large/i, JSON.parse(response.body)["error"])
  end

  # ── Happy paths for each accepted format ──────────────────────────────

  test "accepts a real JPEG and stores it locally" do
    post "/uploads",
         params: { file: upload_fixture(jpeg_bytes, "image/jpeg", "test.jpg") },
         headers: @auth
    assert_response :created
    url = JSON.parse(response.body)["url"]
    assert_match %r{\A/uploads/[A-Za-z0-9-]+\.jpg\z}, url
    assert File.exist?(@uploads_dir.join(url.sub("/uploads/", ""))), "uploaded file should exist on disk at #{url}"
  end

  test "accepts a PNG" do
    post "/uploads",
         params: { file: upload_fixture(png_bytes, "image/png", "test.png") },
         headers: @auth
    assert_response :created
    assert_match %r{\.png\z}, JSON.parse(response.body)["url"]
  end

  test "accepts a WebP" do
    post "/uploads",
         params: { file: upload_fixture(webp_bytes, "image/webp", "test.webp") },
         headers: @auth
    assert_response :created
    assert_match %r{\.webp\z}, JSON.parse(response.body)["url"]
  end

  test "accepts a GIF" do
    post "/uploads",
         params: { file: upload_fixture(gif_bytes, "image/gif", "test.gif") },
         headers: @auth
    assert_response :created
    assert_match %r{\.gif\z}, JSON.parse(response.body)["url"]
  end

  # ── Regression for the photo-not-showcasing bug ───────────────────────
  # End-to-end: upload → URL returned → that exact URL is served by the
  # Rails public_file_server in dev. If this breaks, the menu thumbnails go
  # blank because the URL points nowhere.

  test "uploaded file is then served back by the static file server" do
    post "/uploads",
         params: { file: upload_fixture(jpeg_bytes, "image/jpeg", "served.jpg") },
         headers: @auth
    assert_response :created
    url = JSON.parse(response.body)["url"]

    get url
    assert_response :ok, "the URL returned by POST /uploads must be served by Rails"
    assert_equal jpeg_bytes, response.body.b, "served bytes must match what was uploaded"
  end

  test "extension fallback: when filename has no extension we default to .jpg" do
    post "/uploads",
         params: { file: upload_fixture(jpeg_bytes, "image/jpeg", "noext") },
         headers: @auth
    assert_response :created
    assert_match %r{\.jpg\z}, JSON.parse(response.body)["url"]
  end
end
