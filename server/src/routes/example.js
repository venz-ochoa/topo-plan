//this is for the route template (copy this file, rename it and change the sql to add your own routes)
import { Router } from "express";
import pool from "../db.js";

//this is for the router
const router = Router();

//this is for the GET all request -> GET /api/example
router.get("/", async (_req, res) => {
  try {
    //this is for the sql query (change "items" to your table name)
    const { rows } = await pool.query("SELECT * FROM items ORDER BY id DESC");
    //this is for sending the rows back as json
    res.json(rows);
  } catch (err) {
    //this is for the error handling
    res.status(500).json({ error: err.message });
  }
});

//this is for the GET one request -> GET /api/example/:id
router.get("/:id", async (req, res) => {
  try {
    //this is for the parameterized query ($1 is replaced by the id safely)
    const { rows } = await pool.query("SELECT * FROM items WHERE id = $1", [
      req.params.id,
    ]);
    res.json(rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//this is for the POST request -> POST /api/example
router.post("/", async (req, res) => {
  try {
    //this is for the values coming from the request body
    const { name } = req.body;
    const { rows } = await pool.query(
      "INSERT INTO items (name) VALUES ($1) RETURNING *",
      [name],
    );
    //this is for sending the created row back with status 201
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//this is for the PUT request -> PUT /api/example/:id
router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;
    const { rows } = await pool.query(
      "UPDATE items SET name = $1 WHERE id = $2 RETURNING *",
      [name, req.params.id],
    );
    res.json(rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//this is for the DELETE request -> DELETE /api/example/:id
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM items WHERE id = $1", [req.params.id]);
    //this is for confirming the delete
    res.json({ deleted: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//this is for exporting the router
export default router;
