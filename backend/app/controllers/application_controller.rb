class ApplicationController < ActionController::API
  # Map domain exceptions to the right HTTP status. Rails matches rescue_from
  # handlers bottom-to-top (most-recently registered wins), so the broad
  # StandardError catch-all goes FIRST and the specific ones go AFTER it.
  rescue_from StandardError,                     with: :handle_internal_error
  rescue_from Mongoid::Errors::Validations,      with: :handle_validation_error
  rescue_from ActionController::ParameterMissing, with: :handle_bad_request
  rescue_from Mongoid::Errors::DocumentNotFound, with: :handle_not_found

  private

  def authenticate_admin!
    token = request.headers["Authorization"]&.split("Bearer ")&.last
    return render_unauthorized unless token

    begin
      payload = JWT.decode(token, jwt_secret, true, algorithm: "HS256").first
      @current_admin = AdminUser.find(payload["user_id"])
    rescue JWT::ExpiredSignature
      render json: { error: "Token expired" }, status: :unauthorized
    rescue JWT::DecodeError, Mongoid::Errors::DocumentNotFound
      render_unauthorized
    end
  end

  def render_unauthorized
    render json: { error: "Unauthorized" }, status: :unauthorized
  end

  def jwt_secret
    ENV.fetch("JWT_SECRET") { Rails.application.secret_key_base }
  end

  def handle_not_found(exception)
    Rails.logger.info("[404] #{exception.class}: #{exception.message}")
    render json: { error: "Not found" }, status: :not_found
  end

  def handle_validation_error(exception)
    Rails.logger.info("[422] #{exception.class}: #{exception.message}")
    errors = exception.document.errors.full_messages
    render json: { error: "Validation failed", details: errors }, status: :unprocessable_entity
  end

  def handle_bad_request(exception)
    Rails.logger.info("[400] #{exception.class}: #{exception.message}")
    render json: { error: "Bad request", details: exception.message }, status: :bad_request
  end

  def handle_internal_error(exception)
    Rails.logger.error("#{exception.class}: #{exception.message}")
    Rails.logger.error(exception.backtrace&.first(10)&.join("\n"))

    render json: { error: "Internal server error" }, status: :internal_server_error
  end
end
