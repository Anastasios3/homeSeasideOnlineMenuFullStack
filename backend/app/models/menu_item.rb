class MenuItem
  include Mongoid::Document
  include Mongoid::Timestamps

  field :name, type: String, localize: true
  field :description, type: String, localize: true
  field :category, type: String, localize: true
  field :price, type: Float
  field :available, type: Mongoid::Boolean, default: true
  field :allergens, type: Array, default: []
end