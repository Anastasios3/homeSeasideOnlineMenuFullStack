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
    # Backfill missing keys for documents created before a schema addition
    # (e.g. old SiteSettings without `curation`). Merging the defaults on
    # read means we never have to write a migration just to surface new
    # fields — frontend always sees a complete payload.
    homepage = SiteSetting.default_homepage_photos.merge(setting.homepage_photos || {})
    if homepage["curation"].blank?
      homepage["curation"] = SiteSetting.default_curation
    end
    # Backfill hero_picks for documents created before this field existed.
    homepage["hero_picks"] = SiteSetting.default_hero_picks.merge(homepage["hero_picks"] || {})

    {
      schedule:        setting.schedule       || SiteSetting.default_schedule,
      subcategories:   setting.subcategories  || {},
      homepage_photos: homepage,
      updated_at:      setting.updated_at
    }
  end
end
