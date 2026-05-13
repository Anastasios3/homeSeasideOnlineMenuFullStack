# Public GET for everyone, admin PATCH to update individual sections.
# Updates accept partial payloads keyed by section ("schedule",
# "subcategories", "homepage_photos") — each write replaces that section
# wholesale to keep the contract simple. Validation is purposely loose:
# the admin UI is the source of structural truth, and we want to be
# tolerant if/when the shape evolves.
class SiteSettingsController < ApplicationController
  before_action :authenticate_admin!, only: [:update]

  SECTIONS = %w[schedule subcategories homepage_photos].freeze

  # GET /site_setting
  def show
    setting = SiteSetting.current
    render json: serialize(setting)
  end

  # PATCH /site_setting
  def update
    setting = SiteSetting.current

    SECTIONS.each do |section|
      next unless params.key?(section)
      value = params[section]
      # ActionController::Parameters → plain hash/array
      value = value.respond_to?(:to_unsafe_h) ? value.to_unsafe_h : value
      setting.send("#{section}=", value)
    end

    if setting.save
      render json: serialize(setting)
    else
      render json: { errors: setting.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def serialize(setting)
    {
      schedule:        setting.schedule        || SiteSetting.default_schedule,
      subcategories:   setting.subcategories   || {},
      homepage_photos: setting.homepage_photos || { "hero" => nil, "journey" => [], "gallery" => [] },
      updated_at:      setting.updated_at
    }
  end
end
