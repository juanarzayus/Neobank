import "dotenv/config";
import express from "express";
import { pool } from "./infrastructure/database/PostgresPool";

const app = express();

app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;

app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        message: "Neobank backend funcionando",
    });
});

app.get("/health/db", async (_req, res) => {
    try {
        const result = await pool.query("SELECT NOW() AS now");

        res.json({
            status: "ok",
            database: "connected",
            time: result.rows[0].now,
        });
    } catch (error) {
        const code =
            typeof error === "object" && error !== null && "code" in error
                ? String((error as { code: unknown }).code)
                : "UNKNOWN";

        // Log only the PostgreSQL/network error code; never log credentials.
        console.error("Database connection failed:", code);

        res.status(500).json({
            status: "error",
            database: "disconnected",
            code,
        });
    }

});
app.post("PRUEBA", async (_req, res) => {
    try {
        const result = await pool.query(`
      INSERT INTO virtual_cards
        (user_id, card_number, cardholder_name, monthly_limit, current_spending, status)
      VALUES
        ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
            "test-user-001",
            "4111111111111111",
            "JUAN DAVID",
            1000000,
            0,
            "ACTIVE"
        ]);

        res.json({
            status: "ok",
            card: result.rows[0],
        });
    } catch (error) {
        console.error("Card creation error:", error);

        res.status(500).json({
            status: "error",
            message: "No se pudo crear la tarjeta",
        });
    }
});
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

