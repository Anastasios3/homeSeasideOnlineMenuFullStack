class UploadsController < ApplicationController
  before_action :authenticate_admin!

  ALLOWED_TYPES = %w[image/jpeg image/png image/webp image/gif].freeze
  MAX_SIZE = 5.megabytes

  # Magic bytes for image format verification
  MAGIC_BYTES = {
    "\xFF\xD8\xFF".b => "image/jpeg",
    "\x89PNG\r\n\x1A\n".b => "image/png",
    "RIFF".b => "image/webp",   # WebP starts with RIFF
    "GIF87a".b => "image/gif",
    "GIF89a".b => "image/gif"
  }.freeze

  # POST /uploads
  def create
    file = params[:file]

    unless file.is_a?(ActionDispatch::Http::UploadedFile)
      return render json: { error: "No file provided" }, status: :unprocessable_entity
    end

    unless ALLOWED_TYPES.include?(file.content_type)
      return render json: { error: "Invalid file type. Allowed: jpg, png, webp, gif" }, status: :unprocessable_entity
    end

    if file.size > MAX_SIZE
      return render json: { error: "File too large. Maximum 5MB." }, status: :unprocessable_entity
    end

    # Verify actual file content via magic bytes
    unless valid_image_magic?(file)
      return render json: { error: "File content does not match a valid image format" }, status: :unprocessable_entity
    end

    ext = File.extname(file.original_filename).downcase
    ext = ".jpg" unless %w[.jpg .jpeg .png .webp .gif].include?(ext)
    filename = "#{SecureRandom.uuid}#{ext}"

    if s3_configured?
      upload_to_s3(file, filename, ext)
    else
      upload_to_local(file, filename)
    end
  end

  private

  def valid_image_magic?(file)
    header = file.read(8)
    file.rewind
    return false unless header

    MAGIC_BYTES.any? { |magic, _| header.start_with?(magic) }
  end

  # ── S3 upload ──────────────────────────────────────────────

  def s3_configured?
    ENV["S3_UPLOADS_BUCKET"].present?
  end

  def s3_client
    @s3_client ||= Aws::S3::Client.new(
      region: ENV.fetch("AWS_REGION", "eu-south-1")
    )
  end

  def upload_to_s3(file, filename, ext)
    content_type = MAGIC_BYTES.values.find { |t| t.end_with?(ext.delete(".")) } || file.content_type
    key = "uploads/#{filename}"

    s3_client.put_object(
      bucket: ENV.fetch("S3_UPLOADS_BUCKET"),
      key: key,
      body: file.read,
      content_type: content_type,
      cache_control: "public, max-age=31536000, immutable"
    )

    cdn_base = ENV.fetch("UPLOADS_CDN_URL").chomp("/")
    render json: { url: "#{cdn_base}/#{key}" }, status: :created
  rescue Aws::S3::Errors::ServiceError => e
    Rails.logger.error("S3 upload failed: #{e.message}")
    render json: { error: "Upload failed" }, status: :internal_server_error
  end

  # ── Local upload (development fallback) ────────────────────

  def upload_to_local(file, filename)
    upload_dir = Rails.root.join("public", "uploads")
    FileUtils.mkdir_p(upload_dir)
    filepath = upload_dir.join(filename)

    File.open(filepath, "wb") { |f| f.write(file.read) }

    render json: { url: "/uploads/#{filename}" }, status: :created
  end
end
