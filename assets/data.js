/* ==========================================================================
   BRA Running Style — data layer
   Seed data, persistence, derived state (issues, completeness) and mutations.
   ========================================================================== */

(function () {
  "use strict";

  const STORE_KEY = "bra-running-style-v2";

  const DEPTS = ["MD", "Pattern Maker", "IE-Technical", "Production", "QA"];
  const DOC_CATS = [
    "BOM",
    "Material Estimation",
    "HO",
    "MC",
    "RA",
    "Foto style"
  ];
  const CODES = {
    "BOM": "BOM",
    "Material Estimation": "ME",
    "HO": "HO",
    "MC": "MC",
    "RA": "RA",
    "Foto style": "FOTO"
  };
  const DEV_STATES = [
    "In Development",
    "In Trial",
    "Dev selesai",
    "Ditahan",
    "Dibatalkan"
  ];
  const PROD_STATES = [
    "Belum produksi",
    "Produksi berjalan",
    "Pernah produksi",
    "Produksi ditahan"
  ];
  const SAMPLE_STATES = [
    "Diminta",
    "Menunggu konfirmasi",
    "Dikerjakan",
    "Selesai",
    "Dibatalkan",
    "Legacy — verifikasi diperlukan"
  ];

  const ROLES = {
    admin: { label: "Administrator", caps: ["edit", "bulk", "import", "upload", "verify", "allocate", "publish"] },
    md: { label: "MD — pemelihara data", caps: ["edit", "bulk", "import", "allocate", "publish"] },
    ie: { label: "IE-Technical", caps: ["edit", "upload", "verify", "allocate", "publish"] },
    pattern: { label: "Pattern Maker", caps: ["edit", "upload", "allocate"] },
    production: { label: "Production", caps: [] },
    qa: { label: "QA", caps: [] }
  };

  /* ------------------------------------------------------------------ seed */

  function makeDoc(sid, cat, versions, alloc) {
    return {
      cat: cat,
      versions: versions.map(function (row) {
        return {
          v: row[0],
          status: row[1],
          by: row[2],
          at: row[3],
          size: row[4] || 248,
          reviewer: row[1] === "Terverifikasi" ? (row[5] || row[2]) : null,
          note: row[6] || "",
          file: sid + "_" + CODES[cat] + "_" + row[0] + "." + (cat === "Foto style" ? "zip" : "xlsx")
        };
      }),
      alloc: alloc || {}
    };
  }

  function style(o) {
    const base = {
      brand: "",
      buyer: "",
      desc: "",
      group: "",
      color: "",
      week: "",
      dev: "In Development",
      prod: "Belum produksi",
      sample: "Diminta",
      sampleEvidence: true,
      mc: 2,
      pic: { pattern: null, mdmkt: null, ie: null, prod: null, qa: null },
      notes: "",
      updatedAt: "2026-10-20",
      updatedBy: "D. Widayanto",
      docs: [],
      pubs: { FRONT: [], BACK: [] }
    };
    const merged = Object.assign(base, o);
    merged.pic = Object.assign({ pattern: null, mdmkt: null, ie: null, prod: null, qa: null }, o.pic || {});
    merged.pubs = Object.assign({ FRONT: [], BACK: [] }, o.pubs || {});
    return merged;
  }

  function seed() {
    const s1 = "10345161";
    const s2 = "10767R";
    const s3 = "WC-88214";
    const s4 = "AD-44082";
    const s5 = "VS-26018";
    const s6 = "SP-9120";
    const s7 = "10455209";
    const s8 = "10882P";
    const s9 = "WC-88390";
    const s10 = "AD-44091";
    const s11 = "10582310";
    const s12 = "36662R";

    return {
      version: 2,
      role: "md",
      styles: [
        style({
          id: s1, brand: "Victoria's Secret", buyer: "VS", desc: "Wireless Lightly Lined Bra",
          group: "Women's Wear", color: "Powder pink / Hitam", week: "WK 42",
          dev: "In Trial", prod: "Belum produksi", sample: "Menunggu konfirmasi", sampleEvidence: false, mc: 1.8,
          pic: { pattern: "D. Prasetyo", mdmkt: "A. Wulandari", ie: "F. Ramadhan", prod: null, qa: null },
          notes: "Periksa catatan fitting sebelum putaran sampel berikutnya.",
          updatedAt: "2026-10-24",
          docs: [
            makeDoc(s1, "BOM", [["V2", "Terverifikasi", "R. Santoso", "2026-10-18"], ["V3", "Terverifikasi", "R. Santoso", "2026-10-24", 412]], { MD: "V3", "Pattern Maker": "V3", "IE-Technical": "V3", "Production": "V3", QA: "V3" }),
            makeDoc(s1, "Material Estimation", [["V1", "Terverifikasi", "A. Wulandari", "2026-10-15"], ["V2", "Terverifikasi", "A. Wulandari", "2026-10-23", 236], ["V3", "Menunggu verifikasi", "A. Wulandari", "2026-10-24", 251]], { MD: "V2", "IE-Technical": "V2", "Production": "V2" }),
            makeDoc(s1, "HO", [["V1", "Menunggu verifikasi", "D. Prasetyo", "2026-10-22", 248]], { "Pattern Maker": "V1" }),
            makeDoc(s1, "MC", [["V1", "Terverifikasi", "D. Prasetyo", "2026-10-14"], ["V2", "Terverifikasi", "D. Prasetyo", "2026-10-22", 198]], { MD: "V2", "Pattern Maker": "V2", "IE-Technical": "V2", "Production": "V2", QA: "V2" }),
            makeDoc(s1, "RA", [], {}),
            makeDoc(s1, "Foto style", [["V1", "Terverifikasi", "A. Wulandari", "2026-10-16"], ["V2", "Terverifikasi", "A. Wulandari", "2026-10-24", 1840]], {})
          ],
          pubs: {
            FRONT: [
              { v: "V1", status: "Terbit", file: "FRONT_" + s1 + "_V1.pdf", by: "D. Prasetyo", at: "2026-10-12" },
              { v: "V2", status: "Terbit", file: "FRONT_" + s1 + "_V2.pdf", by: "A. Wulandari", at: "2026-10-18" },
              { v: "V3", status: "Terbit", file: "FRONT_" + s1 + "_V3.pdf", by: "D. Prasetyo", at: "2026-10-22" }
            ],
            BACK: [
              { v: "V1", status: "Terbit", file: "BACK_" + s1 + "_V1.pdf", by: "A. Wulandari", at: "2026-10-18" },
              { v: "V2", status: "Draft", file: "BACK_" + s1 + "_V2.pdf", by: "D. Prasetyo", at: "2026-10-24" }
            ]
          }
        }),
        style({
          id: s2, brand: "SPANX", buyer: "SPANX", desc: "Seamless shaping brief",
          group: "Shapewear", color: "Hitam / Cinnamon", week: "WK 42",
          dev: "In Development", prod: "Belum produksi", sample: "Diminta", sampleEvidence: true, mc: 2.2,
          pic: { pattern: "A. Wulandari", mdmkt: "F. Ramadhan", ie: "M. Hidayat", prod: null, qa: "R. Santoso" },
          notes: "Foto style dan risk analysis perlu tindak lanjut.",
          updatedAt: "2026-10-23",
          docs: [
            makeDoc(s2, "BOM", [["V1", "Terverifikasi", "M. Hidayat", "2026-10-21", 302]], { MD: "V1", "Pattern Maker": "V1", "IE-Technical": "V1" }),
            makeDoc(s2, "Material Estimation", [["V1", "Terverifikasi", "A. Wulandari", "2026-10-21", 214]], { MD: "V1", "IE-Technical": "V1" }),
            makeDoc(s2, "HO", [], {}),
            makeDoc(s2, "MC", [["V1", "Terverifikasi", "M. Hidayat", "2026-10-20", 176]], { MD: "V1", "IE-Technical": "V1" }),
            makeDoc(s2, "RA", [], {}),
            makeDoc(s2, "Foto style", [], {})
          ],
          pubs: {
            FRONT: [{ v: "V1", status: "Draft", file: "FRONT_" + s2 + "_V1.pdf", by: "A. Wulandari", at: "2026-10-19" }],
            BACK: []
          }
        }),
        style({
          id: s3, brand: "Wacoal", buyer: "WACOAL", desc: "Everyday comfort bra",
          group: "Intimate Wear", color: "Nude / Hitam", week: "WK 41",
          dev: "Dev selesai", prod: "Pernah produksi", sample: "Selesai", sampleEvidence: true, mc: 2.4,
          pic: { pattern: "R. Santoso", mdmkt: "N. Kusuma", ie: "F. Ramadhan", prod: "S. Halim", qa: "R. Santoso" },
          notes: "Style lama, seluruh dokumen sudah terverifikasi.",
          updatedAt: "2026-10-21",
          docs: [
            makeDoc(s3, "BOM", [["V4", "Terverifikasi", "R. Santoso", "2026-10-21", 388]], { MD: "V4", "Pattern Maker": "V4", "IE-Technical": "V4", Production: "V4", QA: "V4" }),
            makeDoc(s3, "Material Estimation", [["V2", "Terverifikasi", "R. Santoso", "2026-10-20", 202], ["V3", "Terverifikasi", "R. Santoso", "2026-10-21", 208]], { MD: "V3", "Pattern Maker": "V3", "IE-Technical": "V3", Production: "V3", QA: "V3" }),
            makeDoc(s3, "HO", [["V1", "Terverifikasi", "R. Santoso", "2026-10-18"]], { MD: "V1", "Pattern Maker": "V1", "IE-Technical": "V1", Production: "V1", QA: "V1" }),
            makeDoc(s3, "MC", [["V2", "Terverifikasi", "R. Santoso", "2026-10-19", 164]], { MD: "V2", "Pattern Maker": "V2", "IE-Technical": "V2", Production: "V2", QA: "V2" }),
            makeDoc(s3, "RA", [["V1", "Terverifikasi", "R. Santoso", "2026-10-20", 226]], { MD: "V1", "Pattern Maker": "V1", "IE-Technical": "V1", Production: "V1", QA: "V1" }),
            makeDoc(s3, "Foto style", [["V2", "Terverifikasi", "R. Santoso", "2026-10-20", 1620]], { MD: "V2", "Pattern Maker": "V2", "IE-Technical": "V2", Production: "V2", QA: "V2" })
          ],
          pubs: {
            FRONT: [
              { v: "V4", status: "Terbit", file: "FRONT_" + s3 + "_V4.pdf", by: "R. Santoso", at: "2026-10-18" },
              { v: "V5", status: "Terbit", file: "FRONT_" + s3 + "_V5.pdf", by: "R. Santoso", at: "2026-10-20" }
            ],
            BACK: [
              { v: "V3", status: "Terbit", file: "BACK_" + s3 + "_V3.pdf", by: "R. Santoso", at: "2026-10-17" },
              { v: "V4", status: "Terbit", file: "BACK_" + s3 + "_V4.pdf", by: "R. Santoso", at: "2026-10-20" }
            ]
          }
        }),
        style({
          id: s4, brand: "Adidas", buyer: "ADIDAS", desc: "Performance training top",
          group: "Sports & Activewear", color: "Hitam", week: "WK 41",
          dev: "Ditahan", prod: "Belum produksi", sample: "Diminta", sampleEvidence: true, mc: 3.1,
          pic: { pattern: "M. Hidayat", mdmkt: "N. Kusuma", ie: "F. Ramadhan", prod: null, qa: null },
          notes: "Menunggu konfirmasi buyer sebelum lanjut.",
          updatedAt: "2026-10-19",
          docs: [
            makeDoc(s4, "BOM", [["V1", "Terverifikasi", "M. Hidayat", "2026-10-15"], ["V2", "Terverifikasi", "M. Hidayat", "2026-10-19", 296]], { MD: "V2", "IE-Technical": "V2" }),
            makeDoc(s4, "Material Estimation", [], {}),
            makeDoc(s4, "HO", [["V1", "Menunggu verifikasi", "M. Hidayat", "2026-10-20", 231]], {}),
            makeDoc(s4, "MC", [["V1", "Terverifikasi", "M. Hidayat", "2026-10-16", 158]], { MD: "V1", "IE-Technical": "V1" }),
            makeDoc(s4, "RA", [], {}),
            makeDoc(s4, "Foto style", [["V1", "Terverifikasi", "M. Hidayat", "2026-10-17", 1420]], { "Pattern Maker": "V1" })
          ],
          pubs: { FRONT: [], BACK: [] }
        }),
        style({
          id: s5, brand: "Victoria's Secret", buyer: "VS", desc: "Plunge swim top",
          group: "Swimwear", color: "Biru / Hitam", week: "WK 40",
          dev: "In Development", prod: "Belum produksi", sample: "Menunggu konfirmasi", sampleEvidence: false, mc: 2,
          pic: { pattern: "D. Prasetyo", mdmkt: "A. Wulandari", ie: "F. Ramadhan", prod: "S. Halim", qa: null },
          notes: "Request sampel belum dilengkapi bukti.",
          updatedAt: "2026-10-18",
          docs: [
            makeDoc(s5, "BOM", [["V1", "Terverifikasi", "D. Prasetyo", "2026-10-14", 274]], { MD: "V1", "Pattern Maker": "V1" }),
            makeDoc(s5, "Material Estimation", [["V1", "Terverifikasi", "D. Prasetyo", "2026-10-15", 219]], { MD: "V1" }),
            makeDoc(s5, "HO", [], {}),
            makeDoc(s5, "MC", [["V1", "Menunggu verifikasi", "D. Prasetyo", "2026-10-17", 148]], {}),
            makeDoc(s5, "RA", [], {}),
            makeDoc(s5, "Foto style", [["V1", "Terverifikasi", "D. Prasetyo", "2026-10-16", 1180]], { MD: "V1" })
          ],
          pubs: { FRONT: [], BACK: [] }
        }),
        style({
          id: s6, brand: "SPANX", buyer: "SPANX", desc: "High-rise shaping short",
          group: "Shapewear", color: "Very black", week: "WK 40",
          dev: "Dev selesai", prod: "Produksi berjalan", sample: "Selesai", sampleEvidence: true, mc: 1.6,
          pic: { pattern: "A. Wulandari", mdmkt: "F. Ramadhan", ie: "M. Hidayat", prod: "S. Halim", qa: "R. Santoso" },
          notes: "Menunggu konfirmasi buyer sebelum lanjut.",
          updatedAt: "2026-10-17",
          docs: [
            makeDoc(s6, "BOM", [["V2", "Terverifikasi", "A. Wulandari", "2026-10-16", 318]], { MD: "V2", "Pattern Maker": "V2", "IE-Technical": "V2", Production: "V2", QA: "V2" }),
            makeDoc(s6, "Material Estimation", [["V1", "Terverifikasi", "A. Wulandari", "2026-10-15"]], { MD: "V1", "Pattern Maker": "V1", "IE-Technical": "V1", Production: "V1", QA: "V1" }),
            makeDoc(s6, "HO", [["V1", "Terverifikasi", "A. Wulandari", "2026-10-14"]], { MD: "V1", "Pattern Maker": "V1", "IE-Technical": "V1", Production: "V1", QA: "V1" }),
            makeDoc(s6, "MC", [["V2", "Terverifikasi", "M. Hidayat", "2026-10-16", 172]], { MD: "V2", "Pattern Maker": "V2", "IE-Technical": "V2", Production: "V2", QA: "V2" }),
            makeDoc(s6, "RA", [["V1", "Terverifikasi", "M. Hidayat", "2026-10-16", 208]], { MD: "V1", "Pattern Maker": "V1", "IE-Technical": "V1", Production: "V1", QA: "V1" }),
            makeDoc(s6, "Foto style", [["V2", "Terverifikasi", "A. Wulandari", "2026-10-17", 1510]], { MD: "V2", "Pattern Maker": "V2", "IE-Technical": "V2", Production: "V2", QA: "V2" })
          ],
          pubs: {
            FRONT: [{ v: "V2", status: "Terbit", file: "FRONT_" + s6 + "_V2.pdf", by: "A. Wulandari", at: "2026-10-16" }],
            BACK: [{ v: "V2", status: "Terbit", file: "BACK_" + s6 + "_V2.pdf", by: "A. Wulandari", at: "2026-10-17" }]
          }
        }),
        style({
          id: s7, brand: "Victoria's Secret", buyer: "VS", desc: "Cotton modal bralette",
          group: "Women's Wear", color: "Putih / Sage", week: "WK 42",
          dev: "In Development", prod: "Belum produksi", sample: "Diminta", sampleEvidence: true, mc: 2.9,
          pic: { pattern: "S. Halim", mdmkt: "A. Wulandari", ie: "F. Ramadhan", prod: null, qa: null },
          updatedAt: "2026-10-22",
          docs: [
            makeDoc(s7, "BOM", [["V1", "Terverifikasi", "D. Prasetyo", "2026-10-20", 264]], { MD: "V1", "Pattern Maker": "V1" }),
            makeDoc(s7, "Material Estimation", [], {}),
            makeDoc(s7, "HO", [], {}),
            makeDoc(s7, "MC", [["V1", "Terverifikasi", "D. Prasetyo", "2026-10-19", 141]], { MD: "V1" }),
            makeDoc(s7, "RA", [], {}),
            makeDoc(s7, "Foto style", [], {})
          ],
          pubs: { FRONT: [], BACK: [] }
        }),
        style({
          id: s8, brand: "SPANX", buyer: "SPANX", desc: "Sculpting bodysuit",
          group: "Shapewear", color: "Hitam", week: "WK 41",
          dev: "In Trial", prod: "Belum produksi", sample: "Menunggu konfirmasi", sampleEvidence: true, mc: 2.2,
          pic: { pattern: "S. Halim", mdmkt: "F. Ramadhan", ie: "M. Hidayat", prod: null, qa: null },
          updatedAt: "2026-10-21",
          docs: [
            makeDoc(s8, "BOM", [["V1", "Terverifikasi", "A. Wulandari", "2026-10-18"]], { MD: "V1" }),
            makeDoc(s8, "Material Estimation", [["V1", "Menunggu verifikasi", "A. Wulandari", "2026-10-21", 205]], {}),
            makeDoc(s8, "HO", [], {}),
            makeDoc(s8, "MC", [["V1", "Terverifikasi", "M. Hidayat", "2026-10-16"]], { MD: "V1" }),
            makeDoc(s8, "RA", [], {}),
            makeDoc(s8, "Foto style", [["V1", "Terverifikasi", "A. Wulandari", "2026-10-19", 1290]], { MD: "V1" })
          ],
          pubs: { FRONT: [], BACK: [] }
        }),
        style({
          id: s9, brand: "Wacoal", buyer: "WACOAL", desc: "Minimizer everyday bra",
          group: "Intimate Wear", color: "Beige", week: "WK 40",
          dev: "Dev selesai", prod: "Pernah produksi", sample: "Selesai", sampleEvidence: true, mc: 1.4,
          pic: { pattern: "R. Santoso", mdmkt: "N. Kusuma", ie: "F. Ramadhan", prod: "S. Halim", qa: "R. Santoso" },
          updatedAt: "2026-10-16",
          docs: [
            makeDoc(s9, "BOM", [["V3", "Terverifikasi", "R. Santoso", "2026-10-15", 356]], { MD: "V3", "Pattern Maker": "V3", "IE-Technical": "V3", Production: "V3", QA: "V3" }),
            makeDoc(s9, "Material Estimation", [["V2", "Terverifikasi", "R. Santoso", "2026-10-14"]], { MD: "V2", "IE-Technical": "V2", Production: "V2" }),
            makeDoc(s9, "HO", [["V1", "Terverifikasi", "R. Santoso", "2026-10-13"]], { MD: "V1", "Pattern Maker": "V1" }),
            makeDoc(s9, "MC", [["V2", "Terverifikasi", "R. Santoso", "2026-10-14"]], { MD: "V2", "IE-Technical": "V2" }),
            makeDoc(s9, "RA", [["V1", "Terverifikasi", "R. Santoso", "2026-10-15"]], { MD: "V1", "IE-Technical": "V1" }),
            makeDoc(s9, "Foto style", [["V2", "Terverifikasi", "R. Santoso", "2026-10-16", 1460]], { MD: "V2", "IE-Technical": "V2" })
          ],
          pubs: {
            FRONT: [{ v: "V4", status: "Terbit", file: "FRONT_" + s9 + "_V4.pdf", by: "R. Santoso", at: "2026-10-15" }],
            BACK: [{ v: "V3", status: "Terbit", file: "BACK_" + s9 + "_V3.pdf", by: "R. Santoso", at: "2026-10-16" }]
          }
        }),
        style({
          id: s10, brand: "Adidas", buyer: "ADIDAS", desc: "Seamless training legging",
          group: "Sports & Activewear", color: "Charcoal", week: "WK 42",
          dev: "In Development", prod: "Belum produksi", sample: "Diminta", sampleEvidence: true, mc: 2.3,
          pic: { pattern: "M. Hidayat", mdmkt: "N. Kusuma", ie: "F. Ramadhan", prod: null, qa: null },
          updatedAt: "2026-10-21",
          docs: [
            makeDoc(s10, "BOM", [["V1", "Menunggu verifikasi", "M. Hidayat", "2026-10-21", 288]], {}),
            makeDoc(s10, "Material Estimation", [], {}),
            makeDoc(s10, "HO", [], {}),
            makeDoc(s10, "MC", [], {}),
            makeDoc(s10, "RA", [], {}),
            makeDoc(s10, "Foto style", [], {})
          ],
          pubs: { FRONT: [], BACK: [] }
        }),
        style({
          id: s11, brand: "Victoria's Secret", buyer: "VS", desc: "Push-up contour bra",
          group: "Women's Wear", color: "Rose", week: "WK 41",
          dev: "In Trial", prod: "Belum produksi", sample: "Dikerjakan", sampleEvidence: true, mc: 1.9,
          pic: { pattern: "D. Prasetyo", mdmkt: "A. Wulandari", ie: "F. Ramadhan", prod: null, qa: null },
          updatedAt: "2026-10-21",
          docs: [
            makeDoc(s11, "BOM", [["V2", "Terverifikasi", "D. Prasetyo", "2026-10-20", 322]], { MD: "V2", "Pattern Maker": "V2", "IE-Technical": "V2" }),
            makeDoc(s11, "Material Estimation", [["V1", "Terverifikasi", "D. Prasetyo", "2026-10-19"]], { MD: "V1" }),
            makeDoc(s11, "HO", [["V1", "Terverifikasi", "D. Prasetyo", "2026-10-21"]], { MD: "V1", "Pattern Maker": "V1" }),
            makeDoc(s11, "MC", [["V1", "Terverifikasi", "D. Prasetyo", "2026-10-20"]], { MD: "V1" }),
            makeDoc(s11, "RA", [], {}),
            makeDoc(s11, "Foto style", [["V1", "Terverifikasi", "D. Prasetyo", "2026-10-19", 1330]], { MD: "V1" })
          ],
          pubs: {
            FRONT: [{ v: "V1", status: "Draft", file: "FRONT_" + s11 + "_V1.pdf", by: "D. Prasetyo", at: "2026-10-21" }],
            BACK: []
          }
        }),
        style({
          id: s12, brand: "Victoria's Secret", buyer: "VS", desc: "Ribbed sleep short",
          group: "Sleepwear", color: "Off white", week: "WK 40",
          dev: "Ditahan", prod: "Belum produksi", sample: "Dibatalkan", sampleEvidence: true, mc: 1.2,
          pic: { pattern: "S. Halim", mdmkt: "A. Wulandari", ie: "M. Hidayat", prod: null, qa: null },
          updatedAt: "2026-10-15",
          docs: [
            makeDoc(s12, "BOM", [["V1", "Terverifikasi", "S. Halim", "2026-10-12", 242]], { MD: "V1" }),
            makeDoc(s12, "Material Estimation", [], {}),
            makeDoc(s12, "HO", [], {}),
            makeDoc(s12, "MC", [["V1", "Terverifikasi", "S. Halim", "2026-10-13"]], { MD: "V1" }),
            makeDoc(s12, "RA", [], {}),
            makeDoc(s12, "Foto style", [], {})
          ],
          pubs: { FRONT: [], BACK: [] }
        })
      ],
      activity: [
        { id: "act-6", at: "2026-10-24", actor: "D. Widayanto", type: "impor", title: "Impor WK 42 — VS 2026 FRONT/BACK", detail: "42 baris · 11 field diubah pada 9 style", ref: "IMP-2026-010" },
        { id: "act-5", at: "2026-10-24", actor: "A. Wulandari", type: "alokasi", title: "Alokasi dokumen diubah", detail: "10345161 · BOM V3 · ditambahkan QA", ref: "10345161" },
        { id: "act-4", at: "2026-10-24", actor: "D. Prasetyo", type: "publikasi", title: "BACK V2 disimpan sebagai draft", detail: "10345161 · FRONT V3 tetap terbit", ref: "10345161" },
        { id: "act-3", at: "2026-10-23", actor: "A. Wulandari", type: "dokumen", title: "Revisi Material Estimation V3 diunggah", detail: "10345161 · menunggu verifikasi", ref: "10345161" },
        { id: "act-2", at: "2026-10-22", actor: "D. Prasetyo", type: "dokumen", title: "HO V1 diunggah", detail: "10345161 · 248 KB · xlsx", ref: "10345161" },
        { id: "act-1", at: "2026-10-21", actor: "R. Santoso", type: "dokumen", title: "BOM V4 diverifikasi", detail: "WC-88214 · dialokasikan ke 5 departemen", ref: "WC-88214" }
      ],
      batches: [
        { id: "IMP-2026-010", at: "2026-10-24", by: "D. Widayanto", source: "VS 2026 — Running Style FRONT/BACK", rows: 42, created: 9, updated: 11, excluded: 5 },
        { id: "IMP-2026-009", at: "2026-10-20", by: "D. Widayanto", source: "INDEX RUNNING STYLE 2026", rows: 128, created: 4, updated: 31, excluded: 3 }
      ]
    };
  }

  /* --------------------------------------------------------------- storage */

  let state = null;

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === 2 && Array.isArray(parsed.styles)) {
          state = parsed;
          return state;
        }
      }
    } catch (err) {
      console.warn("State tidak dapat dibaca, memakai data awal.", err);
    }
    state = seed();
    save();
    return state;
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("Perubahan hanya berlaku pada sesi ini.", err);
    }
  }

  function reset() {
    state = seed();
    save();
    return state;
  }

  function get() { return state; }

  /* ---------------------------------------------------------------- helpers */

  function fmtDate(iso) {
    if (!iso) return "—";
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const parts = String(iso).slice(0, 10).split("-");
    if (parts.length !== 3) return iso;
    return parseInt(parts[2], 10) + " " + months[parseInt(parts[1], 10) - 1] + " " + parts[0];
  }

  function today() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function styleById(id) {
    return state.styles.find(function (s) { return s.id === id; }) || null;
  }

  function docOf(s, cat) {
    return s.docs.find(function (d) { return d.cat === cat; }) || null;
  }

  function latestVersion(doc) {
    if (!doc || !doc.versions.length) return null;
    return doc.versions[doc.versions.length - 1];
  }

  function reviewedVersion(doc) {
    if (!doc) return null;
    for (let i = doc.versions.length - 1; i >= 0; i -= 1) {
      if (doc.versions[i].status === "Terverifikasi") return doc.versions[i];
    }
    return null;
  }

  function docState(doc) {
    if (!doc || !doc.versions.length) return "missing";
    const latest = latestVersion(doc);
    if (latest.status === "Menunggu verifikasi") return "pending";
    if (latest.status === "Perlu revisi") return "revise";
    if (!reviewedVersion(doc)) return "pending";
    return "verified";
  }

  function docProgress(s) {
    const total = DOC_CATS.length;
    let ok = 0;
    DOC_CATS.forEach(function (cat) {
      if (docState(docOf(s, cat)) === "verified") ok += 1;
    });
    return { ok: ok, total: total };
  }

  function completeness() {
    return DOC_CATS.map(function (cat) {
      let have = 0;
      state.styles.forEach(function (s) {
        if (docState(docOf(s, cat)) === "verified") have += 1;
      });
      return { cat: cat, have: have, total: state.styles.length };
    });
  }

  function latestPublished(s, side) {
    const list = (s.pubs[side] || []).filter(function (p) { return p.status === "Terbit"; });
    return list.length ? list[list.length - 1] : null;
  }

  function latestDraft(s, side) {
    const list = (s.pubs[side] || []).filter(function (p) { return p.status === "Draft" || p.status === "Tinjau" });
    return list.length ? list[list.length - 1] : null;
  }

  /* ----------------------------------------------------------------- issues */

  const CAT_OWNER = {
    "BOM": "MD",
    "Material Estimation": "MD",
    "HO": "IE-Technical",
    "MC": "IE-Technical",
    "RA": "QA",
    "Foto style": "Pattern Maker"
  };

  function picFor(s, dept) {
    const map = { MD: "mdmkt", "Pattern Maker": "pattern", "IE-Technical": "ie", Production: "prod", QA: "qa" };
    const key = map[dept];
    return key ? s.pic[key] : null;
  }

  function buildIssues() {
    const issues = [];
    state.styles.forEach(function (s) {
      DOC_CATS.forEach(function (cat) {
        const doc = docOf(s, cat);
        const stateName = docState(doc);
        const dept = CAT_OWNER[cat];
        const owner = picFor(s, dept);
        if (stateName === "missing") {
          issues.push({
            key: s.id + "|" + cat + "|missing",
            styleId: s.id,
            tone: "att",
            status: "Belum tersedia",
            title: cat + " belum tersedia",
            object: "Dokumen teknis " + cat,
            objectSub: "Belum ada berkas",
            dept: dept,
            owner: owner,
            evidence: "Tidak ada berkas di vault",
            evidenceSub: "—",
            action: "Unggah " + cat,
            actionNote: "atau tetapkan PIC",
            kind: "doc-missing"
          });
        } else if (stateName === "pending") {
          const latest = latestVersion(doc);
          issues.push({
            key: s.id + "|" + cat + "|pending",
            styleId: s.id,
            tone: "att",
            status: "Menunggu verifikasi",
            title: cat + " " + latest.v + " menunggu verifikasi",
            object: cat,
            objectSub: latest.v,
            dept: dept,
            owner: owner,
            evidence: fmtDate(latest.at),
            evidenceSub: latest.by + " · " + latest.size + " KB",
            action: "Verifikasi " + latest.v,
            actionNote: "oleh reviewer yang ditetapkan",
            kind: "doc-pending",
            cat: cat,
            version: latest.v
          });
        } else if (stateName === "revise") {
          const latest = latestVersion(doc);
          issues.push({
            key: s.id + "|" + cat + "|revise",
            styleId: s.id,
            tone: "block",
            status: "Perlu revisi",
            title: cat + " " + latest.v + " dikembalikan untuk revisi",
            object: cat,
            objectSub: latest.v,
            dept: dept,
            owner: owner,
            evidence: fmtDate(latest.at),
            evidenceSub: latest.note || "Catatan revisi belum diisi",
            action: "Unggah revisi",
            actionNote: cat,
            kind: "doc-revise",
            cat: cat
          });
        }
      });

      ["FRONT", "BACK"].forEach(function (side) {
        const draft = latestDraft(s, side);
        if (draft) {
          issues.push({
            key: s.id + "|pub-" + side,
            styleId: s.id,
            tone: "att",
            status: "Draft",
            title: "Publikasi " + side + " " + draft.v + " masih draft",
            object: "Publikasi " + side,
            objectSub: draft.v,
            dept: "MD",
            owner: s.pic.mdmkt,
            evidence: fmtDate(draft.at),
            evidenceSub: side === "BACK" ? "FRONT terbit " + (latestPublished(s, "FRONT") ? latestPublished(s, "FRONT").v : "—") : "Menunggu tinjauan",
            action: "Terbitkan " + side + " " + draft.v,
            actionNote: "setelah ditinjau",
            kind: "pub-draft",
            side: side
          });
        }
      });

      if (!s.pic.prod) {
        issues.push({
          key: s.id + "|pic-prod",
          styleId: s.id,
          tone: "block",
          status: "Tanpa PIC",
          title: "PIC Production belum ditetapkan",
          object: "Alokasi departemen",
          objectSub: "Production",
          dept: "Production",
          owner: null,
          evidence: docOf(s, "BOM") && reviewedVersion(docOf(s, "BOM")) ? "BOM " + reviewedVersion(docOf(s, "BOM")).v + " terverifikasi" : "Belum ada BOM terverifikasi",
          evidenceSub: "Alokasi menunggu PIC",
          action: "Tetapkan PIC",
          actionNote: "Production",
          kind: "pic-missing",
          deptTarget: "Production"
        });
      }

      if (!s.sampleEvidence) {
        issues.push({
          key: s.id + "|sample",
          styleId: s.id,
          tone: "att",
          status: s.sample,
          title: "Sample request tanpa bukti",
          object: "Sample request",
          objectSub: s.id === "10345161" ? "VS-26018" : s.id + "-SR01",
          dept: "MD",
          owner: s.pic.mdmkt,
          evidence: fmtDate(s.updatedAt),
          evidenceSub: "Belum ada berkas",
          action: "Lampirkan bukti",
          actionNote: "request " + (s.id === "10345161" ? "VS-26018" : s.id + "-SR01"),
          kind: "sample-no-evidence"
        });
      }

      /* Alokasi Production dan QA ditindaklanjuti sebagai satu item per style,
         bukan satu item per dokumen — supaya antrean tetap bisa dibaca. */
      ["Production", "QA"].forEach(function (dept) {
        const owner = picFor(s, dept);
        if (!owner) return;
        const openDocs = DOC_CATS.filter(function (cat) {
          const doc = docOf(s, cat);
          return docState(doc) === "verified" && !doc.alloc[dept];
        });
        if (!openDocs.length) return;
        const firstDoc = docOf(s, openDocs[0]);
        const reviewed = reviewedVersion(firstDoc);
        issues.push({
          key: s.id + "|alloc-" + dept,
          styleId: s.id,
          tone: "att",
          status: "Belum dialokasikan",
          title: "Alokasi " + dept + " belum ditetapkan",
          object: openDocs.length > 1 ? openDocs.length + " dokumen" : openDocs[0],
          objectSub: openDocs.length > 1 ? openDocs.join(", ") : reviewed.v,
          dept: dept,
          owner: owner,
          evidence: "Terverifikasi " + fmtDate(reviewed.at),
          evidenceSub: "versi " + reviewed.v + " · " + openDocs.length + " dokumen terbuka",
          action: "Tetapkan alokasi",
          actionNote: dept,
          kind: "alloc-gap",
          cat: openDocs[0],
          deptTarget: dept
        });
      });
    });

    const ORDER = {
      "doc-missing": 0,
      "doc-pending": 1,
      "doc-revise": 2,
      "pub-draft": 3,
      "sample-no-evidence": 4,
      "pic-missing": 5,
      "alloc-gap": 6
    };
    issues.sort(function (a, b) {
      const diff = (ORDER[a.kind] == null ? 9 : ORDER[a.kind]) - (ORDER[b.kind] == null ? 9 : ORDER[b.kind]);
      if (diff !== 0) return diff;
      return String(a.styleId).localeCompare(String(b.styleId));
    });
    return issues;
  }

  function issuesForStyle(styleId) {
    return buildIssues().filter(function (i) { return i.styleId === styleId; });
  }

  function issuesForDept(dept) {
    return buildIssues().filter(function (i) { return i.dept === dept; });
  }

  /* ------------------------------------------------------------- permission */

  function roleInfo(role) {
    return ROLES[role] || ROLES.pattern;
  }

  function can(cap) {
    const info = roleInfo(state.role);
    return info.caps.indexOf(cap) !== -1;
  }

  function setRole(role) {
    if (!ROLES[role]) return;
    state.role = role;
    save();
  }

  /* -------------------------------------------------------------- mutations */

  function log(type, title, detail, ref) {
    const info = roleInfo(state.role);
    state.activity.unshift({
      id: "act-" + Date.now(),
      at: today(),
      actor: info.label.split(" — ")[0],
      type: type,
      title: title,
      detail: detail,
      ref: ref || ""
    });
    state.activity = state.activity.slice(0, 120);
  }

  function touch(s) {
    s.updatedAt = today();
    s.updatedBy = roleInfo(state.role).label.split(" — ")[0];
  }

  function updateStyle(id, patch) {
    const s = styleById(id);
    if (!s) return false;
    Object.keys(patch).forEach(function (k) {
      if (k === "pic") {
        s.pic = Object.assign({}, s.pic, patch.pic);
      } else {
        s[k] = patch[k];
      }
    });
    touch(s);
    log("database", "Data style diperbarui", id + " · " + s.brand + " · " + Object.keys(patch).length + " field", id);
    save();
    return true;
  }

  function addRevision(styleId, cat, meta) {
    const s = styleById(styleId);
    if (!s) return null;
    let doc = docOf(s, cat);
    if (!doc) {
      doc = { cat: cat, versions: [], alloc: {} };
      s.docs.push(doc);
      s.docs.sort(function (a, b) { return DOC_CATS.indexOf(a.cat) - DOC_CATS.indexOf(b.cat); });
    }
    const last = latestVersion(doc);
    const nextNum = last ? parseInt(String(last.v).replace(/[^0-9]/g, ""), 10) + 1 : 1;
    const row = {
      v: "V" + nextNum,
      status: "Menunggu verifikasi",
      by: meta.by,
      at: today(),
      size: meta.size || 0,
      reviewer: null,
      note: meta.note || "",
      file: styleId + "_" + CODES[cat] + "_V" + nextNum + "." + (meta.ext || "xlsx")
    };
    doc.versions.push(row);
    touch(s);
    log("dokumen", "Revisi " + cat + " " + row.v + " diunggah", styleId + " · " + row.file + " · menunggu verifikasi", styleId);
    save();
    return row;
  }

  function verifyDoc(styleId, cat, v) {
    const s = styleById(styleId);
    const doc = s && docOf(s, cat);
    if (!doc) return false;
    const row = doc.versions.find(function (x) { return x.v === v; });
    if (!row) return false;
    row.status = "Terverifikasi";
    row.reviewer = roleInfo(state.role).label.split(" — ")[0];
    touch(s);
    log("dokumen", cat + " " + v + " diverifikasi", styleId + " · oleh " + row.reviewer, styleId);
    save();
    return true;
  }

  function returnDoc(styleId, cat, v, note) {
    const s = styleById(styleId);
    const doc = s && docOf(s, cat);
    if (!doc) return false;
    const row = doc.versions.find(function (x) { return x.v === v; });
    if (!row) return false;
    row.status = "Perlu revisi";
    row.note = note || "Dikembalikan untuk revisi";
    touch(s);
    log("dokumen", cat + " " + v + " dikembalikan untuk revisi", styleId + " · " + row.note, styleId);
    save();
    return true;
  }

  function allocate(styleId, cat, dept) {
    const s = styleById(styleId);
    const doc = s && docOf(s, cat);
    if (!doc) return { ok: false, message: "Dokumen belum tersedia." };
    const reviewed = reviewedVersion(doc);
    if (!reviewed) return { ok: false, message: "Belum ada versi terverifikasi untuk dialokasikan." };
    doc.alloc[dept] = reviewed.v;
    touch(s);
    log("alokasi", "Alokasi dokumen diubah", styleId + " · " + cat + " " + reviewed.v + " · " + dept + " ditambahkan", styleId);
    save();
    return { ok: true, version: reviewed.v };
  }

  function deallocate(styleId, cat, dept) {
    const s = styleById(styleId);
    const doc = s && docOf(s, cat);
    if (!doc || !doc.alloc[dept]) return false;
    const previous = doc.alloc[dept];
    delete doc.alloc[dept];
    touch(s);
    log("alokasi", "Alokasi dokumen dicabut", styleId + " · " + cat + " " + previous + " · " + dept, styleId);
    save();
    return true;
  }

  function moveAllocation(styleId, cat) {
    const s = styleById(styleId);
    const doc = s && docOf(s, cat);
    if (!doc) return { ok: false, message: "Dokumen tidak ditemukan." };
    const reviewed = reviewedVersion(doc);
    if (!reviewed) return { ok: false, message: "Versi terbaru belum diverifikasi, alokasi tidak dipindahkan." };
    const moved = [];
    Object.keys(doc.alloc).forEach(function (dept) {
      if (doc.alloc[dept] !== reviewed.v) {
        doc.alloc[dept] = reviewed.v;
        moved.push(dept);
      }
    });
    if (!moved.length) return { ok: false, message: "Semua alokasi sudah memakai " + reviewed.v + "." };
    touch(s);
    log("alokasi", "Alokasi dipindahkan ke " + reviewed.v, styleId + " · " + cat + " · " + moved.join(", "), styleId);
    save();
    return { ok: true, version: reviewed.v, departments: moved };
  }

  function createDraft(styleId, side, note) {
    const s = styleById(styleId);
    if (!s) return null;
    const list = s.pubs[side] || (s.pubs[side] = []);
    const nums = list.map(function (p) { return parseInt(String(p.v).replace(/[^0-9]/g, ""), 10) || 0; });
    const next = "V" + ((nums.length ? Math.max.apply(null, nums) : 0) + 1);
    const row = {
      v: next,
      status: "Draft",
      file: side + "_" + styleId + "_" + next + ".pdf",
      by: roleInfo(state.role).label.split(" — ")[0],
      at: today(),
      note: note || ""
    };
    list.push(row);
    touch(s);
    log("publikasi", side + " " + next + " disimpan sebagai draft", styleId + (note ? " · " + note : ""), styleId);
    save();
    return row;
  }

  function publish(styleId, side) {
    const s = styleById(styleId);
    if (!s) return { ok: false, message: "Style tidak ditemukan." };
    const draft = latestDraft(s, side);
    if (!draft) return { ok: false, message: "Tidak ada draft " + side + " untuk diterbitkan." };
    draft.status = "Terbit";
    draft.by = roleInfo(state.role).label.split(" — ")[0];
    draft.at = today();
    touch(s);
    log("publikasi", side + " " + draft.v + " diterbitkan", styleId + " · " + draft.file, styleId);
    save();
    return { ok: true, version: draft.v };
  }

  function setSampleEvidence(styleId, evidence, note) {
    const s = styleById(styleId);
    if (!s) return false;
    s.sampleEvidence = !!evidence;
    if (note) s.notes = note;
    touch(s);
    log("dokumen", "Bukti sample request " + (evidence ? "dilampirkan" : "dicabut"), styleId, styleId);
    save();
    return true;
  }

  /* --------------------------------------------------------------- import */

  const IMPORT_FIELDS = [
    { key: "id", label: "Style number", required: true },
    { key: "buyer", label: "Buyer", required: true },
    { key: "brand", label: "Brand" },
    { key: "desc", label: "Deskripsi style" },
    { key: "group", label: "Product group" },
    { key: "week", label: "Minggu sumber" },
    { key: "dev", label: "Status development" },
    { key: "prod", label: "Status produksi" },
    { key: "sample", label: "Status Sample Request" },
    { key: "mc", label: "MC / rasio" },
    { key: "picPattern", label: "PIC Pattern Maker" },
    { key: "picMdmkt", label: "Owner MD-MKT" },
    { key: "picIe", label: "PIC IE-Technical" },
    { key: "picProd", label: "PIC Production" }
  ];

  const HEADER_HINTS = {
    id: ["style", "style no", "style number", "style no.", "styleno"],
    buyer: ["buyer"],
    brand: ["brand"],
    desc: ["description", "deskripsi", "description style"],
    group: ["product group", "product", "group"],
    week: ["week", "minggu", "wk"],
    dev: ["dev status", "development", "dev"],
    prod: ["prod status", "production", "prod"],
    sample: ["sample request", "sample"],
    mc: ["mc", "ratio", "mc / ratio", "mc ratio"],
    picPattern: ["pic pattern", "pattern"],
    picMdmkt: ["pic mdmkt", "mdmkt", "md-mkt", "owner md-mkt"],
    picIe: ["pic ie", "ie-tech", "ie technical"],
    picProd: ["pic prod", "pic production", "production pic"]
  };

  function detectDelimiter(text) {
    const firstLine = text.split(/\r?\n/)[0] || "";
    const counts = { ",": 0, ";": 0, "\t": 0 };
    for (let i = 0; i < firstLine.length; i += 1) {
      if (counts[firstLine[i]] !== undefined) counts[firstLine[i]] += 1;
    }
    let best = ",";
    let bestCount = -1;
    Object.keys(counts).forEach(function (k) {
      if (counts[k] > bestCount) { best = k; bestCount = counts[k]; }
    });
    return bestCount > 0 ? best : ",";
  }

  function parseDelimited(text) {
    const clean = text.replace(/^\uFEFF/, "");
    const delimiter = detectDelimiter(clean);
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    for (let i = 0; i < clean.length; i += 1) {
      const ch = clean[i];
      if (quoted) {
        if (ch === '"') {
          if (clean[i + 1] === '"') { field += '"'; i += 1; }
          else { quoted = false; }
        } else { field += ch; }
      } else if (ch === '"') {
        quoted = true;
      } else if (ch === delimiter) {
        row.push(field); field = "";
      } else if (ch === "\n") {
        row.push(field); field = ""; rows.push(row); row = [];
      } else if (ch === "\r") {
        /* skip */
      } else {
        field += ch;
      }
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return String(c).trim() !== ""; }); });
  }

  function autoMap(headers) {
    const map = {};
    headers.forEach(function (h, idx) {
      const norm = String(h).trim().toLowerCase();
      let match = "";
      IMPORT_FIELDS.forEach(function (f) {
        const hints = HEADER_HINTS[f.key] || [];
        if (norm === f.label.toLowerCase() || hints.indexOf(norm) !== -1) match = f.key;
      });
      map[idx] = match;
    });
    return map;
  }

  function buildImport(text) {
    const rows = parseDelimited(text);
    if (!rows.length) return { error: "Berkas tidak berisi baris yang bisa dibaca." };
    const headers = rows[0].map(function (h) { return String(h).trim(); });
    const body = rows.slice(1);
    const mapping = autoMap(headers);
    return {
      headers: headers,
      body: body,
      mapping: mapping,
      totalRows: body.length,
      blankRule: "keep",
      decisions: {}
    };
  }

  function toNumber(value) {
    return Number(String(value == null ? "" : value).trim().replace(",", "."));
  }

  function normaliseRow(headers, mapping, cells) {
    const out = { pic: {} };
    Object.keys(mapping).forEach(function (idx) {
      const key = mapping[idx];
      if (!key) return;
      const value = String(cells[idx] == null ? "" : cells[idx]).trim();
      if (["picPattern", "picMdmkt", "picIe", "picProd"].indexOf(key) !== -1) {
        out.pic[key.replace("pic", "").toLowerCase()] = value || null;
      } else {
        out[key] = value;
      }
    });
    return out;
  }

  function reconcile(imp) {
    const seen = {};
    const results = imp.body.map(function (cells, rowIndex) {
      const raw = normaliseRow(imp.headers, imp.mapping, cells);
      const issues = [];
      const id = (raw.id || "").trim();

      if (!id) {
        return { rowIndex: rowIndex, id: "", group: "invalid", reasons: ["Style number kosong"], raw: raw };
      }
      if (Object.prototype.hasOwnProperty.call(seen, id)) {
        return { rowIndex: rowIndex, id: id, group: "duplikat", reasons: ["Muncul juga di baris " + (seen[id] + 2)], raw: raw };
      }
      seen[id] = rowIndex;

      if (raw.dev && DEV_STATES.indexOf(raw.dev) === -1) {
        issues.push("Status development \"" + raw.dev + "\" bukan pilihan yang dikenal");
      }
      if (raw.prod && PROD_STATES.indexOf(raw.prod) === -1) {
        issues.push("Status produksi \"" + raw.prod + "\" bukan pilihan yang dikenal");
      }
      if (raw.sample && SAMPLE_STATES.indexOf(raw.sample) === -1) {
        issues.push("Status sample \"" + raw.sample + "\" bukan pilihan yang dikenal");
      }
      if (raw.mc && !(toNumber(raw.mc) >= 0.5 && toNumber(raw.mc) <= 4)) {
        issues.push("MC / rasio \"" + raw.mc + "\" di luar rentang 0,5–4,0");
      }
      if (issues.length) {
        return { rowIndex: rowIndex, id: id, group: "invalid", reasons: issues, raw: raw };
      }

      const existing = styleById(id);
      if (!existing) {
        return { rowIndex: rowIndex, id: id, group: "baru", reasons: [], raw: raw, existing: null };
      }

      const mapping2 = {
        buyer: existing.buyer,
        brand: existing.brand,
        desc: existing.desc,
        group: existing.group,
        week: existing.week,
        dev: existing.dev,
        prod: existing.prod,
        sample: existing.sample,
        mc: existing.mc,
        picPattern: existing.pic.pattern || "",
        picMdmkt: existing.pic.mdmkt || "",
        picIe: existing.pic.ie || "",
        picProd: existing.pic.prod || ""
      };

      const changes = [];
      Object.keys(mapping2).forEach(function (key) {
        let incoming = raw[key];
        if (incoming === undefined) return;
        const blank = incoming === "" || incoming === null;
        if (blank) {
          if (imp.blankRule === "clear" && String(mapping2[key] || "") !== "") {
            changes.push({ key: key, from: String(mapping2[key] || ""), to: "", blank: true });
          }
          return;
        }
        if (key === "mc") {
          if (toNumber(incoming) !== toNumber(mapping2[key])) {
            changes.push({ key: key, from: String(mapping2[key]), to: String(incoming) });
          }
          return;
        }
        if (String(incoming) !== String(mapping2[key] || "")) {
          changes.push({ key: key, from: String(mapping2[key] || ""), to: String(incoming) });
        }
      });

      return {
        rowIndex: rowIndex,
        id: id,
        group: changes.length ? "konflik" : "tetap",
        reasons: [],
        changes: changes,
        raw: raw,
        existing: existing
      };
    });

    const counts = { baru: 0, tetap: 0, konflik: 0, invalid: 0, duplikat: 0 };
    results.forEach(function (r) { counts[r.group] += 1; });

    return { rows: results, counts: counts };
  }

  function commitImport(imp, rec, sourceLabel, fileName) {
    let created = 0;
    let updatedFields = 0;
    const touchedStyles = {};
    const skipped = [];

    rec.rows.forEach(function (row) {
      if (row.group === "invalid" || row.group === "duplikat") { skipped.push(row); return; }
      if (row.group === "baru") {
        const raw = row.raw;
        const fresh = style({
          id: row.id,
          buyer: raw.buyer || "—",
          brand: raw.brand || raw.buyer || "—",
          desc: raw.desc || "",
          group: raw.group || "",
          week: raw.week || "",
          dev: raw.dev || "In Development",
          prod: raw.prod || "Belum produksi",
          sample: raw.sample || "Diminta",
          sampleEvidence: false,
          mc: raw.mc ? toNumber(raw.mc) : 2,
          pic: { pattern: raw.pic && raw.pic.pattern, mdmkt: raw.pic && raw.pic.mdmkt, ie: raw.pic && raw.pic.ie, prod: raw.pic && raw.pic.prod, qa: null },
          updatedAt: today(),
          updatedBy: roleInfo(state.role).label.split(" — ")[0]
        });
        state.styles.push(fresh);
        created += 1;
        touchedStyles[row.id] = true;
        return;
      }
      if (row.group === "konflik") {
        const decision = imp.decisions[row.rowIndex] || "db";
        if (decision === "db") return;
        const target = styleById(row.id);
        if (!target) return;
        row.changes.forEach(function (change) {
          if (change.key.indexOf("pic") === 0) {
            target.pic[change.key.replace("pic", "").toLowerCase()] = change.to || null;
          } else if (change.key === "mc") {
            target.mc = toNumber(change.to) || target.mc;
          } else {
            target[change.key] = change.to;
          }
          updatedFields += 1;
        });
        touch(target);
        touchedStyles[row.id] = true;
      }
    });

    const batch = {
      id: "IMP-" + new Date().getFullYear() + "-" + String(state.batches.length + 11).padStart(3, "0"),
      at: today(),
      by: roleInfo(state.role).label.split(" — ")[0],
      source: sourceLabel || fileName || "Berkas impor",
      rows: rec.rows.length,
      created: created,
      updated: updatedFields,
      excluded: skipped.length
    };
    state.batches.unshift(batch);
    log(
      "impor",
      "Impor " + batch.id + " dijalankan",
      batch.rows + " baris · " + created + " style baru · " + updatedFields + " field diperbarui · " + skipped.length + " dikecualikan",
      batch.id
    );
    save();
    return { batch: batch, created: created, updatedFields: updatedFields, skipped: skipped.length };
  }

  function importSampleCsv() {
    /* Pemisah titik-koma, desimal memakai koma — sama seperti berkas Excel lokal. */
    const header = [
      "STYLE NO", "BUYER", "BRAND", "DESCRIPTION", "PRODUCT GROUP", "WEEK",
      "DEV STATUS", "PROD STATUS", "SAMPLE REQUEST", "MC RATIO",
      "PIC PATTERN", "PIC MDMKT", "PIC IE", "PIC PROD"
    ].join(";");
    const rows = [
      ["10345161", "VS", "Victoria's Secret", "Wireless Lightly Lined Bra", "Women's Wear", "WK 43", "In Trial", "Belum produksi", "Menunggu konfirmasi", "1,8", "D. Prasetyo", "A. Wulandari", "F. Ramadhan", ""],
      ["10767R", "SPANX", "SPANX", "Seamless shaping brief", "Shapewear", "WK 43", "In Trial", "Belum produksi", "Diminta", "2,2", "A. Wulandari", "F. Ramadhan", "M. Hidayat", ""],
      ["WC-88214", "WACOAL", "Wacoal", "Everyday comfort bra", "Intimate Wear", "WK 41", "Dev selesai", "Pernah produksi", "Selesai", "2,4", "R. Santoso", "N. Kusuma", "F. Ramadhan", "S. Halim"],
      ["AD-44082", "ADIDAS", "Adidas", "Performance training top", "Sports & Activewear", "WK 41", "Ditahan", "Belum produksi", "Diminta", "3,9", "M. Hidayat", "N. Kusuma", "F. Ramadhan", ""],
      ["VS-26104", "VS", "Victoria's Secret", "Lace trim bralette", "Women's Wear", "WK 43", "In Development", "Belum produksi", "Diminta", "2,1", "D. Prasetyo", "A. Wulandari", "F. Ramadhan", ""],
      ["SP-9142", "SPANX", "SPANX", "Everyday shaping brief", "Shapewear", "WK 43", "In Trial", "Belum produksi", "Menunggu konfirmasi", "2,0", "A. Wulandari", "F. Ramadhan", "M. Hidayat", ""],
      ["", "VS", "Victoria's Secret", "Baris tanpa nomor style", "Women's Wear", "WK 43", "In Development", "Belum produksi", "Diminta", "2,0", "", "", "", ""],
      ["WC-88410", "WACOAL", "Wacoal", "Soft cup everyday bra", "Intimate Wear", "WK 43", "In Development", "Belum produksi", "Diminta", "1:12", "", "N. Kusuma", "", ""],
      ["10345161", "VS", "Victoria's Secret", "Wireless Lightly Lined Bra", "Women's Wear", "WK 43", "In Trial", "Belum produksi", "Menunggu konfirmasi", "1,8", "D. Prasetyo", "A. Wulandari", "F. Ramadhan", ""]
    ];
    return [header].concat(rows.map(function (row) { return row.join(";"); })).join("\n");
  }

  /* ------------------------------------------------------------------ export */

  function exportCsv(rows) {
    const header = ["Style", "Buyer", "Brand", "Deskripsi", "Product group", "Minggu", "Development", "Produksi", "Sample request", "MC rasio", "PIC Pattern", "MD-MKT", "IE-Technical", "Production", "Dokumen terverifikasi"];
    const lines = [header].concat(rows.map(function (s) {
      const p = docProgress(s);
      return [s.id, s.buyer, s.brand, s.desc, s.group, s.week, s.dev, s.prod, s.sample, s.mc, s.pic.pattern || "", s.pic.mdmkt || "", s.pic.ie || "", s.pic.prod || "", p.ok + "/" + p.total];
    }));
    return lines.map(function (line) {
      return line.map(function (cell) {
        return '"' + String(cell == null ? "" : cell).replace(/"/g, '""') + '"';
      }).join(",");
    }).join("\r\n");
  }

  /* ------------------------------------------------------------------- public */

  window.BRA = {
    STORE_KEY: STORE_KEY,
    DEPTS: DEPTS,
    DOC_CATS: DOC_CATS,
    DEV_STATES: DEV_STATES,
    PROD_STATES: PROD_STATES,
    SAMPLE_STATES: SAMPLE_STATES,
    ROLES: ROLES,
    IMPORT_FIELDS: IMPORT_FIELDS,
    load: load,
    save: save,
    reset: reset,
    get: get,
    fmtDate: fmtDate,
    today: today,
    styleById: styleById,
    docOf: docOf,
    latestVersion: latestVersion,
    reviewedVersion: reviewedVersion,
    docState: docState,
    docProgress: docProgress,
    completeness: completeness,
    latestPublished: latestPublished,
    latestDraft: latestDraft,
    buildIssues: buildIssues,
    issuesForStyle: issuesForStyle,
    issuesForDept: issuesForDept,
    picFor: picFor,
    roleInfo: roleInfo,
    can: can,
    setRole: setRole,
    updateStyle: updateStyle,
    addRevision: addRevision,
    verifyDoc: verifyDoc,
    returnDoc: returnDoc,
    allocate: allocate,
    deallocate: deallocate,
    moveAllocation: moveAllocation,
    createDraft: createDraft,
    publish: publish,
    setSampleEvidence: setSampleEvidence,
    buildImport: buildImport,
    reconcile: reconcile,
    commitImport: commitImport,
    importSampleCsv: importSampleCsv,
    exportCsv: exportCsv,
    log: log,
    touch: touch
  };
})();
