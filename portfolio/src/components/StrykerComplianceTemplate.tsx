import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Shield,
  AlertTriangle,
  FileText,
  Monitor,
  Smartphone,
  BrainCircuit,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  GitBranch,
  Search,
  HeartPulse,
  Eye,
  Zap,
  Layers,
  ExternalLink,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────
interface TemplateField {
  field: string;
  value: string;
  regulatory?: string;
  highlight?: boolean;
}

interface TraceLink {
  type: string;
  id: string;
  title: string;
  color: string;
}

// ─── Reusable Sub-Components ────────────────────────────────────
const FieldRow: React.FC<{ f: TemplateField; idx: number }> = ({ f, idx }) => (
  <motion.tr
    initial={{ opacity: 0, x: -10 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay: idx * 0.03 }}
    className={`border-b border-white/5 ${f.highlight ? 'bg-red-500/5' : ''}`}
  >
    <td className="py-3 px-4 text-cyber-cyan font-mono text-sm whitespace-nowrap align-top">
      {f.field}
    </td>
    <td className="py-3 px-4 text-gray-200 text-sm leading-relaxed">
      {f.value}
    </td>
    <td className="py-3 px-4 text-gray-500 text-xs font-mono align-top whitespace-nowrap">
      {f.regulatory || '—'}
    </td>
  </motion.tr>
);

const TraceBadge: React.FC<{ link: TraceLink }> = ({ link }) => (
  <div
    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono border-${link.color}/30 bg-${link.color}/5 text-${link.color}`}
  >
    <span className="opacity-60">{link.type}</span>
    <span className="font-bold">{link.id}</span>
    <span className="opacity-40">|</span>
    <span className="truncate max-w-[200px]">{link.title}</span>
  </div>
);

const SectionDivider: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-4 my-10">
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyber-pink/30 to-transparent" />
    <span className="text-cyber-pink text-xs font-mono uppercase tracking-widest">{label}</span>
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyber-pink/30 to-transparent" />
  </div>
);

// ─── Main Component ─────────────────────────────────────────────
export const StrykerComplianceTemplate: React.FC = () => {
  const [activeProduct, setActiveProduct] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // ── Product-specific defect scenarios ──
  const products = [
    {
      name: 'Mako SmartRobotics',
      icon: Monitor,
      class: 'Class C',
      fdaClass: 'Class II (510(k))',
      color: 'cyber-pink',
      subtitle: 'Desktop — Surgical Planning Workstation (FlaUI)',
      defect: {
        id: 'ANM-2024-0847',
        title: '3D Bone Model Z-axis Registration Drift During CT-to-Bone Alignment',
        severity: 'Critical',
        safetyClass: 'C',
        description:
          'During automated regression testing of the Mako surgical planning workstation (v4.2.1-rc3), the CT-to-Bone registration module exhibits a progressive Z-axis drift of 2.3mm ± 0.4mm over a 45-second alignment sequence. The drift exceeds the ≤1.0mm tolerance specified in SRS-MAKO-1247. The anomaly is reproducible in 8 of 10 automated test runs using the FlaUI-based desktop automation suite against a reference CT dataset (DICOM series: REF-HIP-042).',
        howDiscovered: 'System-level automated regression testing (FlaUI desktop automation) during Sprint 14 verification cycle. Detected by comparing the final registration transform matrix output against the expected golden-reference transform stored in TestData/registration_golden.json.',
        impact:
          'A Z-axis drift of 2.3mm during CT-to-Bone registration could cause the robotic arm to position the acetabular cup or femoral implant outside the surgeon-defined safe zone. In a worst-case scenario (hip arthroplasty), this could result in implant malposition leading to post-operative dislocation, leg length discrepancy, or revision surgery. Risk assessment per ISO 14971: Severity = 4 (Major), Probability = 3 (Occasional) → Risk Priority: Unacceptable without mitigation.',
        rootCause:
          'Floating-point accumulation error in the iterative closest point (ICP) convergence loop within RegistrationEngine.cpp:L847-L892. The loop termination condition checks delta < epsilon using single-precision float comparison, causing accumulated rounding errors across 200+ iterations to exceed the 1.0mm threshold. SW91 Classification: Implementation Defect — Algorithmic Error.',
        module: 'RegistrationEngine / CT-to-Bone Alignment Module',
        version: 'v4.2.1-rc3 (Build 20241215.1847)',
      },
      traceLinks: [
        { type: 'REQ', id: 'SRS-MAKO-1247', title: 'Registration accuracy ≤1.0mm RMS', color: 'cyber-cyan' },
        { type: 'RISK', id: 'HA-MAKO-089', title: 'Implant malposition due to registration error', color: 'cyber-pink' },
        { type: 'FMEA', id: 'FMEA-REG-012', title: 'ICP convergence failure mode', color: 'cyber-violet' },
        { type: 'TEST', id: 'TC-REG-045', title: 'CT-to-Bone Z-axis alignment validation', color: 'cyber-cyan' },
        { type: 'SOUP', id: 'SOUP-VTK-9.2', title: 'VTK 3D rendering library v9.2.6', color: 'cyber-violet' },
      ],
      fields: [
        { field: 'Defect ID', value: 'ANM-2024-0847', regulatory: 'IEC 62304 §9' },
        { field: 'Title', value: '3D Bone Model Z-axis Registration Drift During CT-to-Bone Alignment' },
        { field: 'Date Found', value: '2024-12-15 14:32 UTC', regulatory: 'IEC 62304 §9.1' },
        { field: 'Reporter', value: 'Automated Regression Suite (FlaUI) / Aditya Deoli', regulatory: '21 CFR Part 11' },
        { field: 'Software Version', value: 'v4.2.1-rc3 (Build 20241215.1847)', regulatory: 'IEC 62304 §8' },
        { field: 'Software Safety Class', value: 'Class C — Death or serious injury possible', regulatory: 'IEC 62304 §4.3', highlight: true },
        { field: 'FDA Device Class', value: 'Class II (510(k) — K222056)', regulatory: '21 CFR 860' },
        { field: 'Affected Module', value: 'RegistrationEngine / CT-to-Bone Alignment Module', regulatory: 'IEC 62304 §5.3' },
        { field: 'How Discovered', value: 'System-level automated regression test (FlaUI desktop automation), Sprint 14 verification. TC-REG-045 failed with 2.3mm drift vs ≤1.0mm threshold.', regulatory: 'FDA 2023 Guidance §VI.J' },
        { field: 'Severity', value: 'Critical — Potential for serious patient injury (implant malposition)', regulatory: 'ISO 14971', highlight: true },
        { field: 'Risk Priority Number', value: 'RPN = 48 (Severity: 4 × Occurrence: 3 × Detection: 4) — UNACCEPTABLE', regulatory: 'IEC 60812 FMEA', highlight: true },
        { field: 'Impact on Safety', value: 'Z-axis drift of 2.3mm exceeds tolerance by 130%. Could cause acetabular cup/femoral implant malposition → post-op dislocation, leg length discrepancy, or revision surgery.', regulatory: 'FDA 2023 Guidance §VI.J', highlight: true },
        { field: 'Root Cause', value: 'Floating-point accumulation in ICP convergence loop (RegistrationEngine.cpp:L847-892). Single-precision comparison causes rounding drift over 200+ iterations. SW91: Implementation Defect — Algorithmic Error.', regulatory: 'ANSI/AAMI SW91:2018' },
        { field: 'SOUP Involvement', value: 'VTK 9.2.6 (3D rendering) — Not implicated. Drift originates in proprietary registration code, not SOUP.', regulatory: 'IEC 62304 §5.3.3' },
        { field: 'Disposition', value: 'FIX — Mandatory before release. Cannot defer Class C safety-critical defect.', regulatory: 'IEC 62304 §9.3' },
        { field: 'Corrective Action', value: 'Switch ICP convergence to double-precision arithmetic. Add per-iteration drift guard (terminate + alert if cumulative delta > 0.5mm). Add unit test for 500-iteration stress scenario.', regulatory: 'IEC 62304 §9.5' },
        { field: 'CAPA Reference', value: 'CAPA-2024-0312 — Opened for systemic review of all floating-point calculations in surgical planning modules', regulatory: '21 CFR 820.90' },
        { field: 'Verification of Fix', value: 'Re-run TC-REG-045 + TC-REG-046 (extended 500-iteration stress). Confirm drift ≤0.3mm RMS across 20 consecutive runs. Peer review of code change (CR-4821).', regulatory: 'IEC 62304 §9.7' },
        { field: 'Regression Testing', value: 'Full registration module regression suite (42 test cases). System-level smoke suite (128 test cases). No new anomalies introduced.', regulatory: 'IEC 62304 §9.7' },
        { field: 'Resolved By', value: 'Pending — Assigned to Registration Team (ETA: Sprint 15)', regulatory: '21 CFR Part 11' },
        { field: 'CCB Approval', value: 'Reviewed by Change Control Board on 2024-12-16. Decision: Block release until fix verified.', regulatory: '21 CFR Part 11' },
        { field: 'Status', value: 'OPEN — In Progress', regulatory: 'IEC 62304 §9' },
      ],
    },
    {
      name: 'Vocera Clinical Comms',
      icon: Smartphone,
      class: 'Class B',
      fdaClass: 'Class II (510(k))',
      color: 'cyber-violet',
      subtitle: 'Mobile + Web — Critical Alert Delivery (Appium + Selenium)',
      defect: {
        id: 'ANM-2024-1203',
        title: 'Code Blue Alert Delivery Latency Exceeds 3-Second SLA on Android 14',
        severity: 'Major',
        safetyClass: 'B',
        description:
          'Automated latency testing using the Appium mobile automation suite detected that "Code Blue" critical alerts on Android 14 devices (Pixel 7, Samsung S23) exhibit a mean delivery latency of 4.8 seconds (p95: 6.2s), exceeding the ≤3.0s SLA defined in SRS-VOC-0891. The alert originates from the Vocera web dashboard (validated via Selenium) and arrives at the mobile client. iOS 17 devices remain within SLA (mean: 1.9s).',
        howDiscovered: 'Automated end-to-end latency measurement: Selenium triggers "Code Blue" from web dashboard, Appium captures notification arrival timestamp on mobile device. Discrepancy flagged by threshold assertion (expected ≤3000ms, actual 4800ms).',
        impact:
          'A 4.8-second delay in Code Blue delivery means clinical staff may not respond within the critical 4-minute window. In cardiac arrest scenarios, each second of delay reduces survival probability. Risk assessment: Severity = 3 (Moderate — delayed response, not direct harm), Probability = 4 (Probable on Android 14) → Risk Priority: Unacceptable.',
        rootCause:
          'Android 14 introduced stricter battery optimization for FCM (Firebase Cloud Messaging) high-priority notifications. The Vocera app\'s notification channel was not configured with IMPORTANCE_HIGH + foreground service exemption required by Android 14\'s new power management policy. SW91 Classification: Integration Defect — Platform API Change.',
        module: 'NotificationService / FCM Integration Layer',
        version: 'Vocera Mobile v6.3.0-beta.2 (Build 20241203.0922)',
      },
      traceLinks: [
        { type: 'REQ', id: 'SRS-VOC-0891', title: 'Critical alert delivery ≤3.0 seconds', color: 'cyber-cyan' },
        { type: 'RISK', id: 'HA-VOC-034', title: 'Delayed clinical alert → patient harm', color: 'cyber-pink' },
        { type: 'TEST', id: 'TC-NOTIFY-078', title: 'E2E Code Blue latency measurement', color: 'cyber-cyan' },
        { type: 'TEST', id: 'TC-WEB-DASH-012', title: 'Dashboard alert dispatch validation', color: 'cyber-cyan' },
        { type: 'SOUP', id: 'SOUP-FCM-24.0', title: 'Firebase Cloud Messaging SDK v24.0.0', color: 'cyber-violet' },
      ],
      fields: [
        { field: 'Defect ID', value: 'ANM-2024-1203', regulatory: 'IEC 62304 §9' },
        { field: 'Title', value: 'Code Blue Alert Delivery Latency Exceeds 3-Second SLA on Android 14' },
        { field: 'Date Found', value: '2024-12-03 09:47 UTC', regulatory: 'IEC 62304 §9.1' },
        { field: 'Reporter', value: 'Automated E2E Latency Suite (Appium + Selenium) / Aditya Deoli', regulatory: '21 CFR Part 11' },
        { field: 'Software Version', value: 'Vocera Mobile v6.3.0-beta.2 (Build 20241203.0922)', regulatory: 'IEC 62304 §8' },
        { field: 'Software Safety Class', value: 'Class B — Non-serious injury possible (delayed response)', regulatory: 'IEC 62304 §4.3', highlight: true },
        { field: 'FDA Device Class', value: 'Class II (510(k))', regulatory: '21 CFR 860' },
        { field: 'Affected Module', value: 'NotificationService / FCM Integration Layer', regulatory: 'IEC 62304 §5.3' },
        { field: 'How Discovered', value: 'Automated E2E test: Selenium dispatches Code Blue from web dashboard → Appium captures notification arrival on Android 14. Threshold assertion failed: 4800ms > 3000ms SLA.', regulatory: 'FDA 2023 Guidance §VI.J' },
        { field: 'Affected Platforms', value: 'Android 14 (Pixel 7, Samsung S23). iOS 17 unaffected (mean 1.9s). Android 13 unaffected (mean 2.1s).', regulatory: 'IEC 62304 §5.3' },
        { field: 'Severity', value: 'Major — Delayed clinical response in cardiac arrest scenarios', regulatory: 'ISO 14971', highlight: true },
        { field: 'Risk Priority Number', value: 'RPN = 36 (Severity: 3 × Occurrence: 4 × Detection: 3) — UNACCEPTABLE', regulatory: 'IEC 60812 FMEA', highlight: true },
        { field: 'Impact on Safety', value: 'Code Blue alerts delayed by 1.8-3.2 seconds beyond SLA. In cardiac arrest, delayed notification reduces survival probability. Staff may miss the 4-minute response window.', regulatory: 'FDA 2023 Guidance §VI.J', highlight: true },
        { field: 'Root Cause', value: 'Android 14 FCM battery optimization change. App notification channel missing IMPORTANCE_HIGH + foreground service exemption. SW91: Integration Defect — Platform API Change.', regulatory: 'ANSI/AAMI SW91:2018' },
        { field: 'SOUP Involvement', value: 'Firebase Cloud Messaging SDK v24.0.0 — Directly implicated. SDK behavior changed in v24.x to enforce Android 14 power policies. Requires configuration update.', regulatory: 'IEC 62304 §5.3.3', highlight: true },
        { field: 'Disposition', value: 'FIX — Mandatory before release to production hospitals.', regulatory: 'IEC 62304 §9.3' },
        { field: 'Corrective Action', value: '1) Set notification channel to IMPORTANCE_HIGH. 2) Register foreground service exemption for critical alerts. 3) Add FCM delivery receipt with server-side latency tracking. 4) Add platform-matrix latency test to CI pipeline.', regulatory: 'IEC 62304 §9.5' },
        { field: 'CAPA Reference', value: 'CAPA-2024-0298 — Review all SOUP dependencies for Android 14 behavioral changes', regulatory: '21 CFR 820.90' },
        { field: 'Verification of Fix', value: 'Re-run TC-NOTIFY-078 on Android 14 device farm (Pixel 7, S23, S24). Confirm mean latency ≤2.5s, p95 ≤3.0s across 100 consecutive alerts.', regulatory: 'IEC 62304 §9.7' },
        { field: 'Regression Testing', value: 'Full notification suite (34 test cases) across Android 13/14 + iOS 16/17 matrix. Battery optimization edge cases (Doze mode, App Standby).', regulatory: 'IEC 62304 §9.7' },
        { field: 'Status', value: 'OPEN — Fix in development', regulatory: 'IEC 62304 §9' },
      ],
    },
    {
      name: 'care.ai Patient Monitoring',
      icon: BrainCircuit,
      class: 'Class C',
      fdaClass: 'Class II (De Novo)',
      color: 'cyber-cyan',
      subtitle: 'AI/ML — Fall Prediction Validation (AI Validation Module)',
      defect: {
        id: 'ANM-2024-1419',
        title: 'Fall Prediction Model False Negative Rate Exceeds Threshold for Nighttime Scenarios',
        severity: 'Critical',
        safetyClass: 'C',
        description:
          'The AI validation framework detected that the fall prediction model (PatientExitBed-v3.1) exhibits a false negative rate (FNR) of 18.7% for nighttime (low-light) scenarios, exceeding the ≤5% FNR threshold defined in SRS-CARE-0456. The model correctly identifies daytime exit events (FNR: 2.1%) but fails to detect slow, deliberate nighttime bed exits captured by IR camera. Validated using the AI/ML testing module with ground-truth dataset GT-FALL-2024-Q4 (1,247 labeled video segments).',
        howDiscovered: 'AI validation module automated testing: ConsistencyTester ran 50 inference cycles on GT-FALL-2024-Q4 nighttime subset. HallucinationDetector cross-referenced predictions against ground-truth labels. BiasDetector identified statistically significant performance gap between day/night conditions (p < 0.001).',
        impact:
          'A missed fall prediction means no preemptive alert is sent to nursing staff. For elderly patients (65+), an undetected bed exit leading to a fall has a 30-50% probability of resulting in hip fracture. Risk assessment: Severity = 4 (Major — serious injury), Probability = 3 (Occasional — nighttime-specific) → Risk Priority: Unacceptable.',
        rootCause:
          'Training data imbalance: 78% of training samples are daytime scenes. Nighttime IR imagery has lower spatial resolution and different feature distributions. The model\'s feature extractor (ResNet-50 backbone) was not fine-tuned on IR-specific augmentations. SW91 Classification: Design Defect — Training Data Specification.',
        module: 'PatientExitBed-v3.1 / Fall Prediction Inference Engine',
        version: 'care.ai Platform v2.8.0-rc1 (Model: PEB-v3.1-20241201)',
      },
      traceLinks: [
        { type: 'REQ', id: 'SRS-CARE-0456', title: 'Fall prediction FNR ≤5% all conditions', color: 'cyber-cyan' },
        { type: 'RISK', id: 'HA-CARE-067', title: 'Missed fall prediction → patient injury', color: 'cyber-pink' },
        { type: 'RISK', id: 'HA-CARE-071', title: 'AI bias across environmental conditions', color: 'cyber-pink' },
        { type: 'TEST', id: 'TC-AI-FALL-023', title: 'Nighttime FNR validation (GT dataset)', color: 'cyber-cyan' },
        { type: 'TEST', id: 'TC-AI-BIAS-008', title: 'Day vs Night performance parity', color: 'cyber-cyan' },
        { type: 'DATA', id: 'GT-FALL-2024-Q4', title: 'Ground truth: 1,247 labeled video segments', color: 'cyber-violet' },
      ],
      fields: [
        { field: 'Defect ID', value: 'ANM-2024-1419', regulatory: 'IEC 62304 §9' },
        { field: 'Title', value: 'Fall Prediction Model False Negative Rate Exceeds Threshold for Nighttime Scenarios' },
        { field: 'Date Found', value: '2024-12-19 11:15 UTC', regulatory: 'IEC 62304 §9.1' },
        { field: 'Reporter', value: 'AI Validation Framework (ConsistencyTester + BiasDetector) / Aditya Deoli', regulatory: '21 CFR Part 11' },
        { field: 'Software Version', value: 'care.ai Platform v2.8.0-rc1 (Model: PEB-v3.1-20241201)', regulatory: 'IEC 62304 §8' },
        { field: 'Software Safety Class', value: 'Class C — Death or serious injury possible (undetected fall)', regulatory: 'IEC 62304 §4.3', highlight: true },
        { field: 'FDA Device Class', value: 'Class II (De Novo — AI/ML-enabled patient monitoring)', regulatory: '21 CFR 860' },
        { field: 'Affected Module', value: 'PatientExitBed-v3.1 / Fall Prediction Inference Engine', regulatory: 'IEC 62304 §5.3' },
        { field: 'How Discovered', value: 'AI validation module: ConsistencyTester (50 inference cycles) + HallucinationDetector (ground-truth comparison) + BiasDetector (day/night parity test, p < 0.001). Automated CI pipeline flag.', regulatory: 'FDA 2023 Guidance §VI.J' },
        { field: 'ML Model Details', value: 'Architecture: ResNet-50 backbone + custom temporal head. Training data: 45,000 samples (78% day / 22% night). Inference: 15 FPS on NVIDIA Jetson Orin.', regulatory: 'FDA AI/ML Guidance' },
        { field: 'Severity', value: 'Critical — Undetected fall → hip fracture risk (30-50% in 65+ patients)', regulatory: 'ISO 14971', highlight: true },
        { field: 'Risk Priority Number', value: 'RPN = 48 (Severity: 4 × Occurrence: 3 × Detection: 4) — UNACCEPTABLE', regulatory: 'IEC 60812 FMEA', highlight: true },
        { field: 'Impact on Safety', value: 'FNR of 18.7% at night means ~1 in 5 nighttime bed exits goes undetected. Nursing staff receive no alert. Fall risk is highest at night (disorientation, medication effects).', regulatory: 'FDA 2023 Guidance §VI.J', highlight: true },
        { field: 'Bias Analysis', value: 'BiasDetector confirmed statistically significant performance gap: Daytime FNR 2.1% vs Nighttime FNR 18.7% (Δ = 16.6%, p < 0.001). Constitutes environmental condition bias.', regulatory: 'FDA AI/ML Guidance', highlight: true },
        { field: 'Root Cause', value: 'Training data imbalance (78% day / 22% night). ResNet-50 backbone not fine-tuned for IR imagery. Feature distributions diverge in low-light. SW91: Design Defect — Training Data Specification.', regulatory: 'ANSI/AAMI SW91:2018' },
        { field: 'Disposition', value: 'FIX — Mandatory. Cannot ship with 18.7% FNR on safety-critical prediction.', regulatory: 'IEC 62304 §9.3' },
        { field: 'Corrective Action', value: '1) Augment training set with 15,000+ synthetic nighttime IR samples. 2) Fine-tune feature extractor on IR-specific augmentations (noise injection, contrast reduction). 3) Add night-specific confidence calibration layer. 4) Implement day/night parity gate in CI (auto-block if FNR delta > 3%).', regulatory: 'IEC 62304 §9.5' },
        { field: 'CAPA Reference', value: 'CAPA-2024-0334 — Systemic review of training data coverage across all environmental conditions for all AI models', regulatory: '21 CFR 820.90' },
        { field: 'Verification of Fix', value: 'Re-run TC-AI-FALL-023 on full GT-FALL-2024-Q4 dataset. Confirm nighttime FNR ≤5%. Re-run TC-AI-BIAS-008. Confirm day/night FNR delta ≤3%. 100-run consistency test (stddev < 0.02).', regulatory: 'IEC 62304 §9.7' },
        { field: 'Predetermined Change Control Plan', value: 'Per FDA PCCP guidance: Model retraining within original intended use does not require new 510(k) if FNR remains ≤5% and architecture unchanged.', regulatory: 'FDA AI/ML PCCP' },
        { field: 'Status', value: 'OPEN — Retraining in progress', regulatory: 'IEC 62304 §9' },
      ],
    },
    {
      name: 'iSuite OR Integration',
      icon: Layers,
      class: 'Class C',
      fdaClass: 'Class II (510(k))',
      color: 'cyber-pink',
      subtitle: 'Full Stack — Desktop + Web + Mobile + AI (All 4 Platforms)',
      defect: {
        id: 'ANM-2024-1587',
        title: '4K Video Route Switching Causes Progressive Memory Leak in Video Pipeline',
        severity: 'Critical',
        safetyClass: 'C',
        description:
          'During automated memory leak regression testing using the FlaUI desktop automation suite, the iSuite Video Routing module (v3.8.0-rc2) exhibits a progressive memory growth of 127MB over 200 rapid route-switching cycles between Endoscope→Monitor1 and Endoscope→Monitor2. The memory threshold per SRS-ISUITE-0316 is ≤50MB growth over 200 cycles. At this leak rate, the iSuite workstation would exhaust available memory within 4 hours of continuous OR use, causing the application to crash and lose all active video routes.',
        howDiscovered: 'Automated FlaUI desktop regression test (VideoRoutingTests.Rapid_Route_Switching_Should_Not_Leak_Memory). The PerformRapidRouteSwitching() method captures memory snapshots before/after 200 cycles and asserts delta ≤50MB. Cross-validated with Selenium web dashboard showing the same memory growth trend on the system health monitor.',
        impact:
          'Memory exhaustion during a live surgical procedure causes total loss of video routing — all monitors go black. The surgeon loses the endoscopic view mid-procedure, which could lead to inadvertent tissue damage or inability to identify critical anatomy. In a worst case (laparoscopic cholecystectomy), this could cause bile duct injury. Risk: Severity = 4 (Major), Probability = 3 (Occasional, triggered by frequent source switching) → Unacceptable.',
        rootCause:
          'The VideoRoutePipeline class allocates a new DirectX 11 texture buffer for each route change but only releases it when the route is explicitly cleared, not when overwritten by a new route. The orphaned texture handles accumulate in unmanaged memory outside the .NET garbage collector\'s reach. SW91 Classification: Implementation Defect — Resource Management Error.',
        module: 'VideoRoutePipeline / DirectX Texture Manager',
        version: 'iSuite Workstation v3.8.0-rc2 (Build 20241220.1103)',
      },
      traceLinks: [
        { type: 'REQ', id: 'SRS-ISUITE-0316', title: 'Memory stability ≤50MB growth over 200 route cycles', color: 'cyber-cyan' },
        { type: 'REQ', id: 'SRS-ISUITE-0312', title: 'Route switch latency ≤500ms', color: 'cyber-cyan' },
        { type: 'RISK', id: 'HA-ISUITE-041', title: 'Video loss during active surgery', color: 'cyber-pink' },
        { type: 'FMEA', id: 'FMEA-VRP-008', title: 'Memory exhaustion in video pipeline', color: 'cyber-violet' },
        { type: 'TEST', id: 'TC-VR-MEMLEAK-001', title: 'Rapid route switch memory regression (FlaUI)', color: 'cyber-cyan' },
        { type: 'TEST', id: 'TC-WEB-HEALTH-012', title: 'System health dashboard memory monitor (Selenium)', color: 'cyber-cyan' },
        { type: 'TEST', id: 'TC-TAB-ROUTE-003', title: 'Tablet quick-route memory impact (Appium)', color: 'cyber-cyan' },
      ],
      fields: [
        { field: 'Defect ID', value: 'ANM-2024-1587', regulatory: 'IEC 62304 §9' },
        { field: 'Title', value: '4K Video Route Switching Causes Progressive Memory Leak in Video Pipeline' },
        { field: 'Date Found', value: '2024-12-20 11:47 UTC', regulatory: 'IEC 62304 §9.1' },
        { field: 'Reporter', value: 'Automated Regression Suite (FlaUI + Selenium + Appium) / Aditya Deoli', regulatory: '21 CFR Part 11' },
        { field: 'Software Version', value: 'iSuite Workstation v3.8.0-rc2 (Build 20241220.1103)', regulatory: 'IEC 62304 §8' },
        { field: 'Software Safety Class', value: 'Class C — Death or serious injury possible (video loss during surgery)', regulatory: 'IEC 62304 §4.3', highlight: true },
        { field: 'FDA Device Class', value: 'Class II (510(k))', regulatory: '21 CFR 860' },
        { field: 'Affected Module', value: 'VideoRoutePipeline / DirectX 11 Texture Manager', regulatory: 'IEC 62304 §5.3' },
        { field: 'Platforms Tested', value: 'Desktop (FlaUI — primary detection), Web (Selenium — health monitor correlation), Mobile (Appium — tablet-triggered route switch)', regulatory: 'IEC 62304 §5.7' },
        { field: 'How Discovered', value: 'FlaUI desktop test: PerformRapidRouteSwitching(200 cycles). Memory delta 127MB > 50MB threshold. Confirmed via Selenium system health dashboard and Appium tablet-triggered route switches.', regulatory: 'FDA 2023 Guidance §VI.J' },
        { field: 'Severity', value: 'Critical — Memory exhaustion → all video routes lost during live surgery', regulatory: 'ISO 14971', highlight: true },
        { field: 'Risk Priority Number', value: 'RPN = 48 (Severity: 4 × Occurrence: 3 × Detection: 4) — UNACCEPTABLE', regulatory: 'IEC 60812 FMEA', highlight: true },
        { field: 'Impact on Safety', value: '127MB leak rate → workstation crash within 4 hours of continuous OR use. Total loss of endoscopic video view mid-procedure. Surgeon unable to see anatomy → risk of bile duct injury, vascular injury, or uncontrolled bleeding.', regulatory: 'FDA 2023 Guidance §VI.J', highlight: true },
        { field: 'Root Cause', value: 'DirectX 11 texture buffer leak: VideoRoutePipeline allocates new texture per route change but only releases on explicit ClearRoute(), not on overwrite. Orphaned handles in unmanaged memory. SW91: Implementation Defect — Resource Management Error.', regulatory: 'ANSI/AAMI SW91:2018' },
        { field: 'Cross-Platform Validation', value: 'FlaUI: 127MB delta (primary). Selenium: system health monitor confirmed 130MB growth. Appium: tablet-triggered routing showed identical leak pattern. All 3 platforms independently confirmed the defect.', regulatory: 'IEC 62304 §5.7' },
        { field: 'Disposition', value: 'FIX — Mandatory before release. Class C safety-critical resource leak.', regulatory: 'IEC 62304 §9.3' },
        { field: 'Corrective Action', value: '1) Implement IDisposable on texture buffers with deterministic cleanup. 2) Add using() pattern in route assignment. 3) Add memory watchdog thread (alert at 80% threshold). 4) Add memory delta assertion to CI gate.', regulatory: 'IEC 62304 §9.5' },
        { field: 'CAPA Reference', value: 'CAPA-2024-0351 — Systemic review of all DirectX resource management patterns across iSuite video pipeline', regulatory: '21 CFR 820.90' },
        { field: 'Verification of Fix', value: 'Re-run TC-VR-MEMLEAK-001 (200 cycles, assert ≤50MB). Extended 1000-cycle stress test. 4-hour continuous routing endurance test. Confirm via all 3 platforms.', regulatory: 'IEC 62304 §9.7' },
        { field: 'Regression Testing', value: 'Full iSuite regression: 89 test cases (Desktop: 31, Web: 24, Mobile: 18, AI: 16). All platforms. No new anomalies.', regulatory: 'IEC 62304 §9.7' },
        { field: 'Status', value: 'OPEN — Fix in development', regulatory: 'IEC 62304 §9' },
      ],
    },
  ];

  const current = products[activeProduct];

  // ── Regulatory framework reference ──
  const regulations = [
    { code: 'IEC 62304', title: 'Medical Device Software Lifecycle', icon: GitBranch, desc: 'Clause 9 — Software Problem Resolution Process. Defines how anomalies are identified, analyzed, resolved, and verified.' },
    { code: 'ISO 14971', title: 'Risk Management for Medical Devices', icon: AlertTriangle, desc: 'Risk assessment framework. Severity × Probability scoring. Drives the "Impact on Safety" and RPN fields.' },
    { code: 'FDA 2023 Guidance', title: 'Content of Premarket Submissions for Device Software', icon: FileText, desc: 'Section VI.J — Unresolved anomalies must include: description, how discovered, severity, impact, mitigations, root cause, and deferral rationale.' },
    { code: '21 CFR Part 11', title: 'Electronic Records & Signatures', icon: Shield, desc: 'Audit trail requirements. Every field change, approval, and sign-off is timestamped and attributed to a named individual.' },
    { code: 'ANSI/AAMI SW91', title: 'Classification of Defects in Health Software', icon: Search, desc: 'FDA-recognized taxonomy for classifying where in the lifecycle a defect originated (Requirements, Design, Implementation, Integration).' },
    { code: '21 CFR 820.90', title: 'Corrective and Preventive Action (CAPA)', icon: Activity, desc: 'When a defect reveals a systemic quality issue, CAPA is opened to investigate root cause and prevent recurrence across the product line.' },
  ];

  // ── FAQ ──
  const faqs = [
    {
      q: 'Why is this in Jama Connect and not Jira?',
      a: 'Jama Connect provides native bidirectional traceability between requirements → risks → test cases → defects, which is mandatory for FDA submissions. Jira can be used for sprint tracking, but Jama is the system of record for the Design History File (DHF). The traceability matrix in Jama is what the FDA reviewer actually audits.',
    },
    {
      q: 'What makes this different from a normal bug report?',
      a: 'Three things: (1) Every field maps to a specific regulatory clause — the FDA auditor can trace each piece of information to its compliance requirement. (2) Bidirectional traceability links — the defect connects to requirements, risk items, FMEA entries, test cases, and SOUP components. (3) Risk-based disposition — you cannot simply "close" a bug; the Change Control Board must formally approve the disposition with documented rationale.',
    },
    {
      q: 'How does automation fit into this compliance workflow?',
      a: 'Automation provides the repeatability that regulators demand. When you write "verified by automated regression suite (42 test cases, 20 consecutive runs)", that\'s stronger evidence than "tested manually once." The automation framework generates timestamped test execution records that satisfy 21 CFR Part 11 electronic records requirements. For AI/ML products, automated validation is the only practical way to run 50+ inference cycles for consistency testing.',
    },
    {
      q: 'What happens if you defer a Class C defect?',
      a: 'For IEC 62304 Class C software (death or serious injury possible), deferring a safety-critical defect requires: (1) documented risk-benefit analysis proving the device is still safe to use, (2) compensating controls/mitigations, (3) CCB approval with named signatories, and (4) a committed timeline for correction. The FDA 2023 guidance explicitly requires this rationale in premarket submissions. In practice, Class C critical defects almost always block release.',
    },
  ];

  return (
    <div className="min-h-screen bg-cyber-black text-white">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cyber-black/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-400 hover:text-cyber-pink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-mono">Back to Portfolio</span>
          </Link>
          <span className="text-xs text-gray-600 font-mono">COMPLIANCE TEMPLATE</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-24 pb-20">
        {/* ── Hero ── */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-cyber-pink" />
            <span className="text-cyber-pink text-sm font-mono uppercase tracking-widest">
              FDA / IEC 62304 / ISO 14971
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Compliance-Ready Defect Documentation
            <br />
            <span className="text-cyber-pink">for Stryker Products in Jama Connect</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl leading-relaxed">
            Three production-realistic anomaly reports demonstrating how I would document
            software defects in a regulated medical device environment — with full
            traceability to requirements, risk items, FMEA entries, and SOUP components.
            Each template maps every field to its governing regulatory clause.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { label: 'Regulatory Standards', value: '6' },
              { label: 'Traceability Links', value: '16' },
              { label: 'Documentation Fields', value: '20+' },
              { label: 'Product Scenarios', value: '4' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-cyber-black/60 border border-cyber-pink/20 rounded-lg p-4 text-center"
              >
                <div className="text-2xl font-bold text-cyber-pink">{stat.value}</div>
                <div className="text-xs text-gray-500 font-mono mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ── Product Selector ── */}
        <SectionDivider label="Select Product Scenario" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {products.map((product, i) => {
            const Icon = product.icon;
            const isActive = i === activeProduct;
            return (
              <motion.button
                key={product.name}
                onClick={() => setActiveProduct(i)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-5 rounded-lg border text-left transition-all ${
                  isActive
                    ? `border-${product.color}/60 bg-${product.color}/10`
                    : 'border-white/10 bg-cyber-black/40 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon className={`w-5 h-5 ${isActive ? `text-${product.color}` : 'text-gray-500'}`} />
                  <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-400'}`}>
                    {product.name}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3">{product.subtitle}</p>
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                    product.class === 'Class C'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  }`}>
                    IEC 62304 {product.class}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded font-mono bg-white/5 text-gray-400 border border-white/10">
                    {product.fdaClass}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* ── Defect Summary Card ── */}
        <motion.section
          key={current.defect.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <div className={`bg-cyber-black/60 border border-${current.color}/30 rounded-xl overflow-hidden`}>
            {/* Header */}
            <div className={`bg-${current.color}/10 border-b border-${current.color}/20 px-6 py-4`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-500">JAMA CONNECT</span>
                  <span className="text-xs text-gray-600">|</span>
                  <span className={`font-mono font-bold text-${current.color}`}>{current.defect.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    current.defect.severity === 'Critical'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {current.defect.severity === 'Critical' ? (
                      <span className="flex items-center gap-1"><XCircle className="w-3 h-3" /> CRITICAL</span>
                    ) : (
                      <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> MAJOR</span>
                    )}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/5 text-gray-400 border border-white/10">
                    IEC 62304 Class {current.defect.safetyClass}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> OPEN
                  </span>
                </div>
              </div>
              <h2 className="text-lg font-bold mt-3 leading-snug">{current.defect.title}</h2>
            </div>

            {/* Description */}
            <div className="px-6 py-5 border-b border-white/5">
              <h3 className="text-xs font-mono text-cyber-cyan mb-2 uppercase tracking-wider">Problem Description</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{current.defect.description}</p>
            </div>

            {/* Traceability Links */}
            <div className="px-6 py-5 border-b border-white/5">
              <h3 className="text-xs font-mono text-cyber-cyan mb-3 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-3 h-3" /> Bidirectional Traceability
              </h3>
              <div className="flex flex-wrap gap-2">
                {current.traceLinks.map((link) => (
                  <TraceBadge key={link.id} link={link} />
                ))}
              </div>
            </div>

            {/* Full Field Table */}
            <div className="px-2 py-2 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-2 px-4 text-left text-xs font-mono text-gray-500 uppercase">Field</th>
                    <th className="py-2 px-4 text-left text-xs font-mono text-gray-500 uppercase">Value</th>
                    <th className="py-2 px-4 text-left text-xs font-mono text-gray-500 uppercase">Regulatory Basis</th>
                  </tr>
                </thead>
                <tbody>
                  {current.fields.map((f, idx) => (
                    <FieldRow key={f.field} f={f} idx={idx} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>

        {/* ── Why Each Field Matters ── */}
        <SectionDivider label="Regulatory Framework" />

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-2">
            Why Every Field <span className="text-cyber-pink">Has a Regulatory Basis</span>
          </h2>
          <p className="text-gray-400 text-sm mb-8 max-w-2xl">
            In an FDA-regulated environment, defect documentation is not optional metadata —
            it is auditable evidence. Each field maps to a specific clause that an FDA reviewer
            or notified body auditor will check during a 510(k) review or ISO 13485 audit.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regulations.map((reg) => {
              const Icon = reg.icon;
              return (
                <motion.div
                  key={reg.code}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-cyber-black/60 border border-white/10 rounded-lg p-5 hover:border-cyber-pink/30 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-cyber-pink" />
                    <span className="text-sm font-bold text-cyber-cyan font-mono">{reg.code}</span>
                  </div>
                  <h3 className="text-sm font-semibold mb-2">{reg.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{reg.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* ── How Automation Connects ── */}
        <SectionDivider label="Automation → Compliance Bridge" />

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-8">
            How My Framework <span className="text-cyber-pink">Feeds This Workflow</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Monitor,
                title: 'Mako → FlaUI Desktop',
                color: 'cyber-pink',
                points: [
                  'FlaUI automates the Windows-based surgical planning workstation UI',
                  'Self-healing locators handle UI changes between Mako software versions',
                  'Golden-reference comparison validates 3D registration transform matrices',
                  'ExtentReports generates timestamped evidence for 21 CFR Part 11',
                ],
              },
              {
                icon: Smartphone,
                title: 'Vocera → Appium + Selenium',
                color: 'cyber-violet',
                points: [
                  'Selenium triggers alerts from the clinician web dashboard',
                  'Appium captures notification arrival on Android/iOS device farm',
                  'Cross-platform latency measurement with millisecond precision',
                  'Platform-matrix test execution validates across OS versions',
                ],
              },
              {
                icon: BrainCircuit,
                title: 'care.ai → AI Validation Module',
                color: 'cyber-cyan',
                points: [
                  'ConsistencyTester runs N inference cycles for non-deterministic output scoring',
                  'BiasDetector identifies performance gaps across environmental conditions',
                  'HallucinationDetector compares predictions against ground-truth datasets',
                  'MedicalAIValidator enforces safety thresholds with auto-block CI gates',
                ],
              },
              {
                icon: Layers,
                title: 'iSuite → All 4 Platforms',
                color: 'cyber-pink',
                points: [
                  'FlaUI automates touchpanel + video routing on the Windows workstation',
                  'Selenium validates HIPAA-compliant web dashboard and media playback',
                  'Appium tests tablet lighting presets and measures hub signal latency',
                  'SurgicalAIValidator compares bounding boxes against gold-standard via IoU',
                ],
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={`bg-cyber-black/60 border border-${card.color}/20 rounded-lg p-6`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg bg-${card.color}/10 flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 text-${card.color}`} />
                    </div>
                    <h3 className="font-bold text-sm">{card.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {card.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-400 leading-relaxed">
                        <CheckCircle2 className={`w-3 h-3 mt-0.5 flex-shrink-0 text-${card.color}`} />
                        {point}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* ── Traceability Flow ── */}
        <SectionDivider label="Traceability Flow" />

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-6">
            End-to-End <span className="text-cyber-pink">Traceability Chain</span>
          </h2>
          <p className="text-gray-400 text-sm mb-8">
            The FDA&apos;s core expectation: every requirement, risk, and test result must form
            a clear, auditable trail. This is what Jama Connect&apos;s Live Traceability delivers.
          </p>

          <div className="flex flex-col md:flex-row items-stretch gap-3">
            {[
              { label: 'User Need', sub: '(Design Input)', color: 'cyber-cyan', icon: Eye },
              { label: 'SW Requirement', sub: '(SRS)', color: 'cyber-cyan', icon: FileText },
              { label: 'Risk Analysis', sub: '(ISO 14971)', color: 'cyber-pink', icon: AlertTriangle },
              { label: 'Test Case', sub: '(Verification)', color: 'cyber-violet', icon: CheckCircle2 },
              { label: 'Test Execution', sub: '(Automated)', color: 'cyber-violet', icon: Zap },
              { label: 'Defect / Anomaly', sub: '(This Template)', color: 'cyber-pink', icon: XCircle },
              { label: 'CAPA', sub: '(If systemic)', color: 'cyber-pink', icon: Shield },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.label}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex-1 bg-cyber-black/60 border border-${step.color}/20 rounded-lg p-4 text-center`}
                  >
                    <Icon className={`w-5 h-5 text-${step.color} mx-auto mb-2`} />
                    <div className="text-xs font-bold">{step.label}</div>
                    <div className="text-[10px] text-gray-600 font-mono">{step.sub}</div>
                  </motion.div>
                  {i < 6 && (
                    <div className="hidden md:flex items-center text-gray-600 text-lg">→</div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </motion.section>

        {/* ── FAQ ── */}
        <SectionDivider label="FAQ" />

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-16 max-w-3xl"
        >
          <h2 className="text-2xl font-bold mb-8">
            Frequently Asked <span className="text-cyber-pink">Questions</span>
          </h2>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="bg-cyber-black/60 border border-white/10 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                >
                  <span className="text-sm font-semibold pr-4">{faq.q}</span>
                  {expandedFaq === i ? (
                    <ChevronUp className="w-4 h-4 text-cyber-pink flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="px-5 pb-4"
                  >
                    <p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Footer CTA ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center py-12"
        >
          <h2 className="text-2xl font-bold mb-3">
            This is how I think about <span className="text-cyber-pink">quality in MedTech.</span>
          </h2>
          <p className="text-gray-400 text-sm mb-8 max-w-xl mx-auto">
            Not just &ldquo;find bug, file ticket.&rdquo; Every defect is a node in a compliance
            graph — traceable, risk-assessed, and auditable. That&apos;s what FDA-regulated
            software demands.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/projects/unified-automation-ai"
              className="px-6 py-3 bg-cyber-pink text-cyber-black font-bold rounded-md hover:brightness-110 transition-all flex items-center gap-2"
            >
              <Layers className="w-4 h-4" />
              View Full Framework
            </Link>
            <Link
              to="/"
              className="px-6 py-3 border-2 border-cyber-cyan text-cyber-cyan rounded-md hover:bg-cyber-cyan hover:text-cyber-black transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Portfolio
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
};
