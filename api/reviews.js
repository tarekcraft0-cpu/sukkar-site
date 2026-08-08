const GIST_ID = process.env.GIST_ID || "c1b1c931bf00b05105c71ad00ee6833a";
const FILE_NAME = "reviews-data.json";
const MAX_NAME = 40;
const MAX_TEXT = 280;
const MAX_REVIEWS = 200;

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(res, status, body) {
  cors(res);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function clean(value, max) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

async function readReviews() {
  const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "sukkar-site",
    },
  });

  if (!response.ok) {
    throw new Error("تعذر قراءة الآراء");
  }

  const gist = await response.json();
  const content = String(gist.files?.[FILE_NAME]?.content || "[]")
    .replace(/^\uFEFF/, "")
    .trim();
  const parsed = JSON.parse(content || "[]");
  return Array.isArray(parsed) ? parsed : [];
}

async function writeReviews(reviews) {
  const token = process.env.REVIEWS_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("التخزين غير مهيأ");
  }

  const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: "PATCH",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "sukkar-site",
    },
    body: JSON.stringify({
      files: {
        [FILE_NAME]: {
          content: JSON.stringify(reviews, null, 2),
        },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`تعذر حفظ الرأي (${response.status})`);
  }
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    cors(res);
    res.statusCode = 204;
    return res.end();
  }

  try {
    if (req.method === "GET") {
      const reviews = await readReviews();
      return json(res, 200, { reviews });
    }

    if (req.method === "POST") {
      const body =
        typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

      if (body.website) {
        return json(res, 200, { ok: true });
      }

      const name = clean(body.name, MAX_NAME);
      const text = clean(body.text, MAX_TEXT);

      if (name.length < 2 || text.length < 3) {
        return json(res, 400, { error: "اكتب اسمك ورأيك بشكل صحيح" });
      }

      const reviews = await readReviews();
      const review = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        text,
        createdAt: new Date().toISOString(),
      };

      const next = [review, ...reviews].slice(0, MAX_REVIEWS);
      await writeReviews(next);
      return json(res, 201, { review, reviews: next });
    }

    return json(res, 405, { error: "Method not allowed" });
  } catch (error) {
    return json(res, 500, { error: error.message || "حصل خطأ" });
  }
};
