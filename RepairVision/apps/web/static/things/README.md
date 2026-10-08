# Things chat widget (vendored)

These files are copied from [Rothenhall/Things](https://github.com/Rothenhall/Things)
(MIT License, Copyright (c) 2026 Rothenhall; see `LICENSE-things.txt`), commit
`141680e6cd53d74562ae75919abdd079958b9f40` (2026-10-06).

| File | What it is | License |
|---|---|---|
| `things-chat.js` | The widget: character launcher and chat panel, in a shadow root | MIT (Things) |
| `things.umd.js` | The 3D character engine | MIT (Things) |
| `three.min.js` | three.js r128, Copyright 2010-2021 Three.js Authors (header inside the file) | MIT |

They are served from `/things/` and started by `src/lib/components/ThingsChat.svelte`,
which also removes the "Powered by Things by Rothenhall" line from the panel.

One change was made to `things-chat.js`, marked with a `RepairVision:` comment:
after each answer it fires a `things:answer` event on `window`, so the page can
open the page an answer is about. The other files are unchanged, and every file
keeps its notices.

Questions go to `POST /api/chat` on this hub (apps/cloudflare/src/routes/chat.ts),
which answers with Gemma from the site's live public data.
