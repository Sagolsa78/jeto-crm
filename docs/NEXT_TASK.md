# Jeto Vacations CRM — Next Sprint Task

## Active Sprint: Proposal & Quotation Engine

### Objective
Extend the Jeto CRM system from lead management into custom travel proposal generation, connecting directly with client-facing proposal URLs and quote PDFs.

### Next Tasks in Priority Order
1. **Proposal Schema & Database Models**:
   - Create `proposals`, `proposal_itineraries`, `proposal_items` (flights, hotels, activities, transfers) tables.
   - Support multiple options (e.g. Option A: 4-star superior vs Option B: 5-star luxury).
2. **Consultant Proposal Builder UI**:
   - Interactive proposal editor on `/app/leads/[id]/proposals/new`.
   - Day-by-day itinerary builder pulling from package catalogue or custom text.
   - Pricing breakdown with margin calculation (net supplier cost + markup = client price).
3. **Public Proposal View Bridge**:
   - Connect generated proposal IDs with the public website's tokenized route (`jet-web/src/app/proposal/[id]`).
   - Secure customer acceptance / rejection flow with digital signature or deposit confirmation.
4. **Export & Sharing**:
   - Generate shareable WhatsApp message with tokenized proposal link.
   - PDF quotation generation for offline client presentation.
