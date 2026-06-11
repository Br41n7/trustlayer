import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  Globe, 
  Users, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  MapPin, 
  Search, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  DollarSign,
  Menu,
  ChevronRight,
  Fingerprint,
  Activity,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, Stats, AuditLog, Report, FinancingApplication } from './types';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-gov-accent text-white shadow-lg shadow-gov-accent/20' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-gov-blue'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium text-sm">{label}</span>
  </button>
);

const StatCard = ({ label, value, icon: Icon, trend }: { label: string, value: string | number, icon: any, trend?: string }) => (
  <div className="glass-card p-6 flex flex-col gap-4">
    <div className="flex justify-between items-start">
      <div className="p-2 bg-slate-50 rounded-lg text-gov-accent">
        <Icon size={24} />
      </div>
      {trend && (
        <span className={`text-xs font-bold ${trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
          {trend}
        </span>
      )}
    </div>
    <div>
      <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{label}</p>
      <h3 className="text-2xl font-bold mt-1">{value}</h3>
    </div>
  </div>
);

const ProjectCard = ({ project, onClick }: { project: Project, onClick: () => void | Promise<void>, key?: React.Key }) => (
  <div 
    onClick={() => { onClick(); }}
    className="glass-card p-5 hover:shadow-xl transition-all cursor-pointer group border-l-4 border-l-transparent hover:border-l-gov-accent"
  >
    <div className="flex justify-between items-start mb-4">
      <span className={`status-pill ${
        project.status === 'active' ? 'status-active' : 'status-pending'
      }`}>
        {project.status}
      </span>
      <div className="flex items-center gap-1 text-slate-400 text-xs">
        <MapPin size={12} />
        <span>Lagos, NG</span>
      </div>
    </div>
    <h4 className="font-bold text-lg mb-2 group-hover:text-gov-accent transition-colors">{project.name}</h4>
    <p className="text-slate-500 text-sm line-clamp-2 mb-4">{project.description}</p>
    
    <div className="space-y-3">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-slate-400">Budget Utilization</span>
        <span>{project.total_budget > 0 ? Math.round((project.disbursed_funds / project.total_budget) * 100) : 0}%</span>
      </div>
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div 
          className="bg-gov-accent h-full transition-all duration-1000" 
          style={{ width: `${project.total_budget > 0 ? (project.disbursed_funds / project.total_budget) * 100 : 0}%` }}
        />
      </div>
      <div className="flex justify-between items-center pt-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Risk Score</span>
          <span className={`text-sm font-bold ${project.risk_score > 50 ? 'text-rose-500' : 'text-emerald-500'}`}>
            {project.risk_score}/100
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Total Budget</span>
          <span className="text-sm font-bold">${project.total_budget.toLocaleString()}</span>
        </div>
      </div>
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLandingMenuOpen, setIsLandingMenuOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [submittedReportResult, setSubmittedReportResult] = useState<any>(null);
  const [financingApplications, setFinancingApplications] = useState<FinancingApplication[]>([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isFinancingModalOpen, setIsFinancingModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', category: 'Infrastructure', total_budget: 0, location_lat: 0, location_lng: 0 });
  const [newFinancing, setNewFinancing] = useState({ project_name: '', applicant_name: '', requested_amount: 0, purpose: '' });
  const [newBeneficiary, setNewBeneficiary] = useState({ full_name: '', national_id: '', phone: '' });
  const [isAddingBeneficiary, setIsAddingBeneficiary] = useState(false);
  const [beneficiaryError, setBeneficiaryError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    fetchReports();
    fetchFinancingApplications();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, statsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/stats')
      ]);
      const projectsData = await projectsRes.json();
      const statsData = await statsRes.json();
      setProjects(projectsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      setReports(data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  const fetchFinancingApplications = async () => {
    try {
      const res = await fetch('/api/financing-applications');
      const data = await res.json();
      setFinancingApplications(data);
    } catch (error) {
      console.error("Error fetching financing applications:", error);
    }
  };

  const handleCreateProject = async () => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      });
      if (res.ok) {
        setIsProjectModalOpen(false);
        setNewProject({ name: '', description: '', category: 'Infrastructure', total_budget: 0, location_lat: 0, location_lng: 0 });
        fetchData();
      }
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  const handleAddBeneficiary = async (projectId: number) => {
    setIsAddingBeneficiary(true);
    setBeneficiaryError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/beneficiaries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBeneficiary)
      });
      if (res.ok) {
        setNewBeneficiary({ full_name: '', national_id: '', phone: '' });
        handleProjectClick(projectId);
      } else {
        const errorData = await res.json();
        setBeneficiaryError(errorData.error || "Failed to add beneficiary");
      }
    } catch (error) {
      console.error("Error adding beneficiary:", error);
      setBeneficiaryError("Network error while adding beneficiary");
    } finally {
      setIsAddingBeneficiary(false);
    }
  };

  const handleValidateBeneficiary = async (projectId: number, beneficiaryId: number, status: string) => {
    try {
      const res = await fetch(`/api/beneficiaries/${beneficiaryId}/validate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        handleProjectClick(projectId);
      }
    } catch (error) {
      console.error("Error validating beneficiary:", error);
    }
  };

  const handleSubmitFinancing = async () => {
    try {
      const res = await fetch('/api/financing-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFinancing)
      });
      if (res.ok) {
        setIsFinancingModalOpen(false);
        setNewFinancing({ project_name: '', applicant_name: '', requested_amount: 0, purpose: '' });
        fetchFinancingApplications();
      }
    } catch (error) {
      console.error("Error submitting financing:", error);
    }
  };

  const analyzeFinancing = async (id: number) => {
    setIsAnalyzing(true);
    try {
      await fetch(`/api/analyze-financing/${id}`, { method: 'POST' });
      fetchFinancingApplications();
    } catch (error) {
      console.error("Financing analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleProjectClick = async (id: number) => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      const data = await res.json();
      setSelectedProject(data);
    } catch (error) {
      console.error("Error fetching project details:", error);
    }
  };

  const analyzeProject = async (id: number) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch(`/api/analyze-project/${id}`, { method: 'POST' });
      const result = await res.json();
      // Refresh data
      await fetchData();
      await handleProjectClick(id);
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Global Oversight</h2>
          <p className="text-slate-500 mt-1">Real-time transparency and fund efficiency metrics.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50">
            <FileText size={16} /> Export Report
          </button>
          <button 
            onClick={() => setIsProjectModalOpen(true)}
            className="px-4 py-2 bg-gov-accent text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90 shadow-lg shadow-gov-accent/20"
          >
            <Plus size={16} /> New Project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Projects" value={stats?.totalProjects || 0} icon={Globe} trend="+2 this month" />
        <StatCard label="Total Budget" value={`$${(stats?.totalBudget || 0).toLocaleString()}`} icon={DollarSign} />
        <StatCard label="Funds Disbursed" value={`$${(stats?.totalDisbursed || 0).toLocaleString()}`} icon={TrendingUp} trend="84% Efficiency" />
        <StatCard label="Avg. Risk Score" value={`${stats?.avgRisk || 0}/100`} icon={ShieldCheck} trend="-5% vs last qtr" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Active Projects</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search projects..." 
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gov-accent/20"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} onClick={() => handleProjectClick(project.id)} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold">Recent Anomalies</h3>
          <div className="glass-card p-6 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="p-2 bg-rose-50 text-rose-500 rounded-lg h-fit">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h5 className="font-bold text-sm">Potential Double Payment</h5>
                  <p className="text-xs text-slate-500 mt-1">Vendor ID #9921 received duplicate disbursement for Milestone 2.</p>
                  <span className="text-[10px] text-slate-400 mt-2 block">2 hours ago • Project Alpha</span>
                </div>
              </div>
            ))}
            <button className="w-full py-2 text-gov-accent text-sm font-bold hover:underline">View All Alerts</button>
          </div>

          <h3 className="text-xl font-bold">Civic Sentiment</h3>
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Public Trust Index</span>
              <span className="text-sm font-bold text-emerald-500">72%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[72%]" />
            </div>
            <p className="text-xs text-slate-500 mt-4 italic">"Transparency has improved significantly since the deployment of TrustLayer in the Lagos region."</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProjectDetail = () => {
    if (!selectedProject) return null;
    return (
      <div className="space-y-8">
        <button 
          onClick={() => setSelectedProject(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-gov-blue font-medium transition-colors"
        >
          <ArrowRight className="rotate-180" size={18} /> Back to Dashboard
        </button>

        <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-4xl font-bold tracking-tight">{selectedProject.name}</h2>
              <span className={`status-pill ${selectedProject.status === 'active' ? 'status-active' : 'status-pending'}`}>
                {selectedProject.status}
              </span>
            </div>
            <p className="text-slate-500 text-lg max-w-2xl">{selectedProject.description}</p>
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 uppercase font-bold">Category</span>
                <span className="font-medium flex items-center gap-1"><Globe size={14} /> {selectedProject.category}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 uppercase font-bold">Location</span>
                <span className="font-medium flex items-center gap-1"><MapPin size={14} /> Lagos, Nigeria</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 uppercase font-bold">Organization</span>
                <span className="font-medium flex items-center gap-1"><Users size={14} /> UNICEF Partner</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 uppercase font-bold">Created</span>
                <span className="font-medium flex items-center gap-1"><Clock size={14} /> {new Date(selectedProject.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-80 glass-card p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="font-bold">AI Risk Assessment</h4>
              <button 
                onClick={() => analyzeProject(selectedProject.id)}
                disabled={isAnalyzing}
                className="p-2 bg-gov-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {isAnalyzing ? <Activity className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-black ${selectedProject.risk_score > 50 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {selectedProject.risk_score}
              </div>
              <div className="flex-1">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${selectedProject.risk_score > 50 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${selectedProject.risk_score}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Corruption Risk Score</p>
              </div>
            </div>
            {selectedProject.auditLogs && selectedProject.auditLogs.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-bold">AI Insight:</span> {selectedProject.auditLogs[selectedProject.auditLogs.length - 1].ai_explanation}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Users className="text-gov-accent" size={20} /> Beneficiary Tracking & Fraud Monitoring
              </h3>
              <div className="glass-card p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
                    <input 
                      type="text" 
                      value={newBeneficiary.full_name}
                      onChange={e => setNewBeneficiary({...newBeneficiary, full_name: e.target.value})}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">National ID</label>
                    <input 
                      type="text" 
                      value={newBeneficiary.national_id}
                      onChange={e => setNewBeneficiary({...newBeneficiary, national_id: e.target.value})}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      placeholder="ID-12345678"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Phone</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newBeneficiary.phone}
                        onChange={e => setNewBeneficiary({...newBeneficiary, phone: e.target.value})}
                        className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        placeholder="+234..."
                      />
                      <button 
                        onClick={() => handleAddBeneficiary(selectedProject.id)}
                        disabled={isAddingBeneficiary || !newBeneficiary.full_name || !newBeneficiary.national_id}
                        className="px-4 py-2 bg-gov-accent text-white rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-50"
                      >
                        {isAddingBeneficiary ? <Activity className="animate-spin" size={16} /> : "Add"}
                      </button>
                    </div>
                  </div>
                </div>
                {beneficiaryError && (
                  <p className="text-xs text-rose-500 font-bold flex items-center gap-1">
                    <AlertTriangle size={12} /> {beneficiaryError}
                  </p>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Name</th>
                        <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">National ID</th>
                        <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">AI Fraud Score</th>
                        <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Status</th>
                        <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedProject.beneficiaries?.map(b => (
                        <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-medium">{b.full_name}</td>
                          <td className="px-4 py-3 text-slate-500">{b.national_id}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${b.ai_fraud_score > 50 ? 'text-rose-500' : 'text-emerald-500'}`}>{b.ai_fraud_score}</span>
                              <div className="w-12 bg-slate-100 h-1 rounded-full overflow-hidden">
                                <div className={`h-full ${b.ai_fraud_score > 50 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${b.ai_fraud_score}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`status-pill ${b.status === 'validated' ? 'status-active' : b.status === 'flagged' ? 'status-risk' : 'status-pending'}`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {b.status === 'pending' && (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleValidateBeneficiary(selectedProject.id, b.id, 'validated')}
                                  className="text-emerald-500 hover:underline font-bold"
                                >
                                  Validate
                                </button>
                                <button 
                                  onClick={() => handleValidateBeneficiary(selectedProject.id, b.id, 'flagged')}
                                  className="text-rose-500 hover:underline font-bold"
                                >
                                  Flag
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {(!selectedProject.beneficiaries || selectedProject.beneficiaries.length === 0) && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">No beneficiaries registered for this project.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="text-gov-accent" size={20} /> Project Milestones
              </h3>
              <div className="space-y-3">
                {selectedProject.milestones?.map(m => (
                  <div key={m.id} className="glass-card p-4 flex justify-between items-center">
                    <div>
                      <h5 className="font-bold">{m.title}</h5>
                      <p className="text-xs text-slate-500 mt-1">Allocation: ${m.budget_allocation.toLocaleString()}</p>
                    </div>
                    <span className={`status-pill ${m.status === 'completed' ? 'status-active' : 'status-pending'}`}>
                      {m.status}
                    </span>
                  </div>
                ))}
                {(!selectedProject.milestones || selectedProject.milestones.length === 0) && (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 text-sm">No milestones defined for this project.</p>
                    <button className="mt-2 text-gov-accent text-sm font-bold hover:underline">+ Add First Milestone</button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Fingerprint className="text-gov-accent" size={20} /> Immutable Ledger (Blockchain)
              </h3>
              <div className="glass-card overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3 font-bold text-slate-500 uppercase text-[10px]">Hash</th>
                      <th className="px-6 py-3 font-bold text-slate-500 uppercase text-[10px]">Type</th>
                      <th className="px-6 py-3 font-bold text-slate-500 uppercase text-[10px]">Amount</th>
                      <th className="px-6 py-3 font-bold text-slate-500 uppercase text-[10px]">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedProject.transactions?.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-[10px] text-slate-400">{t.hash.substring(0, 12)}...</td>
                        <td className="px-6 py-4 font-medium">{t.type}</td>
                        <td className="px-6 py-4 font-bold">${t.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-slate-500">{new Date(t.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                    {(!selectedProject.transactions || selectedProject.transactions.length === 0) && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">No transactions recorded on the ledger.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <ShieldCheck className="text-gov-accent" size={20} /> AI Audit Logs
              </h3>
              <div className="space-y-3">
                {selectedProject.auditLogs?.slice().reverse().map(log => (
                  <div key={log.id} className="glass-card p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{log.type}</span>
                        <span className={`status-pill ${log.severity === 'high' ? 'status-risk' : 'status-active'}`}>
                          {log.severity}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {log.ai_explanation}
                    </p>
                  </div>
                ))}
                {(!selectedProject.auditLogs || selectedProject.auditLogs.length === 0) && (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 text-sm">No AI audit logs available. Run an analysis to generate one.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold">Project Impact</h3>
            <div className="glass-card p-6 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Beneficiaries Reached</span>
                  <span className="font-bold">12,400 / 50,000</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-gov-accent h-full w-[24%]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Infrastructure Built</span>
                  <span className="font-bold">3 / 10 Units</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-gov-accent h-full w-[30%]" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <h5 className="text-xs font-bold text-slate-400 uppercase mb-3">Geo-Tagged Evidence</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden relative group">
                    <img src="https://picsum.photos/seed/water1/200/200" alt="Evidence" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <MapPin size={16} className="text-white" />
                    </div>
                  </div>
                  <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden relative group">
                    <img src="https://picsum.photos/seed/water2/200/200" alt="Evidence" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <MapPin size={16} className="text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWhistleblower = () => {
    const handleSubmitReport = async () => {
      if (!reportContent.trim()) return;
      setIsSubmittingReport(true);
      try {
        const res = await fetch('/api/whistleblower', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: reportContent })
        });
        const result = await res.json();
        setSubmittedReportResult(result);
        setReportContent('');
        fetchReports();
      } catch (error) {
        console.error("Report submission error:", error);
      } finally {
        setIsSubmittingReport(false);
      }
    };

    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 bg-rose-50 text-rose-500 rounded-full mb-4">
            <ShieldCheck size={48} />
          </div>
          <h2 className="text-4xl font-bold tracking-tight">Safe Channel</h2>
          <p className="text-slate-500">Anonymous, encrypted reporting for corruption and mismanagement. Your identity is protected by end-to-end encryption.</p>
        </div>

        <AnimatePresence mode="wait">
          {submittedReportResult ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-8 space-y-6 border-emerald-200 bg-emerald-50/30"
            >
              <div className="flex items-center gap-3 text-emerald-600">
                <CheckCircle2 size={24} />
                <h3 className="text-xl font-bold">Report Submitted Securely</h3>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-xl border border-emerald-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-slate-400">AI Threat Classification</span>
                    <span className={`status-pill ${submittedReportResult.severity === 'critical' || submittedReportResult.severity === 'high' ? 'status-risk' : 'status-active'}`}>
                      {submittedReportResult.severity}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Category</p>
                      <p className="text-sm font-medium capitalize">{submittedReportResult.threat_category}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Escalation Path</p>
                      <p className="text-sm font-medium">{submittedReportResult.escalation_path}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-50">
                    <p className="text-xs text-slate-600 italic">"{submittedReportResult.ai_analysis}"</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 text-center">Your report ID is <span className="font-mono font-bold">#{submittedReportResult.id}</span>. Save this for your records.</p>
                <button 
                  onClick={() => setSubmittedReportResult(null)}
                  className="w-full py-3 bg-gov-blue text-white rounded-xl font-bold hover:opacity-90"
                >
                  Submit Another Report
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-8 space-y-6"
            >
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Detailed Report</label>
                <textarea 
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                  placeholder="Describe the incident, including dates, locations, and individuals involved..." 
                  className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gov-accent/20"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Severity Level (Self-Reported)</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none">
                    <option>Low - Minor Mismanagement</option>
                    <option>Medium - Policy Violation</option>
                    <option>High - Corruption/Fraud</option>
                    <option>Critical - Immediate Danger</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Evidence (Optional)</label>
                  <button className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-sm flex items-center justify-center gap-2">
                    <Plus size={16} /> Upload Files
                  </button>
                </div>
              </div>
              <button 
                onClick={handleSubmitReport}
                disabled={isSubmittingReport || !reportContent.trim()}
                className="w-full py-4 bg-gov-blue text-white rounded-xl font-bold hover:opacity-90 shadow-xl shadow-gov-blue/20 transition-all disabled:opacity-50"
              >
                {isSubmittingReport ? <Activity className="animate-spin mx-auto" size={24} /> : 'Submit Encrypted Report'}
              </button>
              <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest font-bold">
                Protected by TrustLayer Zero-Knowledge Proofs
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderReports = () => {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Admin Reports Center</h2>
            <p className="text-slate-500">Review and manage whistleblower submissions and AI-flagged anomalies.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold flex items-center gap-2">
              <FileText size={16} /> Export CSV
            </button>
            <button onClick={fetchReports} className="px-4 py-2 bg-gov-blue text-white rounded-lg text-sm font-bold flex items-center gap-2">
              <Activity size={16} /> Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Total Reports" value={reports.length.toString()} icon={FileText} trend="+12% this week" />
          <StatCard label="Critical Threats" value={reports.filter(r => r.severity === 'critical').length.toString()} icon={AlertTriangle} trend="AI Escalated" />
          <StatCard label="Resolved" value="0" icon={CheckCircle2} trend="Awaiting Action" />
        </div>

        <div className="glass-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">ID</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Category</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Severity</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">AI Analysis</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Timestamp</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map(report => (
                <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-[10px]">#{report.id}</td>
                  <td className="px-6 py-4 font-medium capitalize">{report.threat_category}</td>
                  <td className="px-6 py-4">
                    <span className={`status-pill ${report.severity === 'critical' || report.severity === 'high' ? 'status-risk' : 'status-active'}`}>
                      {report.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate text-slate-500 italic">"{report.ai_analysis}"</td>
                  <td className="px-6 py-4 text-slate-400">{new Date(report.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <button className="text-gov-accent font-bold hover:underline">Review</button>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No reports found in the database.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderFinancing = () => {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Impact Financing</h2>
            <p className="text-slate-500">Apply for project funding and track application status with AI risk assessment.</p>
          </div>
          <button 
            onClick={() => setIsFinancingModalOpen(true)}
            className="px-6 py-3 bg-gov-accent text-white rounded-xl font-bold hover:opacity-90 shadow-lg shadow-gov-accent/20 flex items-center gap-2"
          >
            <Plus size={20} /> New Application
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Active Applications" value={financingApplications.length.toString()} icon={FileText} trend="In Review" />
          <StatCard label="Total Requested" value={`$${financingApplications.reduce((acc, curr) => acc + curr.requested_amount, 0).toLocaleString()}`} icon={DollarSign} />
          <StatCard label="Avg Risk Score" value={`${Math.round(financingApplications.reduce((acc, curr) => acc + curr.risk_score, 0) / (financingApplications.length || 1))}/100`} icon={ShieldCheck} />
        </div>

        <div className="glass-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Project</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Applicant</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Amount</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">AI Risk</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Status</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {financingApplications.map(app => (
                <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold">{app.project_name}</td>
                  <td className="px-6 py-4 text-slate-600">{app.applicant_name}</td>
                  <td className="px-6 py-4 font-bold">${app.requested_amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${app.risk_score > 50 ? 'text-rose-500' : 'text-emerald-500'}`}>{app.risk_score}</span>
                      <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full ${app.risk_score > 50 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${app.risk_score}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`status-pill ${app.status === 'approved' ? 'status-active' : app.status === 'rejected' ? 'status-risk' : 'status-pending'}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => analyzeFinancing(app.id)}
                      disabled={isAnalyzing}
                      className="text-gov-accent font-bold hover:underline flex items-center gap-1"
                    >
                      {isAnalyzing ? <Activity size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Analyze
                    </button>
                  </td>
                </tr>
              ))}
              {financingApplications.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No financing applications found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderLanding = () => (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gov-accent rounded-xl flex items-center justify-center text-white font-black italic shadow-lg shadow-gov-accent/20">T</div>
            <h1 className="text-2xl font-black tracking-tighter text-gov-blue">TrustLayer</h1>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
            <a href="#features" className="hover:text-gov-accent transition-colors">Features</a>
            <a href="#impact" className="hover:text-gov-accent transition-colors">Impact</a>
            <a href="#security" className="hover:text-gov-accent transition-colors">Security</a>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="px-6 py-2.5 bg-gov-blue text-white rounded-xl font-bold hover:bg-gov-blue/90 transition-all shadow-lg shadow-gov-blue/20"
            >
              Enter Platform
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsLandingMenuOpen(!isLandingMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {isLandingMenuOpen ? <Plus className="rotate-45" size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isLandingMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-slate-100 overflow-hidden"
            >
              <div className="flex flex-col p-6 gap-4 text-sm font-bold text-slate-600">
                <a href="#features" onClick={() => setIsLandingMenuOpen(false)} className="py-2 hover:text-gov-accent">Features</a>
                <a href="#impact" onClick={() => setIsLandingMenuOpen(false)} className="py-2 hover:text-gov-accent">Impact</a>
                <a href="#security" onClick={() => setIsLandingMenuOpen(false)} className="py-2 hover:text-gov-accent">Security</a>
                <button 
                  onClick={() => { setActiveTab('dashboard'); setIsLandingMenuOpen(false); }}
                  className="w-full py-4 bg-gov-blue text-white rounded-xl font-bold shadow-lg shadow-gov-blue/20"
                >
                  Enter Platform
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="px-6 pt-12 md:pt-20 pb-24 md:pb-32 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 md:space-y-8 text-center lg:text-left"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gov-accent/10 text-gov-accent rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest mx-auto lg:mx-0">
            <ShieldCheck size={14} /> AI-Powered Governance
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] text-gov-blue">
            Radical <span className="text-gov-accent italic">Transparency</span> for Public Trust.
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-lg leading-relaxed mx-auto lg:mx-0">
            TrustLayer uses blockchain and AI to monitor public infrastructure projects in real-time, preventing corruption and ensuring every dollar reaches its destination.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="px-8 py-4 bg-gov-blue text-white rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-gov-blue/30 flex items-center justify-center gap-2"
            >
              Launch Dashboard <ArrowRight size={20} />
            </button>
            <button className="px-8 py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              View Public Ledger
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 md:gap-8 pt-8 border-t border-slate-100">
            <div>
              <p className="text-2xl md:text-3xl font-black text-gov-blue">$2.4B+</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Funds Monitored</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-gov-blue">142</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Projects</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-gov-blue">0.02%</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Risk Variance</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative mt-12 lg:mt-0"
        >
          <div className="absolute -inset-4 bg-gov-accent/10 blur-3xl rounded-full" />
          <div className="relative glass-card p-4 border-slate-200/50 shadow-2xl overflow-hidden">
            <div className="bg-slate-900 rounded-xl p-6 text-white space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-gov-accent" />
                  <span className="text-xs font-bold uppercase tracking-widest opacity-50">Live Audit Stream</span>
                </div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + (i * 0.1) }}
                    className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-gov-accent/20 flex items-center justify-center text-gov-accent">
                        <Fingerprint size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold">TX_AUDIT_{8234 + i}</p>
                        <p className="text-[10px] opacity-50">Verified via ZK-Proof</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-400">PASSED</p>
                      <p className="text-[10px] opacity-50">Just now</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] opacity-50 uppercase font-bold mb-1">Total Integrity Score</p>
                    <p className="text-4xl font-black italic">98.4%</p>
                  </div>
                  <div className="h-12 w-24 bg-gov-accent/20 rounded relative overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '75%' }}
                      transition={{ duration: 1, delay: 0.8 }}
                      className="absolute inset-0 bg-gov-accent/40" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Partners / Trust Section */}
      <section className="px-6 py-12 border-y border-slate-100 bg-slate-50/50 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-8">Trusted by Global Institutions</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale hover:grayscale-0 transition-all">
            <div className="flex items-center gap-2 font-black text-xl tracking-tighter">UNICEF</div>
            <div className="flex items-center gap-2 font-black text-xl tracking-tighter">WORLD BANK</div>
            <div className="flex items-center gap-2 font-black text-xl tracking-tighter">UNDP</div>
            <div className="flex items-center gap-2 font-black text-xl tracking-tighter">USAID</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="px-6 py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gov-blue">Built for the <span className="text-gov-accent">Next Generation</span> of Governance.</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">We combine cutting-edge technology with human-centric design to solve the world's most difficult transparency challenges.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: ShieldCheck, 
                title: "AI-Driven Auditing", 
                desc: "Continuous automated risk assessment of every transaction, milestone, and procurement process.",
                color: "bg-gov-accent/10 text-gov-accent"
              },
              { 
                icon: Globe, 
                title: "Public Ledger", 
                desc: "Immutable blockchain record of all public funds, accessible to every citizen for total accountability.",
                color: "bg-gov-blue/10 text-gov-blue"
              },
              { 
                icon: AlertTriangle, 
                title: "Safe Channel", 
                desc: "Encrypted, anonymous reporting for whistleblowers with AI-powered threat classification.",
                color: "bg-rose-500/10 text-rose-500"
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -8 }}
                className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section id="impact" className="px-6 py-24 md:py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="absolute -inset-4 bg-gov-blue/5 blur-3xl rounded-full" />
            <div className="relative glass-card p-8 space-y-8">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Real-World Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-2xl border border-slate-100">
                    <p className="text-3xl font-black text-gov-blue">94%</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Reduction in Fraud</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-100">
                    <p className="text-3xl font-black text-gov-blue">3.2x</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Faster Fund Release</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <p className="text-sm font-bold">Project Completion Rate</p>
                  <p className="text-2xl font-black text-gov-accent">88%</p>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: '88%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="bg-gov-accent h-full" 
                  />
                </div>
              </div>
              <div className="p-4 bg-gov-blue rounded-2xl text-white flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold opacity-60 uppercase">Impact Score</p>
                  <p className="text-xl font-black italic">A+ Verified</p>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gov-blue/10 text-gov-blue rounded-full text-xs font-bold uppercase tracking-widest">
              <TrendingUp size={14} /> Measured Impact
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gov-blue leading-tight">Moving from <span className="text-gov-accent">Promises</span> to Proven Results.</h2>
            <p className="text-slate-500 text-lg leading-relaxed">
              TrustLayer doesn't just track money; it tracks outcomes. Our platform links fund disbursement directly to verified project milestones, ensuring that impact is not just claimed, but proven.
            </p>
            <ul className="space-y-4">
              {[
                "Real-time citizen feedback loops",
                "Satellite-verified infrastructure progress",
                "Automated social impact reporting",
                "Donor-to-beneficiary direct tracking"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <div className="w-5 h-5 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={12} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="px-6 py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/10 text-rose-500 rounded-full text-xs font-bold uppercase tracking-widest">
              <ShieldCheck size={14} /> Military-Grade Security
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gov-blue leading-tight">Your Data, <span className="text-gov-accent">Sovereign</span> and Secure.</h2>
            <p className="text-slate-500 text-lg leading-relaxed">
              We employ state-of-the-art cryptographic protocols to ensure that public data remains immutable while protecting the anonymity of whistleblowers and sensitive government operations.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gov-blue font-bold">
                  <Fingerprint size={20} className="text-gov-accent" />
                  <span>Zero-Knowledge Proofs</span>
                </div>
                <p className="text-xs text-slate-500">Verify transactions without revealing sensitive underlying data.</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gov-blue font-bold">
                  <Globe size={20} className="text-gov-accent" />
                  <span>Decentralized Ledger</span>
                </div>
                <p className="text-xs text-slate-500">No single point of failure. Data is distributed across a global network.</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-rose-500/5 blur-3xl rounded-full" />
            <div className="relative glass-card p-1 overflow-hidden border-slate-200">
              <div className="bg-slate-50 p-8 rounded-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800">Security Audit Log</h4>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "End-to-End Encryption", status: "Active", color: "text-emerald-500" },
                    { label: "Multi-Sig Authorization", status: "Verified", color: "text-emerald-500" },
                    { label: "AI Threat Detection", status: "Monitoring", color: "text-gov-accent" },
                    { label: "Quantum-Resistant Hashes", status: "Enabled", color: "text-emerald-500" }
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-600">{item.label}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${item.color}`}>{item.status}</span>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-gov-blue/5 rounded-xl border border-gov-blue/10">
                  <p className="text-[10px] text-gov-blue font-bold uppercase tracking-widest mb-1">System Integrity</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-gov-blue/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: '100%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 2 }}
                        className="bg-gov-blue h-full" 
                      />
                    </div>
                    <span className="text-xs font-black text-gov-blue">100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24 bg-gov-blue relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gov-accent/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-tight">Ready to restore <span className="text-gov-accent italic">public trust</span>?</h2>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto">Join the growing network of transparent governments and NGOs using TrustLayer to build a more accountable future.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="px-10 py-5 bg-white text-gov-blue rounded-2xl font-black text-lg hover:bg-slate-50 transition-all shadow-2xl"
            >
              Get Started Now
            </button>
            <button className="px-10 py-5 bg-transparent border-2 border-white/20 text-white rounded-2xl font-black text-lg hover:bg-white/5 transition-all">
              Request a Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-16 bg-white max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gov-accent rounded-xl flex items-center justify-center text-white font-black italic shadow-lg shadow-gov-accent/20">T</div>
              <h1 className="text-2xl font-black tracking-tighter text-gov-blue">TrustLayer</h1>
            </div>
            <p className="text-slate-500 max-w-xs leading-relaxed">The world's first AI-powered infrastructure for radical transparency in public funding.</p>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Platform</h4>
            <ul className="space-y-2 text-sm font-bold text-slate-600">
              <li><a href="#" className="hover:text-gov-accent">Projects</a></li>
              <li><a href="#" className="hover:text-gov-accent">Audit Center</a></li>
              <li><a href="#" className="hover:text-gov-accent">Impact Financing</a></li>
              <li><a href="#" className="hover:text-gov-accent">Civic Hub</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Company</h4>
            <ul className="space-y-2 text-sm font-bold text-slate-600">
              <li><a href="#" className="hover:text-gov-accent">About Us</a></li>
              <li><a href="#" className="hover:text-gov-accent">Compliance</a></li>
              <li><a href="#" className="hover:text-gov-accent">Partners</a></li>
              <li><a href="#" className="hover:text-gov-accent">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">© 2026 TrustLayer Global. All Rights Reserved.</p>
          <div className="flex gap-8 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <a href="#" className="hover:text-gov-accent">Privacy Policy</a>
            <a href="#" className="hover:text-gov-accent">Terms of Service</a>
            <a href="#" className="hover:text-gov-accent">Cookie Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );

  if (activeTab === 'landing') {
    return renderLanding();
  }

  return (
    <div className="min-h-screen flex bg-gov-bg">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="bg-white border-r border-slate-200 overflow-hidden hidden lg:block sticky top-0 h-screen"
      >
        <div className="p-8 flex flex-col h-full">
          <div 
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-2 mb-12 cursor-pointer group"
          >
            <div className="w-8 h-8 bg-gov-accent rounded-lg flex items-center justify-center text-white font-black italic group-hover:scale-110 transition-transform">T</div>
            <h1 className="text-xl font-black tracking-tighter text-gov-blue">TrustLayer</h1>
          </div>

          <nav className="space-y-2 flex-1">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setSelectedProject(null); }} />
            <SidebarItem icon={Globe} label="Public Projects" active={activeTab === 'projects'} onClick={() => { setActiveTab('projects'); setSelectedProject(null); }} />
            <SidebarItem icon={ShieldCheck} label="AI Audit Center" active={activeTab === 'audit'} onClick={() => { setActiveTab('audit'); setSelectedProject(null); }} />
            <SidebarItem icon={TrendingUp} label="Impact Financing" active={activeTab === 'financing'} onClick={() => { setActiveTab('financing'); setSelectedProject(null); }} />
            <SidebarItem icon={Users} label="Civic Hub" active={activeTab === 'civic'} onClick={() => { setActiveTab('civic'); setSelectedProject(null); }} />
            <div className="pt-4 mt-4 border-t border-slate-100">
              <SidebarItem icon={AlertTriangle} label="Safe Channel" active={activeTab === 'whistleblower'} onClick={() => { setActiveTab('whistleblower'); setSelectedProject(null); }} />
              <SidebarItem icon={FileText} label="Admin Reports" active={activeTab === 'reports'} onClick={() => { setActiveTab('reports'); setSelectedProject(null); }} />
            </div>
          </nav>

          <div className="mt-auto p-4 bg-slate-50 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gov-accent/10 flex items-center justify-center text-gov-accent">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs font-bold">Super Admin</p>
                <p className="text-[10px] text-slate-500">TrustLayer Global</p>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8 lg:hidden">
          <div 
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 bg-gov-accent rounded-lg flex items-center justify-center text-white font-black italic">T</div>
            <h1 className="text-xl font-black tracking-tighter text-gov-blue">TrustLayer</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-white rounded-lg border border-slate-200">
            <Menu size={20} />
          </button>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (selectedProject?.id || '')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {selectedProject ? renderProjectDetail() : (
              <>
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'whistleblower' && renderWhistleblower()}
                {activeTab === 'reports' && renderReports()}
                {activeTab === 'financing' && renderFinancing()}
                {activeTab !== 'dashboard' && activeTab !== 'whistleblower' && activeTab !== 'reports' && activeTab !== 'financing' && (
                  <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                    <div className="p-6 bg-white rounded-full shadow-xl">
                      <BarChart3 size={48} className="text-gov-accent" />
                    </div>
                    <h2 className="text-2xl font-bold">Module Under Construction</h2>
                    <p className="text-slate-500 max-w-md">We are currently deploying the {activeTab} infrastructure to the TrustLayer network.</p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Project Creation Modal */}
      <AnimatePresence>
        {isProjectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold">New Public Project</h3>
                  <button onClick={() => setIsProjectModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                    <Plus className="rotate-45" size={24} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Project Name</label>
                    <input 
                      type="text" 
                      value={newProject.name}
                      onChange={e => setNewProject({...newProject, name: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gov-accent/20"
                      placeholder="e.g. Lagos Water Initiative"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Category</label>
                    <select 
                      value={newProject.category}
                      onChange={e => setNewProject({...newProject, category: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gov-accent/20"
                    >
                      <option>Infrastructure</option>
                      <option>Water & Sanitation</option>
                      <option>Energy</option>
                      <option>Education</option>
                      <option>Healthcare</option>
                      <option>Agriculture</option>
                      <option>Digital Economy</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Description</label>
                    <textarea 
                      value={newProject.description}
                      onChange={e => setNewProject({...newProject, description: e.target.value})}
                      className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gov-accent/20"
                      placeholder="Project goals and impact..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">Total Budget ($)</label>
                      <input 
                        type="number" 
                        value={newProject.total_budget || ''}
                        onChange={e => setNewProject({...newProject, total_budget: Number(e.target.value)})}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gov-accent/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">Location (Lat, Lng)</label>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          placeholder="Lat"
                          onChange={e => setNewProject({...newProject, location_lat: Number(e.target.value)})}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gov-accent/20"
                        />
                        <input 
                          type="number" 
                          placeholder="Lng"
                          onChange={e => setNewProject({...newProject, location_lng: Number(e.target.value)})}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gov-accent/20"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleCreateProject}
                  className="w-full py-4 bg-gov-blue text-white rounded-2xl font-bold shadow-xl shadow-gov-blue/20 hover:opacity-90"
                >
                  Create Project & Deploy to Ledger
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Financing Application Modal */}
      <AnimatePresence>
        {isFinancingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold">Financing Application</h3>
                  <button onClick={() => setIsFinancingModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                    <Plus className="rotate-45" size={24} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Project Name</label>
                    <input 
                      type="text" 
                      value={newFinancing.project_name}
                      onChange={e => setNewFinancing({...newFinancing, project_name: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gov-accent/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Applicant Name / Org</label>
                    <input 
                      type="text" 
                      value={newFinancing.applicant_name}
                      onChange={e => setNewFinancing({...newFinancing, applicant_name: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gov-accent/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Requested Amount ($)</label>
                    <input 
                      type="number" 
                      value={newFinancing.requested_amount || ''}
                      onChange={e => setNewFinancing({...newFinancing, requested_amount: Number(e.target.value)})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gov-accent/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Purpose of Funds</label>
                    <textarea 
                      value={newFinancing.purpose}
                      onChange={e => setNewFinancing({...newFinancing, purpose: e.target.value})}
                      className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gov-accent/20"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleSubmitFinancing}
                  className="w-full py-4 bg-gov-accent text-white rounded-2xl font-bold shadow-xl shadow-gov-accent/20 hover:opacity-90"
                >
                  Submit Application for AI Review
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
