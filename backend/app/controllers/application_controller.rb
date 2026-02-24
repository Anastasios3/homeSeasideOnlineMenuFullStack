class ApplicationController < ActionController::API
  rescue_from StandardError, with: :handle_internal_error

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

  def handle_internal_error(exception)
    Rails.logger.error("#{exception.class}: #{exception.message}")
    Rails.logger.error(exception.backtrace&.first(10)&.join("\n"))

    render json: { error: "Internal server error" }, status: :internal_server_error
  end
end
