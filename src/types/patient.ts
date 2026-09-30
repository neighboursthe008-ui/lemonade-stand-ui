/** Mirrors App\Http\Resources\PatientResource (Laravel). */
export interface Contact { name: string | null; phone: string | null; relationship: string | null }
export interface Patient {
  id: number;
  patient_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  full_name: string;
  date_of_birth: string | null;
  age: number | null;
  gender: "male" | "female" | "other" | null;
  phone: string;
  alternate_phone: string | null;
  email: string | null;
  address: string | null;
  emergency_contact: Contact;
  next_of_kin: Contact;
  referral_source: string | null;
  notes: string | null;
  allergies: string | null;
  medical_history: string | null;
  current_medications: string | null;
  blood_group: string | null;
  care_status: string | null;
  has_insurance: boolean;
  is_active: boolean;
  is_portal_active: boolean;
  outstanding_balance: string;
  branch_id: number;
  registered_at: string | null;
  created_at: string | null;
}

/** Body accepted by POST/PUT /api/v1/patients (PatientController::store/update validation). */
export interface PatientInput {
  first_name: string; middle_name?: string | null; last_name: string;
  date_of_birth?: string | null; gender?: "male" | "female" | "other" | null;
  phone: string; alternate_phone?: string | null; email?: string | null; address?: string | null;
  emergency_contact_name?: string | null; emergency_contact_phone?: string | null; emergency_contact_relationship?: string | null;
  next_of_kin_name?: string | null; next_of_kin_phone?: string | null; next_of_kin_relationship?: string | null;
  referral_source?: string | null; notes?: string | null; allergies?: string | null;
  medical_history?: string | null; current_medications?: string | null;
  blood_group?: string | null; has_insurance?: boolean; branch_id: number;
}

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export interface PatientListParams { page?: number; per_page?: number; search?: string; status?: "active" | "inactive" | ""; branch_id?: number | null; sort?: string; direction?: "asc" | "desc" }
export interface Page<T> { items: T[]; page: number; lastPage: number; total: number }

export interface ConsultationRow { id: number; consulted_at: string | null; reason: string | null; clinical_notes: string | null; status: string | null }
export interface PrescriptionRow { id: number; created_at?: string | null; status?: string | null; items?: { id: number; drug_name: string; dosage?: string | null; frequency?: string | null; duration?: string | null }[] }
export interface VitalRow { id: number; created_at?: string | null; bp?: string | null; pulse?: number | null; temperature?: string | number | null; weight?: string | number | null; oxygen_saturation?: number | null }
