import express from "express";
import request from "supertest";
import { createPulseRouter } from "./pulseRoutes";

describe("GET /internal/pulse", () => {
  const app = express();
  const pulseRouter = createPulseRouter();

  if (!pulseRouter) {
    throw new Error(
      "PULSE_BEARER_TOKEN debe estar definido (p. ej. vía jest.setup.ts)"
    );
  }

  app.use("/internal", pulseRouter);

  it("rejects requests without Authorization", async () => {
    await request(app).get("/internal/pulse").expect(401);
  });

  it("rejects invalid bearer token", async () => {
    await request(app)
      .get("/internal/pulse")
      .set("Authorization", "Bearer wrong-token")
      .expect(401);
  });

  it("returns pulse payload with valid bearer", async () => {
    const token = process.env.PULSE_BEARER_TOKEN;
    expect(token).toBeDefined();

    const res = await request(app)
      .get("/internal/pulse")
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body.pulse_version).toBe("1");
    expect(["ok", "degraded", "down"]).toContain(res.body.status);
    expect(res.body.context).toMatchObject({
      product_name: expect.any(String),
      environment: expect.any(String),
      generated_at: expect.any(String),
      collection_duration_ms: expect.any(Number),
    });
    expect(res.body.metrics.technical).toMatchObject({
      uptime_s: expect.any(Number),
      node_version: expect.any(String),
      memory: expect.any(Object),
    });
    expect(Array.isArray(res.body.infrastructure)).toBe(true);
  });
});
