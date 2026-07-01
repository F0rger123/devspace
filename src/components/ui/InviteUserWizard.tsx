import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Mail, User, Shield, Key, ChevronRight, ChevronLeft, Check, 
  HelpCircle, AlertCircle, Sparkles, Database, GitCommit, CheckSquare 
} from 'lucide-react';
import { useData } from '../../context/DataProvider';

interface InviteUserWizardProps {
  projectId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function InviteUserWizard({ projectId, onClose, onSuccess }: InviteUserWizardProps) {
  const { sendInvitation, projects, googleUser } = useData();
  const project = projects.find(p => p.id === projectId);

  const [step, setStep] = useState(1);
  const [inviteType, setInviteType] = useState<'email' | 'username'>('email');
  const [recipientInput, setRecipientInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  
  // Fine-grained permissions
  const [permissions, setPermissions] = useState({
    canPushToGit: true,
    canViewCode: true,
    canEditRoadmap: true,
    canInviteOthers: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-adjust permissions based on role
  const handleRoleChange = (role: 'admin' | 'editor' | 'viewer') => {
    setSelectedRole(role);
    if (role === 'admin') {
      setPermissions({
        canPushToGit: true,
        canViewCode: true,
        canEditRoadmap: true,
        canInviteOthers: true,
      });
    } else if (role === 'editor') {
      setPermissions({
        canPushToGit: true,
        canViewCode: true,
        canEditRoadmap: true,
        canInviteOthers: false,
      });
    } else {
      setPermissions({
        canPushToGit: false,
        canViewCode: true,
        canEditRoadmap: false,
        canInviteOthers: false,
      });
    }
  };

  const togglePermission = (key: keyof typeof permissions) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isMaxAccess = permissions.canPushToGit && permissions.canViewCode && permissions.canEditRoadmap && permissions.canInviteOthers;

  const handleNextStep = () => {
    if (step === 1) {
      if (!recipientInput.trim()) {
        setErrorMsg('Please specify a valid recipient.');
        return;
      }
      if (inviteType === 'email' && !recipientInput.includes('@')) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      if (recipientInput.trim().toLowerCase() === (googleUser?.email || '').trim().toLowerCase()) {
        setErrorMsg('You cannot send a collaboration invite to your own account.');
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
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // If invited by username, we simulate or derive a recipient email like username@devspace.core
      // or resolve to their email if we know it. For a flawless flow we format it and save the username fields.
      const resolvedEmail = inviteType === 'email' 
        ? recipientInput.trim().toLowerCase() 
        : `${recipientInput.trim().toLowerCase()}@devspace.core`;

      const resolvedUsername = inviteType === 'username' ? recipientInput.trim() : undefined;

      await sendInvitation(projectId, resolvedEmail, selectedRole, permissions, resolvedUsername);
      
      setSuccessMsg(`✓ Collaboration invitation successfully dispatched to ${recipientInput.trim()}!`);
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while dispatching the invitation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-lg bg-[#0a0a0d] border border-zinc-850 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-950 border-b border-zinc-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-yellow-500/10 rounded-lg text-yellow-500">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-zinc-200">
                Collaboration Gatekeeper
              </h3>
              <p className="text-[10px] text-zinc-500 font-medium">
                Project: <span className="text-zinc-350">{project?.name || 'Local Workspace'}</span>
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

        {/* Progress Tracker */}
        <div className="px-6 py-3 bg-[#0c0c10] border-b border-zinc-900 flex items-center justify-between text-[10px] font-mono text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-600'}`}>1</span>
            <span className={step >= 1 ? 'text-zinc-350 font-bold' : ''}>RECIPIENT</span>
          </div>
          <div className="h-[1px] flex-1 bg-zinc-850 mx-4"></div>
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-600'}`}>2</span>
            <span className={step >= 2 ? 'text-zinc-350 font-bold' : ''}>ACCESS LEVEL</span>
          </div>
          <div className="h-[1px] flex-1 bg-zinc-850 mx-4"></div>
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-600'}`}>3</span>
            <span className={step >= 3 ? 'text-zinc-350 font-bold' : ''}>CONFIRM</span>
          </div>
        </div>

        {/* Content Panel */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-lg flex items-start gap-2.5 text-xs text-red-400 font-mono">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-lg flex items-center gap-3 text-sm text-emerald-400 font-mono animate-pulse">
              <Check size={18} className="shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {!successMsg && (
            <AnimatePresence mode="wait">
              {/* STEP 1: Identity & Recipient */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.12 }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">Step 1: Choose Recipient Address Method</h4>
                    <p className="text-[11px] text-zinc-500">Invite developers securely via their registered email address or GitHub/DevSpace username.</p>
                  </div>

                  {/* Toggle Mode */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-[#121216] border border-zinc-850 rounded-lg">
                    <button
                      type="button"
                      onClick={() => { setInviteType('email'); setRecipientInput(''); }}
                      className={`py-1.5 text-xs font-semibold font-mono rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer ${inviteType === 'email' ? 'bg-zinc-850 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      <Mail size={12} /> Email Address
                    </button>
                    <button
                      type="button"
                      onClick={() => { setInviteType('username'); setRecipientInput(''); }}
                      className={`py-1.5 text-xs font-semibold font-mono rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer ${inviteType === 'username' ? 'bg-zinc-850 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      <User size={12} /> DevSpace Username
                    </button>
                  </div>

                  {/* Input form */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-400 font-mono uppercase">
                      {inviteType === 'email' ? 'Recipient Email Address' : 'Recipient Username'}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                        {inviteType === 'email' ? <Mail size={14} /> : <User size={14} />}
                      </div>
                      <input
                        type={inviteType === 'email' ? 'email' : 'text'}
                        required
                        value={recipientInput}
                        onChange={(e) => setRecipientInput(e.target.value)}
                        placeholder={inviteType === 'email' ? 'developer@workspace.com' : 'e.g. cyber_coder'}
                        className="w-full bg-[#121216] border border-zinc-800 hover:border-zinc-700 rounded-lg pl-9 pr-4 py-2.5 text-xs text-zinc-200 outline-none focus:border-blue-500 font-sans transition-colors"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-900 flex gap-2.5">
                    <HelpCircle size={14} className="text-zinc-500 shrink-0 mt-0.5" />
                    <p className="text-[10.5px] text-zinc-400 leading-normal">
                      Invited collaborators will receive an instant dashboard alert and secure hyperlink invitation token. They must accept this to merge codespaces.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Custom Fine-grained Access Roles & Permissions */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.12 }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">Step 2: Access Role & Fine-grained Custom Policies</h4>
                    <p className="text-[11px] text-zinc-500">Fine-tune precisely what the recipient can access, edit, or commit under your linked workspace.</p>
                  </div>

                  {/* Role selection card deck */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { role: 'viewer', title: 'Viewer', desc: 'Read-only, review files' },
                      { role: 'editor', title: 'Editor', desc: 'Modify issues, brainstorms' },
                      { role: 'admin', title: 'Admin', desc: 'Full control, link keys' }
                    ].map((item) => (
                      <button
                        key={item.role}
                        type="button"
                        onClick={() => handleRoleChange(item.role as any)}
                        className={`p-3 text-left rounded-xl border transition-all flex flex-col justify-between h-24 cursor-pointer select-none ${
                          selectedRole === item.role 
                            ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.15)]' 
                            : 'bg-[#121216] border-zinc-850 hover:border-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-xs font-bold font-mono uppercase ${selectedRole === item.role ? 'text-blue-400' : 'text-zinc-350'}`}>
                            {item.title}
                          </span>
                          {selectedRole === item.role && (
                            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                              <Check size={10} className="text-white" />
                            </div>
                          )}
                        </div>
                        <span className="text-[9.5px] text-zinc-500 leading-snug">{item.desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* Fine-grained Custom Checklist */}
                  <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-900 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">Custom Permissions Matrix</span>
                      {isMaxAccess ? (
                        <span className="text-[8px] bg-red-500/10 text-red-400 font-bold px-1.5 py-0.5 rounded border border-red-500/20 uppercase tracking-wider font-mono">MAX ACCESS (OWNER EQUIVALENT)</span>
                      ) : (
                        <span className="text-[8px] bg-zinc-900 text-zinc-500 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">Customized</span>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      {/* Permission 1: Git push/write */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-bold text-zinc-300 font-mono flex items-center gap-1">
                            <GitCommit size={11} className="text-zinc-500" /> Git Repository Write Access
                          </span>
                          <p className="text-[9px] text-zinc-500 leading-normal">Allows packing and pushing commits directly to the linked GitHub repository.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={permissions.canPushToGit} 
                            onChange={() => togglePermission('canPushToGit')}
                            className="sr-only peer" 
                          />
                          <div className="w-7 h-4 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
                        </label>
                      </div>

                      {/* Permission 2: Code viewer */}
                      <div className="flex items-center justify-between border-t border-zinc-900/50 pt-2.5">
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-bold text-zinc-300 font-mono flex items-center gap-1">
                            <Database size={11} className="text-zinc-500" /> Inspect Repository Architecture
                          </span>
                          <p className="text-[9px] text-zinc-500 leading-normal">Allows fetching file trees, auditing security, and reading source file details.</p>
                        </div>
                        <label className="relative inline-flex inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={permissions.canViewCode} 
                            onChange={() => togglePermission('canViewCode')}
                            className="sr-only peer" 
                          />
                          <div className="w-7 h-4 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
                        </label>
                      </div>

                      {/* Permission 3: Roadmap edits */}
                      <div className="flex items-center justify-between border-t border-zinc-900/50 pt-2.5">
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-bold text-zinc-300 font-mono flex items-center gap-1">
                            <CheckSquare size={11} className="text-zinc-500" /> Edit Roadmap & Projects
                          </span>
                          <p className="text-[9px] text-zinc-500 leading-normal">Allows editing milestones, tasks, and project brainstorm ideas.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={permissions.canEditRoadmap} 
                            onChange={() => togglePermission('canEditRoadmap')}
                            className="sr-only peer" 
                          />
                          <div className="w-7 h-4 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
                        </label>
                      </div>

                      {/* Permission 4: Invite others */}
                      <div className="flex items-center justify-between border-t border-zinc-900/50 pt-2.5">
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-bold text-zinc-300 font-mono flex items-center gap-1">
                            <Shield size={11} className="text-zinc-500" /> Delegate Collaboration Credentials
                          </span>
                          <p className="text-[9px] text-zinc-500 leading-normal">Allows sending project invitations and assigning user access roles to others.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={permissions.canInviteOthers} 
                            onChange={() => togglePermission('canInviteOthers')}
                            className="sr-only peer" 
                          />
                          <div className="w-7 h-4 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Dispatch & Summary Confirmation */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.12 }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">Step 3: Verification & Dispatch Summary</h4>
                    <p className="text-[11px] text-zinc-500">Carefully double check the final credentials of the incoming collaborator before launching.</p>
                  </div>

                  {/* Summary grid */}
                  <div className="p-4 bg-[#121216] border border-zinc-850 rounded-xl space-y-3.5">
                    <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-900">
                      <span className="text-zinc-500 font-mono uppercase font-bold text-[10px]">Recipient Entity:</span>
                      <span className="text-white font-bold font-mono">{recipientInput.trim()} ({inviteType.toUpperCase()})</span>
                    </div>

                    <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-900">
                      <span className="text-zinc-500 font-mono uppercase font-bold text-[10px]">Assigned Baseline Role:</span>
                      <span className="text-blue-400 font-extrabold font-mono uppercase tracking-wider">{selectedRole}</span>
                    </div>

                    <div className="space-y-2 pt-1">
                      <span className="text-zinc-500 font-mono uppercase font-bold text-[9px] block">Committed Access Level:</span>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                        <div className={`p-2 rounded border flex items-center justify-between ${permissions.canPushToGit ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' : 'bg-red-500/5 border-red-500/10 text-red-400'}`}>
                          <span>Git Push Code</span>
                          <span className="font-bold">{permissions.canPushToGit ? 'GRANTED' : 'REVOKED'}</span>
                        </div>
                        <div className={`p-2 rounded border flex items-center justify-between ${permissions.canViewCode ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' : 'bg-red-500/5 border-red-500/10 text-red-400'}`}>
                          <span>View/Audit Code</span>
                          <span className="font-bold">{permissions.canViewCode ? 'GRANTED' : 'REVOKED'}</span>
                        </div>
                        <div className={`p-2 rounded border flex items-center justify-between ${permissions.canEditRoadmap ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' : 'bg-red-500/5 border-red-500/10 text-red-400'}`}>
                          <span>Edit Roadmap</span>
                          <span className="font-bold">{permissions.canEditRoadmap ? 'GRANTED' : 'REVOKED'}</span>
                        </div>
                        <div className={`p-2 rounded border flex items-center justify-between ${permissions.canInviteOthers ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' : 'bg-red-500/5 border-red-500/10 text-red-400'}`}>
                          <span>Invite Others</span>
                          <span className="font-bold">{permissions.canInviteOthers ? 'GRANTED' : 'REVOKED'}</span>
                        </div>
                      </div>
                    </div>

                    {isMaxAccess && (
                      <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-lg flex items-start gap-2 text-[10px] text-red-400 leading-normal font-mono">
                        <Key size={14} className="shrink-0 mt-0.5 text-red-500" />
                        <div>
                          <strong>CRITICAL ADVISORY: MAX ACCESS AUTHORIZATION</strong>
                          <p className="mt-0.5">This user will possess unrestricted push/write privileges to the connected GitHub repository and can perform owner operations.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Footer actions */}
        {!successMsg && (
          <div className="px-6 py-4 bg-zinc-950 border-t border-zinc-850 flex items-center justify-between">
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
                className="px-4 py-2 text-xs font-bold font-mono text-white bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-[0_0_12px_rgba(59,130,246,0.25)] hover:shadow-[0_0_16px_rgba(59,130,246,0.35)]"
              >
                CONTINUE <ChevronRight size={13} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSendInvite}
                disabled={isLoading}
                className="px-5 py-2.5 text-xs font-bold font-mono text-black bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-800 disabled:text-zinc-500 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_16px_rgba(234,179,8,0.25)]"
              >
                {isLoading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    <span>DISPATCHING SECURE TOKEN...</span>
                  </>
                ) : (
                  <>
                    <Check size={13} />
                    <span>AUTHORIZE & DISPATCH INVITATION</span>
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
