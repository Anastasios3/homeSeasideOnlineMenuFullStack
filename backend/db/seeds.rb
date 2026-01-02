# Clear existing data
MenuItem.delete_all

MenuItem.create!([
  { 
    name: "Seaside Lobster Roll", 
    description: "Fresh Maine lobster on a toasted brioche bun with herb butter.", 
    price: 24.50, 
    category: "Mains", 
    available: true 
  },
  { 
    name: "Golden Hour Calamari", 
    description: "Crispy fried squid rings with a spicy aioli dip.", 
    price: 14.00, 
    category: "Appetizers", 
    available: true 
  },
  { 
    name: "Coral Reef Salad", 
    description: "Mixed greens, pomegranate seeds, and citrus vinaigrette.", 
    price: 12.50, 
    category: "Sides", 
    available: true 
  }
])

puts "Database seeded with #{MenuItem.count} items."