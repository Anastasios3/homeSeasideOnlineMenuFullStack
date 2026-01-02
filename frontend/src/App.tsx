import { useEffect, useState } from "react";
import axios from "axios";
import type { AxiosResponse, AxiosError } from "axios";
import "./App.css";

interface TestResponse {
  message: string;
  status: string;
}

function App() {
  const [message, setMessage] = useState<string>("Connecting...");

  useEffect(() => {
    axios
      .get<TestResponse>("http://localhost:3000/test")
      .then((response: AxiosResponse<TestResponse>) => {
        setMessage(response.data.message);
      })
      .catch((error: AxiosError) => {
        console.error("Connection error:", error);
        setMessage("Connection failed");
      });
  }, []);

  return (
    <div className="App">
      <h1>HomeSeaside Menu</h1>
      <div className="card">
        <p>Status: {message}</p>
      </div>
    </div>
  );
}

export default App;
