# Public GET for everyone, admin PATCH to update individual sections.
# Updates accept partial payloads keyed by section ("schedule",
# "subcategories", "homepage_photos") — each write replaces that section
# wholesale to keep the contract simple. Validation is purposely loose:
# the admin UI is the source of structural truth, and we want to be
# tolerant if/when the shape evolves.
class SiteSettingsController < ApplicationController
  before_action :authenticate_admin!,
    only: [ :update, :show_draft, :save_draft, :discard_draft, :publish_content, :revert_content ]

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

  # ── Site-content draft lifecycle ────────────────────────────────────
  # Draft → Preview → Publish, with one previous-version snapshot for
  # revert. Validation of the content's SHAPE is the admin editor's job
  # (same philosophy as the sections above); these endpoints only manage
  # the state machine.

  # GET /site_setting/content_draft
  def show_draft
    render json: serialize_draft(SiteSetting.current)
  end

  # PUT /site_setting/content_draft
  def save_draft
    content = params[:site_content]
    is_hashlike = content.is_a?(ActionController::Parameters) || content.is_a?(Hash)
    unless is_hashlike
      return render json: { error: "site_content must be an object" }, status: :bad_request
    end

    setting = SiteSetting.current
    setting.site_content_draft = content.respond_to?(:to_unsafe_h) ? content.to_unsafe_h : content
    setting.site_content_draft_saved_at = Time.current
    setting.save!
    render json: serialize_draft(setting)
  end

  # DELETE /site_setting/content_draft — idempotent
  def discard_draft
    setting = SiteSetting.current
    setting.site_content_draft = nil
    setting.site_content_draft_saved_at = nil
    setting.save!
    render json: serialize_draft(setting)
  end

  # POST /site_setting/content/publish
  # previous ← live, live ← draft, draft ← nil. One document write.
  def publish_content
    setting = SiteSetting.current
    if setting.site_content_draft.nil?
      return render json: { error: "No draft to publish" }, status: :unprocessable_entity
    end

    setting.site_content_previous = setting.site_content
    setting.site_content = setting.site_content_draft
    setting.site_content_draft = nil
    setting.site_content_draft_saved_at = nil
    setting.site_content_published_at = Time.current
    setting.save!
    render json: serialize(setting).merge(has_previous: true)
  end

  # POST /site_setting/content/revert
  # Swap live ↔ previous (not pop): pressing revert again re-applies, so
  # the admin gets a free redo.
  def revert_content
    setting = SiteSetting.current
    if setting.site_content_previous.nil?
      return render json: { error: "Nothing to revert to" }, status: :unprocessable_entity
    end

    setting.site_content, setting.site_content_previous =
      setting.site_content_previous, setting.site_content
    setting.site_content_published_at = Time.current
    setting.save!
    render json: serialize(setting).merge(has_previous: true)
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
      # Live site content only — draft and previous are admin-only state
      # and must never leak through this public endpoint. `presence`
      # turns the never-published {} into an explicit null.
      site_content:    setting.site_content.presence,
      updated_at:      setting.updated_at
    }
  end

  def serialize_draft(setting)
    {
      site_content_draft: setting.site_content_draft,
      # nil-check, not present?: after the FIRST publish the previous live
      # version is {} ("no overrides / bundled defaults"), and reverting to
      # the original site is a perfectly meaningful operation.
      has_previous:       !setting.site_content_previous.nil?,
      draft_saved_at:     setting.site_content_draft_saved_at,
      published_at:       setting.site_content_published_at
    }
  end
end
