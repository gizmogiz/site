# How to keep this site updated

Content lives in **`content/site.json`**. The page loads that file at runtime — no build step.

## Add a new article

1. Open `content/site.json`.
2. Find the right group under `"writing"` (or add a new `category`).
3. Prepend a new item (newest first):

```json
{
  "title": "Your title",
  "href": "https://x.com/gizmothegizzer/status/…",
  "date": "Nov 2026",
  "blurb": "One-line summary.",
  "lang": "zh"
}
```

Omit `"lang"` for English. Use `"lang": "zh"` for Chinese pieces.

4. Bump `"meta.updated"` to today’s date.
5. Commit and push to `main` (or open a PR). GitHub Pages will pick it up.

## Update projects / map / defaults

Same file:

- `projects` — ventures (array)
- `climbing` / `travel` — atlas pins (`name`, `lat`, `lng`, optional `sub` / `note`)
- `defaults` — Alternate Defaults lines
- `social` — footer / nav links

## Ask an agent to refresh writing

In Cursor, you can say:

> Pull my latest X articles into `content/site.json` and update the site.

Keep blurbs short (one sentence). Prefer newest-first within each category.

## Local preview

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8080/`.
