class MenuItemsController < ApplicationController
  before_action :authenticate_admin!, only: [:create, :update, :destroy]
  before_action :set_menu_item, only: [:show, :update, :destroy]

  # GET /menu_items
  def index
    @menu_items = if params[:all] == "true"
                    MenuItem.all.order_by(created_at: :asc)
                  else
                    MenuItem.where(available: true).order_by(created_at: :asc)
                  end
    render json: @menu_items.map { |item| serialize_item(item) }
  end

  # GET /menu_items/:id
  def show
    render json: serialize_item(@menu_item)
  end

  # POST /menu_items
  def create
    @menu_item = MenuItem.new
    assign_localized_fields(@menu_item, menu_item_params)

    if @menu_item.save
      render json: serialize_item(@menu_item), status: :created
    else
      render json: { errors: @menu_item.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /menu_items/:id
  def update
    assign_localized_fields(@menu_item, menu_item_params)

    if @menu_item.save
      render json: serialize_item(@menu_item)
    else
      render json: { errors: @menu_item.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /menu_items/:id
  def destroy
    @menu_item.destroy
    head :no_content
  end

  private

  def set_menu_item
    @menu_item = MenuItem.find(params[:id])
  rescue Mongoid::Errors::DocumentNotFound
    render json: { error: "Item not found" }, status: :not_found
  end

  def menu_item_params
    params.require(:menu_item).permit(
      :main_category, :price, :pricing_type, :price_secondary, :available, :image_url,
      allergens: [],
      name: [:en, :el],
      description: [:en, :el],
      category: [:en, :el]
    )
  end

  def assign_localized_fields(item, p)
    item.main_category = p[:main_category] if p.key?(:main_category)
    item.price = p[:price] if p.key?(:price)
    item.pricing_type = p[:pricing_type] if p.key?(:pricing_type)
    item.price_secondary = p[:price_secondary] if p.key?(:price_secondary)
    item.available = p[:available] if p.key?(:available)
    item.allergens = p[:allergens] if p.key?(:allergens)
    item.image_url = p[:image_url] if p.key?(:image_url)

    if p[:name].is_a?(ActionController::Parameters) || p[:name].is_a?(Hash)
      I18n.with_locale(:en) { item.name = p[:name][:en] } if p[:name][:en]
      I18n.with_locale(:el) { item.name = p[:name][:el] } if p[:name][:el]
    end

    if p[:description].is_a?(ActionController::Parameters) || p[:description].is_a?(Hash)
      I18n.with_locale(:en) { item.description = p[:description][:en] } if p[:description][:en]
      I18n.with_locale(:el) { item.description = p[:description][:el] } if p[:description][:el]
    end

    if p[:category].is_a?(ActionController::Parameters) || p[:category].is_a?(Hash)
      I18n.with_locale(:en) { item.category = p[:category][:en] } if p[:category][:en]
      I18n.with_locale(:el) { item.category = p[:category][:el] } if p[:category][:el]
    end
  end

  def serialize_item(item)
    {
      _id: item.id.to_s,
      name: { en: item.name_translations["en"], el: item.name_translations["el"] },
      description: { en: item.description_translations["en"], el: item.description_translations["el"] },
      main_category: item.main_category,
      category: { en: item.category_translations["en"], el: item.category_translations["el"] },
      price: item.price,
      pricing_type: item.pricing_type || "single",
      price_secondary: item.price_secondary,
      available: item.available,
      allergens: item.allergens || [],
      image_url: item.image_url,
      created_at: item.created_at,
      updated_at: item.updated_at
    }
  end
end
