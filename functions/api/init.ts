export async function onRequest(context: any) {
  const db = context.env.DB;
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS draws (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        draw_date TEXT NOT NULL,
        numbers TEXT NOT NULL,
        special INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);
    return new Response(JSON.stringify({ success: true, message: "Table created or exists" }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
