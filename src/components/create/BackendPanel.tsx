import React, { useState } from 'react';
import { 
  Database, 
  Table, 
  Plus, 
  Trash2, 
  Terminal, 
  Activity, 
  ShieldAlert, 
  Cpu, 
  Play, 
  RefreshCw 
} from 'lucide-react';

type BackendPanelProps = {
  virtualTables: { [tableName: string]: any[] };
  backendRoutes: { path: string; method: string; data: any; description: string; id?: string }[];
  rlsPolicies: { id: string; name: string; table: string; operation: string; expression: string; status: string }[];
  mcpServers: { id: string; name: string; urlOrCmd: string; type: string; status: 'connected' | 'disconnected'; tools: string[] }[];
  setMcpServers: React.Dispatch<React.SetStateAction<any[]>>;
  activeProjectId: string | null;
  devSpaceProjects: any[] | undefined;
  updateProject: (id: string, updates: any) => void;
  addTerminalLog: (type: 'log' | 'warn' | 'error' | 'system', text: string) => void;
  showToast: (message: string, type?: any, duration?: number) => void;
};

export const BackendPanel: React.FC<BackendPanelProps> = ({
  virtualTables,
  backendRoutes,
  rlsPolicies,
  mcpServers,
  setMcpServers,
  activeProjectId,
  devSpaceProjects,
  updateProject,
  addTerminalLog,
  showToast
}) => {
  const [backendSubTab, setBackendSubTab] = useState<'sql' | 'routes' | 'rls' | 'mcp'>('sql');

  // SQL states
  const [selectedDbTable, setSelectedDbTable] = useState<string>(() => {
    const keys = Object.keys(virtualTables);
    return keys.length > 0 ? keys[0] : 'tasks';
  });
  const [showInsertRowForm, setShowInsertRowForm] = useState(false);
  const [insertRowFields, setInsertRowFields] = useState<Record<string, string>>({});
  const [sqlText, setSqlText] = useState(`SELECT * FROM ${selectedDbTable};`);
  const [sqlQueryResult, setSqlQueryResult] = useState<any[] | null>(null);
  const [sqlError, setSqlError] = useState('');

  // REST API Tester States
  const [activeTestedRouteId, setActiveTestedRouteId] = useState<string | null>(null);
  const [apiHeaders, setApiHeaders] = useState<string>('{\n  "Content-Type": "application/json"\n}');
  const [apiRequestBody, setApiRequestBody] = useState<string>('{\n  "title": "A New Task",\n  "status": "pending"\n}');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiResStatus, setApiResStatus] = useState<string | null>(null);
  const [apiResLatency, setApiResLatency] = useState<number | null>(null);
  const [apiResSize, setApiResSize] = useState<number | null>(null);
  const [isCallingApi, setIsCallingApi] = useState<boolean>(false);

  // New REST route form states
  const [showAddRouteForm, setShowAddRouteForm] = useState(false);
  const [newRoutePath, setNewRoutePath] = useState('');
  const [newRouteMethod, setNewRouteMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [newRouteData, setNewRouteData] = useState('{\n  "status": "success",\n  "data": []\n}');

  // MCPstates
  const [selectedMcpServer, setSelectedMcpServer] = useState<string>(mcpServers[0]?.id || 'mcp-1');
  const [selectedMcpTool, setSelectedMcpTool] = useState<string>('get_geocode');
  const [mcpArguments, setMcpArguments] = useState<string>('{\n  "address": "1600 Amphitheatre Pkwy, Mountain View, CA"\n}');
  const [mcpResponse, setMcpResponse] = useState<any>(null);
  const [isInvokingMcp, setIsInvokingMcp] = useState<boolean>(false);

  // New MCP form states
  const [showAddMcpForm, setShowAddMcpForm] = useState(false);
  const [mcpName, setMcpName] = useState('');
  const [mcpUrl, setMcpUrl] = useState('');

  // Run SQL parser locally
  const handleRunSQL = (sqlText: string) => {
    const query = sqlText.trim().replace(/;$/, '');
    addTerminalLog('system', `📂 Executing SQL query on virtual schema: "${sqlText}"`);
    
    const queryUpper = query.toUpperCase();
    if (queryUpper.startsWith('SELECT')) {
      const match = query.match(/FROM\s+(\w+)/i);
      if (match) {
        const tableName = match[1].toLowerCase();
        if (virtualTables[tableName]) {
          addTerminalLog('log', `✅ Query returned ${virtualTables[tableName].length} rows.`);
          setSqlQueryResult(virtualTables[tableName]);
          setSqlError('');
        } else {
          setSqlError(`Relation "${tableName}" does not exist in active virtual database.`);
          setSqlQueryResult(null);
        }
      } else {
        setSqlError("Invalid SELECT statement format. Expected: SELECT * FROM [table];");
        setSqlQueryResult(null);
      }
    } else if (queryUpper.startsWith('INSERT')) {
      const match = query.match(/INSERT\s+INTO\s+(\w+)\s*\((.*?)\)\s*VALUES\s*\((.*?)\)/i);
      if (match) {
        const tableName = match[1].toLowerCase();
        const columns = match[2].split(',').map(c => c.trim().replace(/['"`]/g, ''));
        const values = match[3].split(',').map(v => v.trim().replace(/['"`]/g, ''));
        
        if (virtualTables[tableName]) {
          const newRow: any = { id: String(Date.now()) };
          columns.forEach((col, idx) => {
            newRow[col] = values[idx] || '';
          });
          
          const updatedTables = {
            ...virtualTables,
            [tableName]: [...virtualTables[tableName], newRow]
          };
          
          const realProj = devSpaceProjects?.find(p => p.id === activeProjectId);
          if (realProj) {
            updateProject(realProj.id, { virtualTables: updatedTables } as any);
          }
          addTerminalLog('system', `🎉 [SQL Engine] INSERT 0 1. Successfully inserted 1 row into ${tableName}.`);
          setSqlQueryResult([newRow]);
          setSqlError('');
        } else {
          setSqlError(`Relation "${tableName}" does not exist.`);
          setSqlQueryResult(null);
        }
      } else {
        setSqlError("Could not parse INSERT statement. Expected: INSERT INTO [table] (col1, col2) VALUES ('val1', 'val2');");
        setSqlQueryResult(null);
      }
    } else if (queryUpper.startsWith('UPDATE')) {
      const match = query.match(/UPDATE\s+(\w+)\s+SET\s+(.*?)\s+WHERE\s+(.*?)/i);
      if (match) {
        const tableName = match[1].toLowerCase();
        const setClause = match[2];
        const whereClause = match[3];
        
        if (virtualTables[tableName]) {
          const updates: Record<string, string> = {};
          setClause.split(',').forEach(part => {
            const [col, val] = part.split('=').map(p => p.trim().replace(/['"`]/g, ''));
            if (col && val) updates[col] = val;
          });
          
          const [whereCol, whereVal] = whereClause.split('=').map(p => p.trim().replace(/['"`]/g, ''));
          
          let updatedRowsCount = 0;
          const updatedRows = virtualTables[tableName].map((row: any) => {
            if (String(row[whereCol]) === String(whereVal)) {
              updatedRowsCount++;
              return { ...row, ...updates };
            }
            return row;
          });
          
          const updatedTables = {
            ...virtualTables,
            [tableName]: updatedRows
          };
          
          const realProj = devSpaceProjects?.find(p => p.id === activeProjectId);
          if (realProj) {
            updateProject(realProj.id, { virtualTables: updatedTables } as any);
          }
          addTerminalLog('system', `🎉 [SQL Engine] UPDATE. Successfully updated ${updatedRowsCount} rows in ${tableName}.`);
          setSqlQueryResult(updatedRows.filter((row: any) => String(row[whereCol]) === String(whereVal)));
          setSqlError('');
        } else {
          setSqlError(`Relation "${tableName}" does not exist.`);
          setSqlQueryResult(null);
        }
      } else {
        setSqlError("Could not parse UPDATE. Expected: UPDATE [table] SET col1 = 'val1' WHERE id = '123';");
        setSqlQueryResult(null);
      }
    } else if (queryUpper.startsWith('DELETE')) {
      const match = query.match(/DELETE\s+FROM\s+(\w+)\s+WHERE\s+(.*?)/i);
      if (match) {
        const tableName = match[1].toLowerCase();
        const whereClause = match[2];
        
        if (virtualTables[tableName]) {
          const [whereCol, whereVal] = whereClause.split('=').map(p => p.trim().replace(/['"`]/g, ''));
          
          const initialLength = virtualTables[tableName].length;
          const remainingRows = virtualTables[tableName].filter((row: any) => String(row[whereCol]) !== String(whereVal));
          const deletedCount = initialLength - remainingRows.length;
          
          const updatedTables = {
            ...virtualTables,
            [tableName]: remainingRows
          };
          
          const realProj = devSpaceProjects?.find(p => p.id === activeProjectId);
          if (realProj) {
            updateProject(realProj.id, { virtualTables: updatedTables } as any);
          }
          addTerminalLog('system', `🎉 [SQL Engine] DELETE. Successfully deleted ${deletedCount} rows from ${tableName}.`);
          setSqlQueryResult([]);
          setSqlError('');
        } else {
          setSqlError(`Relation "${tableName}" does not exist.`);
          setSqlQueryResult(null);
        }
      } else {
        setSqlError("Could not parse DELETE. Expected: DELETE FROM [table] WHERE id = '123';");
        setSqlQueryResult(null);
      }
    } else if (queryUpper.startsWith('CREATE TABLE')) {
      const match = query.match(/CREATE\s+TABLE\s+(\w+)\s*\((.*?)\)/i);
      if (match) {
        const tableName = match[1].toLowerCase();
        if (virtualTables[tableName]) {
          setSqlError(`Relation "${tableName}" already exists.`);
          setSqlQueryResult(null);
        } else {
          const updatedTables = {
            ...virtualTables,
            [tableName]: []
          };
          const realProj = devSpaceProjects?.find(p => p.id === activeProjectId);
          if (realProj) {
            updateProject(realProj.id, { virtualTables: updatedTables } as any);
          }
          addTerminalLog('system', `🎉 [SQL Engine] CREATE TABLE. Relation "${tableName}" created successfully.`);
          setSqlQueryResult([]);
          setSqlError('');
        }
      } else {
        setSqlError("Could not parse CREATE TABLE. Expected: CREATE TABLE table_name (col1, col2);");
        setSqlQueryResult(null);
      }
    } else if (queryUpper.startsWith('DROP TABLE')) {
      const match = query.match(/DROP\s+TABLE\s+(\w+)/i);
      if (match) {
        const tableName = match[1].toLowerCase();
        if (virtualTables[tableName]) {
          const updatedTables = { ...virtualTables };
          delete updatedTables[tableName];
          const realProj = devSpaceProjects?.find(p => p.id === activeProjectId);
          if (realProj) {
            updateProject(realProj.id, { virtualTables: updatedTables } as any);
          }
          addTerminalLog('system', `🎉 [SQL Engine] DROP TABLE. Relation "${tableName}" has been dropped.`);
          setSqlQueryResult([]);
          setSqlError('');
        } else {
          setSqlError(`Relation "${tableName}" does not exist.`);
          setSqlQueryResult(null);
        }
      } else {
        setSqlError("Could not parse DROP TABLE. Expected: DROP TABLE table_name;");
        setSqlQueryResult(null);
      }
    } else {
      setSqlError("SQL parser only supports simulated SELECT, INSERT, UPDATE, DELETE, CREATE TABLE, and DROP TABLE operations in this virtual schema.");
      setSqlQueryResult(null);
    }
  };

  // REST API Client Execution
  const handleTestApiCall = async (routeId: string, routeMethod: string, routePath: string) => {
    setIsCallingApi(true);
    setApiResponse(null);
    setApiResStatus(null);
    setApiResLatency(null);
    setApiResSize(null);
    
    addTerminalLog('system', `📡 [REST client] dispatching simulated request: ${routeMethod} ${routePath}...`);
    
    const latency = Math.floor(Math.random() * 24) + 12; // 12-36ms
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let parsedBody: any = null;
    if (routeMethod !== 'GET') {
      try {
        parsedBody = JSON.parse(apiRequestBody);
      } catch (e) {
        setIsCallingApi(false);
        setApiResStatus('400 Bad Request');
        setApiResponse({ error: "Invalid JSON request body syntax." });
        return;
      }
    }

    let responseData: any = null;
    let status = '200 OK';
    
    const cleanPath = routePath.replace(/^\/api\//, '').split('/')[0].toLowerCase();
    
    if (virtualTables[cleanPath]) {
      if (routeMethod === 'GET') {
        responseData = {
          success: true,
          table: cleanPath,
          count: virtualTables[cleanPath].length,
          data: virtualTables[cleanPath]
        };
      } else if (routeMethod === 'POST') {
        const newRow = { id: String(Date.now()), ...parsedBody };
        const updatedTables = {
          ...virtualTables,
          [cleanPath]: [...virtualTables[cleanPath], newRow]
        };
        const realProj = devSpaceProjects?.find(p => p.id === activeProjectId);
        if (realProj) {
          updateProject(realProj.id, { virtualTables: updatedTables } as any);
        }
        responseData = {
          success: true,
          message: `Successfully created row in table ${cleanPath}`,
          data: newRow
        };
        status = '201 Created';
        addTerminalLog('system', `🎉 [SQL Engine] INSERT 0 1. Appended 1 row to table ${cleanPath} via API POST.`);
      } else if (routeMethod === 'PUT') {
        const updatedRows = virtualTables[cleanPath].map((row: any) => ({ ...row, ...parsedBody }));
        const updatedTables = {
          ...virtualTables,
          [cleanPath]: updatedRows
        };
        const realProj = devSpaceProjects?.find(p => p.id === activeProjectId);
        if (realProj) {
          updateProject(realProj.id, { virtualTables: updatedTables } as any);
        }
        responseData = {
          success: true,
          message: `Successfully updated table ${cleanPath}`,
          updatedCount: updatedRows.length,
          data: parsedBody
        };
        addTerminalLog('system', `🎉 [SQL Engine] UPDATE. Modified rows in table ${cleanPath} via API PUT.`);
      } else if (routeMethod === 'DELETE') {
        const updatedTables = {
          ...virtualTables,
          [cleanPath]: []
        };
        const realProj = devSpaceProjects?.find(p => p.id === activeProjectId);
        if (realProj) {
          updateProject(realProj.id, { virtualTables: updatedTables } as any);
        }
        responseData = {
          success: true,
          message: `Successfully emptied table ${cleanPath}`
        };
        addTerminalLog('system', `🎉 [SQL Engine] DELETE. Emptied table ${cleanPath} via API DELETE.`);
      }
    } else {
      const matchedRoute = backendRoutes.find((r: any) => r.id === routeId || r.path === routePath);
      responseData = matchedRoute?.data || { status: 'success', info: 'Interpreted static response gateway.' };
    }

    const payloadStr = JSON.stringify(responseData);
    const byteSize = new Blob([payloadStr]).size;
    
    setIsCallingApi(false);
    setApiResStatus(status);
    setApiResLatency(latency);
    setApiResSize(byteSize);
    setApiResponse(responseData);
    
    addTerminalLog('log', `🟢 Response intercepted: ${status} from ${routePath}. Trace time: ${latency}ms, Size: ${byteSize} bytes`);
    showToast(`API Request returned ${status}!`, 'success');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0c12] blueprint-grid" id="create-backend-db-panel">
      {/* Horizontal Sub-tabs Pill Navigation */}
      <div className="px-4 py-2.5 bg-white/[0.02] backdrop-blur-md border-b border-white/[0.05] flex items-center justify-between gap-4 shrink-0 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Database size={13} className="text-amber-400" />
          <span className="text-[10px] font-bold text-zinc-300 tracking-wider uppercase mr-2 select-none font-sans">Database & API</span>
          
          <button
            onClick={() => setBackendSubTab('sql')}
            className={`px-3 py-1.5 text-[10px] font-mono font-bold rounded-md transition-all cursor-pointer ${
              backendSubTab === 'sql' ? 'bg-white/[0.08] text-yellow-400 border border-white/[0.12] shadow-[0_2px_10px_rgba(234,179,8,0.08)]' : 'text-zinc-400 hover:text-white bg-transparent border border-transparent'
            }`}
          >
            SQL Console
          </button>
          <button
            onClick={() => setBackendSubTab('routes')}
            className={`px-3 py-1.5 text-[10px] font-mono font-bold rounded-md transition-all cursor-pointer ${
              backendSubTab === 'routes' ? 'bg-white/[0.08] text-yellow-400 border border-white/[0.12] shadow-[0_2px_10px_rgba(234,179,8,0.08)]' : 'text-zinc-400 hover:text-white bg-transparent border border-transparent'
            }`}
          >
            API Endpoints
          </button>
          <button
            onClick={() => setBackendSubTab('rls')}
            className={`px-3 py-1.5 text-[10px] font-mono font-bold rounded-md transition-all cursor-pointer ${
              backendSubTab === 'rls' ? 'bg-white/[0.08] text-yellow-400 border border-white/[0.12] shadow-[0_2px_10px_rgba(234,179,8,0.08)]' : 'text-zinc-400 hover:text-white bg-transparent border border-transparent'
            }`}
          >
            Security Policies (RLS)
          </button>
          <button
            onClick={() => setBackendSubTab('mcp')}
            className={`px-3 py-1.5 text-[10px] font-mono font-bold rounded-md transition-all cursor-pointer ${
              backendSubTab === 'mcp' ? 'bg-white/[0.08] text-yellow-400 border border-white/[0.12] shadow-[0_2px_10px_rgba(234,179,8,0.08)]' : 'text-zinc-400 hover:text-white bg-transparent border border-transparent'
            }`}
          >
            Tool Connections
          </button>
        </div>
      </div>

      {/* Sub-panel Content View */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-transparent" id="create-backend-sub-panel">
        
        {/* Sub-tab 1: SQL Database Visualizer */}
        {backendSubTab === 'sql' && (
          <div className="space-y-4">
            {/* Active Tables Visual Explorer */}
            <div className="glass-card rounded-xl overflow-hidden flex flex-col">
              <div className="px-4 py-2.5 bg-zinc-950/80 border-b border-zinc-850 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <Table size={13} className="text-amber-400" />
                  <span className="text-[10px] font-mono text-zinc-300 font-bold uppercase">Database Tables</span>
                </div>
                
                <button
                  onClick={() => {
                    const activeRows = virtualTables[selectedDbTable] || [];
                    const cols = activeRows.length > 0 ? Object.keys(activeRows[0]).filter(k => k !== 'id') : ['title', 'status', 'assigned_to'];
                    const initialFields = {};
                    cols.forEach(c => { (initialFields as any)[c] = ''; });
                    setInsertRowFields(initialFields);
                    setShowInsertRowForm(true);
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-md text-[9px] font-mono font-bold transition-all cursor-pointer"
                >
                  <Plus size={11} />
                  <span>Insert Row Visually</span>
                </button>
              </div>

              {/* Table Select Tabs */}
              <div className="px-4 py-2 bg-zinc-900/60 border-b border-zinc-850 flex items-center gap-2 overflow-x-auto scrollbar-none">
                {Object.keys(virtualTables).map(table => (
                  <button
                    key={table}
                    onClick={() => {
                      setSelectedDbTable(table);
                      setShowInsertRowForm(false);
                    }}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-semibold border transition-all cursor-pointer ${
                      selectedDbTable === table 
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 font-bold' 
                        : 'border-zinc-800 text-zinc-400 hover:text-white bg-zinc-950/40'
                    }`}
                  >
                    📁 {table} ({virtualTables[table]?.length || 0} rows)
                  </button>
                ))}
              </div>

              {/* Grid table representation */}
              <div className="overflow-x-auto w-full">
                {showInsertRowForm ? (
                  <div className="p-4 bg-zinc-950/40 space-y-4 max-w-lg">
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
                      <span className="text-[10px] font-mono text-yellow-500 font-bold uppercase">Insert New Data Row Visually: [{selectedDbTable}]</span>
                      <button onClick={() => setShowInsertRowForm(false)} className="text-[9px] text-zinc-500 hover:text-white font-mono">Cancel</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.keys(insertRowFields).map(field => (
                        <div key={field} className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-400 uppercase font-semibold">{field}</label>
                          <input 
                            type="text"
                            value={insertRowFields[field]}
                            onChange={(e) => setInsertRowFields(prev => ({ ...prev, [field]: e.target.value }))}
                            placeholder={`Enter ${field}`}
                            className="w-full bg-[#121319] border border-zinc-850 rounded px-2.5 py-1.5 text-xs text-zinc-200 outline-none"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        const cols = Object.keys(insertRowFields).join(', ');
                        const vals = Object.values(insertRowFields).map(v => `'${v.replace(/'/g, "''")}'`).join(', ');
                        const sql = `INSERT INTO ${selectedDbTable} (${cols}) VALUES (${vals});`;
                        handleRunSQL(sql);
                        setShowInsertRowForm(false);
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      Commit Insert (INSERT INTO)
                    </button>
                  </div>
                ) : (!virtualTables[selectedDbTable] || virtualTables[selectedDbTable].length === 0) ? (
                  <div className="p-6 text-center text-zinc-500 text-xs italic font-mono bg-zinc-950/20">
                    Table "{selectedDbTable}" is empty. Run an INSERT statement or click "Insert Row Visually" to append rows.
                  </div>
                ) : (
                  <table className="w-full text-left font-mono text-[10px] select-text">
                    <thead>
                      <tr className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-850">
                        <th className="p-2.5 font-bold">id</th>
                        {Object.keys(virtualTables[selectedDbTable]?.[0] || {}).filter(k => k !== 'id').map(col => (
                          <th key={col} className="p-2.5 font-bold uppercase">{col}</th>
                        ))}
                        <th className="p-2.5 w-10 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850/65">
                      {virtualTables[selectedDbTable]?.map((row: any) => (
                        <tr key={row.id} className="hover:bg-zinc-950/40 text-zinc-300">
                          <td className="p-2.5 text-zinc-500 font-semibold">{row.id}</td>
                          {Object.keys(row).filter(k => k !== 'id').map(col => (
                            <td key={col} className="p-2.5 max-w-[150px] truncate">{row[col]}</td>
                          ))}
                          <td className="p-2.5 text-right w-10">
                            <button
                              onClick={() => {
                                const sql = `DELETE FROM ${selectedDbTable} WHERE id = '${row.id}';`;
                                handleRunSQL(sql);
                              }}
                              className="text-zinc-600 hover:text-red-400 p-0.5 rounded cursor-pointer transition-colors"
                              title="Delete Row (SQL DELETE)"
                            >
                              <Trash2 size={11} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* SQL Console Query Panel */}
            <div className="glass-card rounded-xl p-4 space-y-3.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <Terminal size={12} className="text-yellow-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-zinc-300 font-semibold uppercase">SQL Query Terminal Console</span>
                </div>
                
                <div className="flex gap-1">
                  <button 
                    onClick={() => setSqlText(`SELECT * FROM ${selectedDbTable};`)} 
                    className="px-2 py-0.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded text-[9px] font-mono cursor-pointer"
                  >
                    SELECT *
                  </button>
                  <button 
                    onClick={() => setSqlText(`INSERT INTO ${selectedDbTable} (title, status) VALUES ('Dynamic Task', 'pending');`)} 
                    className="px-2 py-0.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded text-[9px] font-mono cursor-pointer"
                  >
                    INSERT
                  </button>
                  <button 
                    onClick={() => setSqlText(`UPDATE ${selectedDbTable} SET status = 'completed' WHERE id = '1';`)} 
                    className="px-2 py-0.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded text-[9px] font-mono cursor-pointer"
                  >
                    UPDATE
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <textarea
                  value={sqlText}
                  onChange={(e) => setSqlText(e.target.value)}
                  placeholder="SELECT * FROM tasks;"
                  rows={3}
                  className="w-full bg-[#050608] border border-zinc-800 rounded-lg p-3 text-xs text-yellow-350 font-mono outline-none focus:border-yellow-500/40 leading-relaxed"
                />
                
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-mono text-zinc-500 leading-none">Supports SELECT, INSERT, UPDATE, DELETE, CREATE TABLE, DROP TABLE statements in sandbox.</span>
                  <button
                    onClick={() => handleRunSQL(sqlText)}
                    className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Play size={10} />
                    <span>Execute Statement</span>
                  </button>
                </div>
              </div>

              {/* SQL execution results pane */}
              {sqlError && (
                <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg text-[10px] font-mono text-red-400">
                  🚨 SQL Syntax Error: {sqlError}
                </div>
              )}
              {sqlQueryResult && (
                <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg space-y-1.5">
                  <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold block">SQL Result Set buffer:</span>
                  <pre className="text-[10px] text-zinc-300 font-mono overflow-x-auto max-h-44 custom-scrollbar leading-normal">
                    {JSON.stringify(sqlQueryResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sub-tab 2: REST API Routes manager */}
        {backendSubTab === 'routes' && (
          <div className="space-y-4">
            {/* Interactive Route Creator inline form */}
            <div className="glass-card border-dashed border-amber-500/20 rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-850 pb-2.5">
                <span className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-1.5 font-sans">
                  <Activity size={13} className="text-amber-400 animate-pulse" />
                  API Endpoints (/api/*)
                </span>
                <button
                  onClick={() => setShowAddRouteForm(!showAddRouteForm)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded border border-zinc-750 text-[10px] font-mono cursor-pointer"
                >
                  <Plus size={11} />
                  <span>{showAddRouteForm ? 'Collapse' : 'Add API Endpoint'}</span>
                </button>
              </div>

              {showAddRouteForm && (
                <div className="p-4 glass-card rounded-xl space-y-3.5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase">Route Endpoint Path</label>
                      <input 
                        type="text" 
                        value={newRoutePath}
                        onChange={(e) => setNewRoutePath(e.target.value)}
                        placeholder="/api/tasks/count"
                        className="w-full bg-[#121319] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase">HTTP Method</label>
                      <select
                        value={newRouteMethod}
                        onChange={(e) => setNewRouteMethod(e.target.value as any)}
                        className="w-full bg-[#121319] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none"
                      >
                        <option value="GET">GET (Retrieve Resources)</option>
                        <option value="POST">POST (Create / Trigger Action)</option>
                        <option value="PUT">PUT (Replace / Update)</option>
                        <option value="DELETE">DELETE (Remove Resource)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase">JSON Mock Response Payload</label>
                    <textarea 
                      value={newRouteData}
                      onChange={(e) => setNewRouteData(e.target.value)}
                      placeholder={`{\n  "status": "success",\n  "data": []\n}`}
                      rows={4}
                      className="w-full bg-[#050608] border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 font-mono outline-none"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (!newRoutePath.trim()) return;
                      try {
                        JSON.parse(newRouteData); // Validate json
                        const updatedRoutes = [
                          ...backendRoutes,
                          { path: newRoutePath.trim(), method: newRouteMethod, data: JSON.parse(newRouteData), description: 'Custom dynamic user-defined Rest API Route endpoint.', id: `route-${Date.now()}` }
                        ];
                        const realProj = devSpaceProjects?.find(p => p.id === activeProjectId);
                        if (realProj) {
                          updateProject(realProj.id, { backendRoutes: updatedRoutes } as any);
                        }
                        addTerminalLog('system', `🎉 [REST Gateway] Registered new API route: ${newRouteMethod} ${newRoutePath}`);
                        showToast('Virtual Rest Route saved successfully!', 'success');
                        setShowAddRouteForm(false);
                        setNewRoutePath('');
                      } catch (e) {
                        showToast('Invalid JSON syntax. Please correct response structure.', 'error');
                      }
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Deploy Route Live
                  </button>
                </div>
              )}

              {/* List registered routes and integrate testing bench */}
              <div className="space-y-3">
                {backendRoutes.map((route, idx) => {
                  const rId = route.id || `route-${idx}`;
                  const isTestingThisRoute = activeTestedRouteId === rId;
                  
                  return (
                    <div key={rId} className="p-3.5 glass-card rounded-xl space-y-3 hover:border-zinc-850 transition-colors">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                            route.method === 'GET' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                            route.method === 'POST' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                            route.method === 'PUT' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20' :
                            'bg-red-500/15 text-red-400 border border-red-500/20'
                          }`}>
                            {route.method}
                          </span>
                          <span className="text-xs font-mono font-semibold text-zinc-150">{route.path}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setActiveTestedRouteId(isTestingThisRoute ? null : rId);
                              setApiResponse(null);
                              setApiResStatus(null);
                            }}
                            className={`px-2.5 py-1 text-[9px] font-mono border rounded cursor-pointer transition-all ${
                              isTestingThisRoute 
                                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' 
                                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800'
                            }`}
                          >
                            {isTestingThisRoute ? 'Close Client' : 'HTTP Client Workbench'}
                          </button>
                          <button
                            onClick={() => {
                              const updatedRoutes = backendRoutes.filter((_, i) => i !== idx);
                              const realProj = devSpaceProjects?.find(p => p.id === activeProjectId);
                              if (realProj) {
                                updateProject(realProj.id, { backendRoutes: updatedRoutes } as any);
                              }
                              addTerminalLog('system', `🗑️ Registered REST endpoint removed: ${route.method} ${route.path}`);
                            }}
                            className="text-zinc-600 hover:text-red-400 p-1 cursor-pointer transition-colors"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-[10px] text-zinc-500 leading-normal font-sans">{route.description || 'Virtual API mock router node.'}</p>

                      {/* Interactive workbench nested body */}
                      {isTestingThisRoute && (
                        <div className="mt-3 p-3.5 glass-card rounded-lg space-y-4 animate-fadeIn">
                          <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase block border-b border-zinc-800 pb-1 flex items-center gap-1">
                            <Activity size={10} />
                            Interactive Request Sandbox Workbench
                          </span>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] font-mono">
                            <div className="space-y-1">
                              <span className="text-zinc-500 uppercase block">Headers Configuration (JSON)</span>
                              <textarea
                                value={apiHeaders}
                                onChange={(e) => setApiHeaders(e.target.value)}
                                rows={2}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-zinc-300 font-mono text-[9px] outline-none"
                              />
                            </div>
                            {route.method !== 'GET' && (
                              <div className="space-y-1">
                                <span className="text-zinc-500 uppercase block">Request Body Payload (JSON)</span>
                                <textarea
                                  value={apiRequestBody}
                                  onChange={(e) => setApiRequestBody(e.target.value)}
                                  rows={2}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-yellow-300 font-mono text-[9px] outline-none"
                                />
                              </div>
                            )}
                          </div>

                          <div className="flex justify-between items-center border-t border-zinc-800 pt-3">
                            <span className="text-[9px] text-zinc-500 font-mono">Mock host server: http://localhost:3000{route.path}</span>
                            <button
                              onClick={() => handleTestApiCall(rId, route.method, route.path)}
                              disabled={isCallingApi}
                              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-[10px] font-mono font-bold rounded flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              {isCallingApi ? <RefreshCw size={11} className="animate-spin" /> : <Play size={9} />}
                              <span>Send Request</span>
                            </button>
                          </div>

                          {/* HTTP Response panel */}
                          {(apiResStatus || apiResponse) && (
                            <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg space-y-2">
                              <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5">
                                <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold block">Response metadata:</span>
                                <div className="flex gap-2 text-[9px] font-mono">
                                  <span>Status: <span className={apiResStatus?.startsWith('2') ? 'text-emerald-400' : 'text-yellow-400'}>{apiResStatus}</span></span>
                                  <span>Time: <span className="text-amber-400">{apiResLatency}ms</span></span>
                                  <span>Size: <span className="text-yellow-500">{apiResSize} B</span></span>
                                </div>
                              </div>
                              <pre className="text-[10px] text-zinc-300 font-mono overflow-x-auto max-h-44 custom-scrollbar leading-normal">
                                {JSON.stringify(apiResponse, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Sub-tab 3: RLS Security Policies */}
        {backendSubTab === 'rls' && (
          <div className="space-y-4">
            <div className="glass-card border-dashed border-amber-500/20 rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-850 pb-2.5">
                <span className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-1.5 font-sans">
                  <ShieldAlert size={13} className="text-amber-500 animate-pulse" />
                  Database Security (RLS) Policies
                </span>
              </div>

              <div className="p-3.5 glass-card rounded-lg">
                <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
                  Row Level Security allows you to restrict rows returned on queries depending on user authentication context or credentials. Toggle policies or write custom ones inside the SQL query terminal using the format: <code className="text-yellow-500 font-mono">CREATE POLICY "name" ON table FOR SELECT USING (expression);</code>
                </p>
              </div>

              {/* RLS rules listing */}
              <div className="space-y-2.5">
                {rlsPolicies.map((policy) => (
                  <div key={policy.id} className="p-3 glass-card rounded-xl space-y-1.5 hover:border-zinc-850 transition-all">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-zinc-200 font-mono">🛡️ Policy: {policy.name}</span>
                      <span className="text-[8px] font-mono bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded uppercase font-bold">{policy.status}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-zinc-500">
                      <div>Table: <span className="text-amber-400">{policy.table}</span></div>
                      <div>Operation: <span className="text-emerald-400">{policy.operation}</span></div>
                      <div className="truncate">Using expression: <span className="text-yellow-500">{policy.expression}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sub-tab 4: MCP Servers & Tools caller Playground */}
        {backendSubTab === 'mcp' && (
          <div className="space-y-4">
            {/* Interactive form to add server */}
            <div className="glass-card border-dashed border-amber-500/20 rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-850 pb-2.5">
                <span className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-1.5 font-sans">
                  <Cpu size={13} className="text-amber-400 animate-pulse" />
                  External Tool Connections & MCP Services
                </span>
                <button
                  onClick={() => setShowAddMcpForm(!showAddMcpForm)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded border border-zinc-750 text-[10px] font-mono cursor-pointer"
                >
                  <Plus size={11} />
                  <span>{showAddMcpForm ? 'Hide' : 'Register Tool Server'}</span>
                </button>
              </div>

              {/* Quick Connect MCP Presets (Supabase, Firebase, Cloudflare, Postgres, Google Maps) */}
              <div className="p-3 bg-zinc-950/60 border border-zinc-850 rounded-xl space-y-2">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase block">⚡ 1-Click Connect MCP Presets:</span>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  <button
                    onClick={() => {
                      const exists = mcpServers.some(s => s.name.toLowerCase().includes('supabase'));
                      if (exists) {
                        showToast('Supabase MCP server is already connected!', 'info');
                        return;
                      }
                      const updated = [
                        ...mcpServers,
                        {
                          id: `mcp-supabase-${Date.now()}`,
                          name: 'Supabase MCP Server',
                          urlOrCmd: 'npx -y @supabase/mcp-server',
                          type: 'stdio',
                          status: 'connected' as const,
                          tools: ['query_tables', 'insert_record', 'get_schema', 'execute_raw_sql']
                        }
                      ];
                      setMcpServers(updated);
                      setSelectedMcpServer(updated[updated.length - 1].id);
                      setSelectedMcpTool('query_tables');
                      addTerminalLog('system', '⚡ Connected Supabase MCP Server node!');
                      showToast('Connected Supabase MCP Server!', 'success');
                    }}
                    className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-left transition-all cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-emerald-400 flex items-center justify-between">
                      <span>⚡ Supabase</span>
                      <Plus size={10} className="group-hover:scale-125 transition-transform" />
                    </div>
                    <span className="text-[9px] text-zinc-400 font-mono block mt-0.5 truncate">SQL, Tables & Auth</span>
                  </button>

                  <button
                    onClick={() => {
                      const exists = mcpServers.some(s => s.name.toLowerCase().includes('firebase'));
                      if (exists) {
                        showToast('Firebase MCP server is already connected!', 'info');
                        return;
                      }
                      const updated = [
                        ...mcpServers,
                        {
                          id: `mcp-firebase-${Date.now()}`,
                          name: 'Firebase MCP Server',
                          urlOrCmd: 'stdio: firebase-mcp --project default',
                          type: 'stdio',
                          status: 'connected' as const,
                          tools: ['firestore_get_doc', 'firestore_set_doc', 'firestore_query', 'auth_list_users']
                        }
                      ];
                      setMcpServers(updated);
                      setSelectedMcpServer(updated[updated.length - 1].id);
                      setSelectedMcpTool('firestore_query');
                      addTerminalLog('system', '🔥 Connected Firebase Firestore MCP Server node!');
                      showToast('Connected Firebase MCP Server!', 'success');
                    }}
                    className="p-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-left transition-all cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-amber-400 flex items-center justify-between">
                      <span>🔥 Firebase</span>
                      <Plus size={10} className="group-hover:scale-125 transition-transform" />
                    </div>
                    <span className="text-[9px] text-zinc-400 font-mono block mt-0.5 truncate">Firestore & Rules</span>
                  </button>

                  <button
                    onClick={() => {
                      const exists = mcpServers.some(s => s.name.toLowerCase().includes('cloudflare'));
                      if (exists) {
                        showToast('Cloudflare MCP server is already connected!', 'info');
                        return;
                      }
                      const updated = [
                        ...mcpServers,
                        {
                          id: `mcp-cloudflare-${Date.now()}`,
                          name: 'Cloudflare D1 & KV MCP',
                          urlOrCmd: 'npx -y @cloudflare/mcp-server',
                          type: 'stdio',
                          status: 'connected' as const,
                          tools: ['d1_query', 'kv_get', 'kv_put', 'vectorize_search']
                        }
                      ];
                      setMcpServers(updated);
                      setSelectedMcpServer(updated[updated.length - 1].id);
                      setSelectedMcpTool('d1_query');
                      addTerminalLog('system', '☁️ Connected Cloudflare D1/KV MCP Server node!');
                      showToast('Connected Cloudflare MCP Server!', 'success');
                    }}
                    className="p-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-lg text-left transition-all cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-orange-400 flex items-center justify-between">
                      <span>☁️ Cloudflare</span>
                      <Plus size={10} className="group-hover:scale-125 transition-transform" />
                    </div>
                    <span className="text-[9px] text-zinc-400 font-mono block mt-0.5 truncate">D1 SQL & KV Storage</span>
                  </button>

                  <button
                    onClick={() => {
                      const exists = mcpServers.some(s => s.name.toLowerCase().includes('postgres'));
                      if (exists) {
                        showToast('PostgreSQL MCP server is already connected!', 'info');
                        return;
                      }
                      const updated = [
                        ...mcpServers,
                        {
                          id: `mcp-postgres-${Date.now()}`,
                          name: 'PostgreSQL / Neon MCP',
                          urlOrCmd: 'stdio: postgres-mcp-server',
                          type: 'stdio',
                          status: 'connected' as const,
                          tools: ['inspect_schema', 'run_query', 'explain_plan']
                        }
                      ];
                      setMcpServers(updated);
                      setSelectedMcpServer(updated[updated.length - 1].id);
                      setSelectedMcpTool('run_query');
                      addTerminalLog('system', '🐘 Connected PostgreSQL / Neon MCP Server node!');
                      showToast('Connected PostgreSQL MCP Server!', 'success');
                    }}
                    className="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg text-left transition-all cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-cyan-400 flex items-center justify-between">
                      <span>🐘 PostgreSQL</span>
                      <Plus size={10} className="group-hover:scale-125 transition-transform" />
                    </div>
                    <span className="text-[9px] text-zinc-400 font-mono block mt-0.5 truncate">Direct DB Connection</span>
                  </button>

                  <button
                    onClick={() => {
                      const exists = mcpServers.some(s => s.name.toLowerCase().includes('maps'));
                      if (exists) {
                        showToast('Google Maps MCP server is already connected!', 'info');
                        return;
                      }
                      const updated = [
                        ...mcpServers,
                        {
                          id: `mcp-maps-${Date.now()}`,
                          name: 'Google Maps Platform MCP',
                          urlOrCmd: 'http://localhost:3011',
                          type: 'SSE',
                          status: 'connected' as const,
                          tools: ['get_geocode', 'search_places', 'calculate_route']
                        }
                      ];
                      setMcpServers(updated);
                      setSelectedMcpServer(updated[updated.length - 1].id);
                      setSelectedMcpTool('get_geocode');
                      addTerminalLog('system', '🗺️ Connected Google Maps Platform MCP Server node!');
                      showToast('Connected Google Maps MCP Server!', 'success');
                    }}
                    className="p-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-lg text-left transition-all cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-yellow-400 flex items-center justify-between">
                      <span>🗺️ Maps API</span>
                      <Plus size={10} className="group-hover:scale-125 transition-transform" />
                    </div>
                    <span className="text-[9px] text-zinc-400 font-mono block mt-0.5 truncate">Geocoding & Places</span>
                  </button>
                </div>
              </div>

              {showAddMcpForm && (
                <div className="p-4 glass-card rounded-xl border border-zinc-850 space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-400 uppercase">MCP Server Name</label>
                    <input 
                      type="text"
                      value={mcpName}
                      onChange={(e) => setMcpName(e.target.value)}
                      placeholder="e.g. Brave Search Api"
                      className="w-full bg-[#121319] border border-zinc-850 rounded px-2.5 py-1.5 text-xs text-zinc-200 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-400 uppercase">SSE URL or Command Statement</label>
                    <input 
                      type="text"
                      value={mcpUrl}
                      onChange={(e) => setMcpUrl(e.target.value)}
                      placeholder="e.g. http://localhost:3015 or stdio: search-mcp"
                      className="w-full bg-[#121319] border border-zinc-850 rounded px-2.5 py-1.5 text-xs text-zinc-200 outline-none"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!mcpName || !mcpUrl) return;
                      const updated = [
                        ...mcpServers,
                        { id: `mcp-${Date.now()}`, name: mcpName, urlOrCmd: mcpUrl, type: mcpUrl.startsWith('http') ? 'SSE' : 'stdio', status: 'connected' as const, tools: ['custom_query', 'fetch_data', 'read_logs'] }
                      ];
                      setMcpServers(updated);
                      setShowAddMcpForm(false);
                      setMcpName('');
                      setMcpUrl('');
                      addTerminalLog('system', `📡 Registered and connected MCP client node: ${mcpName}`);
                      showToast(`Registered MCP node: ${mcpName}!`, 'success');
                    }}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Connect MCP Link
                  </button>
                </div>
              )}

              {/* Server node status lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mcpServers.map(s => (
                  <div key={s.id} className="p-3 glass-card rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <Cpu size={12} className="text-zinc-400" />
                        <span className="text-xs font-bold text-zinc-200 font-mono">{s.name}</span>
                      </div>
                      <span className="flex items-center gap-1 text-[8px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                        CONNECTED
                      </span>
                    </div>
                    <div className="space-y-1 font-mono text-[9px] text-zinc-500">
                      <div>Endpoint: <span className="text-zinc-400 truncate max-w-[150px] inline-block align-bottom">{s.urlOrCmd}</span></div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {s.tools.map(t => (
                          <span key={t} className="px-1.5 py-0.5 bg-zinc-900 text-zinc-400 rounded text-[8px] uppercase">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Tool caller bench */}
              <div className="p-4 glass-card rounded-xl space-y-4">
                <div className="space-y-3.5">
                  <span className="text-[10px] font-mono text-zinc-400 font-semibold uppercase block border-b border-zinc-850 pb-1">Tool Execution Sandbox</span>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-400">
                    <div className="space-y-1">
                      <span>Active Server</span>
                      <select
                        value={selectedMcpServer}
                        onChange={(e) => {
                          setSelectedMcpServer(e.target.value);
                          const s = mcpServers.find(v => v.id === e.target.value);
                          if (s && s.tools.length > 0) {
                            setSelectedMcpTool(s.tools[0]);
                          }
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] outline-none text-zinc-200"
                      >
                        {mcpServers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <span>Select Declared Tool</span>
                      <select
                        value={selectedMcpTool}
                        onChange={(e) => setSelectedMcpTool(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] outline-none text-zinc-200"
                      >
                        {mcpServers.find(s => s.id === selectedMcpServer)?.tools.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-400">Execution Input Parameters (JSON)</label>
                    <textarea
                      value={mcpArguments}
                      onChange={(e) => setMcpArguments(e.target.value)}
                      placeholder="{}"
                      rows={3}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-yellow-350 font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3 mt-3.5">
                  <button
                    onClick={() => {
                      if (isInvokingMcp) return;
                      setIsInvokingMcp(true);
                      setMcpResponse(null);
                      
                      const t = selectedMcpTool;
                      addTerminalLog('system', `📡 [MCP client] dispatching tool invoke request to standard node: [${t}] with params: ${mcpArguments}`);
                      
                      setTimeout(() => {
                        setIsInvokingMcp(false);
                        let parsedArgs: any = {};
                        try { parsedArgs = JSON.parse(mcpArguments); } catch(e){}
                        
                        let resultData: any = {};
                        if (t === 'query_tables' || t === 'get_schema' || t === 'execute_raw_sql') {
                          resultData = { success: true, supabase_database: 'active_project_db', table: 'users', rows_count: 14, status: 'connected' };
                        } else if (t === 'firestore_query' || t === 'firestore_get_doc') {
                          resultData = { success: true, firestore_collection: 'projects', document_id: 'doc_8823', data: { name: 'DevSpace Web App', created_at: new Date().toISOString() } };
                        } else if (t === 'd1_query' || t === 'kv_get') {
                          resultData = { success: true, cloudflare_worker: 'd1-prod-db', query_time: '12ms', result: [{ id: 101, val: 'production_cache' }] };
                        } else if (t === 'get_geocode') {
                          resultData = { status: 'OK', results: [{ formatted_address: 'Googleplex, Mountain View, CA 94043', geometry: { location: { lat: 37.4220, lng: -122.0841 } } }] };
                        } else if (t === 'search_places') {
                          resultData = { results: [{ name: 'Computer History Museum', rating: 4.8 }, { name: 'Shoreline Amphitheatre', rating: 4.5 }] };
                        } else if (t === 'search_notes') {
                          resultData = { matching_files: ['/vault/todo.md', '/vault/ideas.md'], results_count: 2 };
                        } else if (t === 'read_note') {
                          resultData = { note: 'ideas.md', contents: '# Prototype Ideas\n- Consolidate layout views\n- Build high-fidelity DB explore panel.' };
                        } else {
                          resultData = { success: true, tool_invoked: t, params: parsedArgs, timestamp: new Date().toISOString(), result: 'Autonomous schema task executed successfully!' };
                        }
                        
                        setMcpResponse(resultData);
                        addTerminalLog('log', `🟢 MCP Tool Response for [${t}]: Success status, 200 OK. Trace time: 35ms`);
                        showToast(`Successfully called tool: ${t}!`, 'success');
                      }, 600);
                    }}
                    disabled={isInvokingMcp}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {isInvokingMcp ? <RefreshCw size={12} className="animate-spin" /> : <Play size={10} />}
                    <span>Execute Tool Call (RPC Call)</span>
                  </button>

                  {mcpResponse && (
                    <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg space-y-1 shrink-0">
                      <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase block">RPC Result Set payload:</span>
                      <pre className="text-[9px] text-emerald-400 font-mono overflow-x-auto max-h-32 custom-scrollbar select-text leading-normal">
                        {JSON.stringify(mcpResponse, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
