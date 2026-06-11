export interface Project {
  id: number;
  name: string;
  description: string;
  category: string;
  total_budget: number;
  disbursed_funds: number;
  status: string;
  location_lat: number;
  location_lng: number;
  risk_score: number;
  created_at: string;
  milestones?: Milestone[];
  transactions?: Transaction[];
  auditLogs?: AuditLog[];
  beneficiaries?: Beneficiary[];
}

export interface Milestone {
  id: number;
  project_id: number;
  title: string;
  budget_allocation: number;
  status: string;
  evidence_url: string;
}

export interface Transaction {
  id: number;
  project_id: number;
  milestone_id: number;
  amount: number;
  sender: string;
  receiver: string;
  timestamp: string;
  hash: string;
  type: string;
}

export interface AuditLog {
  id: number;
  project_id: number;
  type: string;
  severity: string;
  description: string;
  ai_explanation: string;
  timestamp: string;
}

export interface Stats {
  totalProjects: number;
  totalBudget: number;
  totalDisbursed: number;
  avgRisk: number;
}

export interface Report {
  id: number;
  content: string;
  status: string;
  severity: string;
  threat_category: string;
  escalation_path: string;
  ai_analysis: string;
  timestamp: string;
}

export interface FinancingApplication {
  id: number;
  project_name: string;
  applicant_name: string;
  requested_amount: number;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
  risk_score: number;
  ai_risk_analysis: string;
  timestamp: string;
}

export interface Beneficiary {
  id: number;
  project_id: number;
  full_name: string;
  national_id: string;
  phone: string;
  status: 'pending' | 'validated' | 'flagged';
  ai_fraud_score: number;
  created_at: string;
}
