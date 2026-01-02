class MenuItemsController < ApplicationController
  def index
    # Prototype data mirroring your MenuItem model fields
    render json: [
      { name: "Seaside Pizza", description: "Signature crust with fresh local seafood.", price: 18.50, category: "Mains" },
      { name: "Coral Spritz", description: "Refreshing citrus and mint cocktail.", price: 9.00, category: "Drinks" },
      { name: "Golden Fries", description: "Hand-cut potatoes with organic sea salt.", price: 5.50, category: "Sides" }
    ]
  end
end