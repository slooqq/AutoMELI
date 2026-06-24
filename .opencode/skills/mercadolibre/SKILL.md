---
name: mercadolibre
description: Use for MercadoLibre API integration, OAuth PKCE flow, token management, webhook notifications, messaging automation, competitor tracking, and A/B testing. Use ONLY when working with the MercadoLibre API. Do NOT use for general NestJS or Railway work.
---

# MercadoLibre Skill

## OAuth PKCE Flow (`src/modules/auth/`)

The app uses **PKCE** (Proof Key for Code Exchange) for MercadoLibre OAuth.

1. **GET /auth/login** — generates auth URL with PKCE challenge and redirects user
2. User authorizes on MercadoLibre
3. **GET /auth/callback?code=XXXX** — MercadoLibre redirects here; the code is exchanged for tokens
4. Tokens are stored in SQLite (dev) or PostgreSQL (production) via `Token` entity

**OAuth URLs:**
- Authorization: `https://auth.mercadolibre.com.ec/authorization`
- Token: `https://api.mercadolibre.com/oauth/token`

**Env vars:**
- `MELI_APP_ID` — App ID from developers.mercadolibre.com
- `MELI_SECRET_KEY` — Secret Key
- `MELI_REDIRECT_URI` — Must match exactly in Meli dev portal

**Token refresh is automatic** — `AuthService.getValidToken()` checks expiry and refreshes if needed.

## Messaging Automation (`src/modules/messaging/`)

- `GET /messaging/templates` — list auto-response templates
- `POST /messaging/templates` — create template `{ keyword, response }`
- `DELETE /messaging/templates/:id` — delete template
- Templates are matched by keyword against incoming buyer messages
- Auto-replies are sent via `POST /messages/packs/:packId/sellers/:sellerId?tag=post_sale`

## Webhooks (`src/modules/webhook/`)

- `POST /webhook/notifications` — receives Meli notifications
- Currently handles `topic === 'messages'` → delegates to `MessagingService.processNotification()`
- Returns `{ received: true }` immediately, processes async

## Competitor Tracking (`src/modules/tracker/`)

- `TrackerService.trackCompetitors()` — Cron job running every 6 hours
- Tracks items via `CompetitorItem` entity, stores price snapshots in `CompetitorSnapshot`
- TODO: query Meli API for each tracked ITEM_ID

## A/B Testing (`src/modules/ab-testing/`)

- `AbTestingService.rotateVariants()` — Cron job running daily at midnight
- Manages `TestVariant` and `TestResult` entities
- TODO: rotate titles/images for active tests

## Meli API Endpoints Used

| Purpose | Endpoint |
|---|---|
| OAuth token | `POST https://api.mercadolibre.com/oauth/token` |
| Get messages | `GET https://api.mercadolibre.com{resource}` (from webhook) |
| Reply to buyer | `POST https://api.mercadolibre.com/messages/packs/{packId}/sellers/{sellerId}?tag=post_sale` |

## Important Notes

- MercadoLibre expects fast 200 response on webhooks — always process async
- The Meli auth domain for Ecuador is `auth.mercadolibre.com.ec` — adjust for other countries
- Token refresh uses `grant_type=refresh_token`
