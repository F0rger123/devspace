import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Search, Mail, User, Shield, Key, ChevronRight, ChevronLeft, Check, 
  AlertCircle, Sparkles, Loader2, Info, Users, ShieldAlert, CheckCircle2
} from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/auth';

interface ProjectInviteWizardProps {
  projectId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface UserProfile {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  avatarColor?: string;
  title?: string;
  bio?: string;
}

export function ProjectInviteWizard({ projectId, onClose, onSuccess }: ProjectInviteWizardProps) {
  const { projects, googleUser, updateProject } = useData();
  const project = projects.find(p => p.id === projectId);

  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Selected user state
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [customEmail, setCustomEmail] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Permission role
  const [selectedRole, setSelectedRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load all registered users on component load for fast client-side fuzzy matching
  useEffect(() => {
    async function fetchUsers() {
      setLoadingUsers(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersList: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Don't include the current logged-in user in the list of invitees
          if (data.email && data.email.toLowerCase() !== googleUser?.email?.toLowerCase()) {
            usersList.push({
              uid: data.uid,
              email: data.email,
              username: data.username || data.displayName || 'user',
              displayName: data.displayName || data.username || 'Workspace User',
              avatarColor: data.avatarColor || '#3b82f6',
              title: data.title || 'Collaborator',
              bio: data.bio || ''
            });
          }
        });
        setAllUsers(usersList);
      } catch (err) {
        console.warn('Failed to load registered users for autocomplete:', err);
      } finally {
        setLoadingUsers(false);
      }
    }

    if (googleUser) {
      fetchUsers();
    }
  }, [googleUser]);

  // Client-side fuzzy search on username, email, and display name
  const filteredUsers = allUsers.filter(u => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return false;
    return (
      u.email.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      u.displayName.toLowerCase().includes(query)
    );
  });

  const handleSelectUser = (user: UserProfile) => {
    setSelectedUser(user);
    setCustomEmail('');
    setIsCustomMode(false);
    setErrorMsg(null);
  };

  const handleUseCustomEmail = () => {
    if (!searchQuery.includes('@')) {
      setErrorMsg('Please enter a valid email address to invite as guest.');
      return;
    }
    setCustomEmail(searchQuery.trim().toLowerCase());
    setSelectedUser(null);
    setIsCustomMode(true);
    setErrorMsg(null);
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!selectedUser && !isCustomMode) {
        setErrorMsg('Please search and select a user, or specify an email address.');
        return;
      }
      setErrorMsg(null);
    }
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    setStep(prev => prev - 1);
  };

  const handleSendInvite = async () => {
    if (!project) {
      setErrorMsg('Project context not found.');
      return;
    }

    const receiverEmail = selectedUser ? selectedUser.email : customEmail;
    if (!receiverEmail) {
      setErrorMsg('Recipient email is missing.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const inviteId = crypto.randomUUID();
      const inviteLink = `${window.location.origin}/projects?inviteId=${inviteId}`;
      
      const newInvitation = {
        id: inviteId,
        projectId,
        projectName: project.name,
        senderId: googleUser?.uid || 'anonymous',
        senderEmail: googleUser?.email || '',
        senderName: googleUser?.displayName || googleUser?.email?.split('@')[0] || 'Project Owner',
        receiverEmail: receiverEmail.trim().toLowerCase(),
        status: 'pending',
        role: selectedRole,
        inviteLink,
        createdAt: Date.now()
      };

      // 1. Store the pending invitation in Firestore
      await setDoc(doc(db, 'invitations', inviteId), newInvitation);

      // 2. Add email directly to the project's collaborators list field
      const currentCollaborators = project.collaborators || [];
      const updatedCollaborators = [...currentCollaborators];
      if (!updatedCollaborators.includes(receiverEmail.trim().toLowerCase())) {
        updatedCollaborators.push(receiverEmail.trim().toLowerCase());
      }

      const updatedRoles = { 
        ...(project.collaboratorRoles || {}), 
        [receiverEmail.trim().toLowerCase()]: selectedRole 
      };

      const updatedPermissions = {
        ...(project.collaboratorPermissions || {}),
        [receiverEmail.trim().toLowerCase()]: {
          canPushToGit: selectedRole === 'admin' || selectedRole === 'editor',
          canViewCode: true,
          canEditRoadmap: selectedRole === 'admin' || selectedRole === 'editor',
          canInviteOthers: selectedRole === 'admin'
        }
      };

      // Save updated project state back to Firestore & local memory context
      await updateProject(projectId, {
        collaborators: updatedCollaborators,
        collaboratorRoles: updatedRoles,
        collaboratorPermissions: updatedPermissions
      });

      // Show beautiful success notification
      setSuccessMsg(`✓ Pending collaboration invitation safely dispatched and saved for ${receiverEmail}!`);
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while writing collaboration state to Firestore.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans select-none">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg bg-[#0a0a0d] border border-zinc-850 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-950 border-b border-zinc-850 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-650/10 rounded-lg text-blue-400">
              <Users size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-zinc-200">
                Project Invite Wizard
              </h3>
              <p className="text-[10px] text-zinc-500 font-medium">
                Workspace: <span className="text-zinc-350">{project?.name || 'Local Sandbox'}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded-md transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Step Progress Tracker */}
        <div className="px-6 py-3 bg-[#0c0c10] border-b border-zinc-900 flex items-center justify-between text-[10px] font-mono text-zinc-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-600'}`}>1</span>
            <span className={step >= 1 ? 'text-zinc-300 font-bold' : ''}>SEARCH USER</span>
          </div>
          <div className="h-[1px] flex-1 bg-zinc-850 mx-4"></div>
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-600'}`}>2</span>
            <span className={step >= 2 ? 'text-zinc-300 font-bold' : ''}>PERMISSION</span>
          </div>
          <div className="h-[1px] flex-1 bg-zinc-850 mx-4"></div>
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-600'}`}>3</span>
            <span className={step >= 3 ? 'text-zinc-300 font-bold' : ''}>CONFIRMATION</span>
          </div>
        </div>

        {/* Scrollable Content Pane */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 scrollbar-thin">
          {errorMsg && (
            <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-lg flex items-start gap-2.5 text-xs text-red-400 font-mono">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-5 bg-emerald-950/20 border border-emerald-500/20 rounded-lg flex flex-col items-center gap-3 text-center text-emerald-400 font-mono">
              <CheckCircle2 size={36} className="text-emerald-500 animate-bounce" />
              <p className="text-sm font-semibold">{successMsg}</p>
              <p className="text-[10px] text-zinc-500">Redirecting to project space...</p>
            </div>
          )}

          {!successMsg && (
            <AnimatePresence mode="wait">
              {/* STEP 1: Search Users */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">Search DevSpace Network</h4>
                    <p className="text-[11px] text-zinc-500">Query users in the Firestore registry, or key in a guest email address to invite them.</p>
                  </div>

                  {/* Search Input Box */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                      {loadingUsers ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setErrorMsg(null);
                      }}
                      placeholder="Type username, email, or full name..."
                      className="w-full bg-[#121216] border border-zinc-800 hover:border-zinc-750 focus:border-blue-500 rounded-lg pl-9 pr-4 py-2.5 text-xs text-zinc-200 outline-none font-sans transition-all"
                    />
                  </div>

                  {/* Search Results / Matches */}
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {searchQuery.trim().length > 0 ? (
                      <>
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((user) => (
                            <button
                              key={user.uid}
                              type="button"
                              onClick={() => handleSelectUser(user)}
                              className={`w-full p-2.5 text-left rounded-lg border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                                selectedUser?.uid === user.uid 
                                  ? 'bg-blue-600/10 border-blue-500' 
                                  : 'bg-zinc-900/40 border-zinc-850 hover:bg-zinc-800/60'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div 
                                  className="w-7 h-7 rounded-full text-[11px] font-bold font-mono flex items-center justify-center shrink-0 text-white"
                                  style={{ backgroundColor: user.avatarColor || '#3b82f6' }}
                                >
                                  {user.displayName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-zinc-200 truncate">{user.displayName}</p>
                                  <p className="text-[10px] text-zinc-500 font-mono truncate">@{user.username} • {user.email}</p>
                                </div>
                              </div>
                              <div className="shrink-0">
                                {selectedUser?.uid === user.uid ? (
                                  <span className="text-[9px] font-bold font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">SELECTED</span>
                                ) : (
                                  <span className="text-[9px] font-bold font-mono text-zinc-500 hover:text-zinc-300">SELECT</span>
                                )}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="text-center py-4 bg-zinc-900/20 border border-dashed border-zinc-850 rounded-lg space-y-2">
                            <p className="text-[11px] text-zinc-500 font-mono">No matching registered user found.</p>
                            {searchQuery.includes('@') && (
                              <button
                                type="button"
                                onClick={handleUseCustomEmail}
                                className="text-[10px] bg-zinc-850 hover:bg-zinc-800 text-zinc-200 px-3 py-1.5 rounded font-bold font-mono border border-zinc-750 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Mail size={11} /> Invite guest email: {searchQuery.trim()}
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-5 text-zinc-500 text-[10.5px] italic">
                        Start typing above to search the workspace database.
                      </div>
                    )}
                  </div>

                  {/* Active Selection Indicator */}
                  {(selectedUser || isCustomMode) && (
                    <div className="p-3 bg-zinc-950/60 border border-zinc-850 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                          {selectedUser ? <User size={12} /> : <Mail size={12} />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-200">
                            {selectedUser ? selectedUser.displayName : 'Custom External Guest'}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-mono">
                            {selectedUser ? selectedUser.email : customEmail}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUser(null);
                          setCustomEmail('');
                          setIsCustomMode(false);
                        }}
                        className="text-[9px] text-red-400 hover:underline font-mono"
                      >
                        CLEAR
                      </button>
                    </div>
                  )}

                  <div className="p-3 bg-[#0c0c0f] border border-zinc-900 rounded-lg flex gap-2.5">
                    <Info size={14} className="text-zinc-500 shrink-0 mt-0.5" />
                    <p className="text-[10.5px] text-zinc-400 leading-normal font-sans">
                      Invitations store a secure pending document in Firestore. Collaborators can instantly claim access when they sign in with their linked email address.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Access Role */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">Select Access Permission Level</h4>
                    <p className="text-[11px] text-zinc-500">Fine-tune the security clearance of this collaborator inside your workspace.</p>
                  </div>

                  {/* Permission Selection Cards */}
                  <div className="space-y-2.5">
                    {[
                      { 
                        role: 'viewer', 
                        title: 'Read Only (Viewer)', 
                        desc: 'Unrestricted code audit and workspace reviews. Cannot push code or update issues.', 
                        color: 'border-zinc-800'
                      },
                      { 
                        role: 'editor', 
                        title: 'Write (Editor)', 
                        desc: 'Can edit issues, milestones, and push code changes directly to linked Git repositories.', 
                        color: 'border-blue-550/30'
                      },
                      { 
                        role: 'admin', 
                        title: 'Admin (Full Clearance)', 
                        desc: 'Unrestricted administration, permission modification, and authority to invite other members.', 
                        color: 'border-yellow-550/30'
                      }
                    ].map((item) => (
                      <button
                        key={item.role}
                        type="button"
                        onClick={() => setSelectedRole(item.role as any)}
                        className={`w-full p-4 text-left rounded-xl border transition-all flex gap-3 cursor-pointer ${
                          selectedRole === item.role 
                            ? 'bg-blue-600/10 border-blue-500 shadow-md' 
                            : 'bg-[#121216] border-zinc-850 hover:border-zinc-800'
                        }`}
                      >
                        <div className="pt-0.5">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedRole === item.role ? 'border-blue-500 bg-blue-500' : 'border-zinc-700'}`}>
                            {selectedRole === item.role && <Check size={10} className="text-white" />}
                          </div>
                        </div>
                        <div className="space-y-1 min-w-0">
                          <span className={`text-xs font-bold font-mono uppercase tracking-wider ${selectedRole === item.role ? 'text-blue-400' : 'text-zinc-300'}`}>
                            {item.title}
                          </span>
                          <p className="text-[10px] text-zinc-500 leading-normal font-sans">{item.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Dispatch & Confirmation */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">Confirm Collaboration Dispatch</h4>
                    <p className="text-[11px] text-zinc-500">Carefully verify the information below before saving the pending records to Firestore.</p>
                  </div>

                  {/* Summary card */}
                  <div className="p-4 bg-[#121216] border border-zinc-850 rounded-xl space-y-3 font-mono text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                      <span className="text-zinc-500 uppercase font-bold text-[9px]">Target Workspace:</span>
                      <span className="text-zinc-200 font-bold">{project?.name}</span>
                    </div>

                    <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                      <span className="text-zinc-500 uppercase font-bold text-[9px]">Invited Developer:</span>
                      <span className="text-blue-400 font-bold">
                        {selectedUser ? selectedUser.displayName : customEmail}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                      <span className="text-zinc-500 uppercase font-bold text-[9px]">Assigned Role:</span>
                      <span className="text-yellow-450 font-extrabold uppercase tracking-widest">{selectedRole}</span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <span className="text-zinc-500 uppercase font-bold text-[9px] block">Permissions Matrix:</span>
                      
                      <div className="grid grid-cols-2 gap-2 text-[9px]">
                        <div className="p-1.5 rounded bg-zinc-950 border border-zinc-900 text-zinc-400 flex justify-between">
                          <span>Git Push:</span>
                          <span className={selectedRole !== 'viewer' ? 'text-emerald-400' : 'text-red-400'}>
                            {selectedRole !== 'viewer' ? 'YES' : 'NO'}
                          </span>
                        </div>
                        <div className="p-1.5 rounded bg-zinc-950 border border-zinc-900 text-zinc-400 flex justify-between">
                          <span>Code Audit:</span>
                          <span className="text-emerald-400">YES</span>
                        </div>
                        <div className="p-1.5 rounded bg-zinc-950 border border-zinc-900 text-zinc-400 flex justify-between">
                          <span>Edit Roadmap:</span>
                          <span className={selectedRole !== 'viewer' ? 'text-emerald-400' : 'text-red-400'}>
                            {selectedRole !== 'viewer' ? 'YES' : 'NO'}
                          </span>
                        </div>
                        <div className="p-1.5 rounded bg-zinc-950 border border-zinc-900 text-zinc-400 flex justify-between">
                          <span>Invite Others:</span>
                          <span className={selectedRole === 'admin' ? 'text-emerald-400' : 'text-red-400'}>
                            {selectedRole === 'admin' ? 'YES' : 'NO'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedRole === 'admin' && (
                      <div className="p-2.5 bg-yellow-950/25 border border-yellow-500/20 rounded-lg flex items-start gap-2 text-[10px] text-yellow-400 leading-normal font-sans">
                        <ShieldAlert size={14} className="shrink-0 text-yellow-500" />
                        <div>
                          <strong>ADMIN PRIVILEGES WARNING</strong>
                          <p className="mt-0.5">This user will be authorized to delete code resources, connect API key channels, and perform administrative edits.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Footer controls */}
        {!successMsg && (
          <div className="px-6 py-4 bg-zinc-950 border-t border-zinc-850 flex items-center justify-between shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-bold font-mono text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-750 rounded-lg transition-all cursor-pointer"
              >
                <ChevronLeft size={13} /> BACK
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-4 py-2 text-xs font-bold font-mono text-white bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-lg shadow-blue-500/10"
              >
                CONTINUE <ChevronRight size={13} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSendInvite}
                disabled={isLoading}
                className="px-5 py-2.5 text-xs font-bold font-mono text-black bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-850 disabled:text-zinc-500 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-yellow-500/15"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>SAVING STATE...</span>
                  </>
                ) : (
                  <>
                    <Check size={13} />
                    <span>AUTHORIZE & SEND INVITATION</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
