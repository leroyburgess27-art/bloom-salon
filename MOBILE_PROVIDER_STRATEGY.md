# Mobile Provider App — Strategy & Feature Spec

**Working name:** TBD (e.g. "Bloom for Pros" / a standalone brand)
**Prepared by:** Claude (Senior BA) for Jake
**Date:** 23 June 2026
**Status:** Strategy draft v0.1 — for discussion, not yet build-ready

---

## 1. The idea in one line

A low, **flat monthly fee** app that gives independent mobile beauty providers — hairdressers,
barbers, nail techs — the same professional tooling a salon gets (booking, scheduling,
reminders, payments, client management) **plus a trust-rich public profile**, so they keep
**100% of their earnings** and **own their client relationships**. Empowering, not extractive.

## 2. Positioning — why this wins

| | Home Salon | Fresha | **Us** |
| --- | --- | --- | --- |
| Model | ~20% deposit kept as platform fee | Subscription **+ 20% on new marketplace clients** + 2–3% card fees | **Flat monthly fee, 0% commission** |
| Provider keeps | 80% | <100% (cut on new clients) | **100%** |
| Owns client list | No (platform owns it) | Partially (marketplace clients are Fresha's) | **Yes — fully theirs** |
| Comms/admin | Manual (WhatsApp) | Built-in | Built-in |
| Trust/profile | Basic listing | Reviews + portfolio | **Profile + reviews + returning-clients + verification ladder** |

**The wedge:** Fresha proves providers will pay monthly for these tools, but it (and Home Salon)
still skim a cut and keep the customer relationship. In a high-unemployment SA context, taking
20% of an independent's new clients is exactly the extraction we refuse. Our promise is simple
and honest: *pay a small flat fee, keep everything you earn, and your clients are yours.*

## 3. Target user

Independent, mobile providers who **already have some clients / word of mouth** and are tired of
running everything on WhatsApp and cash. NOT primarily people with zero clients hoping to be
discovered (see §8 on discovery). Services: hair, barbering, nails (extensible to brows, lashes,
makeup later).

## 4. Business model

- **Flat monthly subscription.** No per-booking commission, ever. (Final pricing TBD — anchored
  by Booklink's R0/R79; an individual tier should be very low given near-zero cost to serve,
  e.g. a free starter + a low paid tier ~R49–R99/mo. Numbers to validate, not fixed.)
- **Free tier** to get providers in the door (limited bookings/features); **paid tier** unlocks
  reminders, payments, marketing-to-clients, and the Verified badge path.
- **Two account types, one backend:**
  - **Individual** — a "business of one"; profile-centric; cheapest tier.
  - **Business** (Bloom) — multi-staff salon; higher tier; more resources/roles.
- Messaging costs (WhatsApp) and card-processing fees are pass-through / only incurred when used —
  never a hidden skim. This keeps the model honest even as we scale.

## 5. The trust layer — the real differentiator

For mobile/at-home work, **trust is the deciding factor** (a stranger in your home, or you in
theirs). The profile is what clients choose on. Components:

1. **Clear photo** of the provider — required for a "complete" profile.
2. **Star rating (out of 5)** — only from clients who actually completed a booking (earned, not
   open to anyone — kills most fake reviews).
3. **Returning-customer count / rebooking rate** — the strongest, least-fakeable signal, and we
   already have the data (clients with 2+ completed bookings). Feature it prominently
   ("120 returning clients", "84% rebook").
4. **Certifications** — provider uploads proof; we display "Certified: [skill]".
5. **Verified tick** — an aspirational status (see §6), not a binary. The goal providers climb toward.
6. **Portfolio** (phase 2) — a few photos of their work.

## 6. The Verification ladder (and the ID/POPIA caution)

Make "Verified" achievable **without us storing sensitive documents**:

- **Profile Verified** (everyday badge) — real photo + N completed bookings + a reviewed
  certification. No ID required. This is the badge most providers earn.
- **ID Verified** (higher tier, later) — ⚠️ **Legal flag:** storing copies of IDs in South Africa
  falls under **POPIA**. It's permissible with explicit consent and a clear purpose, but it
  creates real obligations (consent, encryption, minimal retention, breach liability). **Best
  practice — and cheaper — is to NOT store IDs ourselves**: use a third-party identity/KYC
  provider (some verify against Home Affairs) that returns only a pass/fail token. We display the
  badge; we never hold the raw ID.
- **Action:** confirm POPIA specifics with a professional before collecting any IDs. The design
  answer regardless: outsource the ID check, store only the result. *(This is not legal advice.)*

## 7. Feature scope for a "business of one"

Reuse from Bloom, keep lean:

**Keep:** own services + prices, availability/calendar, the slot engine, **reminders** (vital for
solo operators with no front desk), payments, and the **client list + rebooking/marketing** (the
feature that stops them losing clients to a platform).

**Add (individual-specific):**
- **Public profile** with all the trust signals above + a shareable booking link.
- **Mobile flow** (the piece we deferred on Bloom): service area, travel-time buffers between
  jobs, client address capture, geo-lock. For individuals this is the core, not an add-on.
- **Deposit-to-secure-the-slot** — mirrors Home Salon's deposit, except the provider keeps it
  (we only charge the flat monthly). Strong no-show protection.

**Drop (for solo):** multi-staff, resource columns, complex role permissions — those belong to
the business (Bloom) tier.

## 8. Discovery strategy — avoid the marketplace trap

The biggest risk is implicitly promising to be a *demand engine* when v1 is a *tools + presence*
product. Fresha/Home Salon's commissions fund discovery; a flat fee does not.

- **Phase 1:** each provider gets a **shareable profile/booking page** (think professional
  Linktree). They bring their existing clients; the profile makes them look top-tier and lets
  clients book + pay a deposit. No cold-start problem.
- **Phase 2 (once provider density exists in an area):** a **browsable directory** with
  filter-by-Verified / rating / location. This is where profiles compound into discovery — but we
  don't gate launch on it, and we never tax the booking.

## 9. Architecture — Bloom is the framework

We already built multi-tenant (`business_id` on every table). An individual is simply a
**business of one** (one "business" whose single stylist is themselves). Most of the backend
already fits. Additions:

- `account_type` on businesses: `'individual' | 'business'`.
- **provider_profiles** — display name, headline, photo_url, bio, slug (for the public link),
  service categories, verification_level (`none|profile|id`), location/area.
- **reviews** — booking_id (one review per completed booking), client_id, rating (1–5), comment,
  created_at. Rating aggregates roll up to the profile.
- **certifications** — provider_id, title, issuer, proof_url, status (`pending|approved`).
- **service_areas** + travel fields — already in the schema; now first-class for individuals.
- Returning-customer metric — derived (no new table): distinct clients with ≥2 completed bookings.

Two product surfaces, one backend and one provider directory: the individual's public profile/
booking page, and Bloom's salon storefront. Same engine, different plans and limits.

## 10. What we adopt vs reject from Fresha

**Adopt:** clean scheduling, automated reminders (done), client management, simple reporting,
deposit/no-show protection, polished booking UX. Their AI "intelligent scheduling" is a nice
long-term north star — overkill now.

**Reject:** the 20% new-client commission and marketplace lock-in. That is precisely the part we
beat. Their marketplace does prove discovery has value — we'll offer it later **without the tax**.

## 11. Phased roadmap

1. **Discovery** — interview the real mobile-hairdresser test user (see `TEST_USER_DISCOVERY.md`).
2. **Profile + booking page** on the Bloom framework: provider profile, services, shareable link,
   public booking with deposit. (Reuses the booking engine.)
3. **Mobile flow** — service area, travel buffers, address capture, geo-lock.
4. **Trust signals** — reviews (post-completion), returning-customer metric, certifications.
5. **Verification ladder** — Profile Verified first; ID Verified via a KYC provider later.
6. **Onboard the test user for real**, iterate on their feedback.
7. **Directory / discovery** (Phase 2) once there's provider density.

## 12. Risks & open questions

- **Demand vs tools** — we sell efficiency + presence, not (initially) customers. Messaging must
  be honest to avoid churn from providers expecting leads.
- **Pricing** — individual-tier numbers to validate with the test user (willingness to pay).
- **POPIA / ID verification** — confirm legal path before any ID handling; prefer outsourced KYC.
- **Review integrity** — earned-only reviews; watch for retaliation/abuse; consider provider
  right-of-reply.
- **Trust cold-start** — new providers have no reviews/returning clients yet; the "Profile
  Verified" badge + certifications help them start credibly.
- **Mobile safety** — for at-home work, consider basic safety features later (shared location,
  in-app contact) for both client and provider.

---

*Living document. The mission stays fixed: don't be extractive, be empowering.*
