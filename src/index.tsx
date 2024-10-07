import { Hono } from "hono";
import { basicAuth } from 'hono/basic-auth'
import { renderToString } from "react-dom/server";
import { env, getRuntimeKey } from "hono/adapter";
import { Analyze } from "./ocr";

type Bindings = {
  API_KEY: string;
  MODEL_ID: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', basicAuth({
    username: 'taxiocr',
    password: 'taxiocr',
  })
)

app.get("/api/clock", (c) => {
  return c.json({
    time: new Date().toLocaleTimeString(),
    runtime: getRuntimeKey(),
  });
});

app.post("/api/analyze", async (c) => {
  const body = await c.req.parseBody();
  const file = body.file;

  const apiKey = c.env.API_KEY || import.meta.env.VITE_API_KEY
  const modelId = c.env.MODEL_ID || import.meta.env.VITE_MODEL_ID

  try {
    const data = await Analyze(file, apiKey, modelId);
    return c.json({ data });
  } catch (error) {
    c.status(500)
    return c.json({
      error: error.message,
      detail: {
        stack: error.stack,
      }
    });
  }
});

app.get("*", (c) => {
  return c.html(
    renderToString(
      <html>
        <head>
          <meta charSet="utf-8" />
          <meta content="width=device-width, initial-scale=1" name="viewport" />

          <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/alvaromontoro/almond.css@latest/dist/almond.min.css" />

          {import.meta.env.PROD
            ? (
              <>
                <script type="module" src="/static/client.js"></script>
              </>
            )
            : (
              <>
                <script type="module" src="/src/client.tsx"></script>
              </>
            )}
          <title>Taxi OCR 🚖</title>
        </head>
        <body>
          <div id="root"></div>
        </body>
      </html>,
    ),
  );
});

export default app;
