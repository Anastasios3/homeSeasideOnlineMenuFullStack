Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  resources :menu_items, only: [:index, :show, :create, :update, :destroy]
  resources :uploads, only: [:create]

  # Singleton: schedule, subcategory metadata, homepage photos
  get   "site_setting", to: "site_settings#show"
  patch "site_setting", to: "site_settings#update"

  # Admin authentication
  post   "admin/login",  to: "sessions#create"
  delete "admin/logout", to: "sessions#destroy"
  get    "admin/verify", to: "sessions#verify"
end
