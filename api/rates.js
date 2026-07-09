export default async function handler(req, res) {
  try {
    const response = await fetch("https://api.frankfurter.app/latest?from=NOK&to=USD,EUR,GBP,CNY,SEK,DKK,JPY,KRW");
    const data = await response.json();
    res.setHeader("Cache-Control", "s-maxage=3600");
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch rates" });
  }
}
