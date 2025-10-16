import express, { Request, Response } from "express";
import fetch from "node-fetch";

// Create the Express app
const app = express();
app.use(express.json());

// Basic health route
app.get("/", (req: Request, res: Response) => {
  res.send("Wohnhilfe Assistant backend is running 🚀");
});

// Chat endpoint
app.post("/api/chat", async (req: Request, res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { messages = [], fileIds = [] } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Send a messages array" });
    }

    const systemMsg = {
      role: "system",
      content:
        "You are the Wohnhilfe Zürich Assistant. Answer concisely in a calm, elegant tone (quiet luxury). Prefer Swiss spelling, be helpful, and when unsure, say you don’t have that information. If file documents are available, answer from them."
    };

    const history = [systemMsg, ...messages];

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5",
        input: history,
        ...(fileIds.length ? { file_search: { file_ids: fileIds } } : {})
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    const reply =
      data?.output?.[0]?.content?.find?.((c: any) => c.type === "output_text")
        ?.text ||
      data?.output?.[0]?.content?.[0]?.text ||
      "Sorry, I couldn’t generate a response.";

    res.json({ reply });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err?.message || "Server error" });
  }
});

// Start server (Vercel handles this automatically)
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

export default app;
