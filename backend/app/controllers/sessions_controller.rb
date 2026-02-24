class SessionsController < ApplicationController
  # POST /admin/login
  def create
    user = AdminUser.find_by(username: params[:username])

    if user&.authenticate(params[:password])
      token = generate_token(user.id.to_s)
      render json: { token: token }, status: :ok
    else
      render json: { error: "Invalid credentials" }, status: :unauthorized
    end
  end

  # DELETE /admin/logout
  def destroy
    head :no_content
  end

  # GET /admin/verify
  def verify
    authenticate_admin!
    render json: { valid: true }
  end

  private

  def generate_token(user_id)
    payload = {
      user_id: user_id,
      exp: 24.hours.from_now.to_i
    }
    JWT.encode(payload, jwt_secret, "HS256")
  end

  def jwt_secret
    ENV.fetch("JWT_SECRET") { Rails.application.secret_key_base }
  end
end
