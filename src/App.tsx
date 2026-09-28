import React, { useMemo, useRef, useState } from 'react';
import { FontIcon, Toggle } from '@fluentui/react';

type ModuleKey =
  | 'home'
  | 'architecture'
  | 'api'
  | 'database'
  | 'deployment'
  | 'troubleshooting'
  | 'code'
  | 'standards';

type KnowledgeResponse = {
  answer: string;
  module: string;
  sources: string[];
};

type AnswerSummary = {
  title: string;
  summary: string;
  bullets: string[];
};

type ModuleViewProps = Readonly<{
  selectedModule: ModuleKey;
  question: string;
  setQuestion: React.Dispatch<React.SetStateAction<string>>;
  handlePromptClick: (prompt: string) => void;
  currentAnswer: AnswerSummary;
  liveAnswer: KnowledgeResponse | null;
  showCitations: boolean;
  isLoading: boolean;
  error: string | null;
  handleAsk: () => Promise<void>;
}>;

type ModuleTabProps = Readonly<{
  currentAnswer: AnswerSummary;
  liveAnswer: KnowledgeResponse | null;
  showCitations: boolean;
  isLoading: boolean;
  error: string | null;
}>;

const samplePrompts: Record<ModuleKey, string[]> = {
  home: [
    'Give me a project overview',
    'What is the architecture summary?',
    'How do I start with this solution?',
  ],
  architecture: [
    'Explain EmbedFAST architecture',
    'How does authentication work?',
    'Show frontend flow and service interactions',
  ],
  api: [
    'What is the Export History API contract?',
    'How do I authenticate to the Reporting API?',
    'Show request and response schema for report export',
  ],
  database: [
    'Which tables are involved in ExportHistory?',
    'Explain the ExportHistory table schema',
    'What stored procedures are used in the export pipeline?',
  ],
  deployment: [
    'How do I deploy to DEV?',
    'What is the rollback process for UAT?',
    'Share the deployment validation checklist',
  ],
  troubleshooting: [
    'Why are Databricks alerts lagging?',
    'What should I check for a stuck LogWorkflow?',
    'How do I resolve Export failed incidents?',
  ],
  code: [
    'Where is Export Status implemented?',
    'Which files manage the export workflow?',
    'Show me the backend and repository flow for export status',
  ],
  standards: [
    'What are the React naming conventions?',
    'What are the SonarQube compliance rules?',
    'What is the recommended project folder structure?',
  ],
};

const answerMap: Record<ModuleKey, AnswerSummary> = {
  home: {
    title: 'Project overview',
    summary: 'This onboarding assistant brings together architecture, API, database, deployment, troubleshooting, and coding guidance in one place.',
    bullets: [
      'Use the navigation to switch between role-specific knowledge views.',
      'Ask project questions from the search box to get a guided answer.',
      'Browse sources and references for onboarding, issues, and best practices.',
    ],
  },
  architecture: {
    title: 'Architecture overview',
    summary: 'EmbedFAST follows a layered architecture where the UI, API services, orchestration layer, and data stores connect through defined contracts.',
    bullets: [
      'Frontend: React + Fluent UI orchestrates user experience and dashboard navigation.',
      'API layer: .NET services expose endpoints for export, history, authentication, and reporting.',
      'Data layer: SQL Server, stored procedures, and integrations power retrieval and reporting.',
      'Ops layer: Azure Monitor, App Insights, and runbooks support monitoring and incident response.',
    ],
  },
  api: {
    title: 'API contract summary',
    summary: 'The API knowledge assistant retrieves endpoint contracts, request payloads, response models, status codes, and examples from Swagger/OpenAPI artifacts.',
    bullets: [
      'Use Microsoft Entra authentication for secured access to protected API resources.',
      'Export History requires a request id, tenant context, and export parameters in JSON payloads.',
      'Error responses use standard HTTP codes and include trace and correlation IDs for troubleshooting.',
    ],
  },
  database: {
    title: 'Database insights',
    summary: 'The database copilot can explain table relationships, key columns, stored procedures, and data flow in the export lifecycle.',
    bullets: [
      'Primary tables include ExportHistory, ExportRequests, Jobs, and Audit logs.',
      'Stored procedures manage insert, rehydrate, and status update operations across the export pipeline.',
      'Schema metadata and relationship mapping support faster onboarding and incident tracing.',
    ],
  },
  deployment: {
    title: 'Deployment guidance',
    summary: 'Deployment guidance consolidates environment-specific steps, validation gates, approvals, and rollback procedures in one place.',
    bullets: [
      'DEV deployment requires smoke tests, config validation, and release review checks.',
      'UAT and PROD require approval checkpoints, regression verification, and release notes review.',
      'Rollback steps should include version restore, app restart, and validation against the affected workflow.',
    ],
  },
  troubleshooting: {
    title: 'Troubleshooting workflow',
    summary: 'The troubleshooting assistant links to TSGs, RCAs, and previous incident records to reduce resolution time for known environment issues.',
    bullets: [
      'Investigate Azure Monitor alerts, application logs, and job status before escalating.',
      'Check correlation IDs to follow the full request path across API, database, and downstream pipeline components.',
      'Use known runbooks and incident patterns to avoid repetitive debugging cycles.',
    ],
  },
  code: {
    title: 'Code search results',
    summary: 'The code search assistant traces feature implementation from UI components to backend controllers, services, repositories, and database procedures.',
    bullets: [
      'Frontend: ExportHistory.tsx and ExportStatusCard.tsx render the UI and status indicators.',
      'Backend: ExportHistoryController.cs and ExportHistoryService.cs handle API and orchestration logic.',
      'Data: repository and SQL stored procedures complete the export and reporting flow.',
    ],
  },
  standards: {
    title: 'Engineering standards',
    summary: 'The assistant surfaces coding standards, repository conventions, SonarQube guidance, and examples for onboarding developers quickly.',
    bullets: [
      'Use clear component naming, consistent folder grouping, and single-responsibility logic in front-end and backend code.',
      'Apply secure defaults, structured logging, and reusable service abstractions across modules.',
      'Review architecture, code quality, and validation checks before completion of a feature branch.',
    ],
  },
};

const quickCategoryCards = [
  { key: 'architecture', title: 'Architecture Assistant', subtitle: 'Understand system architecture, components, and flows', count: '12 Documents', color: 'green', icon: 'Design' },
  { key: 'api', title: 'API Knowledge', subtitle: 'Explore APIs, endpoints, payloads, and samples', count: '28 APIs', color: 'blue', icon: 'Code' },
  { key: 'database', title: 'Database Copilot', subtitle: 'Schemas, tables, procedures, and relationships', count: '56 Objects', color: 'purple', icon: 'Database' },
  { key: 'deployment', title: 'Deployment Assistant', subtitle: 'Runbooks, release checklists, and rollback steps', count: '18 Documents', color: 'amber', icon: 'Rocket' },
  { key: 'troubleshooting', title: 'Troubleshooting', subtitle: 'TSGs, RCA, and operational resolution guidance', count: '32 Guides', color: 'pink', icon: 'Warning' },
  { key: 'code', title: 'Code Search', subtitle: 'Trace implementation across code, repos, and data', count: '15 Repositories', color: 'cyan', icon: 'Search' },
  { key: 'standards', title: 'Coding Standards', subtitle: 'React patterns, guidebooks, and quality checks', count: '9 Documents', color: 'orange', icon: 'Book' },
] as const;

const sourceCards = [
  { name: 'Azure DevOps Wiki', count: '120 Documents', status: 'Synced', tone: 'purple' },
  { name: 'SharePoint', count: '85 Documents', status: 'Synced', tone: 'blue' },
  { name: 'GitHub / Azure DevOps', count: '42 Repositories', status: 'Synced', tone: 'green' },
  { name: 'API Docs', count: '28 APIs', status: 'Synced', tone: 'yellow' },
  { name: 'SQL Database', count: '156 Objects', status: 'Synced', tone: 'orange' },
  { name: 'Runbooks & Guides', count: '64 Documents', status: 'Synced', tone: 'pink' },
] as const;

const recentConversations = [
  'Explain EmbedFAST architecture',
  'Export History API details',
  'Databricks Lagging Alerts issue',
  'Deploy to DEV environment',
  'ExportHistory table schema',
];

const popularQuestions = [
  'How does authentication work?',
  'Where is Export Status implemented?',
  'Explain frontend flow',
  'Rollback deployment steps',
  'LogWorkflow.StuckProcessing issue',
];

const announcements = [
  'New: Architecture Diagram for EmbedFAST v2.0',
  'Update: Deployment process for UAT environment',
];

const navItems = [
  { key: 'home', label: 'Home', icon: 'Home', module: 'home' },
  { key: 'ask', label: 'Ask a Question', icon: 'Comment' },
  { key: 'architecture', label: 'Architecture', icon: 'Architecture', module: 'architecture' },
  { key: 'api', label: 'APIs', icon: 'Code', module: 'api' },
  { key: 'database', label: 'Database', icon: 'Database', module: 'database' },
  { key: 'deployment', label: 'Deployment', icon: 'Rocket', module: 'deployment' },
  { key: 'troubleshooting', label: 'Troubleshooting', icon: 'Warning', module: 'troubleshooting' },
  { key: 'code', label: 'Code Search', icon: 'Search', module: 'code' },
  { key: 'standards', label: 'Coding Standards', icon: 'CodeEdit', module: 'standards' },
  { key: 'runbooks', label: 'Runbooks & RCA', icon: 'Book', module: 'troubleshooting' },
  { key: 'documents', label: 'Documents', icon: 'DocumentSet', module: 'architecture' },
] as const;

// API Configuration with fallback to proxy
const API_BASE_URL = (() => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  // Handle different environment configurations
  if (envUrl) {
    // Remove trailing slash for consistency
    return envUrl.replace(/\/$/, '');
  }
  
  // Development: use proxy through vite dev server
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // Production: use direct backend URL
  return `${window.location.protocol}//${window.location.hostname}:5098/api`;
})();

// Axios instance for API calls (using fetch for now, can be replaced with axios)
const callApi = async (endpoint: string, method: string = 'GET', data?: unknown) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log(`[API] ${method} ${url}`, data ? 'with payload:' : '', data);
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API ERROR] ${response.status}: ${errorText}`);
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    console.log(`[API SUCCESS]`, responseData);
    return responseData;
  } catch (err) {
    console.error(`[API EXCEPTION]`, err);
    throw err;
  }
};

function HomeTab(props: ModuleTabProps) {
  const { currentAnswer, liveAnswer, showCitations, isLoading, error } = props;

  return (
    <section className="module-page home-page">
      <div className="module-header">
        <div>
          <span className="module-kicker">Workspace overview</span>
          <h2>Developer Success Dashboard</h2>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card accent">
          <span className="mini-label">Knowledge articles</span>
          <strong>120+</strong>
          <small>Updated this week</small>
        </div>
        <div className="stat-card">
          <span className="mini-label">APIs indexed</span>
          <strong>28</strong>
          <small>OpenAPI + docs</small>
        </div>
        <div className="stat-card">
          <span className="mini-label">Services</span>
          <strong>12</strong>
          <small>Architecture map</small>
        </div>
        <div className="stat-card">
          <span className="mini-label">Incidents resolved</span>
          <strong>94%</strong>
          <small>Runbook success</small>
        </div>
      </div>

      <div className="module-grid two-column">
        <div className="module-panel">
          <h3>Current answer</h3>
          <p>{currentAnswer.summary}</p>
          <ul>
            {currentAnswer.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
          </ul>
        </div>

        <div className="module-panel">
          <h3>Reference sources</h3>
          <div className="doc-list">
            {(liveAnswer?.sources?.length ? liveAnswer.sources : ['Architecture Document', 'API reference', 'Deployment runbook', 'Knowledge base']).map((source) => (
              <span className="doc-pill" key={source}>{source}</span>
            ))}
          </div>
        </div>
      </div>

      {showCitations && (
        <div className="module-panel">
          <h3>Citations</h3>
          <div className="doc-list">
            {['README.md', 'OpenAPI', 'Azure DevOps Wiki', 'RCA library'].map((item) => (
              <span className="doc-pill" key={item}>{item}</span>
            ))}
          </div>
        </div>
      )}

      {isLoading && <div className="status-box">Checking the indexed knowledge base…</div>}
      {error && <div className="error-box">{error}</div>}
    </section>
  );
}

function ArchitectureTab(props: ModuleTabProps) {
  const { currentAnswer, liveAnswer, showCitations, isLoading, error } = props;

  return (
    <section className="module-page architecture-page">
      <div className="module-header">
        <div>
          <span className="module-kicker">System design</span>
          <h2>Architecture Assistant</h2>
        </div>
      </div>

      <div className="module-grid three-column">
        <div className="module-panel blue">
          <h3>Frontend</h3>
          <p>React and Fluent UI present the user experience, search, and AI chat workflows.</p>
        </div>
        <div className="module-panel purple">
          <h3>Backend</h3>
          <p>.NET API exposes knowledge endpoints and business logic for query resolution.</p>
        </div>
        <div className="module-panel green">
          <h3>Data layer</h3>
          <p>SQL, documentation, and metadata sources support onboarding, troubleshooting, and RCA queries.</p>
        </div>
      </div>

      <div className="module-panel flow-panel">
        <h3>Application flow</h3>
        <div className="timeline">
          <div><span>01</span><p>User asks a question</p></div>
          <div><span>02</span><p>Frontend sends request to API</p></div>
          <div><span>03</span><p>Knowledge service evaluates the module</p></div>
          <div><span>04</span><p>Response includes citations and sources</p></div>
        </div>
      </div>

      <div className="module-panel">
        <h3>Summary</h3>
        <p>{currentAnswer.summary}</p>
        <ul>
          {currentAnswer.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
        </ul>
      </div>

      {showCitations && (
        <div className="module-panel">
          <h3>Reference docs</h3>
          <div className="doc-list">
            {(liveAnswer?.sources?.length ? liveAnswer.sources : ['Architecture Doc', 'System diagram', 'Deployment guide']).map((item) => (
              <span className="doc-pill" key={item}>{item}</span>
            ))}
          </div>
        </div>
      )}

      {isLoading && <div className="status-box">Indexing architecture docs…</div>}
      {error && <div className="error-box">{error}</div>}
    </section>
  );
}

function ApiTab(props: ModuleTabProps) {
  const { currentAnswer, liveAnswer, showCitations, isLoading, error } = props;

  return (
    <section className="module-page api-page">
      <div className="module-header">
        <div>
          <span className="module-kicker">Interface layer</span>
          <h2>API Knowledge Assistant</h2>
        </div>
      </div>

      <div className="module-grid two-column">
        <div className="module-panel">
          <h3>Endpoint catalog</h3>
          <div className="list-stack">
            <div className="detail-item"><strong>GET</strong><span>/api/knowledge/health</span></div>
            <div className="detail-item"><strong>POST</strong><span>/api/knowledge/ask</span></div>
            <div className="detail-item"><strong>Auth</strong><span>Microsoft Entra ID</span></div>
          </div>
        </div>

        <div className="module-panel">
          <h3>Contract overview</h3>
          <ul>
            <li>Request: question + selected module</li>
            <li>Response: answer, module, sources</li>
            <li>Status codes: 200, 400, 500</li>
          </ul>
        </div>
      </div>

      <div className="module-panel">
        <h3>Summary</h3>
        <p>{currentAnswer.summary}</p>
        <ul>
          {currentAnswer.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
        </ul>
      </div>

      {showCitations && (
        <div className="module-panel">
          <h3>Docs</h3>
          <div className="doc-list">
            {(liveAnswer?.sources?.length ? liveAnswer.sources : ['Swagger', 'OpenAPI spec', 'Auth guide']).map((item) => (
              <span className="doc-pill" key={item}>{item}</span>
            ))}
          </div>
        </div>
      )}

      {isLoading && <div className="status-box">Looking up API contracts…</div>}
      {error && <div className="error-box">{error}</div>}
    </section>
  );
}

function DatabaseTab(props: ModuleTabProps) {
  const { currentAnswer, liveAnswer, showCitations, isLoading, error } = props;

  return (
    <section className="module-page database-page">
      <div className="module-header">
        <div>
          <span className="module-kicker">Persistent data</span>
          <h2>Database Copilot</h2>
        </div>
      </div>

      <div className="module-grid three-column">
        <div className="module-panel purple"><h3>Tables</h3><p>ExportHistory, ExportRequests, Jobs, AuditLog</p></div>
        <div className="module-panel blue"><h3>Procedures</h3><p>sp_GetExportStatus, sp_UpdateExportStatus, sp_CreateExportRequest</p></div>
        <div className="module-panel green"><h3>Relationships</h3><p>Job to audit trail and export request linking</p></div>
      </div>

      <div className="module-panel">
        <h3>Summary</h3>
        <p>{currentAnswer.summary}</p>
        <ul>
          {currentAnswer.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
        </ul>
      </div>

      {showCitations && (
        <div className="module-panel">
          <h3>Schema docs</h3>
          <div className="doc-list">
            {(liveAnswer?.sources?.length ? liveAnswer.sources : ['ER diagram', 'Table dictionary', 'Stored procedure catalog']).map((item) => (
              <span className="doc-pill" key={item}>{item}</span>
            ))}
          </div>
        </div>
      )}

      {isLoading && <div className="status-box">Reading table metadata…</div>}
      {error && <div className="error-box">{error}</div>}
    </section>
  );
}

function DeploymentTab(props: ModuleTabProps) {
  const { currentAnswer, liveAnswer, showCitations, isLoading, error } = props;

  return (
    <section className="module-page deployment-page">
      <div className="module-header">
        <div>
          <span className="module-kicker">Release operations</span>
          <h2>Deployment Assistant</h2>
        </div>
      </div>

      <div className="timeline large">
        <div><span>DEV</span><p>Smoke tests and validation</p></div>
        <div><span>UAT</span><p>Approval gates and regression checks</p></div>
        <div><span>PROD</span><p>Release and monitoring</p></div>
        <div><span>RB</span><p>Restore previous version if needed</p></div>
      </div>

      <div className="module-panel">
        <h3>Summary</h3>
        <p>{currentAnswer.summary}</p>
        <ul>
          {currentAnswer.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
        </ul>
      </div>

      {showCitations && (
        <div className="module-panel">
          <h3>Release docs</h3>
          <div className="doc-list">
            {(liveAnswer?.sources?.length ? liveAnswer.sources : ['Runbook DEV', 'UAT checklist', 'Rollback guide']).map((item) => (
              <span className="doc-pill" key={item}>{item}</span>
            ))}
          </div>
        </div>
      )}

      {isLoading && <div className="status-box">Checking release guidebooks…</div>}
      {error && <div className="error-box">{error}</div>}
    </section>
  );
}

function TroubleshootingTab(props: ModuleTabProps) {
  const { currentAnswer, liveAnswer, showCitations, isLoading, error } = props;

  return (
    <section className="module-page troubleshooting-page">
      <div className="module-header">
        <div>
          <span className="module-kicker">Operational support</span>
          <h2>Troubleshooting Assistant</h2>
        </div>
      </div>

      <div className="module-grid two-column">
        <div className="module-panel">
          <h3>Live signals</h3>
          <ul>
            <li>Azure Monitor alerts</li>
            <li>Failed job logs</li>
            <li>Correlation IDs</li>
          </ul>
        </div>
        <div className="module-panel">
          <h3>Known incidents</h3>
          <ul>
            <li>Databricks lagging alerts</li>
            <li>LogWorkflow stuck processing</li>
            <li>Export failed in UAT</li>
          </ul>
        </div>
      </div>

      <div className="module-panel">
        <h3>Summary</h3>
        <p>{currentAnswer.summary}</p>
        <ul>
          {currentAnswer.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
        </ul>
      </div>

      {showCitations && (
        <div className="module-panel">
          <h3>RCA references</h3>
          <div className="doc-list">
            {(liveAnswer?.sources?.length ? liveAnswer.sources : ['TSG', 'RCA library', 'Alert playbook']).map((item) => (
              <span className="doc-pill" key={item}>{item}</span>
            ))}
          </div>
        </div>
      )}

      {isLoading && <div className="status-box">Reviewing alerts and RCA logs…</div>}
      {error && <div className="error-box">{error}</div>}
    </section>
  );
}

function CodeTab(props: ModuleTabProps) {
  const { currentAnswer, liveAnswer, showCitations, isLoading, error } = props;

  return (
    <section className="module-page code-page">
      <div className="module-header">
        <div>
          <span className="module-kicker">Source traceability</span>
          <h2>Code Search Assistant</h2>
        </div>
      </div>

      <div className="module-grid three-column">
        <div className="module-panel"><h3>Frontend</h3><p>UI, components, and page orchestration logic</p></div>
        <div className="module-panel"><h3>Backend</h3><p>Controller, service, and orchestration code</p></div>
        <div className="module-panel"><h3>Data</h3><p>Repository, SQL, and stored procedures</p></div>
      </div>

      <div className="module-panel">
        <h3>Summary</h3>
        <p>{currentAnswer.summary}</p>
        <ul>
          {currentAnswer.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
        </ul>
      </div>

      {showCitations && (
        <div className="module-panel">
          <h3>Code references</h3>
          <div className="doc-list">
            {(liveAnswer?.sources?.length ? liveAnswer.sources : ['ExportHistoryController.cs', 'ExportHistoryService.cs', 'Repository layer']).map((item) => (
              <span className="doc-pill" key={item}>{item}</span>
            ))}
          </div>
        </div>
      )}

      {isLoading && <div className="status-box">Tracing code path across services…</div>}
      {error && <div className="error-box">{error}</div>}
    </section>
  );
}

function StandardsTab(props: ModuleTabProps) {
  const { currentAnswer, liveAnswer, showCitations, isLoading, error } = props;

  return (
    <section className="module-page standards-page">
      <div className="module-header">
        <div>
          <span className="module-kicker">Engineering quality</span>
          <h2>Coding Standards Assistant</h2>
        </div>
      </div>

      <div className="checklist-grid">
        <div className="module-panel"><h3>Architecture</h3><ul><li>Keep layers separate</li><li>Use clear ownership</li><li>Prefer reusable abstractions</li></ul></div>
        <div className="module-panel"><h3>Security</h3><ul><li>Use Entra auth</li><li>Validate inputs</li><li>Protect secrets</li></ul></div>
        <div className="module-panel"><h3>Quality</h3><ul><li>Write readable code</li><li>Log critical events</li><li>Run validation checks</li></ul></div>
      </div>

      <div className="module-panel">
        <h3>Summary</h3>
        <p>{currentAnswer.summary}</p>
        <ul>
          {currentAnswer.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
        </ul>
      </div>

      {showCitations && (
        <div className="module-panel">
          <h3>Reference rules</h3>
          <div className="doc-list">
            {(liveAnswer?.sources?.length ? liveAnswer.sources : ['Style guide', 'SonarQube checklist', 'Repo conventions']).map((item) => (
              <span className="doc-pill" key={item}>{item}</span>
            ))}
          </div>
        </div>
      )}

      {isLoading && <div className="status-box">Pulling engineering rules…</div>}
      {error && <div className="error-box">{error}</div>}
    </section>
  );
}

export default function App() {
  const [selectedModule, setSelectedModule] = useState<ModuleKey>('home');
  const [question, setQuestion] = useState(samplePrompts.home[0]);
  const [showCitations, setShowCitations] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveAnswer, setLiveAnswer] = useState<KnowledgeResponse | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const promptInputRef = useRef<HTMLInputElement | null>(null);

  const filteredCards = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return quickCategoryCards;
    return quickCategoryCards.filter((card) => `${card.title} ${card.subtitle} ${card.count}`.toLowerCase().includes(query));
  }, [searchValue]);

  const currentAnswer = useMemo(() => {
    if (liveAnswer) {
      return {
        title: liveAnswer.module || selectedModule,
        summary: liveAnswer.answer,
        bullets: liveAnswer.sources.length > 0 ? liveAnswer.sources.map((source) => `Source: ${source}`) : ['Retrieved from project knowledge index.'],
      };
    }
    return answerMap[selectedModule];
  }, [selectedModule, liveAnswer]);

  const handlePromptClick = (prompt: string) => {
    setQuestion(prompt);
    setError(null);
  };

  const handleModuleSelection = (module: ModuleKey) => {
    setSelectedModule(module);
    setQuestion(samplePrompts[module][0]);
    setError(null);
    setLiveAnswer(null);
  };

  const handleNavItemClick = (item: { key: string; module?: ModuleKey }) => {
    if (item.key === 'ask') {
      promptInputRef.current?.focus();
      return;
    }

    const targetModule = (item.module ?? item.key) as ModuleKey;
    handleModuleSelection(targetModule);
  };

  const handleAsk = async () => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setError('Please enter a question before asking Copilot.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[Request] Asking question:', { question: trimmedQuestion, module: selectedModule });
      
      const data: KnowledgeResponse = await callApi('/knowledge/ask', 'POST', {
        question: trimmedQuestion,
        module: selectedModule,
      });

      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from API');
      }

      // Ensure sources is an array
      if (!Array.isArray(data.sources)) {
        data.sources = [];
      }

      console.log('[Response] Received answer:', data);
      setLiveAnswer(data as KnowledgeResponse);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Unable to reach the knowledge API. Make sure the backend is running on http://localhost:5098';
      console.error('[Error]', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTabContent = () => {
    const tabProps: ModuleTabProps = {
      currentAnswer,
      liveAnswer,
      showCitations,
      isLoading,
      error,
    };

    switch (selectedModule) {
      case 'home':
        return <HomeTab {...tabProps} />;
      case 'architecture':
        return <ArchitectureTab {...tabProps} />;
      case 'api':
        return <ApiTab {...tabProps} />;
      case 'database':
        return <DatabaseTab {...tabProps} />;
      case 'deployment':
        return <DeploymentTab {...tabProps} />;
      case 'troubleshooting':
        return <TroubleshootingTab {...tabProps} />;
      case 'code':
        return <CodeTab {...tabProps} />;
      case 'standards':
        return <StandardsTab {...tabProps} />;
      default:
        return <HomeTab {...tabProps} />;
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-box">
          <div className="brand-mark">D</div>
          <div className="brand-copy">
            <h2>Developer Success Copilot</h2>
            <span>AI-Powered Project Knowledge Assistant</span>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => {
            const isActive = item.key === selectedModule;
            return (
              <button key={item.key} type="button" className={isActive ? 'nav-item active' : 'nav-item'} onClick={() => handleNavItemClick(item)}>
                <FontIcon iconName={item.icon} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="nav-item small">
            <FontIcon iconName="Settings" />
            <span>Settings</span>
          </button>

          <div className="profile-box">
            <div className="avatar">A</div>
            <div>
              <strong>Abhinesh Yadav</strong>
              <span>Developer</span>
            </div>
            <span className="online-dot" />
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="welcome">Welcome back, Abhinesh! 👋</p>
            <h1>How can I help you with your project today?</h1>
          </div>

          <div className="topbar-actions">
            <div className="project-pill">
              <FontIcon iconName="OfficeLogo" />
              <span>EmbedFAST Project</span>
              <FontIcon iconName="ChevronDown" />
            </div>
            <button type="button" className="icon-button"><FontIcon iconName="Ringer" /></button>
            <button type="button" className="icon-button"><FontIcon iconName="Help" /></button>
          </div>
        </header>

        <div className="chat-panel">
          <div className="assistant-search">
            <div className="search-icon-wrap"><FontIcon iconName="Robot" /></div>
            <input
              ref={promptInputRef}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask anything about your project..."
            />
            <button type="button" className="send-button" onClick={handleAsk}><FontIcon iconName="Send" /></button>
          </div>

          <div className="search-strip">
            <div className="search-input-wrap">
              <FontIcon iconName="Search" />
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search categories, APIs, docs, errors, or deployment..."
              />
            </div>
            <button type="button" className="secondary-action" onClick={() => setSearchValue('')}>Clear</button>
          </div>

          <div className="chip-row">
            {samplePrompts[selectedModule].map((prompt) => (
              <button key={prompt} type="button" className="chip" onClick={() => handlePromptClick(prompt)}>{prompt}</button>
            ))}
          </div>
        </div>

        {selectedModule === 'home' && (
          <div className="content-grid">
            <section className="main-panel">
              <div className="section-title-row"><h3>Explore by Category</h3></div>
              <div className="category-grid">
                {filteredCards.map((card) => (
                  <button key={card.key} type="button" className={`category-card ${card.color}`} onClick={() => handleModuleSelection(card.key as ModuleKey)}>
                    <div className="card-icon-wrap"><FontIcon iconName={card.icon} /></div>
                    <div className="card-body">
                      <h4>{card.title}</h4>
                      <p>{card.subtitle}</p>
                    </div>
                    <div className="card-footer">
                      <span>{card.count}</span>
                      <FontIcon iconName="ChevronRight" />
                    </div>
                  </button>
                ))}
              </div>

              {filteredCards.length === 0 && (
                <div className="empty-state">No matching categories found. Try searching for deployment, API, architecture, or database.</div>
              )}

              <div className="section-title-row second-row"><h3>Knowledge Sources</h3></div>
              <div className="source-grid">
                {sourceCards.map((source) => (
                  <div key={source.name} className={`source-card ${source.tone}`}>
                    <div className="source-icon">
                   <FontIcon
  iconName={
    source.name.includes('GitHub')
      ? 'GitGraph'
      : source.name.includes('SharePoint')
        ? 'SharePointApp'
        : source.name.includes('API')
          ? 'Code'
          : source.name.includes('SQL')
            ? 'Database'
            : source.name.includes('Runbooks')
              ? 'Book'
              : 'Wiki'
  }
/>
                    </div>
                    <div>
                      <h4>{source.name}</h4>
                      <p>{source.count}</p>
                    </div>
                    <span className="status-badge">{source.status}</span>
                  </div>
                ))}
              </div>

              <div className="security-strip">
                <div className="security-item"><span className="security-icon purple">🔒</span><span>Enterprise Security & Compliance</span></div>
                <div className="security-item"><span className="security-icon blue">🛡️</span><span>Microsoft Entra ID Authentication</span></div>
                <div className="security-item"><span className="security-icon green">🔐</span><span>Role-Based Access Control</span></div>
                <div className="security-item"><span className="security-icon orange">📄</span><span>Data Encryption in Transit & Rest</span></div>
                <div className="security-item"><span className="security-icon pink">🧾</span><span>Audit Logs & Compliance</span></div>
              </div>
            </section>

            <aside className="right-panel">
              <div className="panel-box">
                <div className="panel-header"><h4>Recent Conversations</h4><button type="button">View all</button></div>
                <ul>
                  {recentConversations.map((item, idx) => (
                    <li key={item}>
                      <span className="bullet"></span>
                      <span>{item}</span>
                      <small>{idx === 0 ? '2 min ago' : idx === 1 ? '15 min ago' : idx === 2 ? '1 hour ago' : idx === 3 ? '3 hours ago' : 'Yesterday'}</small>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="panel-box">
                <div className="panel-header"><h4>Popular Questions</h4></div>
                <ul className="simple-list">
                  {popularQuestions.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>

              <div className="panel-box">
                <div className="panel-header"><h4>Announcements</h4><button type="button">View all</button></div>
                <ul className="announcement-list">
                  {announcements.map((item, idx) => (
                    <li key={item}>
                      <span className="announce-tag">{idx === 0 ? 'New' : 'Update'}</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        )}

        <section className="answer-section">
          <div className="answer-header-row">
            <h3>Knowledge Answer</h3>
            <div className="toggle-row">
              <Toggle
                label="Show citations"
                checked={showCitations}
                onText="On"
                offText="Off"
                onChange={(_, checked) => setShowCitations(Boolean(checked))}
              />
            </div>
          </div>

          <div className="answer-card">
            <div className="answer-summary-box">
              <span className="answer-badge">{currentAnswer.title}</span>
              <h4>{isLoading ? 'Searching project knowledge…' : 'Response Summary'}</h4>
              <p>{isLoading ? 'Checking the indexed knowledge base and preparing the answer.' : currentAnswer.summary}</p>
            </div>

            <div className="answer-content">
              <ul>
                {currentAnswer.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
              </ul>

              {showCitations && (
                <div className="reference-docs">
                  <h5>Reference Documents</h5>
                  <div className="doc-list">
                    {(liveAnswer?.sources?.length ? liveAnswer.sources : [
                      'Architecture Document – EmbedFAST System Design',
                      'README.md – Developer onboarding guide',
                      'Azure AI Search index – technical documentation',
                      'OpenAPI – Export History API contract',
                      'Runbooks & RCA – incident response playbooks',
                    ]).map((source) => (
                      <div className="doc-pill" key={source}>{source}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && <div className="error-box">{error}</div>}
        </section>

        {renderTabContent()}
      </main>
    </div>
  );
}
