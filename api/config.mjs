export function GET() {
  try {
    return Response.json(
      { gasUrl: (process.env.GAS_URL || "").trim() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("config error", err);
    return Response.json({ gasUrl: "" }, { status: 500 });
  }
}
