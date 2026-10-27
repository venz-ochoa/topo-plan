//this is for the server entry point
import "dotenv/config";
import express from "express";
import cors from "cors";

//this is for the database connection (only needed in files that run queries)
import pool from "./db.js";

//this is for the route files (add one import line per new route file)
import exampleRouter from "./routes/example.js";

//this is for the express app
const app = express();
//this is for the port the api runs on
const PORT = process.env.PORT || 3001;

//this is for allowing the react app to call the api (cors)
app.use(cors());
//this is for reading json request bodies
app.use(express.json());

//this is for the health check endpoint (quick way to check the api is alive)
app.get("/api/health", async (_req, res) => {
  try {
    //this is for checking the database connection too
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ status: "db error", error: err.message });
  }
});

//this is for mounting the route files (add one line per new route file)
app.use("/api/example", exampleRouter);

//this is for starting the server
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
