/**
 * Fallback hospital specialty/department catalogue. NOT authoritative: once Laravel
 * implements GET /api/hospital/specialties (proposed), the server list replaces this.
 * Dental is one specialty among many.
 */
export interface Specialty { code: string; name: string; group: "Core care" | "Diagnostics & support" | "Specialist clinics"; summary: string; services: string[] }

export const SPECIALTIES_SOURCE = "fallback" as const; // becomes "api" when the Laravel endpoint is verified

export const specialties: Specialty[] = [
  { code: "OPD", name: "OPD / General Outpatient", group: "Core care", summary: "Walk-in and booked general consultations.", services: ["General consultation", "Review visit", "Medical certificate"] },
  { code: "ER", name: "Emergency / Casualty", group: "Core care", summary: "Triage on arrival and emergency treatment.", services: ["Triage", "Emergency consultation", "Observation"] },
  { code: "IPD", name: "Inpatient", group: "Core care", summary: "Admission to the wards with doctor rounds.", services: ["Admission", "Ward care", "Discharge planning"] },
  { code: "NUR", name: "Nursing", group: "Core care", summary: "Round-the-clock nursing, observations and medication rounds.", services: ["Nursing care", "Wound dressing", "Injections"] },
  { code: "MAT", name: "Maternity", group: "Core care", summary: "Antenatal, delivery and postnatal care.", services: ["Antenatal visit", "Delivery", "Postnatal check"] },
  { code: "OBG", name: "Obstetrics & Gynaecology", group: "Specialist clinics", summary: "Women's health and specialist pregnancy care.", services: ["Gynaecology consultation", "Family planning"] },
  { code: "PAED", name: "Paediatrics", group: "Core care", summary: "Care for babies, children and adolescents.", services: ["Child consultation", "Growth monitoring", "Immunisation"] },
  { code: "DEN", name: "Dental", group: "Specialist clinics", summary: "Check-ups, fillings, extractions, root canals and the full dental chart.", services: ["Dental consultation", "Scaling & polishing", "Filling", "Extraction", "Root canal"] },
  { code: "PHA", name: "Pharmacy", group: "Diagnostics & support", summary: "Prescriptions checked and dispensed by a pharmacist.", services: ["Prescription dispensing", "Medication counselling"] },
  { code: "LAB", name: "Laboratory", group: "Diagnostics & support", summary: "Sample collection and tests reported to your clinician.", services: ["Blood tests", "Urinalysis", "Microbiology"] },
  { code: "RAD", name: "Radiology / Imaging", group: "Diagnostics & support", summary: "Imaging requested by your clinician.", services: ["X-ray", "Ultrasound"] },
  { code: "THR", name: "Theatre / Surgery", group: "Core care", summary: "Scheduled and emergency procedures with recovery care.", services: ["Minor procedure", "Major procedure"] },
  { code: "PHY", name: "Physiotherapy", group: "Diagnostics & support", summary: "Rehabilitation and mobility sessions.", services: ["Physiotherapy session"] },
  { code: "NUT", name: "Nutrition / Dietetics", group: "Diagnostics & support", summary: "Dietary assessment and advice.", services: ["Nutrition consultation"] },
  { code: "MH", name: "Mental Health / Counselling", group: "Specialist clinics", summary: "Counselling and mental health support.", services: ["Counselling session"] },
  { code: "EYE", name: "Eye Clinic / Ophthalmology", group: "Specialist clinics", summary: "Eye examinations and eye care.", services: ["Eye examination"] },
  { code: "ENT", name: "ENT", group: "Specialist clinics", summary: "Ear, nose and throat care.", services: ["ENT consultation"] },
  { code: "DERM", name: "Dermatology", group: "Specialist clinics", summary: "Skin, hair and nail conditions.", services: ["Skin consultation"] },
  { code: "CARD", name: "Cardiology", group: "Specialist clinics", summary: "Heart health assessment.", services: ["Cardiology consultation", "ECG"] },
  { code: "GS", name: "General Surgery", group: "Specialist clinics", summary: "Surgical assessment and follow-up.", services: ["Surgical consultation"] },
  { code: "IM", name: "Internal Medicine", group: "Specialist clinics", summary: "Adult chronic and complex conditions.", services: ["Physician consultation"] },
  { code: "ORTH", name: "Orthopaedics", group: "Specialist clinics", summary: "Bones, joints and injuries.", services: ["Orthopaedic consultation"] },
  { code: "URO", name: "Urology", group: "Specialist clinics", summary: "Urinary and kidney conditions.", services: ["Urology consultation"] },
];
