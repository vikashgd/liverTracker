import { NextRequest, NextResponse } from "next/server";
// no-op
import { z } from "zod";

const Body = z.object({ imageUrl: z.string().url().optional(), imageUrls: z.array(z.string().url()).optional(), contentType: z.string().optional() });

export async function POST(req: NextRequest) {
  const { imageUrl, imageUrls } = Body.parse(await req.json());

  const prompt = `Extract the following and return strict JSON with the exact keys and structure. Do not invent values. Use null if missing. In addition to the named metrics, also extract ALL lab analytes present as an array in metricsAll.
{
  "reportType": "Lab"|"Ultrasound"|"CT"|"MRI"|"Other",
  "reportDate": "YYYY-MM-DD"|null,
  "metrics": {
    "ALT": {"value": number|null, "unit": "U/L"|"IU/L"|null} | null,
    "AST": {"value": number|null, "unit": "U/L"|"IU/L"|null} | null,
    "Platelets": {"value": number|null, "unit": "10^9/L"|"×10³/μL"|"/μL"|null} | null,
    "Bilirubin": {"value": number|null, "unit": "mg/dL"|"μmol/L"|null} | null,
    "Albumin": {"value": number|null, "unit": "g/dL"|"g/L"|null} | null,
    "Creatinine": {"value": number|null, "unit": "mg/dL"|"μmol/L"|null} | null,
    "INR": {"value": number|null, "unit": "ratio"|null} | null,
    "ALP": {"value": number|null, "unit": "U/L"|"IU/L"|null} | null,
    "GGT": {"value": number|null, "unit": "U/L"|"IU/L"|null} | null,
    "TotalProtein": {"value": number|null, "unit": "g/dL"|"g/L"|null} | null,
    "Sodium": {"value": number|null, "unit": "mEq/L"|"mmol/L"|null} | null,
    "Potassium": {"value": number|null, "unit": "mEq/L"|"mmol/L"|null} | null
  },
  "metricsAll": [
    { "name": string, "value": number|null, "unit": string|null, "category": "hematology"|"chemistry"|"electrolytes"|"coagulation"|"immunology"|"urinalysis"|"liver_function"|"kidney_function"|"other"|null }
  ] | null,
  "imaging": {
    "modality": "Ultrasound"|"CT"|"MRI"|null,
    "organs": [
      {"name": "Liver"|"Spleen"|"Gallbladder"|"PortalVein"|"Kidney"|string, "size": {"value": number|null, "unit": "cm"|null} | null, "notes": string|null}
    ] | null,
    "findings": [string] | null
  }
}

EXTRACTION GUIDELINES:
- Look for MELD score components: Bilirubin, Creatinine, INR (critical for liver disease assessment)
- Extract liver enzymes: ALT, AST, ALP, GGT (indicate liver function)
- Find protein markers: Albumin, Total Protein (liver synthesis function)
- Capture electrolytes: Sodium, Potassium (especially sodium for MELD-Na calculation)
- Get blood counts: Platelets (important for liver disease staging)
- Common name variations:
  * Creatinine: "Serum Creatinine", "SCr", "Creat"
  * INR: "International Normalized Ratio", "PT INR"
  * ALP: "Alkaline Phosphatase", "Alk Phos"
  * GGT: "Gamma GT", "γ-GT", "Gamma-Glutamyl Transferase"
  * Total Protein: "Serum Protein", "TP"
  * Sodium: "Na", "Serum Sodium"
  * Potassium: "K", "Serum Potassium"
- Support multiple unit formats (US vs International standards)
- Categorize appropriately: liver_function, kidney_function, electrolytes, etc.`;

  // Use the OpenAI REST API via fetch to avoid SDK dependency conflicts
  const messages: Array<Record<string, unknown>> = [
    { role: "system", content: "You are a medical data extraction assistant." },
  ];

  if (imageUrls && imageUrls.length > 0) {
    const content: Array<Record<string, unknown>> = [{ type: "text", text: prompt }];
    for (const url of imageUrls) content.push({ type: "image_url", image_url: { url } });
    messages.push({ role: "user", content });
  } else if (imageUrl) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: imageUrl } },
      ],
    });
  }

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0.1, messages }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    return NextResponse.json({ error: "openai_error", detail: err }, { status: 500 });
  }

  const data = await resp.json();
  let text: string = data?.choices?.[0]?.message?.content ?? "{}";
  // Strip Markdown code fences if present
  const fenceMatch = text.match(/```(?:json)?\n([\s\S]*?)\n```/i);
  if (fenceMatch) {
    text = fenceMatch[1];
  }
  try {
    const json = JSON.parse(text);
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ raw: text }, { status: 200 });
  }
}


