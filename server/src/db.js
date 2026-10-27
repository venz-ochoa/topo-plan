//this is for the database connection pool
import "dotenv/config";
import pg from "pg";

//this is for the connection string (in docker it comes from docker-compose.yml, locally it falls back to localhost)
const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL || "postgres://app:app@localhost:5432/app",
});

//this is for exporting the pool so route files can run queries with it
export default pool;
