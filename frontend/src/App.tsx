import TopBar from "./components/TopBar";
import CategoryNav from "./components/CategoryNav";
import "./App.css";

function App() {
  return (
    <div className="app-container">
      <header>
        <TopBar />
        <CategoryNav />
      </header>

      <main className="content">{/* Menu items will be rendered here */}</main>
    </div>
  );
}

export default App;
