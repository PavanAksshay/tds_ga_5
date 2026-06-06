import type { Route } from "./+types/terms";
import styles from "./legal.module.css";
import { buildMeta } from "~/lib/seo";
import {
  AlertTriangle,
  ShieldCheck,
  Terminal,
  Lock,
  Eye,
  Scale,
  FileText,
} from "lucide-react";

export function meta() {
  return [
    ...buildMeta({
      title: "Master Legal Documentation v2.0 — TDC",
      description:
        "Comprehensive legal framework, terms of service, and governance charter for The Developer Community. Strictly confidential.",
      path: "/terms",
    }),
  ];
}

const DOCUMENTS = [
  { id: "index", title: "Document Index" },
  { id: "doc1", title: "01 · Platform Terms of Service" },
  { id: "doc2", title: "02 · Supreme Authority & Governance" },
  { id: "doc3", title: "03 · Penalty & Enforcement Policy" },
  { id: "doc4", title: "04 · IP Assignment & Ownership" },
  { id: "doc5", title: "05 · Project Lead Agreement" },
  { id: "doc6", title: "06 · Non-Disclosure Agreement" },
  { id: "doc7", title: "07 · Code of Conduct" },
  { id: "doc8", title: "08 · Revenue Distribution Policy" },
  { id: "doc9", title: "09 · Liability Disclaimer" },
  { id: "doc10", title: "10 · Privacy Protocol" },
  { id: "doc11", title: "11 · Advisory Board Terms" },
  { id: "doc12", title: "12 · Acceptable Use Policy" },
  { id: "appa", title: "Appendix A · Acknowledgement Form" },
  { id: "appb", title: "Appendix B · Penalty Schedule" },
];

export default function TermsPage() {
  return (
    <div className={styles.root}>
      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <aside className={styles.sidebar}>
        <div className={styles.navTitle}>LEGAL_REGISTRY</div>
        <div className={styles.navVersion}>VERSION 2.0 // 2025 // ACTIVE</div>

        <nav className={styles.navList}>
          {DOCUMENTS.map((doc) => (
            <a key={doc.id} href={`#${doc.id}`} className={styles.navLink}>
              {doc.title}
            </a>
          ))}
        </nav>

      </aside>

      {/* ── MAIN ────────────────────────────────────────────────────────── */}
      <main className={styles.main}>
        <div className={styles.breadcrumb}>
          <Terminal size={14} /> SYSTEM_PROTOCOL // LEGAL_CORE // DECRYPT_SUCCESS
        </div>

        <header className={styles.header}>
          <div className={styles.statusBadge}>
            <AlertTriangle size={12} style={{ marginRight: "4px" }} />
            STRICTLY CONFIDENTIAL AND PROPRIETARY
          </div>
          <h1 className={styles.title}>
            MASTER LEGAL DOCUMENTATION v2.0
            <span className={styles.blinkingCursor} />
          </h1>
          <div className={styles.metaGrid}>
            <span>DOC ID: TDC-MLD-2025</span>
            <span>EFFECTIVE DATE: 2025</span>
            <span>STATUS: ACTIVE_PROTOCOL</span>
          </div>
          <p className={styles.text} style={{ marginTop: "var(--space-4)", fontStyle: "italic" }}>
            Unauthorised reproduction or distribution is prohibited and subject to legal action. This document governs all participation, contribution, and engagement with The Developer Community and its associated platforms, products, and operations.
          </p>
        </header>

        <div className={styles.content}>

          {/* ── DOCUMENT INDEX ──────────────────────────────────────────── */}
          <section id="index" className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.documentId}>INDEX_00</span>
              <h2 className={styles.sectionTitle}>DOCUMENT INDEX</h2>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>DOCUMENT</th>
                    <th>TITLE</th>
                    <th>SCOPE</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Document 1</td><td>Platform Terms of Service</td><td>All participants</td><td className={styles.emphasis}>ACTIVE</td></tr>
                  <tr><td>Document 2</td><td>Supreme Authority &amp; Governance Charter</td><td>All members</td><td className={styles.emphasis}>ACTIVE</td></tr>
                  <tr><td>Document 3</td><td>Penalty &amp; Enforcement Policy</td><td>All members</td><td className={styles.emphasis}>ACTIVE</td></tr>
                  <tr><td>Document 4</td><td>Intellectual Property Assignment</td><td>All contributors</td><td className={styles.emphasis}>ACTIVE</td></tr>
                  <tr><td>Document 5</td><td>Project Lead Agreement</td><td>Project Leads</td><td className={styles.emphasis}>ACTIVE</td></tr>
                  <tr><td>Document 6</td><td>Non-Disclosure Agreement</td><td>All members</td><td className={styles.emphasis}>ACTIVE</td></tr>
                  <tr><td>Document 7</td><td>Participant Code of Conduct</td><td>All members</td><td className={styles.emphasis}>ACTIVE</td></tr>
                  <tr><td>Document 8</td><td>Revenue Distribution Policy</td><td>All contributors</td><td className={styles.emphasis}>ACTIVE</td></tr>
                  <tr><td>Document 9</td><td>Liability Disclaimer</td><td>All participants</td><td className={styles.emphasis}>ACTIVE</td></tr>
                  <tr><td>Document 10</td><td>Privacy Protocol</td><td>All users</td><td className={styles.emphasis}>ACTIVE</td></tr>
                  <tr><td>Document 11</td><td>Advisory Board Terms of Engagement</td><td>Advisory Board</td><td className={styles.emphasis}>ACTIVE</td></tr>
                  <tr><td>Document 12</td><td>Acceptable Use Policy</td><td>All users</td><td className={styles.emphasis}>ACTIVE</td></tr>
                  <tr><td>Appendix A</td><td>Member Acknowledgement Form</td><td>All members</td><td className={styles.emphasis}>MANDATORY</td></tr>
                  <tr><td>Appendix B</td><td>Consolidated Penalty Schedule</td><td>All members</td><td className={styles.emphasis}>ACTIVE</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ── DOCUMENT 1 ─────────────────────────────────────────────── */}
          <section id="doc1" className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.documentId}>DOC_01</span>
              <h2 className={styles.sectionTitle}>PLATFORM TERMS OF SERVICE</h2>
            </div>
            <p className={styles.text}>Effective: 2025 | Applies to: All participants, contributors, users, and members of The Developer Community.</p>

            <div className={styles.warningBox}>
              <div className={styles.warningHeader}><ShieldCheck size={14} /> MANDATORY ACCEPTANCE REQUIRED</div>
              <p className={styles.text} style={{ fontSize: "13px", marginBottom: 0 }}>
                By registering, joining, contributing to, or in any way participating in The Developer Community ("TDC"), you unconditionally and irrevocably accept these Terms in their entirety, together with all supplementary documents listed in the Document Index. You may not partially accept these Terms. Acceptance is all-or-nothing. If you do not agree to any part of these Terms, you must immediately cease all participation and contact the administration for offboarding.
              </p>
            </div>

            <h3 className={styles.subSectionTitle}>1. Platform Purpose</h3>
            <p className={styles.text}>
              TDC is a structured, closed developer community that assembles teams to collaboratively build, ship, and scale real software products. TDC carries the business risk and operational overhead. Members focus exclusively on building. Participation is for educational advancement, professional portfolio development, and community standing — not employment or financial entitlement.
            </p>

            <h3 className={styles.subSectionTitle}>2. Eligibility</h3>
            <p className={styles.text}>
              Participation is open to individuals who: (a) are 16 years of age or older; (b) have submitted a valid application; (c) have been formally accepted by TDC administration; and (d) have acknowledged and accepted all documents in this Master Legal Documentation. Misrepresentation of identity, qualifications, or experience constitutes immediate grounds for removal and potential legal action.
            </p>

            <h3 className={styles.subSectionTitle}>3. Nature of Participation</h3>
            <p className={styles.text}>
              Participation in TDC does not constitute: (a) an employment relationship; (b) a contractor relationship; (c) a partnership; (d) an internship under any labour or employment law; or (e) any legal obligation by TDC to provide compensation, references, or continued engagement. TDC is a voluntary community platform. Members participate as independent contributors.
            </p>

            <h3 className={styles.subSectionTitle}>4. Account Responsibilities</h3>
            <p className={styles.text}>
              Members are fully responsible for: (a) maintaining the confidentiality of their credentials; (b) all activity conducted under their account; (c) notifying TDC immediately of any unauthorised access. TDC is not liable for any loss or damage arising from failure to comply with account security obligations.
            </p>

            <h3 className={styles.subSectionTitle}>5. Amendments</h3>
            <p className={styles.text}>
              TDC reserves the absolute right to amend these Terms at any time without prior notice. Continued participation following any amendment constitutes acceptance of the revised Terms. It is the member's responsibility to review this documentation periodically.
            </p>

            <h3 className={styles.subSectionTitle}>6. Governing Law</h3>
            <p className={styles.text}>
              These Terms are governed by applicable Indian law. Any disputes shall be subject to the exclusive jurisdiction of courts in India. Members waive any right to class-action proceedings or jury trials in any applicable jurisdiction.
            </p>
          </section>

          {/* ── DOCUMENT 2 ─────────────────────────────────────────────── */}
          <section id="doc2" className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.documentId}>DOC_02</span>
              <h2 className={styles.sectionTitle}>SUPREME AUTHORITY &amp; GOVERNANCE CHARTER</h2>
            </div>
            <p className={styles.text}>This document establishes the command structure, decision-making authority, and governance hierarchy of The Developer Community.</p>

            <h3 className={styles.subSectionTitle}>1. Founding Authority</h3>
            <p className={styles.text}>
              The President / CEO / Director of TDC holds supreme, absolute, and unconditional authority over all matters pertaining to TDC — including but not limited to: product direction, membership, financial decisions, partnerships, legal positions, and community governance. This authority is non-delegable without explicit written notice and may be reclaimed at any time.
            </p>

            <h3 className={styles.subSectionTitle}>2. Governance Hierarchy</h3>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>TIER</th>
                    <th>ROLE</th>
                    <th>AUTHORITY SCOPE</th>
                    <th>DECISION TYPE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.emphasis}>TIER 1</td>
                    <td>President / CEO / Director</td>
                    <td>Absolute, unilateral, unreviewable authority across all domains.</td>
                    <td>Final on all matters</td>
                  </tr>
                  <tr>
                    <td>TIER 2</td>
                    <td>Core Committee (COO, CTO, CMO, CSO)</td>
                    <td>Execution authority within delegated scope. Cannot override Tier 1.</td>
                    <td>Operational decisions</td>
                  </tr>
                  <tr>
                    <td>TIER 3</td>
                    <td>Project Leads</td>
                    <td>Team management for assigned project only. Cannot override Tiers 1–2.</td>
                    <td>Project-level decisions</td>
                  </tr>
                  <tr>
                    <td>TIER 4</td>
                    <td>Core Contributors / Members</td>
                    <td>Task execution as directed. No unilateral authority.</td>
                    <td>Advisory input only</td>
                  </tr>
                  <tr>
                    <td>TIER 5</td>
                    <td>Advisory Board</td>
                    <td>Guidance and mentorship. No decision-making authority.</td>
                    <td>Non-binding counsel</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className={styles.subSectionTitle}>3. Decision-Making Protocol</h3>
            <p className={styles.text}>
              All decisions impacting product direction, financial commitments, legal obligations, external partnerships, or membership status must be escalated to and approved by Tier 1. Core Committee members may make autonomous decisions only within explicitly pre-approved operational domains. Any decision made outside of authorised scope is void and may result in disciplinary action.
            </p>

            <h3 className={styles.subSectionTitle}>4. Dispute Resolution</h3>
            <p className={styles.text}>
              All internal disputes — whether between members, between a member and the platform, or between teams — shall be resolved exclusively by the President / CEO. There is no appeals process beyond Tier 1. Members agree that the President's decision is final, binding, and non-reviewable in any internal forum.
            </p>

            <h3 className={styles.subSectionTitle}>5. Succession</h3>
            <p className={styles.text}>
              In the event of the President's temporary incapacity, the COO assumes interim authority. Permanent succession is determined solely by the President via written designation. No election, vote, or community consensus may transfer authority without the President's explicit written authorisation.
            </p>
          </section>

          {/* ── DOCUMENT 3 ─────────────────────────────────────────────── */}
          <section id="doc3" className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.documentId}>DOC_03</span>
              <h2 className={styles.sectionTitle}>PENALTY &amp; ENFORCEMENT POLICY</h2>
            </div>
            <p className={styles.text}>
              TDC maintains a zero-tolerance policy toward violations that undermine the integrity, security, or reputation of the platform. This document defines the classification of violations, applicable penalties, and the enforcement process.
            </p>

            <h3 className={styles.subSectionTitle}>1. Violation Classification</h3>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>CLASS</th>
                    <th>SEVERITY</th>
                    <th>EXAMPLES</th>
                    <th>BASE PENALTY</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Class I</td>
                    <td>Minor</td>
                    <td>Missed deadlines, incomplete tasks, minor communication failures</td>
                    <td>XP deduction, formal warning</td>
                  </tr>
                  <tr>
                    <td>Class II</td>
                    <td>Moderate</td>
                    <td>Repeated tardiness, attitude violations, minor conduct breaches</td>
                    <td>Project removal, 30-day suspension</td>
                  </tr>
                  <tr>
                    <td>Class III</td>
                    <td>Serious</td>
                    <td>Unauthorised financial promises, data mishandling, team disruption</td>
                    <td>Permanent ban, personal liability</td>
                  </tr>
                  <tr>
                    <td className={styles.emphasis}>Class IV</td>
                    <td className={styles.emphasis}>Critical</td>
                    <td>IP theft, harassment, sabotage, NDA breach, forking proprietary code</td>
                    <td className={styles.emphasis}>Immediate removal + legal prosecution</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className={styles.subSectionTitle}>2. Enforcement Process</h3>
            <p className={styles.text}>
              Violations are reported to the Core Committee. Class I violations: Project Lead may issue a warning directly. Class II–IV violations: escalated to the President for final determination. All enforcement decisions by the President are final and non-appealable. TDC reserves the right to bypass the standard process for Class IV violations and take immediate action.
            </p>

            <h3 className={styles.subSectionTitle}>3. Aggravating Factors</h3>
            <p className={styles.text}>
              The following factors may elevate any violation to a higher class: (a) repeated offences; (b) intentionality or premeditation; (c) reputational harm to TDC or its products; (d) harm to other members; (e) public disclosure of confidential matters. TDC reserves sole discretion in applying aggravating factors.
            </p>

            <h3 className={styles.subSectionTitle}>4. No Refund on Penalty</h3>
            <p className={styles.text}>
              Members removed due to violations — regardless of class — are not entitled to any refund of fees paid, access to prior work products, or compensation for contributions made prior to removal. All work completed remains the exclusive property of TDC.
            </p>
          </section>

          {/* ── DOCUMENT 4 ─────────────────────────────────────────────── */}
          <section id="doc4" className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.documentId}>DOC_04</span>
              <h2 className={styles.sectionTitle}>INTELLECTUAL PROPERTY ASSIGNMENT</h2>
            </div>

            <div className={styles.warningBox}>
              <div className={styles.warningHeader}><Lock size={14} /> CRITICAL LEGAL NOTICE</div>
              <p className={styles.text} style={{ fontSize: "13px", marginBottom: 0 }}>
                All Work Product created by any member during their participation in TDC — regardless of time, location, tools used, or the involvement of personal resources — is the sole and exclusive property of The Developer Community. This assignment is irrevocable, perpetual, and worldwide in scope.
              </p>
            </div>

            <h3 className={styles.subSectionTitle}>1. Assignment of Rights</h3>
            <p className={styles.text}>
              Each member hereby assigns, transfers, and conveys to TDC all right, title, and interest in and to any and all Work Product, including all intellectual property rights therein. "Work Product" includes: source code, algorithms, designs, prototypes, documentation, data models, APIs, user interfaces, databases, marketing materials, and any derivative works.
            </p>

            <h3 className={styles.subSectionTitle}>2. Moral Rights Waiver</h3>
            <p className={styles.text}>
              To the extent permitted by applicable law, each member irrevocably waives all moral rights, including rights of attribution and integrity, in relation to all Work Product. Members agree not to assert any such rights against TDC or its licensees, successors, or assigns.
            </p>

            <h3 className={styles.subSectionTitle}>3. No Equity or Ownership Claims</h3>
            <p className={styles.text}>
              Contributing to TDC projects does not grant any member: (a) equity in TDC or any project; (b) ownership of any product, domain, or codebase; (c) licensing rights; (d) any claim to future revenue beyond what is explicitly provided in the Revenue Distribution Policy (Document 8).
            </p>

            <h3 className={styles.subSectionTitle}>4. Prior Art Declaration</h3>
            <p className={styles.text}>
              Members must disclose any pre-existing IP ("Prior Art") before incorporating it into TDC work products. Undisclosed Prior Art incorporated into TDC projects may be claimed by TDC. Members are liable for any infringement claims arising from undisclosed Prior Art.
            </p>

            <h3 className={styles.subSectionTitle}>5. Third-Party Tools and Licences</h3>
            <p className={styles.text}>
              Members must not incorporate third-party code, libraries, or assets into TDC projects unless such use is permitted by the applicable open-source or commercial licence and has been disclosed and approved by the CTO or President. Incorporating incompatible licences constitutes a Class III violation.
            </p>
          </section>

          {/* ── DOCUMENT 5 ─────────────────────────────────────────────── */}
          <section id="doc5" className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.documentId}>DOC_05</span>
              <h2 className={styles.sectionTitle}>PROJECT LEAD AGREEMENT</h2>
            </div>
            <p className={styles.text}>
              Project Leads are the execution backbone of TDC. They are appointed directly by the President or Core Committee and are responsible for the technical and operational success of their assigned project. This agreement governs their responsibilities, authority, and obligations.
            </p>

            <h3 className={styles.subSectionTitle}>1. Appointment and Authority</h3>
            <p className={styles.text}>
              Project Leads are appointed — not elected. They serve at the discretion of the President and may be replaced, reassigned, or removed at any time without notice or cause. Their authority is strictly limited to their assigned project scope.
            </p>

            <h3 className={styles.subSectionTitle}>2. Responsibilities</h3>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>RESPONSIBILITY</th>
                    <th>DETAILS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Team Direction</td><td>Assign tasks, set timelines, and hold contributors accountable for deliverables.</td></tr>
                  <tr><td>Progress Reporting</td><td>Provide weekly written updates to the Core Committee on project status, blockers, and milestones.</td></tr>
                  <tr><td>Quality Control</td><td>Review and approve all code before merging. Maintain production-grade standards.</td></tr>
                  <tr><td>Escalation</td><td>Escalate all non-technical decisions, financial matters, and conduct issues to the Core Committee.</td></tr>
                  <tr><td>Documentation</td><td>Maintain up-to-date technical and product documentation for every sprint.</td></tr>
                </tbody>
              </table>
            </div>

            <h3 className={styles.subSectionTitle}>3. Authority Boundaries</h3>
            <p className={styles.text}>Project Leads are expressly prohibited from:</p>
            <ul className={styles.text} style={{ paddingLeft: "20px", listStyleType: "square" }}>
              <li>Promising equity, financial return, or future roles to contributors without written approval from the President.</li>
              <li>Making any public statements on behalf of TDC without prior written authorisation.</li>
              <li>Entering into agreements with third parties on behalf of TDC.</li>
              <li>Recruiting members for competing platforms or personal ventures using TDC resources or networks.</li>
              <li>Accessing or modifying production infrastructure without Core Committee approval.</li>
            </ul>

            <h3 className={styles.subSectionTitle}>4. Performance Standards</h3>
            <p className={styles.text}>
              Project Leads are evaluated on: (a) on-time delivery of milestones; (b) team retention and satisfaction; (c) code quality and production stability; (d) compliance with all TDC governance documents. Failure to meet performance standards may result in demotion, reassignment, or removal.
            </p>
          </section>

          {/* ── DOCUMENT 6 ─────────────────────────────────────────────── */}
          <section id="doc6" className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.documentId}>DOC_06</span>
              <h2 className={styles.sectionTitle}>NON-DISCLOSURE AGREEMENT (NDA)</h2>
            </div>

            <div className={styles.warningBox}>
              <div className={styles.warningHeader}><Lock size={14} /> SECURITY CLEARANCE REQUIRED — ALL MEMBERS</div>
              <p className={styles.text} style={{ fontSize: "13px", marginBottom: 0 }}>
                This NDA is binding on all members from the moment of acceptance and survives termination or departure from TDC indefinitely. Breach of this agreement constitutes a Class IV violation and triggers immediate legal action.
              </p>
            </div>

            <h3 className={styles.subSectionTitle}>1. Definition of Confidential Information</h3>
            <p className={styles.text}>"Confidential Information" includes, without limitation:</p>
            <ul className={styles.text} style={{ paddingLeft: "20px", listStyleType: "square" }}>
              <li>All source code, repositories, and technical architecture of any TDC product.</li>
              <li>Product roadmaps, feature plans, and unpublished design documents.</li>
              <li>Financial data, revenue models, pricing strategies, and investor information.</li>
              <li>Member identities, XP scores, disciplinary records, and internal communications.</li>
              <li>Any information marked as confidential or that a reasonable person would understand to be confidential.</li>
            </ul>

            <h3 className={styles.subSectionTitle}>2. Obligations</h3>
            <p className={styles.text}>Each member agrees to:</p>
            <ul className={styles.text} style={{ paddingLeft: "20px", listStyleType: "square" }}>
              <li>Hold all Confidential Information in strict confidence.</li>
              <li>Not disclose Confidential Information to any third party without prior written consent from the President.</li>
              <li>Use Confidential Information solely for the purpose of contributing to assigned TDC projects.</li>
              <li>Immediately notify TDC upon discovery of any actual or suspected disclosure of Confidential Information.</li>
              <li>Return or destroy all Confidential Information upon departure from TDC.</li>
            </ul>

            <h3 className={styles.subSectionTitle}>3. Media and Public Disclosure</h3>
            <p className={styles.text}>
              Members are strictly prohibited from discussing TDC's internal operations, financials, products in development, team structure, or governance with any media outlet, social media platform, or public forum — unless explicitly authorised in writing by the President. Violations constitute a Class IV breach.
            </p>

            <h3 className={styles.subSectionTitle}>4. Survival</h3>
            <p className={styles.text}>
              Confidentiality obligations under this agreement survive the termination of membership for a period of five (5) years with respect to business information and indefinitely with respect to technical trade secrets and source code.
            </p>
          </section>

          {/* ── DOCUMENT 7 ─────────────────────────────────────────────── */}
          <section id="doc7" className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.documentId}>DOC_07</span>
              <h2 className={styles.sectionTitle}>PARTICIPANT CODE OF CONDUCT</h2>
            </div>
            <p className={styles.text}>
              TDC is an elite professional environment. Members are expected to conduct themselves with the highest standards of integrity, professionalism, and respect at all times — in every communication channel, community space, and product context.
            </p>

            <h3 className={styles.subSectionTitle}>1. Professional Standards</h3>
            <p className={styles.text}>All members must:</p>
            <ul className={styles.text} style={{ paddingLeft: "20px", listStyleType: "square" }}>
              <li>Communicate professionally and respectfully in all TDC channels and interactions.</li>
              <li>Meet committed deadlines and proactively communicate blockers in advance.</li>
              <li>Take full ownership of their work — no excuses, no blame-shifting.</li>
              <li>Represent TDC positively in external interactions.</li>
              <li>Ask for help before failing silently.</li>
            </ul>

            <h3 className={styles.subSectionTitle}>2. Major Violations</h3>
            <div className={styles.warningBox}>
              <div className={styles.warningHeader}><AlertTriangle size={14} /> ZERO TOLERANCE — CLASS IV</div>
              <ul className={styles.text} style={{ paddingLeft: "20px", listStyleType: "square", marginBottom: 0, fontSize: "13px" }}>
                <li>Any form of harassment, bullying, intimidation, or discrimination — based on gender, race, religion, sexuality, nationality, or any other characteristic.</li>
                <li>Plagiarism, code theft, or submitting others' work as one's own.</li>
                <li>Sabotage of infrastructure, codebases, or product systems.</li>
                <li>Soliciting or recruiting TDC members for competing platforms, personal ventures, or outside opportunities.</li>
                <li>Leaking confidential information in any form.</li>
              </ul>
            </div>

            <h3 className={styles.subSectionTitle}>3. Community Respect</h3>
            <p className={styles.text}>
              Members must foster an environment where all contributors feel safe, heard, and valued. Condescension, dismissiveness, or gatekeeping based on skill level, background, or experience is prohibited. TDC's strength is its diversity of perspective — protect it.
            </p>

            <h3 className={styles.subSectionTitle}>4. Reporting</h3>
            <p className={styles.text}>
              Any member who witnesses a conduct violation must report it to their Project Lead or directly to the Core Committee within 48 hours. Failure to report a known violation makes the non-reporting member a secondary party to the violation and subject to Class II penalties.
            </p>
          </section>

          {/* ── DOCUMENT 8 ─────────────────────────────────────────────── */}
          <section id="doc8" className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.documentId}>DOC_08</span>
              <h2 className={styles.sectionTitle}>REVENUE DISTRIBUTION POLICY</h2>
            </div>
            <p className={styles.text}>
              TDC operates a Proof-of-Work revenue model. Contributors who demonstrate sustained, high-quality work may be eligible for revenue sharing once a shipped product crosses defined income thresholds. This document defines eligibility, tiers, and exclusions.
            </p>

            <h3 className={styles.subSectionTitle}>1. Eligibility Criteria</h3>
            <p className={styles.text}>To be eligible for revenue sharing, a contributor must:</p>
            <ul className={styles.text} style={{ paddingLeft: "20px", listStyleType: "square" }}>
              <li>Have completed a minimum of one full project cycle from active development to live launch.</li>
              <li>Have no active disciplinary actions or unresolved violations.</li>
              <li>Have contributed a minimum threshold of verifiable commits, documented by the Project Lead and CTO.</li>
              <li>Have remained in good standing throughout the project duration.</li>
            </ul>

            <h3 className={styles.subSectionTitle}>2. Benefit Tiers</h3>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>BENEFIT</th>
                    <th>NON-PAYING MEMBER</th>
                    <th>PAYING MEMBER (SCALING INTERNSHIP)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Build Real Products</td><td className={styles.emphasis}>YES</td><td className={styles.emphasis}>YES</td></tr>
                  <tr><td>Portfolio Credit</td><td className={styles.emphasis}>YES</td><td className={styles.emphasis}>YES</td></tr>
                  <tr><td>Advisory Sessions</td><td>Limited</td><td className={styles.emphasis}>Full Access</td></tr>
                  <tr><td>Scaling Internship Track</td><td>NO</td><td className={styles.emphasis}>YES</td></tr>
                  <tr><td>Revenue Waterfall Eligibility</td><td>LOW PRIORITY</td><td className={styles.emphasis}>HIGHEST PRIORITY</td></tr>
                  <tr><td>Completion Certificate</td><td className={styles.emphasis}>YES</td><td className={styles.emphasis}>YES</td></tr>
                  <tr><td>Name on Live Product</td><td className={styles.emphasis}>YES</td><td className={styles.emphasis}>YES</td></tr>
                </tbody>
              </table>
            </div>

            <h3 className={styles.subSectionTitle}>3. Revenue Waterfall</h3>
            <p className={styles.text}>
              When a TDC product generates revenue: (a) operational costs are deducted first; (b) TDC retains a platform fee; (c) remaining funds are distributed among eligible contributors according to their verified contribution score and tier. The President determines the exact distribution percentages for each project at launch. No contributor has a guaranteed right to a specific percentage.
            </p>

            <h3 className={styles.subSectionTitle}>4. No Guarantees</h3>
            <p className={styles.text}>
              Revenue sharing is contingent on product performance. TDC makes no guarantee that any product will generate revenue, that revenue will meet any threshold, or that the distribution structure will remain unchanged for the duration of a project. This section does not constitute a financial contract or employment agreement.
            </p>
          </section>

          {/* ── DOCUMENT 9 ─────────────────────────────────────────────── */}
          <section id="doc9" className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.documentId}>DOC_09</span>
              <h2 className={styles.sectionTitle}>DISCLAIMER &amp; LIABILITY</h2>
            </div>

            <div className={styles.warningBox}>
              <div className={styles.warningHeader}><Scale size={14} /> LEGAL DISCLAIMER — READ CAREFULLY</div>
              <p className={styles.text} style={{ fontWeight: 700, textDecoration: "underline", marginBottom: "var(--space-2)", fontSize: "13px" }}>
                TDC MAKES NO GUARANTEE OF FINANCIAL RETURN, EMPLOYMENT, CAREER PLACEMENT, OR ANY SPECIFIC OUTCOME ARISING FROM PARTICIPATION. ALL PARTICIPATION IS ON AN AS-IS BASIS.
              </p>
            </div>

            <h3 className={styles.subSectionTitle}>1. Platform As-Is</h3>
            <p className={styles.text}>
              TDC provides its platform, community, and tools "as-is" and "as-available" without warranties of any kind — express or implied — including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. TDC does not warrant that the platform will be error-free, uninterrupted, or free from harmful components.
            </p>

            <h3 className={styles.subSectionTitle}>2. Limitation of Liability</h3>
            <p className={styles.text}>
              To the fullest extent permitted by applicable law, TDC and its officers, directors, employees, advisors, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages — including lost profits, data loss, reputational harm, or business interruption — arising from or related to participation in TDC, even if TDC has been advised of the possibility of such damages.
            </p>

            <h3 className={styles.subSectionTitle}>3. Indemnification</h3>
            <p className={styles.text}>
              Members agree to indemnify, defend, and hold harmless TDC and its affiliated parties from and against any claims, liabilities, damages, judgments, awards, losses, costs, and expenses (including reasonable legal fees) arising out of or relating to: (a) any violation of this Master Legal Documentation; (b) any content contributed to TDC platforms; (c) any violation of third-party rights, including intellectual property rights.
            </p>

            <h3 className={styles.subSectionTitle}>4. No Employment Relationship</h3>
            <p className={styles.text}>
              TDC is not an employer. Contributors are not employees, contractors, interns, or agents of TDC. TDC is not liable for contributions to any employment benefit schemes, insurance, or statutory entitlements on behalf of contributors.
            </p>
          </section>

          {/* ── DOCUMENT 10 ─────────────────────────────────────────────── */}
          <section id="doc10" className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.documentId}>DOC_10</span>
              <h2 className={styles.sectionTitle}>PRIVACY PROTOCOL</h2>
            </div>
            <p className={styles.text}>
              This document describes what data TDC collects from members, how it is used, and your rights regarding that data. TDC is committed to responsible data practices.
            </p>

            <h3 className={styles.subSectionTitle}>1. Data We Collect</h3>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>DATA TYPE</th>
                    <th>PURPOSE</th>
                    <th>RETENTION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Full name &amp; email address</td><td>Identity verification, account management, communication</td><td>Duration of membership + 2 years</td></tr>
                  <tr><td>GitHub profile &amp; commit history</td><td>Proof of Work verification, contribution scoring</td><td>Indefinite (product association)</td></tr>
                  <tr><td>Profile photo</td><td>Product credits, community identity</td><td>Duration of membership</td></tr>
                  <tr><td>Contribution logs</td><td>XP scoring, revenue eligibility, portfolio documentation</td><td>Indefinite</td></tr>
                  <tr><td>Communication records</td><td>Dispute resolution, compliance audits</td><td>5 years</td></tr>
                </tbody>
              </table>
            </div>

            <h3 className={styles.subSectionTitle}>2. How We Use Data</h3>
            <p className={styles.text}>TDC uses collected data exclusively to:</p>
            <ul className={styles.text} style={{ paddingLeft: "20px", listStyleType: "square" }}>
              <li>Manage memberships and platform access.</li>
              <li>Document and verify contributions for portfolio and revenue purposes.</li>
              <li>Enforce governance and conduct policies.</li>
              <li>Display member credit on live products (with explicit consent).</li>
            </ul>

            <h3 className={styles.subSectionTitle}>3. Data Sharing</h3>
            <p className={styles.text}>
              TDC does not sell, rent, or trade member data to third parties. Data may be shared with: (a) third-party services necessary to operate the platform (e.g., hosting, authentication); (b) legal authorities if required by applicable law or valid legal process. All third-party processors are bound by data protection agreements.
            </p>

            <h3 className={styles.subSectionTitle}>4. Member Rights</h3>
            <p className={styles.text}>
              Members may request: (a) access to their personal data held by TDC; (b) correction of inaccurate data; (c) deletion of personal data, subject to legal retention requirements. Requests must be submitted in writing to the Core Committee. TDC will respond within 30 days.
            </p>
          </section>

          {/* ── DOCUMENT 11 ─────────────────────────────────────────────── */}
          <section id="doc11" className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.documentId}>DOC_11</span>
              <h2 className={styles.sectionTitle}>ADVISORY BOARD TERMS OF ENGAGEMENT</h2>
            </div>
            <p className={styles.text}>
              The Advisory Board consists of senior industry professionals who provide strategic guidance, technical mentorship, and professional insight to TDC and its members. This document defines their engagement model and limitations.
            </p>

            <h3 className={styles.subSectionTitle}>1. Nature of Engagement</h3>
            <p className={styles.text}>
              Advisory Board members (Advisors) serve in a voluntary, non-executive, and non-binding capacity. Their role is strictly mentorship and guidance. Advisors have no decision-making authority, no vote on governance matters, and no claim to TDC equity, revenue, or assets.
            </p>

            <h3 className={styles.subSectionTitle}>2. Advisor Responsibilities</h3>
            <ul className={styles.text} style={{ paddingLeft: "20px", listStyleType: "square" }}>
              <li>Provide periodic technical or strategic advice as agreed upon appointment.</li>
              <li>Participate in sessions with members for mentorship and career guidance.</li>
              <li>Maintain confidentiality of all TDC matters disclosed to them.</li>
              <li>Conduct all interactions with members professionally and respectfully.</li>
            </ul>

            <h3 className={styles.subSectionTitle}>3. Advisor Limitations</h3>
            <p className={styles.text}>Advisors are expressly prohibited from:</p>
            <ul className={styles.text} style={{ paddingLeft: "20px", listStyleType: "square" }}>
              <li>Making any commitments on behalf of TDC to members, partners, or third parties.</li>
              <li>Directing or overriding decisions made by the President or Core Committee.</li>
              <li>Soliciting TDC members for their own ventures or employers.</li>
              <li>Publicly representing themselves as executives, owners, or partners of TDC.</li>
            </ul>

            <h3 className={styles.subSectionTitle}>4. Confidentiality</h3>
            <p className={styles.text}>
              All Advisors are bound by the same confidentiality obligations as members under Document 6 of this Master Legal Documentation. Their engagement does not entitle them to unrestricted access to TDC systems, financials, or member information.
            </p>

            <h3 className={styles.subSectionTitle}>5. Termination of Advisory Role</h3>
            <p className={styles.text}>
              Advisory appointments may be terminated by the President at any time, with or without cause and without notice. Advisors may resign at any time by written notice to the President. Upon termination or resignation, all confidentiality obligations under Document 6 remain in force.
            </p>
          </section>

          {/* ── DOCUMENT 12 ─────────────────────────────────────────────── */}
          <section id="doc12" className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.documentId}>DOC_12</span>
              <h2 className={styles.sectionTitle}>ACCEPTABLE USE POLICY</h2>
            </div>
            <p className={styles.text}>
              This policy governs the acceptable use of all TDC platforms, tools, repositories, communication channels, and resources. Violations may result in immediate suspension or permanent removal.
            </p>

            <h3 className={styles.subSectionTitle}>1. Permitted Use</h3>
            <p className={styles.text}>Members may use TDC platforms and resources solely to:</p>
            <ul className={styles.text} style={{ paddingLeft: "20px", listStyleType: "square" }}>
              <li>Contribute to assigned TDC projects.</li>
              <li>Communicate with team members and leadership on project-related matters.</li>
              <li>Access educational and mentorship resources made available by TDC.</li>
              <li>Submit and review code through authorised version control systems.</li>
            </ul>

            <h3 className={styles.subSectionTitle}>2. Prohibited Use</h3>
            <div className={styles.warningBox}>
              <div className={styles.warningHeader}><Eye size={14} /> STRICTLY PROHIBITED ACTIONS</div>
              <ul className={styles.text} style={{ paddingLeft: "20px", listStyleType: "square", marginBottom: 0, fontSize: "13px" }}>
                <li>Scraping, crawling, or automated data extraction from any TDC platform.</li>
                <li>Reverse engineering, decompiling, or disassembling any TDC system or product.</li>
                <li>Using TDC infrastructure, accounts, or networks for personal commercial activities.</li>
                <li>Attempting to gain unauthorised access to any TDC system, account, or data.</li>
                <li>Introducing malicious code, scripts, or content into any TDC environment.</li>
                <li>Creating or maintaining multiple accounts. One identity per member strictly enforced.</li>
                <li>Sharing login credentials with any other person under any circumstances.</li>
              </ul>
            </div>

            <h3 className={styles.subSectionTitle}>3. Content Standards</h3>
            <p className={styles.text}>
              All content submitted to TDC platforms — including code, messages, documents, and media — must be: (a) the original work of the submitting member or properly licensed for TDC use; (b) free from offensive, discriminatory, or harmful content; (c) relevant to the member's assigned project or TDC operations.
            </p>

            <h3 className={styles.subSectionTitle}>4. Monitoring</h3>
            <p className={styles.text}>
              TDC reserves the right to monitor all activity conducted on its platforms, systems, and communication channels for compliance with this policy. Members have no expectation of privacy in their use of TDC resources. Evidence of policy violations may be retained and used in disciplinary or legal proceedings.
            </p>
          </section>

          {/* ── APPENDIX A ─────────────────────────────────────────────── */}
          <section id="appa" className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.documentId}>APPEND_A</span>
              <h2 className={styles.sectionTitle}>MEMBER ACKNOWLEDGEMENT FORM</h2>
            </div>
            <p className={styles.text}>
              The following statements constitute the binding digital acknowledgement made by every member upon joining TDC. By participating, you confirm that you have read, understood, and agree to all of the following:
            </p>

            <div className={styles.warningBox}>
              <div className={styles.warningHeader}><FileText size={14} /> DIGITAL ACKNOWLEDGEMENT — BINDING ON ACCEPTANCE</div>
              <ol className={styles.text} style={{ paddingLeft: "20px", marginBottom: 0, fontSize: "13px", lineHeight: 2 }}>
                <li>I have read and understood the Master Legal Documentation v2.0 in its entirety, including all 12 documents and both appendices.</li>
                <li>I unconditionally accept all terms, conditions, policies, and obligations contained herein.</li>
                <li>I acknowledge that TDC owns 100% of all Work Product I create during my participation.</li>
                <li>I acknowledge that I have no equity, ownership stake, or financial entitlement beyond what is explicitly defined in Document 8.</li>
                <li>I acknowledge that I am not an employee, contractor, or intern of TDC under any applicable law.</li>
                <li>I acknowledge that my participation may be terminated at any time, with or without cause, at TDC's sole discretion.</li>
                <li>I agree to maintain the confidentiality of all TDC Confidential Information indefinitely as defined in Document 6.</li>
                <li>I agree to conduct myself in accordance with the Code of Conduct in Document 7 at all times.</li>
                <li>I understand that violations of any provision of this documentation may result in removal, legal action, and personal liability.</li>
                <li>I confirm that all information I have provided to TDC is accurate and complete. I understand that misrepresentation is grounds for immediate removal.</li>
              </ol>
            </div>
          </section>

          {/* ── APPENDIX B ─────────────────────────────────────────────── */}
          <section id="appb" className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.documentId}>APPEND_B</span>
              <h2 className={styles.sectionTitle}>CONSOLIDATED PENALTY SCHEDULE</h2>
            </div>
            <p className={styles.text}>
              This schedule consolidates all violation categories and their corresponding consequences. It is a reference document — specific circumstances may result in escalated penalties at TDC's discretion.
            </p>

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>VIOLATION</th>
                    <th>DOCUMENT REF</th>
                    <th>CLASS</th>
                    <th>CONSEQUENCE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Missed deadlines (first offence)</td>
                    <td>Doc 3, Doc 7</td>
                    <td>I</td>
                    <td>Formal warning + XP deduction</td>
                  </tr>
                  <tr>
                    <td>Repeated tardiness or inactivity</td>
                    <td>Doc 3, Doc 7</td>
                    <td>II</td>
                    <td>Project removal + 30-day suspension</td>
                  </tr>
                  <tr>
                    <td>Conduct violation (minor)</td>
                    <td>Doc 7</td>
                    <td>II</td>
                    <td>Warning + mandatory conduct review</td>
                  </tr>
                  <tr>
                    <td>Unauthorised financial promises to members</td>
                    <td>Doc 5</td>
                    <td>III</td>
                    <td>Immediate role removal + personal liability</td>
                  </tr>
                  <tr>
                    <td>Mishandling of confidential data</td>
                    <td>Doc 6, Doc 10</td>
                    <td>III</td>
                    <td>Permanent ban + legal notice</td>
                  </tr>
                  <tr>
                    <td>Incompatible licence incorporation</td>
                    <td>Doc 4</td>
                    <td>III</td>
                    <td>Project removal + liability for damages</td>
                  </tr>
                  <tr>
                    <td className={styles.emphasis}>IP theft / forking proprietary code</td>
                    <td>Doc 4, Doc 3</td>
                    <td className={styles.emphasis}>IV</td>
                    <td className={styles.emphasis}>Immediate removal + legal prosecution</td>
                  </tr>
                  <tr>
                    <td className={styles.emphasis}>NDA breach / media disclosure</td>
                    <td>Doc 6, Doc 3</td>
                    <td className={styles.emphasis}>IV</td>
                    <td className={styles.emphasis}>Immediate removal + legal prosecution</td>
                  </tr>
                  <tr>
                    <td className={styles.emphasis}>Harassment or discrimination</td>
                    <td>Doc 7, Doc 3</td>
                    <td className={styles.emphasis}>IV</td>
                    <td className={styles.emphasis}>Immediate removal + potential criminal referral</td>
                  </tr>
                  <tr>
                    <td className={styles.emphasis}>Infrastructure sabotage</td>
                    <td>Doc 7, Doc 12</td>
                    <td className={styles.emphasis}>IV</td>
                    <td className={styles.emphasis}>Immediate removal + prosecution + damages</td>
                  </tr>
                  <tr>
                    <td className={styles.emphasis}>Soliciting members for competing platforms</td>
                    <td>Doc 7, Doc 6</td>
                    <td className={styles.emphasis}>IV</td>
                    <td className={styles.emphasis}>Immediate removal + legal action</td>
                  </tr>
                  <tr>
                    <td className={styles.emphasis}>Identity fraud / multiple accounts</td>
                    <td>Doc 1, Doc 12</td>
                    <td className={styles.emphasis}>IV</td>
                    <td className={styles.emphasis}>Immediate removal + legal referral</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className={styles.text} style={{ marginTop: "var(--space-6)" }}>
              TDC reserves the right to apply penalties beyond those listed in this schedule where the severity of a violation warrants it. All penalty decisions by the President are final, binding, and non-reviewable.
            </p>
          </section>

          {/* ── FOOTER ─────────────────────────────────────────────────── */}
          <footer className={styles.footer}>
            <div>© 2025 THE DEVELOPER COMMUNITY. ALL RIGHTS RESERVED.</div>
            <div className={styles.emphasis}>// BUILD_SHIP_MATTER //</div>
          </footer>

        </div>
      </main>
    </div>
  );
}
