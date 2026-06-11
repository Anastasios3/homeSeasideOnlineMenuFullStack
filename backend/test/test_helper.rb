ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    # Mongoid + parallel processes don't play nicely (each worker would need its
    # own DB to avoid races). Single process is fine for our suite size.

    setup do
      Mongoid.purge!
    end
  end
end

module ControllerTestHelpers
  # Build an auth header for an admin user, creating one if not provided.
  def admin_auth_headers(admin = nil)
    admin ||= AdminUser.create!(username: "tester-#{SecureRandom.hex(4)}", password: "password123", password_confirmation: "password123")
    payload = { user_id: admin.id.to_s, exp: 24.hours.from_now.to_i }
    token = JWT.encode(payload, Rails.application.secret_key_base, "HS256")
    { "Authorization" => "Bearer #{token}" }
  end
end

class ActionDispatch::IntegrationTest
  include ControllerTestHelpers
end
