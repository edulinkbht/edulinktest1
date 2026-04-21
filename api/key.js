export default function handler(req, res) {
  const newtonAPIKey = process.env.NEWTON_API_KEY;

  if (!newtonAPIKey) {
    console.error("Missing NEWTON_API_KEY in Vercel environment!");
    return res.status(500).json({ error: "Server configuration error." });
  }

  res.status(200).json({ key: newtonAPIKey });
}
