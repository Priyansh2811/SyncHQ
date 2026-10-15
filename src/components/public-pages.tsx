import Link from "next/link";
import { MarketingHeader, Footer } from "@/components/marketing";
const faqs = [
  {
    q: "Can I use SyncHQ for free?",
    a: "Yes. The Free plan includes one workspace with up to 10 active members and 5 channels. You can upgrade when your team needs more room.",
  },
  {
    q: "Can a person join more than one workspace?",
    a: "Yes. Your account can belong to multiple workspaces. Use the workspace switcher in the app to move between them.",
  },
  {
    q: "How does SyncHQ protect team data?",
    a: "Workspace membership is checked on every protected request, and PostgreSQL row-level security scopes tenant data to an authenticated workspace context. Sessions use HTTP-only cookies and stored token hashes.",
  },
  {
    q: "Can guests access private channels?",
    a: "Private channels are visible only to their creator and workspace owners or admins. Guests can participate in public channels.",
  },
  {
    q: "How do paid plans work?",
    a: "SyncHQ uses Stripe Checkout and the Stripe billing portal. Plan changes are confirmed by signed Stripe webhooks, which update the workspace subscription.",
  },
  {
    q: "Can I leave a workspace without deleting its messages?",
    a: "Workspace members can be removed by an owner or admin. Messages remain attached to the workspace and are preserved; workspace data is not silently deleted when limits change.",
  },
];
export function HomePage() {
  return (
    <>
      <MarketingHeader />
      <main>
        <section className="shell home-hero">
          <div>
            <div className="eyebrow">
              Team communication, with room to think
            </div>
            <h1>
              Good work
              <br />
              <span>happens together.</span>
            </h1>
            <p>
              SyncHQ gives your team one clear place to talk through decisions,
              share context and keep work moving.
            </p>
            <div
              style={{
                display: "flex",
                gap: 11,
                flexWrap: "wrap",
                marginTop: 24,
              }}
            >
              <Link className="button" href="/register">
                Start your workspace
              </Link>
              <Link className="button secondary" href="/features">
                See how it works
              </Link>
            </div>
            <div className="hero-note">Free to start · No card required</div>
          </div>
          <div
            className="preview"
            aria-label="Illustration of the SyncHQ workspace layout"
          >
            <div className="preview-bar">
              <i />
              <i />
              <i />
              <span>SyncHQ workspace</span>
            </div>
            <div className="preview-body">
              <div className="preview-side">
                <b>YOUR TEAM</b>
                <div className="prev-row selected"># General</div>
                <div className="prev-row"># Product</div>
                <div className="prev-row"># Design</div>
                <div className="prev-row"># Planning</div>
              </div>
              <div className="preview-main">
                <div className="preview-heading">A place for the work</div>
                <div className="preview-rule" />
                <div className="preview-canvas">
                  <div className="canvas-mark">S</div>
                  <div className="canvas-lines">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
                <div className="preview-input">
                  <span>Share a thought with your team…</span>
                  <b>↗</b>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="home-proof">
          <div className="shell proof-inner">
            <span>Less searching for context.</span>
            <i />
            <span>More time for the work.</span>
            <i />
            <span>One calm place to keep it moving.</span>
          </div>
        </section>
        <section className="shell home-section" id="features">
          <div className="eyebrow">Made for the day-to-day</div>
          <h2>Useful, without getting in the way.</h2>
          <p className="section-intro">
            The essentials for a team to work well together, gathered in one
            dependable place.
          </p>
          <div className="feature-grid">
            <article>
              <span className="feature-number">01</span>
              <h3>Conversations with context</h3>
              <p>
                Keep discussions in channels your team can find again. Edit a
                message when the details change; remove it when it should not
                stay.
              </p>
            </article>
            <article>
              <span className="feature-number">02</span>
              <h3>Workspaces that make sense</h3>
              <p>
                Give each team its own members, channels and settings. Switch
                between the workspaces you belong to without losing your place.
              </p>
            </article>
            <article>
              <span className="feature-number">03</span>
              <h3>Clear roles and boundaries</h3>
              <p>
                Owners, admins, members and guests have distinct permissions.
                Tenant data is checked server-side and scoped again in
                PostgreSQL.
              </p>
            </article>
          </div>
        </section>
        <section className="workflow">
          <div className="shell workflow-inner">
            <div>
              <div className="eyebrow">A simple rhythm</div>
              <h2>
                Find your people.
                <br />
                Find the thread.
              </h2>
              <p>
                Join with an invitation, pick a channel and contribute. Messages
                sync in real time across connected team members.
              </p>
              <Link href="/features" className="text-link">
                Explore the features →
              </Link>
            </div>
            <ol>
              <li>
                <b>01</b>
                <div>
                  <h3>Start a workspace</h3>
                  <p>Create a home for your team in a couple of steps.</p>
                </div>
              </li>
              <li>
                <b>02</b>
                <div>
                  <h3>Bring the right people in</h3>
                  <p>
                    Invite by email and give each teammate a role that fits.
                  </p>
                </div>
              </li>
              <li>
                <b>03</b>
                <div>
                  <h3>Keep work moving</h3>
                  <p>Organize channels around the conversations that matter.</p>
                </div>
              </li>
            </ol>
          </div>
        </section>
        <section className="shell security-section">
          <div className="security-mark" aria-hidden="true">
            ↗
          </div>
          <div>
            <div className="eyebrow">Privacy by design</div>
            <h2>Your team’s space stays yours.</h2>
            <p>
              Membership is checked on each private operation. Database
              row-level security provides a second tenant boundary, and message
              contents never enter audit records.
            </p>
            <Link href="/features" className="text-link">
              Read about the safeguards →
            </Link>
          </div>
        </section>
        <section className="shell home-section pricing-preview">
          <div>
            <div className="eyebrow">Straightforward plans</div>
            <h2>Start small. Grow when you need to.</h2>
            <p className="section-intro">
              A useful free plan, then more room for the way your team works.
            </p>
            <Link className="text-link" href="/pricing">
              Compare plans →
            </Link>
          </div>
          <div className="mini-plans">
            <div>
              <b>Free</b>
              <strong>$0</strong>
              <span>10 members · 5 channels</span>
            </div>
            <div>
              <b>Pro</b>
              <strong>
                $8<span>/user</span>
              </strong>
              <span>100 members · 100 channels</span>
            </div>
            <div>
              <b>Business</b>
              <strong>
                $18<span>/user</span>
              </strong>
              <span>1,000 members · 1,000 channels</span>
            </div>
          </div>
        </section>
        <section className="shell home-faq">
          <div>
            <div className="eyebrow">Good to know</div>
            <h2>A few things teams ask.</h2>
            <Link className="text-link" href="/faq">
              All questions →
            </Link>
          </div>
          <div>
            {faqs.slice(0, 3).map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="final-cta">
          <div className="shell">
            <div className="eyebrow">Bring the team together</div>
            <h2>Make space for better work.</h2>
            <p>Start a workspace for free and see how it feels.</p>
            <Link className="button" href="/register">
              Create your workspace
            </Link>
          </div>
        </section>
      </main>
      <Footer />
      <style>{homeCss}</style>
    </>
  );
}

export function ContentPage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <MarketingHeader />
      <main className="content-page shell">
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p className="content-intro">{description}</p>
        {children}
      </main>
      <Footer />
      <style>{contentCss}</style>
    </>
  );
}
export function FAQContent() {
  return (
    <div className="faq-list">
      {faqs.map((f, i) => (
        <details key={f.q}>
          <summary>
            <span>{String(i + 1).padStart(2, "0")}</span>
            {f.q}
          </summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  );
}
export const faqsForSchema = faqs;

const homeCss = `.home-hero{display:grid;grid-template-columns:1fr 1.08fr;gap:48px;align-items:center;padding-top:82px;padding-bottom:86px}.home-hero h1{font-size:clamp(48px,6vw,76px);letter-spacing:-.065em;line-height:.99;margin:18px 0}.home-hero h1 span{color:var(--accent)}.home-hero p{font-size:18px;line-height:1.65;color:var(--muted);max-width:465px}.hero-note{color:var(--muted);font-size:12px;margin-top:15px}.preview{overflow:hidden;border:1px solid #deded4;border-radius:11px;background:#fff;box-shadow:0 20px 55px #29281814;transform:rotate(.5deg)}.preview-bar{height:42px;border-bottom:1px solid #eee;padding:0 13px;display:flex;align-items:center;gap:5px;color:#888;font-size:11px}.preview-bar i{height:7px;width:7px;border-radius:50%;background:#e0dfd5}.preview-bar span{margin-left:10px}.preview-body{display:grid;grid-template-columns:145px 1fr;min-height:345px}.preview-side{background:#f1f0e9;padding:18px 12px;font-size:10px;color:#85857b}.preview-side b{font-size:9px;letter-spacing:.09em}.prev-row{padding:9px 8px;margin-top:6px;border-radius:5px}.prev-row.selected{background:#e4e2d8;color:#30312b}.preview-main{position:relative;padding:21px 22px}.preview-heading{font-size:16px;font-weight:700}.preview-rule{height:1px;background:#eee;margin:15px -22px}.preview-canvas{position:absolute;left:50%;top:49%;transform:translate(-50%,-50%);display:grid;justify-items:center;gap:13px}.canvas-mark{height:44px;width:44px;display:grid;place-items:center;background:#f6e7e0;color:#bb553d;border-radius:13px;font-size:19px;font-weight:700}.canvas-lines{display:grid;justify-items:center;gap:6px}.canvas-lines i{height:5px;width:130px;border-radius:5px;background:#eeeee8}.canvas-lines i:nth-child(2){width:100px}.canvas-lines i:nth-child(3){width:70px}.preview-input{position:absolute;bottom:17px;left:18px;right:18px;height:41px;border:1px solid #deded6;border-radius:6px;display:flex;align-items:center;justify-content:space-between;padding:0 12px;color:#a1a096;font-size:10px}.preview-input b{height:23px;width:23px;border-radius:4px;background:#bb553d;color:white;display:grid;place-items:center}.home-proof{background:#eeeee7;border-block:1px solid #e6e6de}.proof-inner{min-height:68px;display:flex;align-items:center;justify-content:space-between;gap:20px;color:#636359;font-size:13px}.proof-inner i{height:4px;width:4px;border-radius:50%;background:#bb553d}.home-section{padding-top:100px;padding-bottom:94px}.home-section h2,.workflow h2,.security-section h2,.home-faq h2,.final-cta h2{font-size:clamp(33px,4vw,48px);letter-spacing:-.055em;margin:13px 0}.section-intro{color:var(--muted);line-height:1.65;max-width:540px}.feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:36px;margin-top:50px}.feature-grid article{border-top:1px solid #dcdcd3;padding-top:18px}.feature-number{font-size:12px;color:var(--accent);font-weight:700}.feature-grid h3{font-size:19px;letter-spacing:-.02em;margin:18px 0 9px}.feature-grid p,.workflow p,.security-section p,.home-faq p{color:var(--muted);font-size:14px;line-height:1.7}.workflow{background:#eeeee7;padding:86px 0}.workflow-inner{display:grid;grid-template-columns:.9fr 1.1fr;gap:90px}.workflow-inner>div>p{max-width:400px}.text-link{color:var(--accent);font-size:14px;font-weight:700}.workflow ol{list-style:none;padding:0;margin:0}.workflow li{display:flex;gap:20px;border-top:1px solid #d8d8cf;padding:17px 0}.workflow li>b{font-size:12px;color:var(--accent);padding-top:3px}.workflow li h3{margin:0;font-size:16px}.workflow li p{margin:6px 0 0}.security-section{padding-block:80px;display:grid;grid-template-columns:145px 1fr;gap:24px;align-items:center}.security-mark{height:88px;width:88px;border-radius:50%;border:1px solid #e0ddd2;color:var(--green);display:grid;place-items:center;font-size:38px}.security-section p{max-width:650px}.pricing-preview{border-top:1px solid var(--line);display:grid;grid-template-columns:.8fr 1.2fr;gap:50px;align-items:center}.mini-plans{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.mini-plans>div{display:grid;gap:12px;padding:17px;border:1px solid var(--line);background:#fff;border-radius:6px}.mini-plans strong{font-size:24px;letter-spacing:-.04em}.mini-plans strong span{font-size:11px;color:var(--muted);font-weight:400}.mini-plans span{font-size:11px;color:var(--muted)}.home-faq{border-top:1px solid var(--line);padding-top:70px;display:grid;grid-template-columns:.8fr 1.2fr;gap:50px}.home-faq details,.faq-list details{border-top:1px solid var(--line);padding:16px 0}.home-faq details summary,.faq-list summary{cursor:pointer;font-size:15px;font-weight:650;list-style:none}.home-faq details summary::-webkit-details-marker,.faq-list summary::-webkit-details-marker{display:none}.home-faq details p,.faq-list details p{padding-left:0;margin-bottom:0}.final-cta{background:#dcded4;padding:75px 0;text-align:center}.final-cta p{color:#66675f;margin:0 0 23px}.final-cta .button{margin-top:4px}@media(max-width:850px){.home-hero{grid-template-columns:1fr;gap:42px;padding-top:60px}.home-hero>div:first-child{max-width:650px}.preview{max-width:650px;width:100%;margin:auto}.proof-inner{justify-content:center;flex-wrap:wrap;padding:18px 0}.feature-grid{gap:22px}.workflow-inner{gap:40px}.pricing-preview,.home-faq{grid-template-columns:1fr}.security-section{grid-template-columns:90px 1fr}}@media(max-width:560px){.shell{width:calc(100% - 36px)}.home-hero{padding-top:48px;padding-bottom:56px}.home-hero h1{font-size:49px}.home-hero p{font-size:16px}.preview-body{grid-template-columns:105px 1fr;min-height:290px}.preview-side{padding:15px 7px}.preview-main{padding:18px 13px}.preview-rule{margin-inline:-13px}.preview-input{left:10px;right:10px}.feature-grid{grid-template-columns:1fr;gap:25px;margin-top:30px}.home-section{padding-block:68px}.workflow{padding-block:64px}.workflow-inner{grid-template-columns:1fr;gap:32px}.security-section{padding-block:60px;grid-template-columns:1fr}.security-mark{height:60px;width:60px;font-size:28px}.mini-plans{grid-template-columns:1fr}.proof-inner{gap:12px;font-size:11px}.proof-inner i:last-of-type{display:none}}`;
const contentCss = `.content-page{padding-top:76px;min-height:360px}.content-page h1{font-size:clamp(42px,6vw,64px);letter-spacing:-.06em;margin:14px 0 12px}.content-intro{font-size:18px;line-height:1.6;color:var(--muted);max-width:680px;margin:0 0 42px}.faq-list{max-width:850px}.faq-list summary{display:flex;gap:18px;align-items:center;font-size:17px}.faq-list summary span{font-size:11px;color:var(--accent);min-width:24px}.faq-list details{padding:20px 0}.faq-list details p{max-width:740px;padding-left:42px;color:var(--muted);font-size:14px;line-height:1.75}.feature-detail-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:28px}.feature-detail-grid article{background:white;border:1px solid var(--line);padding:25px;border-radius:7px}.feature-detail-grid h2{font-size:19px;letter-spacing:-.03em;margin:12px 0 8px}.feature-detail-grid p{color:var(--muted);line-height:1.7;font-size:14px}.pricing-page-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.plan-card{background:white;border:1px solid var(--line);border-radius:8px;padding:25px;display:flex;flex-direction:column;min-height:340px}.plan-card.featured{border-color:#bb553d;box-shadow:0 7px 22px #bb553d12}.plan-card h2{font-size:20px;margin:0 0 12px}.plan-price{font-size:36px;font-weight:750;letter-spacing:-.06em}.plan-price small{font-size:13px;color:var(--muted);font-weight:400;letter-spacing:0}.plan-card p,.plan-card li{font-size:13px;color:var(--muted);line-height:1.7}.plan-card ul{padding-left:18px;margin:10px 0 22px}.plan-card .button{margin-top:auto}.form-panel{width:min(100%,600px);display:grid;gap:18px;background:white;border:1px solid var(--line);padding:28px;border-radius:8px}.form-success{padding:15px;border-left:3px solid #315f4f;background:#ecf3ef;color:#315f4f;font-size:14px}.plain-form{display:grid;gap:17px}.plain-form label{font-size:13px;font-weight:650}.plain-form input,.plain-form textarea,.plain-form select{display:block;width:100%;margin-top:7px;min-height:44px;border:1px solid #d9d9d0;border-radius:6px;padding:10px 12px;background:white}.plain-form textarea{min-height:130px}@media(max-width:700px){.pricing-page-grid,.feature-detail-grid{grid-template-columns:1fr}.content-page{padding-top:55px}.content-page h1{font-size:44px}.content-intro{font-size:16px}.plan-card{min-height:unset}}`;
