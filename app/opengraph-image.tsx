// app/opengraph-image.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "SalonixPro — Professional Salon Management Software for the Caribbean";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background:
            "linear-gradient(135deg, #0f172a 0%, #0d3d38 50%, #0f766e 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background pattern dots */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.06,
            backgroundImage:
              "radial-gradient(circle, white 1.5px, transparent 1.5px)",
            backgroundSize: "30px 30px",
          }}
        />

        {/* Top-right decorative circle */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 350,
            height: 350,
            borderRadius: "50%",
            background: "rgba(20, 184, 166, 0.15)",
          }}
        />

        {/* Bottom-left decorative circle */}
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: -60,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(16, 185, 129, 0.1)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
            zIndex: 1,
          }}
        >
          {/* Logo icon */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: "linear-gradient(135deg, #14b8a6, #10b981)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 20px 40px rgba(20, 184, 166, 0.3)",
            }}
          >
            <span style={{ fontSize: 42, color: "white" }}>&#9986;</span>
          </div>

          {/* Brand name */}
          <span
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: "white",
              letterSpacing: "-1px",
            }}
          >
            SalonixPro
          </span>

          {/* Tagline */}
          <span
            style={{
              fontSize: 26,
              color: "rgba(148, 163, 184, 1)",
              maxWidth: 700,
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            Professional Salon Management Software
          </span>

          {/* Feature pills */}
          <div
            style={{
              display: "flex",
              gap: "14px",
              marginTop: "8px",
            }}
          >
            {[
              "Online Booking",
              "POS & Inventory",
              "Staff Scheduling",
              "Client Portal",
              "Reports",
            ].map((label) => (
              <div
                key={label}
                style={{
                  padding: "10px 22px",
                  borderRadius: 999,
                  background: "rgba(20, 184, 166, 0.15)",
                  border: "1px solid rgba(20, 184, 166, 0.3)",
                  color: "#5eead4",
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom URL bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 50,
            background: "rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              color: "rgba(148, 163, 184, 0.7)",
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "0.5px",
            }}
          >
            Built for Caribbean Salons &bull; salonixpro.com
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
