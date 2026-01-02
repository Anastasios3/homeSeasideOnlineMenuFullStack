class MenuItemsController < ApplicationController
  def index
    # Fetches real documents from MongoDB Atlas
    @menu_items = MenuItem.where(available: true)
    render json: @menu_items
  end
end