Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  resources :menu_items, only: [ :index, :show, :create, :update, :destroy ]
  resources :uploads, only: [ :create ]

  # Singleton: schedule, subcategory metadata, homepage photos
  get   "site_setting", to: "site_settings#show"
  patch "site_setting", to: "site_settings#update"

  # Site-content CMS draft lifecycle (admin-only)
  get    "site_setting/content_draft",   to: "site_settings#show_draft"
  put    "site_setting/content_draft",   to: "site_settings#save_draft"
  delete "site_setting/content_draft",   to: "site_settings#discard_draft"
  post   "site_setting/content/publish", to: "site_settings#publish_content"
  post   "site_setting/content/revert",  to: "site_settings#revert_content"

  # Admin authentication
  post   "admin/login",  to: "sessions#create"
  delete "admin/logout", to: "sessions#destroy"
  get    "admin/verify", to: "sessions#verify"
end
