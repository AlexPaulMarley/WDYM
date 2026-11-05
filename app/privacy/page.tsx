import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { COMPANY } from "@/lib/company";
import styles from "./privacy.module.css";

// Text: the Outreach chat's draft (WeDesignYouMake Outreach\compliance\privacy-notice-draft.md), plus the website and room-photo sections.
export const metadata: Metadata = {
  title: "Privacy notice — We Design You Make",
  description:
    "How We Design You Make (A P Marley Ltd) handles business contact details, website visits and room photos, and how to object or be removed.",
  robots: { index: true, follow: true },
};

const mail = <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>;

export default function PrivacyNotice() {
  return (
    <>
      <Header />

      <main className={styles.wrap}>
        <Link href="/" className={styles.back}>
          <span aria-hidden="true">←</span> Back to home
        </Link>

        <header className={styles.head}>
          <p className={styles.kicker}>Privacy · UK GDPR</p>
          <h1>Privacy notice</h1>
          <p className={styles.updated}>Last updated: 5 November 2026</p>
        </header>

        <h2>Who we are</h2>
        <p>
          {COMPANY.name}, trading as <strong>We Design You Make</strong> (“we”), provides 3D design
          services to trade businesses such as builders, carpenters and joiners: concept pictures,
          true-size 3D models, phone AR links and headset walkthroughs. {COMPANY.name} is registered
          in England and Wales, company number {COMPANY.number}, registered office{" "}
          {COMPANY.registeredOffice}.
        </p>
        <p>Contact: {mail}.</p>

        <h2>What this notice covers</h2>
        <p>
          From time to time we contact UK trade businesses to introduce our design services. This
          notice explains what information we hold about those businesses and the people who run
          them, where it came from, how we use it, who handles it, and your rights. It also covers
          visits to our website and any room photos you send us.
        </p>

        <h2>What information we hold, and where it came from</h2>
        <p>We hold only business details that have been made public, such as:</p>
        <ul>
          <li>your business name, trading area, and the name you publish alongside it</li>
          <li>public social media handles (for example your Instagram account)</li>
          <li>your website, business phone number and business email address</li>
          <li>details from the public Companies House register, including a company’s registered office address</li>
        </ul>
        <p>
          We collect this by hand from public sources: your own website and listings, trade
          directories, and Companies House. We do not buy marketing lists and we do not scrape
          websites or social media. We do not use your photos or designs to make examples; our
          examples are our own designs.
        </p>

        <h2>How we may contact you, and why</h2>
        <p>
          We send a small number of individual, personally prepared introductions to businesses we
          believe would benefit from our services:
        </p>
        <ul>
          <li>by email, only to a limited company’s published business address</li>
          <li>by a printed card sent by post</li>
          <li>
            on Instagram, by following and commenting on public posts. We only send you a direct
            message if you have messaged us first or agreed to one.
          </li>
          <li>occasionally, by one phone call</li>
        </ul>
        <p>
          We follow up at most once. We never send automated or bulk messages, and we never message
          you on WhatsApp unless you contact us there first.
        </p>
        <p>
          <strong>Our lawful basis</strong> under UK GDPR is <strong>legitimate interests</strong>{" "}
          (Article 6(1)(f)). Our interest is introducing our design services to trade businesses
          that could use them. We do it one to one, using only details you have already made public,
          at low volume, with an easy way to say no.
        </p>

        <h2>Your right to object</h2>
        <p>
          <strong>You can object at any time to our using your details for direct marketing.</strong>{" "}
          Reply “no thanks” to any message from us, or email {mail}, and we will stop straight away
          and for good.
        </p>

        <h2>Room photos you send us</h2>
        <p>
          If you send us photos of a room, for example for free concept pictures, we use them only
          to make those pictures for you. We make them with Higgsfield, an image-AI service based in
          the United States, which handles uploads under its own{" "}
          <a href="https://higgsfield.ai/privacy-policy">privacy policy</a>. We keep the photos and
          the pictures for 12 months and then delete them, or sooner if you ask. Please only send
          photos you are allowed to share, for example with the homeowner’s agreement. Our lawful
          basis is legitimate interests (Article 6(1)(f)): making the pictures you asked for.
        </p>

        <h2>Our website</h2>
        <p>
          Our website is hosted by Vercel. To see how many people visit, we use Vercel Web
          Analytics, which counts visits without cookies and without identifying you. Like any web
          host, Vercel briefly logs technical details such as IP addresses to run and protect the
          site. Our fonts are served from our own site.
        </p>

        <h2>Who handles your details</h2>
        <p>
          We never sell your details, and we never pass them to anyone else for their own
          marketing. We use service providers that handle them to run our business:
        </p>
        <ul>
          <li>
            <strong>Google</strong> (Google Workspace): our email.
          </li>
          <li>
            <strong>Microsoft</strong>: our file storage (SharePoint/OneDrive) and GitHub, where our
            records are privately backed up.
          </li>
          <li>
            <strong>Anthropic and OpenAI</strong>: AI assistants that help us research businesses
            and draft and check our messages.
          </li>
          <li>
            <strong>Vercel</strong>: hosts our website and counts visits.
          </li>
          <li>
            <strong>Higgsfield</strong>: makes concept pictures from room photos you send us.
          </li>
        </ul>
        <p>
          Some of these providers process data outside the UK, including in the United States. Where
          they do, the transfer relies on UK adequacy regulations (such as the UK–US data bridge),
          or on the UK’s standard data transfer terms (the International Data Transfer Agreement or
          the UK Addendum) in our providers’ contracts. Higgsfield’s privacy policy names standard
          contractual clauses and the UK Extension to the EU–US Data Privacy Framework. You can ask
          us for a copy of the transfer terms that apply by emailing {mail}.
        </p>

        <h2>How long we keep it</h2>
        <ul>
          <li>
            <strong>If we haven’t contacted you within a month</strong> of noting a person’s name or
            contact details, we delete them and keep only the business name and company number.
          </li>
          <li>
            <strong>If you don’t respond, or you tell us no,</strong> we remove your details from our
            active records within 12 months of last contact.
          </li>
          <li>
            <strong>If you ask us to stop,</strong> we keep only the minimum needed (your business
            name) on a permanent do-not-contact list. That list is what stops us ever contacting you
            again.
          </li>
          <li>
            <strong>Room photos and the pictures we make from them</strong> are deleted after 12
            months, or sooner if you ask.
          </li>
        </ul>

        <h2>Automated decisions</h2>
        <p>We don’t make automated decisions about you.</p>

        <h2>Your other rights</h2>
        <p>
          You can ask for a <strong>copy</strong> of what we hold, for its <strong>correction</strong>{" "}
          or <strong>deletion</strong>, or for us to <strong>restrict</strong> (pause) its use while
          a concern is checked. Email {mail}, and we will confirm what we’ve done. You can also
          complain to the Information Commissioner’s Office (
          <a href="https://ico.org.uk">ico.org.uk</a>).
        </p>

        <div className={styles.contact}>
          <p>
            To object, ask for your data, or be removed, email {mail} and we will act on it and
            confirm.
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
