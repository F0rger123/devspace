import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Calendar,
  Clock,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Shield,
  Trash2,
  Edit3,
  GitMerge,
  MessageSquare,
  FileText,
  Handshake,
  CheckSquare,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Eye,
  Check,
  X,
  UserCheck,
  Building2,
  FolderGit2,
  HelpCircle,
  Lock,
} from 'lucide-react';
import {
  aetherPeople,
  PersonProfile,
  RelationshipType,
  PrivacyLevel,
  MeetingPrepContext,
  PeoplePrivacyConfig,
} from '../lib/aetherPeopleService';
import { useData } from '../context/DataProvider';

export const People: React.FC = () => {
  const { projects } = useData();
  const [people, setPeople] = useState<PersonProfile[]>(() => aetherPeople.getPeople());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedPerson, setSelectedPerson] = useState<PersonProfile | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [prepModalData, setPrepModalData] = useState<MeetingPrepContext | null>(null);

  // Form states
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonEmail, setNewPersonEmail] = useState('');
  const [newPersonOrg, setNewPersonOrg] = useState('');
  const [newPersonRole, setNewPersonRole] = useState('');
  const [newPersonRel, setNewPersonRel] = useState<RelationshipType>('collaborator');
  const [newPersonNotes, setNewPersonNotes] = useState('');

  // Quick inputs on selected person
  const [quickNote, setQuickNote] = useState('');
  const [quickFollowUp, setQuickFollowUp] = useState('');
  const [quickFollowUpDate, setQuickFollowUpDate] = useState('');
  const [quickPromiseText, setQuickPromiseText] = useState('');
  const [quickPromiseDir, setQuickPromiseDir] = useState<'to_them' | 'from_them'>('to_them');
  const [quickPromiseDate, setQuickPromiseDate] = useState('');

  // Merge modal state
  const [mergeSourceId, setMergeSourceId] = useState('');
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [mergeMessage, setMergeMessage] = useState('');

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Privacy Config
  const [privacyConfig, setPrivacyConfig] = useState<PeoplePrivacyConfig>(() => aetherPeople.getConfig());

  useEffect(() => {
    return aetherPeople.subscribe((updated) => {
      setPeople(updated);
      if (selectedPerson) {
        const found = updated.find((p) => p.id === selectedPerson.id);
        setSelectedPerson(found || null);
      }
    });
  }, [selectedPerson]);

  // Sync with workspace projects on mount
  useEffect(() => {
    if (projects && projects.length > 0) {
      aetherPeople.syncProjectCollaborators(projects);
    }
  }, [projects]);

  // Filtered list
  const filteredPeople = people.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.organization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.relatedProjects.some((pr) => pr.projectName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'all') return true;
    if (filterType === 'follow_ups') return p.openFollowUps.some((f) => f.status === 'pending');
    if (filterType === 'promises') return p.commitmentsAndPromises.some((pr) => pr.status === 'active');
    if (filterType === 'meetings') return p.recentMeetings.length > 0;
    return p.relationshipType === filterType;
  });

  // Aggregate stats
  const totalFollowUps = people.reduce((acc, p) => acc + p.openFollowUps.filter((f) => f.status === 'pending').length, 0);
  const totalPromises = people.reduce((acc, p) => acc + p.commitmentsAndPromises.filter((pr) => pr.status === 'active').length, 0);
  const totalMeetings = people.reduce((acc, p) => acc + p.recentMeetings.length, 0);

  const handleCreatePerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;

    const created = aetherPeople.createPerson({
      name: newPersonName,
      email: newPersonEmail,
      organization: newPersonOrg,
      role: newPersonRole,
      relationshipType: newPersonRel,
      notes: newPersonNotes,
    });

    setNewPersonName('');
    setNewPersonEmail('');
    setNewPersonOrg('');
    setNewPersonRole('');
    setNewPersonNotes('');
    setIsAddModalOpen(false);
    setSelectedPerson(created);
  };

  const handleSyncContacts = async () => {
    setIsSyncing(true);
    setSyncStatus('Connecting to Google Contacts API...');
    const res = await aetherPeople.syncGoogleContacts();
    setIsSyncing(false);
    setSyncStatus(res.message);
    setTimeout(() => setSyncStatus(null), 4000);
  };

  const handleMerge = () => {
    if (!mergeTargetId || !mergeSourceId) return;
    const res = aetherPeople.mergePeople(mergeTargetId, mergeSourceId);
    setMergeMessage(res.message);
    if (res.success) {
      setTimeout(() => {
        setIsMergeModalOpen(false);
        setMergeMessage('');
        if (res.mergedPerson) setSelectedPerson(res.mergedPerson);
      }, 1200);
    }
  };

  return (
    <div id="people-page" className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-zinc-100">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Users size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                People & Relationships
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono">
                  {people.length} profiles
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                Grounds Aether in real contacts, calendar attendees, project collaborators, GitHub contributors, and promises.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            id="sync-contacts-btn"
            onClick={handleSyncContacts}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-medium text-zinc-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            Sync Contacts
          </button>
          <button
            id="merge-people-btn"
            onClick={() => {
              setMergeTargetId(selectedPerson ? selectedPerson.id : (people[0]?.id || ''));
              setIsMergeModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-medium text-zinc-200 flex items-center gap-1.5 cursor-pointer transition"
          >
            <GitMerge size={13} />
            Merge Duplicates
          </button>
          <button
            id="privacy-settings-btn"
            onClick={() => setIsPrivacyModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-medium text-zinc-200 flex items-center gap-1.5 cursor-pointer transition"
          >
            <Shield size={13} className="text-emerald-400" />
            Privacy & Grounding
          </button>
          <button
            id="add-person-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition"
          >
            <Plus size={14} />
            Add Person
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatus && (
        <div className="p-3 rounded-xl bg-indigo-950/50 border border-indigo-500/40 text-indigo-300 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles size={14} /> {syncStatus}
          </span>
          <button onClick={() => setSyncStatus(null)} className="text-zinc-400 hover:text-white">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Users size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-white leading-tight">{people.length}</div>
            <div className="text-[11px] text-zinc-400">Collaborators & Contacts</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Calendar size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-white leading-tight">{totalMeetings}</div>
            <div className="text-[11px] text-zinc-400">Linked Meetings</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Handshake size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-white leading-tight">{totalPromises}</div>
            <div className="text-[11px] text-zinc-400">Active Commitments</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <CheckSquare size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-white leading-tight">{totalFollowUps}</div>
            <div className="text-[11px] text-zinc-400">Open Follow-Ups</div>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Directory on Left, Profile Deep View on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Search & Directory List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex flex-col gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                id="search-people-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, org, role, or project..."
                className="w-full pl-9 pr-4 py-2 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              {[
                { id: 'all', label: 'All' },
                { id: 'collaborator', label: 'Collaborators' },
                { id: 'advisor', label: 'Advisors' },
                { id: 'contact', label: 'Contacts' },
                { id: 'follow_ups', label: `Follow-Ups (${totalFollowUps})` },
                { id: 'promises', label: `Promises (${totalPromises})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`px-2.5 py-1 rounded-lg shrink-0 cursor-pointer font-medium transition ${
                    filterType === f.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* People List */}
          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {filteredPeople.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800 text-zinc-500 text-xs">
                No people matched your search query.
              </div>
            ) : (
              filteredPeople.map((person) => {
                const isSelected = selectedPerson?.id === person.id;
                const pendingFollowUps = person.openFollowUps.filter((f) => f.status === 'pending').length;
                const activePromises = person.commitmentsAndPromises.filter((p) => p.status === 'active').length;

                return (
                  <div
                    key={person.id}
                    id={`person-card-${person.id}`}
                    onClick={() => setSelectedPerson(person)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-800/90 border-indigo-500/60 ring-1 ring-indigo-500/20'
                        : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-850 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={person.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(person.name)}`}
                        alt={person.name}
                        className="w-10 h-10 rounded-xl object-cover bg-zinc-800 border border-zinc-700 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="font-semibold text-sm text-white truncate">{person.name}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 capitalize shrink-0 font-medium">
                            {person.relationshipType}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 truncate">
                          {person.role || 'Collaborator'} {person.organization ? `• ${person.organization}` : ''}
                        </p>

                        {/* Projects & Badges */}
                        <div className="flex items-center flex-wrap gap-1.5 mt-2">
                          {person.relatedProjects.slice(0, 2).map((p) => (
                            <span
                              key={p.projectId}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 font-mono truncate max-w-[140px]"
                            >
                              {p.projectName}
                            </span>
                          ))}
                          {pendingFollowUps > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 font-medium">
                              {pendingFollowUps} follow-up{pendingFollowUps > 1 ? 's' : ''}
                            </span>
                          )}
                          {activePromises > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium">
                              {activePromises} promise{activePromises > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Deep Relationship Profile View */}
        <div className="lg:col-span-7">
          {selectedPerson ? (
            <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-6">
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src={selectedPerson.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(selectedPerson.name)}`}
                    alt={selectedPerson.name}
                    className="w-14 h-14 rounded-2xl object-cover bg-zinc-800 border border-zinc-700 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-white">{selectedPerson.name}</h2>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 capitalize font-medium">
                        {selectedPerson.relationshipType}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      {selectedPerson.role || 'Collaborator'} {selectedPerson.organization ? `at ${selectedPerson.organization}` : ''}
                    </p>
                    {selectedPerson.email && (
                      <p className="text-xs text-zinc-500 font-mono mt-0.5">{selectedPerson.email}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="meeting-prep-btn"
                    onClick={() => {
                      const prep = aetherPeople.generateMeetingPrep(selectedPerson.name);
                      setPrepModalData(prep);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Sparkles size={13} />
                    Meeting Prep Brief
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Forget and delete all context for "${selectedPerson.name}"?`)) {
                        aetherPeople.deletePerson(selectedPerson.id);
                        setSelectedPerson(null);
                      }
                    }}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-red-500/20 border border-zinc-700 hover:border-red-500/40 text-zinc-400 hover:text-red-300 transition cursor-pointer"
                    title="Forget / Delete Person"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Data Provenance & Sources Tag */}
              <div className="flex items-center justify-between text-xs bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-2 text-zinc-400">
                  <span className="font-semibold text-zinc-300">Sources:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedPerson.sources.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 font-mono text-[10px] text-zinc-300">
                        {s.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 size={12} /> Fact
                  </span>
                  <span className="inline-flex items-center gap-1 text-purple-400">
                    <Sparkles size={12} /> Inference
                  </span>
                </div>
              </div>

              {/* Section 1: Related Projects */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FolderGit2 size={13} className="text-indigo-400" />
                  Related Projects ({selectedPerson.relatedProjects.length})
                </h3>
                {selectedPerson.relatedProjects.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">No linked projects yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedPerson.relatedProjects.map((p) => (
                      <div
                        key={p.projectId}
                        className="p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/80 flex flex-col justify-between gap-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-zinc-200">{p.projectName}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                              p.isVerified
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                            }`}
                          >
                            {p.isVerified ? 'Fact' : 'Inference'}
                          </span>
                        </div>
                        {p.roleOrInvolvement && (
                          <p className="text-[11px] text-zinc-400">{p.roleOrInvolvement}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Commitments & Promises */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Handshake size={13} className="text-amber-400" />
                    Promises & Commitments ({selectedPerson.commitmentsAndPromises.length})
                  </h3>
                </div>

                {/* Promise list */}
                <div className="space-y-1.5">
                  {selectedPerson.commitmentsAndPromises.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">No promises or commitments logged.</p>
                  ) : (
                    selectedPerson.commitmentsAndPromises.map((prom) => (
                      <div
                        key={prom.id}
                        className="p-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 font-bold ${
                              prom.direction === 'to_them'
                                ? 'bg-indigo-500/20 text-indigo-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {prom.direction === 'to_them' ? 'I Promised' : 'They Promised'}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-zinc-200 truncate">{prom.text}</p>
                            <p className="text-[10.5px] text-zinc-500">
                              {prom.deadline ? `Target: ${prom.deadline} • ` : ''}Context: {prom.sourceContext}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {prom.status === 'active' ? (
                            <button
                              onClick={() => {
                                prom.status = 'fulfilled';
                                prom.fulfilledAt = Date.now();
                                aetherPeople.updatePerson(selectedPerson.id, {
                                  commitmentsAndPromises: [...selectedPerson.commitmentsAndPromises],
                                });
                              }}
                              className="px-2 py-1 rounded bg-zinc-800 hover:bg-emerald-600/20 hover:text-emerald-300 text-zinc-400 text-[11px] font-medium transition cursor-pointer"
                            >
                              Fulfill
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-medium">✓ Fulfilled</span>
                          )}
                          <button
                            onClick={() => aetherPeople.forgetPersonContextItem(selectedPerson.id, 'promise', prom.id)}
                            className="p-1 text-zinc-500 hover:text-red-400"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Quick Promise */}
                <div className="flex items-center gap-2 pt-1">
                  <select
                    value={quickPromiseDir}
                    onChange={(e: any) => setQuickPromiseDir(e.target.value)}
                    className="px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300"
                  >
                    <option value="to_them">I promise...</option>
                    <option value="from_them">They promised...</option>
                  </select>
                  <input
                    type="text"
                    value={quickPromiseText}
                    onChange={(e) => setQuickPromiseText(e.target.value)}
                    placeholder="Promise details (e.g., send draft docs by Friday)..."
                    className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                  <input
                    type="date"
                    value={quickPromiseDate}
                    onChange={(e) => setQuickPromiseDate(e.target.value)}
                    className="px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300"
                  />
                  <button
                    onClick={() => {
                      if (!quickPromiseText.trim()) return;
                      aetherPeople.addPromise(selectedPerson.id, {
                        direction: quickPromiseDir,
                        text: quickPromiseText.trim(),
                        deadline: quickPromiseDate || undefined,
                      });
                      setQuickPromiseText('');
                      setQuickPromiseDate('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Section 3: Open Follow-Ups */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare size={13} className="text-purple-400" />
                  Follow-Up Tracking ({selectedPerson.openFollowUps.length})
                </h3>

                <div className="space-y-1.5">
                  {selectedPerson.openFollowUps.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">No open follow-ups.</p>
                  ) : (
                    selectedPerson.openFollowUps.map((fup) => (
                      <div
                        key={fup.id}
                        className="p-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={fup.status === 'completed'}
                            onChange={() => aetherPeople.completeFollowUp(selectedPerson.id, fup.id)}
                            className="rounded border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="min-w-0">
                            <span className={fup.status === 'completed' ? 'line-through text-zinc-500' : 'text-zinc-200'}>
                              {fup.title}
                            </span>
                            {fup.dueDate && (
                              <span className="text-[10px] text-zinc-500 font-mono ml-2">Due: {fup.dueDate}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => aetherPeople.forgetPersonContextItem(selectedPerson.id, 'followup', fup.id)}
                          className="p-1 text-zinc-500 hover:text-red-400"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Quick Follow-Up */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={quickFollowUp}
                    onChange={(e) => setQuickFollowUp(e.target.value)}
                    placeholder="New follow-up item..."
                    className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                  <input
                    type="date"
                    value={quickFollowUpDate}
                    onChange={(e) => setQuickFollowUpDate(e.target.value)}
                    className="px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300"
                  />
                  <button
                    onClick={() => {
                      if (!quickFollowUp.trim()) return;
                      aetherPeople.addFollowUp(selectedPerson.id, {
                        title: quickFollowUp.trim(),
                        dueDate: quickFollowUpDate || undefined,
                      });
                      setQuickFollowUp('');
                      setQuickFollowUpDate('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Section 4: Recent Meetings */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={13} className="text-emerald-400" />
                  Recent & Upcoming Meetings ({selectedPerson.recentMeetings.length})
                </h3>

                {selectedPerson.recentMeetings.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">No meetings synced with this attendee.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedPerson.recentMeetings.map((m) => (
                      <div key={m.id} className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-zinc-200">{m.title}</span>
                          <span className="text-[10px] text-zinc-400 font-mono">{m.date}</span>
                        </div>
                        {m.summary && <p className="text-zinc-400 text-[11px]">{m.summary}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 5: Important Notes (Fact vs Inference) */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={13} className="text-cyan-400" />
                  Notes & Context ({selectedPerson.importantNotes.length})
                </h3>

                <div className="space-y-1.5">
                  {selectedPerson.importantNotes.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">No notes recorded.</p>
                  ) : (
                    selectedPerson.importantNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800 text-xs flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <p className="text-zinc-200">{note.content}</p>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                            <span
                              className={`px-1.5 py-0.2 rounded font-mono ${
                                note.isVerified
                                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                  : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                              }`}
                            >
                              {note.isVerified ? 'Verified Fact' : 'Aether Inference'}
                            </span>
                            <span>{note.source}</span>
                            {note.inferenceExplanation && <span>• {note.inferenceExplanation}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {!note.isVerified && (
                            <button
                              onClick={() => aetherPeople.verifyInference(selectedPerson.id, 'note', note.id)}
                              className="px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 text-[10px] font-medium"
                              title="Verify as true fact"
                            >
                              Verify Fact
                            </button>
                          )}
                          <button
                            onClick={() => aetherPeople.forgetPersonContextItem(selectedPerson.id, 'note', note.id)}
                            className="p-1 text-zinc-500 hover:text-red-400"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Quick Note */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    placeholder="Add an important note or preference..."
                    className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (!quickNote.trim()) return;
                      aetherPeople.addNote(selectedPerson.id, { content: quickNote.trim() });
                      setQuickNote('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800 text-zinc-400 text-sm space-y-3">
              <Users size={32} className="mx-auto text-zinc-600" />
              <p className="font-semibold text-zinc-300">Select a person to view their relationship profile</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Explore project connections, open follow-ups, promises, and generate one-click meeting preparation briefs.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Person */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Plus size={16} className="text-indigo-400" /> Add Person Profile
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreatePerson} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  placeholder="e.g. Jordan Lee"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newPersonEmail}
                    onChange={(e) => setNewPersonEmail(e.target.value)}
                    placeholder="jordan@company.com"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                    Organization
                  </label>
                  <input
                    type="text"
                    value={newPersonOrg}
                    onChange={(e) => setNewPersonOrg(e.target.value)}
                    placeholder="Acme Ventures"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                    Role / Title
                  </label>
                  <input
                    type="text"
                    value={newPersonRole}
                    onChange={(e) => setNewPersonRole(e.target.value)}
                    placeholder="Partner & Advisor"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                    Relationship
                  </label>
                  <select
                    value={newPersonRel}
                    onChange={(e: any) => setNewPersonRel(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="collaborator">Collaborator</option>
                    <option value="teammate">Teammate</option>
                    <option value="advisor">Advisor</option>
                    <option value="stakeholder">Stakeholder</option>
                    <option value="client">Client</option>
                    <option value="contact">Contact</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                  Initial Notes & Context
                </label>
                <textarea
                  rows={2}
                  value={newPersonNotes}
                  onChange={(e) => setNewPersonNotes(e.target.value)}
                  placeholder="Preferences, working style, or context..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Create Person
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Meeting Prep Brief */}
      {prepModalData && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-zinc-900 border border-indigo-500/40 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono">
                  Aether Meeting Prep Brief
                </span>
                <h3 className="text-lg font-bold text-white">{prepModalData.meetingTitle}</h3>
                <p className="text-xs text-zinc-400">
                  Attendee: <span className="text-zinc-200 font-semibold">{prepModalData.personName}</span> • Time: {prepModalData.meetingTime}
                </p>
              </div>
              <button onClick={() => setPrepModalData(null)} className="text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            {/* What to know */}
            <div className="space-y-1.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                💡 What You Should Know
              </h4>
              <ul className="text-xs text-zinc-300 space-y-1 list-disc pl-4">
                {prepModalData.whatToKnow.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>

            {/* Talking points */}
            <div className="space-y-1.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                🗣️ Key Talking Points
              </h4>
              <ul className="text-xs text-zinc-300 space-y-1 list-disc pl-4">
                {prepModalData.keyTalkingPoints.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>

            {/* Promises */}
            {prepModalData.openPromises.length > 0 && (
              <div className="space-y-1.5 bg-zinc-950/60 p-3 rounded-xl border border-amber-500/30">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  🤝 Open Promises & Commitments
                </h4>
                <ul className="text-xs text-zinc-300 space-y-1 list-disc pl-4">
                  {prepModalData.openPromises.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Last interaction */}
            <div className="space-y-1.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1">
                💬 Last Interaction Context
              </h4>
              <p className="text-xs text-zinc-300">{prepModalData.lastInteractionSummary}</p>
            </div>

            {/* Suggested Questions */}
            <div className="space-y-1.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
              <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                ❓ Suggested Questions
              </h4>
              <ul className="text-xs text-zinc-300 space-y-1 list-disc pl-4">
                {prepModalData.suggestedQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPrepModalData(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
              >
                Close Briefing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Merge Duplicates */}
      {isMergeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <GitMerge size={16} className="text-indigo-400" /> Merge Duplicate People
              </h3>
              <button onClick={() => setIsMergeModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Select two duplicate profiles. All meetings, conversation logs, projects, and notes from the Source profile will be safely merged into the Target profile.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                  Merge From (Duplicate Source to delete)
                </label>
                <select
                  value={mergeSourceId}
                  onChange={(e) => setMergeSourceId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="">Select source person...</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.email ? `(${p.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                  Merge Into (Primary Target to keep)
                </label>
                <select
                  value={mergeTargetId}
                  onChange={(e) => setMergeTargetId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="">Select target person...</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.email ? `(${p.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {mergeMessage && (
                <p className="text-xs text-indigo-300 bg-indigo-950/60 p-2.5 rounded-xl border border-indigo-500/30">
                  {mergeMessage}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsMergeModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMerge}
                  disabled={!mergeSourceId || !mergeTargetId || mergeSourceId === mergeTargetId}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
                >
                  Merge Profiles
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Privacy Controls */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Shield size={16} className="text-emerald-400" /> People Privacy & Grounding Controls
              </h3>
              <button onClick={() => setIsPrivacyModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                <div>
                  <div className="font-semibold text-zinc-200">Google Calendar Attendees</div>
                  <div className="text-[11px] text-zinc-500">Auto-link attendees from upcoming and past calendar events</div>
                </div>
                <input
                  type="checkbox"
                  checked={privacyConfig.enableCalendarSync}
                  onChange={(e) => {
                    const updated = { ...privacyConfig, enableCalendarSync: e.target.checked };
                    setPrivacyConfig(updated);
                    aetherPeople.saveConfig(updated);
                  }}
                  className="rounded border-zinc-700 text-indigo-600"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                <div>
                  <div className="font-semibold text-zinc-200">Google Contacts Sync</div>
                  <div className="text-[11px] text-zinc-500">Ingest real contacts via Google People API</div>
                </div>
                <input
                  type="checkbox"
                  checked={privacyConfig.enableContactsSync}
                  onChange={(e) => {
                    const updated = { ...privacyConfig, enableContactsSync: e.target.checked };
                    setPrivacyConfig(updated);
                    aetherPeople.saveConfig(updated);
                  }}
                  className="rounded border-zinc-700 text-indigo-600"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                <div>
                  <div className="font-semibold text-zinc-200">Project Collaborator Sync</div>
                  <div className="text-[11px] text-zinc-500">Ingest collaborators and leads from DevSpace projects</div>
                </div>
                <input
                  type="checkbox"
                  checked={privacyConfig.enableProjectCollaboratorSync}
                  onChange={(e) => {
                    const updated = { ...privacyConfig, enableProjectCollaboratorSync: e.target.checked };
                    setPrivacyConfig(updated);
                    aetherPeople.saveConfig(updated);
                  }}
                  className="rounded border-zinc-700 text-indigo-600"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                <div>
                  <div className="font-semibold text-zinc-200">GitHub Contributor Linking</div>
                  <div className="text-[11px] text-zinc-500">Extract contributor usernames & commit history</div>
                </div>
                <input
                  type="checkbox"
                  checked={privacyConfig.enableGitHubContributorSync}
                  onChange={(e) => {
                    const updated = { ...privacyConfig, enableGitHubContributorSync: e.target.checked };
                    setPrivacyConfig(updated);
                    aetherPeople.saveConfig(updated);
                  }}
                  className="rounded border-zinc-700 text-indigo-600"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                <div>
                  <div className="font-semibold text-zinc-200">Allow Aether Inferences</div>
                  <div className="text-[11px] text-zinc-500">Clearly marks non-verified observations as inferences</div>
                </div>
                <input
                  type="checkbox"
                  checked={privacyConfig.allowAetherInferences}
                  onChange={(e) => {
                    const updated = { ...privacyConfig, allowAetherInferences: e.target.checked };
                    setPrivacyConfig(updated);
                    aetherPeople.saveConfig(updated);
                  }}
                  className="rounded border-zinc-700 text-indigo-600"
                />
              </label>

              <div className="pt-2 border-t border-zinc-800">
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete ALL people, relationship notes, and promise context? This cannot be undone.')) {
                      aetherPeople.purgeAllPeopleData();
                      setSelectedPerson(null);
                      setIsPrivacyModalOpen(false);
                    }
                  }}
                  className="w-full py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 font-semibold text-xs transition cursor-pointer"
                >
                  Purge All People & Relationship Context
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
