class MenuItem
  include Mongoid::Document
  include Mongoid::Timestamps
  field :name, type: String
  field :description, type: String
  field :price, type: Float
  field :category, type: String
  field :image_url, type: String
  field :available, type: Mongoid::Boolean
end
