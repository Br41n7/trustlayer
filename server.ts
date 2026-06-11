import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("trustlayer.db");

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    name TEXT,
    role TEXT,
    organization TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    category TEXT,
    total_budget REAL,
    disbursed_funds REAL DEFAULT 0,
    status TEXT DEFAULT 'proposed',
    location_lat REAL,
    location_lng REAL,
    risk_score INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS beneficiaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    full_name TEXT,
    national_id TEXT UNIQUE,
    phone TEXT,
    status TEXT DEFAULT 'pending', -- pending, validated, flagged
    ai_fraud_score INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    title TEXT,
    budget_allocation REAL,
    status TEXT DEFAULT 'pending',
    evidence_url TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    milestone_id INTEGER,
    amount REAL,
    sender TEXT,
    receiver TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    hash TEXT,
    type TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    type TEXT,
    severity TEXT,
    description TEXT,
    ai_explanation TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    user_id INTEGER,
    type TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT,
    status TEXT DEFAULT 'new',
    severity TEXT,
    threat_category TEXT,
    escalation_path TEXT,
    ai_analysis TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS financing_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_name TEXT,
    applicant_name TEXT,
    requested_amount REAL,
    purpose TEXT,
    status TEXT DEFAULT 'pending',
    risk_score INTEGER DEFAULT 0,
    ai_risk_analysis TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed initial data if empty
const userCount = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (email, name, role, organization) VALUES (?, ?, ?, ?)").run(
    "admin@trustlayer.africa", "Super Admin", "super_admin", "TrustLayer Global"
  );
  
  db.prepare("INSERT INTO projects (name, description, category, total_budget, status, location_lat, location_lng, risk_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
    "Lagos Clean Water Initiative", 
    "Providing sustainable water access to 50,000 residents in Ikorodu.", 
    "Water & Sanitation",
    500000, 
    "active", 
    6.6018, 
    3.3515,
    12
  );
  db.prepare("INSERT INTO projects (name, description, category, total_budget, status, location_lat, location_lng, risk_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
    "Rural Electrification Phase II", 
    "Solar grid installation for 20 off-grid communities in Northern Nigeria.", 
    "Energy",
    1200000, 
    "pending", 
    10.5105, 
    7.4165,
    45
  );
  db.prepare("INSERT INTO projects (name, description, category, total_budget, status, location_lat, location_lng, risk_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
    "Digital Literacy for Schools", 
    "Equipping 100 public schools with computer labs and high-speed internet.", 
    "Education",
    850000, 
    "active", 
    6.4531, 
    3.3958,
    8
  );

  // Add some milestones and transactions for the first project
  db.prepare("INSERT INTO milestones (project_id, title, budget_allocation, status) VALUES (?, ?, ?, ?)").run(1, "Site Survey & Planning", 50000, "completed");
  db.prepare("INSERT INTO milestones (project_id, title, budget_allocation, status) VALUES (?, ?, ?, ?)").run(1, "Borehole Drilling", 150000, "completed");
  db.prepare("INSERT INTO milestones (project_id, title, budget_allocation, status) VALUES (?, ?, ?, ?)").run(1, "Pump Installation", 200000, "pending");

  db.prepare("INSERT INTO transactions (project_id, milestone_id, amount, sender, receiver, hash, type) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    1, 1, 50000, "Ministry of Finance", "Surveyors Ltd", "0x7a2b...c3d4", "Disbursement"
  );
  db.prepare("INSERT INTO transactions (project_id, milestone_id, amount, sender, receiver, hash, type) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    1, 2, 150000, "Ministry of Finance", "DrillCorp Africa", "0x9e1f...a8b2", "Disbursement"
  );

  db.prepare("UPDATE projects SET disbursed_funds = 200000 WHERE id = 1");
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API Routes
  app.get("/api/projects", (req, res) => {
    const projects = db.prepare("SELECT * FROM projects").all();
    res.json(projects);
  });

  app.get("/api/projects/:id", (req, res) => {
    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
    const milestones = db.prepare("SELECT * FROM milestones WHERE project_id = ?").all(req.params.id);
    const transactions = db.prepare("SELECT * FROM transactions WHERE project_id = ?").all(req.params.id);
    const auditLogs = db.prepare("SELECT * FROM audit_logs WHERE project_id = ?").all(req.params.id);
    const beneficiaries = db.prepare("SELECT * FROM beneficiaries WHERE project_id = ?").all(req.params.id);
    res.json({ ...project, milestones, transactions, auditLogs, beneficiaries });
  });

  app.post("/api/projects", (req, res) => {
    const { name, description, category, total_budget, location_lat, location_lng } = req.body;
    const info = db.prepare("INSERT INTO projects (name, description, category, total_budget, location_lat, location_lng) VALUES (?, ?, ?, ?, ?, ?)").run(
      name, description, category, total_budget, location_lat, location_lng
    );
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/stats", (req, res) => {
    const totalProjects = db.prepare("SELECT count(*) as count FROM projects").get() as any;
    const totalBudget = db.prepare("SELECT sum(total_budget) as sum FROM projects").get() as any;
    const totalDisbursed = db.prepare("SELECT sum(disbursed_funds) as sum FROM projects").get() as any;
    const avgRisk = db.prepare("SELECT avg(risk_score) as avg FROM projects").get() as any;
    
    res.json({
      totalProjects: totalProjects.count,
      totalBudget: totalBudget.sum || 0,
      totalDisbursed: totalDisbursed.sum || 0,
      avgRisk: Math.round(avgRisk.avg || 0)
    });
  });

  app.post("/api/analyze-project/:id", async (req, res) => {
    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id) as any;
    const transactions = db.prepare("SELECT * FROM transactions WHERE project_id = ?").all(req.params.id);
    
    if (!project) return res.status(404).json({ error: "Project not found" });

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `Analyze this GovTech project for corruption risks:
      Project: ${project.name}
      Description: ${project.description}
      Budget: $${project.total_budget}
      Disbursed: $${project.disbursed_funds}
      Transactions: ${JSON.stringify(transactions)}
      
      Provide a risk score (0-100) and a brief explanation of potential risks (duplicate payments, inflated costs, etc.).
      Format: JSON with "score" and "explanation" fields.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || "{}");
      
      db.prepare("UPDATE projects SET risk_score = ? WHERE id = ?").run(result.score, req.params.id);
      db.prepare("INSERT INTO audit_logs (project_id, type, severity, description, ai_explanation) VALUES (?, ?, ?, ?, ?)").run(
        req.params.id, "AI_ANALYSIS", result.score > 50 ? "high" : "low", "Automated risk assessment", result.explanation
      );

      res.json(result);
    } catch (error) {
      console.error("AI Analysis Error:", error);
      res.status(500).json({ error: "Failed to perform AI analysis" });
    }
  });

  app.post("/api/whistleblower", async (req, res) => {
    const { content } = req.body;
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `Analyze this whistleblower report for a GovTech platform:
      Report Content: "${content}"
      
      Classify the report based on:
      1. Severity: low, medium, high, critical
      2. Threat Category: corruption, fraud, safety, policy, other
      3. Escalation Path: Who should handle this? (e.g., Anti-Corruption Bureau, Internal Audit, National Police, Project Manager)
      4. AI Analysis: A brief explanation of why it was classified this way.
      
      Format: JSON with "severity", "threat_category", "escalation_path", and "ai_analysis" fields.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || "{}");
      
      const info = db.prepare(`
        INSERT INTO reports (content, severity, threat_category, escalation_path, ai_analysis) 
        VALUES (?, ?, ?, ?, ?)
      `).run(
        content, 
        result.severity || 'medium', 
        result.threat_category || 'other', 
        result.escalation_path || 'Internal Audit', 
        result.ai_analysis || 'Automated classification'
      );

      res.json({ id: info.lastInsertRowid, ...result });
    } catch (error) {
      console.error("Whistleblower AI Error:", error);
      // Fallback if AI fails
      const info = db.prepare("INSERT INTO reports (content, severity) VALUES (?, ?)").run(content, 'medium');
      res.json({ id: info.lastInsertRowid, severity: 'medium', threat_category: 'unknown', escalation_path: 'Internal Audit' });
    }
  });

  app.get("/api/reports", (req, res) => {
    const reports = db.prepare("SELECT * FROM reports ORDER BY timestamp DESC").all();
    res.json(reports);
  });

  app.post("/api/projects/:id/beneficiaries", async (req, res) => {
    const { full_name, national_id, phone } = req.body;
    const projectId = req.params.id;

    // Check for duplicates
    const existing = db.prepare("SELECT * FROM beneficiaries WHERE national_id = ?").get(national_id);
    if (existing) {
      return res.status(400).json({ error: "Beneficiary with this National ID already exists (Potential Fraud)" });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `Analyze this beneficiary for potential fraud in a GovTech project:
      Name: ${full_name}
      National ID: ${national_id}
      Phone: ${phone}
      
      Provide a fraud risk score (0-100) based on the likelihood of this being a fake or duplicate identity.
      Format: JSON with "score" field.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || "{}");
      const fraudScore = result.score || 0;

      const info = db.prepare(`
        INSERT INTO beneficiaries (project_id, full_name, national_id, phone, ai_fraud_score, status) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(projectId, full_name, national_id, phone, fraudScore, fraudScore > 70 ? 'flagged' : 'pending');

      res.json({ id: info.lastInsertRowid, fraudScore });
    } catch (error) {
      console.error("Beneficiary AI Error:", error);
      const info = db.prepare(`
        INSERT INTO beneficiaries (project_id, full_name, national_id, phone) 
        VALUES (?, ?, ?, ?)
      `).run(projectId, full_name, national_id, phone);
      res.json({ id: info.lastInsertRowid });
    }
  });

  app.patch("/api/beneficiaries/:id/validate", (req, res) => {
    const { status } = req.body;
    db.prepare("UPDATE beneficiaries SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ success: true });
  });

  app.get("/api/financing-applications", (req, res) => {
    const applications = db.prepare("SELECT * FROM financing_applications ORDER BY timestamp DESC").all();
    res.json(applications);
  });

  app.post("/api/financing-applications", (req, res) => {
    const { project_name, applicant_name, requested_amount, purpose } = req.body;
    const info = db.prepare(`
      INSERT INTO financing_applications (project_name, applicant_name, requested_amount, purpose)
      VALUES (?, ?, ?, ?)
    `).run(project_name, applicant_name, requested_amount, purpose);
    res.json({ id: info.lastInsertRowid });
  });

  app.post("/api/analyze-financing/:id", async (req, res) => {
    const application = db.prepare("SELECT * FROM financing_applications WHERE id = ?").get(req.params.id) as any;
    if (!application) return res.status(404).json({ error: "Application not found" });

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `Analyze this financing application for a GovTech project for corruption and credit risks:
      Project Name: ${application.project_name}
      Applicant: ${application.applicant_name}
      Amount Requested: $${application.requested_amount}
      Purpose: ${application.purpose}
      
      Provide a risk score (0-100) and a brief AI risk analysis (potential for embezzlement, feasibility, applicant history simulation).
      Format: JSON with "score" and "analysis" fields.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || "{}");
      
      db.prepare("UPDATE financing_applications SET risk_score = ?, ai_risk_analysis = ? WHERE id = ?").run(
        result.score, result.analysis, req.params.id
      );

      res.json(result);
    } catch (error) {
      console.error("Financing AI Analysis Error:", error);
      res.status(500).json({ error: "Failed to perform AI analysis" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
