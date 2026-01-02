import { useEffect, useState } from "react";
import axios from "axios";
import type { AxiosResponse } from "axios";
import "./App.css";

interface MenuItem {
  name: string;
  description: string;
  price: number;
  category: string;
}

function App() {
  const [items, setItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    axios
      .get<MenuItem[]>("http://localhost:3000/menu_items")
      .then((res: AxiosResponse<MenuItem[]>) => setItems(res.data))
      .catch((err) => console.error("Database connection failed", err));
  }, []);

  return (
    <div style={{ padding: "40px" }}>
      <header style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1
          style={{
            fontSize: "3rem",
            borderBottom: "4px solid var(--highlight)",
            display: "inline-block",
          }}
        >
          HomeSeaside Menu
        </h1>
      </header>

      <div className="menu-grid">
        {items.map((item, index) => (
          <div key={index} className="menu-card">
            <span className="category">{item.category}</span>
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span className="price-tag">${item.price.toFixed(2)}</span>
              <button>Order Now</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
