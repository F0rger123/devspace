import { useState, useEffect } from 'react';
import { 
  Lock, X, RefreshCw, Github, Globe, ExternalLink, Check, Clock, 
  UserPlus, MessageSquare, Star, Trash2 
} from 'lucide-react';
import { 
  collection, query, where, getDocs, getDoc, doc, setDoc, deleteDoc, updateDoc 
} from 'firebase/firestore';
import { db } from '../lib/auth';
import { setDocWithSanitize, updateDocWithSanitize, deleteDocWithSanitize } from '../context/DataProvider';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export interface DevProfile {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  avatarColor: string;
  title: string;
  bio: string;
  isPrivate?: boolean;
  followersCount?: number;
  followingCount?: number;
  createdAt: number;
  githubUrl?: string;
  websiteUrl?: string;
  techStack?: string;
}

export interface PublicProject {
  id: string;
  name: string;
  description: string;
  isPublic?: boolean;
  tags?: string[];
  starsCount?: number;
  ownerId?: string;
  status: string;
  createdAt: number;
  ownerName?: string;
  ownerAvatarColor?: string;
  ownerTitle?: string;
}

interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  receiverName: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
}

interface ProfileViewProps {
  developer: DevProfile;
  currentUid: string;
  currentEmail: string;
  currentUserProfile: any;
  isFollowingInitially?: boolean;
  onClose: () => void;
  onInitiateChat: (dev: DevProfile) => void;
  onSelectProject?: (proj: PublicProject) => void;
  onFollowToggle?: (devId: string, isFollowing: boolean) => void;
  showToast: (text: string, type?: 'success' | 'error') => void;
  addNotification?: (notif: {
    userId: string;
    type: "message" | "star" | "comment" | "friend_request" | "collab_request" | "collab_accept";
    title: string;
    description: string;
    senderId?: string;
    senderName?: string;
    projectId?: string;
    projectName?: string;
  }) => Promise<void>;
}

export function ProfileView({
  developer,
  currentUid,
  currentEmail,
  currentUserProfile,
  isFollowingInitially = false,
  onClose,
  onInitiateChat,
  onSelectProject,
  onFollowToggle,
  showToast,
  addNotification
}: ProfileViewProps) {
  const [loading, setLoading] = useState(true);
  const [devProjects, setDevProjects] = useState<PublicProject[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(isFollowingInitially);
  const [friendshipStatus, setFriendshipStatus] = useState<'accepted' | 'pending_sent' | 'pending_received' | 'none'>('none');
  const [activeFriendRequestDoc, setActiveFriendRequestDoc] = useState<FriendRequest | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDeveloperStats() {
      if (!developer.uid) return;
      setLoading(true);
      try {
        // 1. Fetch public projects
        const projRef = collection(db, 'projects');
        const qProj = query(projRef, where('ownerId', '==', developer.uid), where('isPublic', '==', true));
        const projSnap = await getDocs(qProj);
        
        if (!active) return;

        const projects: PublicProject[] = projSnap.docs.map(d => {
          const pData = d.data();
          return {
            id: d.id,
            name: pData.name || '',
            description: pData.description || '',
            status: pData.status || 'Active',
            createdAt: pData.createdAt || Date.now(),
            tags: pData.tags || [],
            starsCount: pData.starsCount || 0,
            ownerId: developer.uid,
            ownerName: developer.displayName || developer.username || 'Developer',
            ownerAvatarColor: developer.avatarColor || '#10b981',
            ownerTitle: developer.title || 'Engineer'
          };
        });
        setDevProjects(projects);

        // 2. Fetch followers & following count
        const followsRef = collection(db, 'follows');
        const followersQuery = query(followsRef, where('followingId', '==', developer.uid));
        const followingQuery = query(followsRef, where('followerId', '==', developer.uid));

        const [followersSnap, followingSnap] = await Promise.all([
          getDocs(followersQuery),
          getDocs(followingQuery)
        ]);

        if (!active) return;
        setFollowersCount(followersSnap.size);
        setFollowingCount(followingSnap.size);

        // 3. Fetch following status
        if (developer.uid !== currentUid) {
          const followId = `follow_${currentUid}_${developer.uid}`;
          const followDoc = await getDoc(doc(db, 'follows', followId));
          if (active) {
            setIsFollowing(followDoc.exists());
          }
        }

        // 4. Fetch friendship status
        if (developer.uid !== currentUid) {
          const reqSentId = `req_${currentUid}_${developer.uid}`;
          const reqRecId = `req_${developer.uid}_${currentUid}`;

          const [sentSnap, recSnap] = await Promise.all([
            getDoc(doc(db, 'friend_requests', reqSentId)),
            getDoc(doc(db, 'friend_requests', reqRecId))
          ]);

          if (!active) return;

          if (sentSnap.exists()) {
            const data = sentSnap.data();
            setFriendshipStatus(data?.status === 'accepted' ? 'accepted' : 'pending_sent');
            setActiveFriendRequestDoc({ id: sentSnap.id, ...data } as FriendRequest);
          } else if (recSnap.exists()) {
            const data = recSnap.data();
            setFriendshipStatus(data?.status === 'accepted' ? 'accepted' : 'pending_received');
            setActiveFriendRequestDoc({ id: recSnap.id, ...data } as FriendRequest);
          } else {
            setFriendshipStatus('none');
            setActiveFriendRequestDoc(null);
          }
        }
      } catch (err) {
        console.error("Failed to load developer profile statistics:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDeveloperStats();

    return () => {
      active = false;
    };
  }, [developer.uid, currentUid]);

  const handleToggleFollow = async () => {
    setActionLoading('follow');
    const followId = `follow_${currentUid}_${developer.uid}`;
    try {
      const followRef = doc(db, 'follows', followId);
      if (isFollowing) {
        await deleteDocWithSanitize(followRef);
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
        showToast(`You stopped following ${developer.displayName || developer.username}.`);
        if (onFollowToggle) onFollowToggle(developer.uid, false);
      } else {
        await setDocWithSanitize(followRef, {
          id: followId,
          followerId: currentUid,
          followingId: developer.uid,
          createdAt: Date.now()
        });
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        showToast(`You are now following ${developer.displayName || developer.username}!`);
        if (onFollowToggle) onFollowToggle(developer.uid, true);

        if (developer.uid !== currentUid && addNotification) {
          await addNotification({
            userId: developer.uid,
            type: 'friend_request',
            title: 'New Follower! 🤝',
            description: `${currentUserProfile?.displayName || 'A developer'} started following your profile.`,
            senderId: currentUid,
            senderName: currentUserProfile?.displayName
          });
        }
      }
    } catch (err) {
      console.error("Failed to toggle follow status:", err);
      showToast("Could not complete follow operation.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendFriendRequest = async () => {
    setActionLoading('friend');
    try {
      const requestId = `req_${currentUid}_${developer.uid}`;
      const requestRef = doc(db, 'friend_requests', requestId);
      
      const newRequestData = {
        id: requestId,
        senderId: currentUid,
        receiverId: developer.uid,
        senderName: currentUserProfile?.displayName || currentUserProfile?.username || 'Collaborator',
        receiverName: developer.displayName || developer.username || 'Developer',
        status: 'pending' as const,
        createdAt: Date.now()
      };

      await setDocWithSanitize(requestRef, newRequestData);
      setFriendshipStatus('pending_sent');
      setActiveFriendRequestDoc({ id: requestId, ...newRequestData } as FriendRequest);
      showToast(`Friend request sent to ${developer.displayName}!`);

      if (developer.uid !== currentUid && addNotification) {
        await addNotification({
          userId: developer.uid,
          type: 'friend_request',
          title: 'Friend Request Received 👥',
          description: `${currentUserProfile?.displayName || 'A developer'} sent you a friend request.`,
          senderId: currentUid,
          senderName: currentUserProfile?.displayName
        });
      }
    } catch (err) {
      console.error("Failed to send friend request:", err);
      showToast("Failed to dispatch friend request.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRespondFriendRequest = async (accept: boolean) => {
    if (!activeFriendRequestDoc) return;
    setActionLoading('respond');
    try {
      const requestRef = doc(db, 'friend_requests', activeFriendRequestDoc.id);
      if (accept) {
        await updateDocWithSanitize(requestRef, { status: 'accepted' });
        setFriendshipStatus('accepted');
        showToast(`Friend request accepted!`);
        
        // Auto-create chat session on mutual friend accept
        const chatId = currentUid < developer.uid ? `chat_${currentUid}_${developer.uid}` : `chat_${developer.uid}_${currentUid}`;
        const chatRef = doc(db, 'chats', chatId);
        await setDocWithSanitize(chatRef, {
          id: chatId,
          participantIds: [currentUid, developer.uid],
          status: 'accepted',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lastMessage: "Mutual connection confirmed. Direct message unlocked!",
          requestedBy: currentUid
        });
      } else {
        await deleteDocWithSanitize(requestRef);
        setFriendshipStatus('none');
        setActiveFriendRequestDoc(null);
        showToast(`Friend request declined.`);
      }
    } catch (err) {
      console.error("Error responding to request:", err);
      showToast("Error updating friend request status.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisconnectFriend = async () => {
    if (!activeFriendRequestDoc) return;
    setActionLoading('respond');
    try {
      await deleteDocWithSanitize(doc(db, 'friend_requests', activeFriendRequestDoc.id));
      setFriendshipStatus('none');
      setActiveFriendRequestDoc(null);
      showToast("Friend disconnected.");
    } catch (err) {
      console.error("Failed to disconnect friend:", err);
      showToast("Failed to remove friend connection.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleInitiateChatClick = () => {
    if (developer.isPrivate && friendshipStatus !== 'accepted') {
      showToast("Profile is private. Send a friend request to start messaging.", "error");
      return;
    }
    onInitiateChat(developer);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative z-10 bg-[#121214] border border-zinc-800 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-zinc-800/60 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-widest text-yellow-500 font-bold">
              Developer Profile
            </span>
            {developer.isPrivate && (
              <span className="flex items-center gap-1 text-[8px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                <Lock size={8} /> Private
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-[#1e1e24] cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-3 flex-1">
            <RefreshCw className="animate-spin text-yellow-500" size={30} />
            <p className="text-xs text-zinc-400 font-mono">Loading developer profile...</p>
          </div>
        ) : (
          <div className="overflow-y-auto custom-scrollbar flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-zinc-800/60">
            
            {/* Left Column: Stats and Bio */}
            <div className="p-6 md:w-[45%] flex flex-col space-y-5">
              {/* Avatar Block */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div 
                  className="w-20 h-20 rounded-full border border-zinc-850 flex items-center justify-center font-black text-2xl text-white shadow-xl"
                  style={{ backgroundColor: developer.avatarColor || '#3b82f6' }}
                >
                  {developer.displayName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || developer.username?.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-extrabold text-zinc-100 leading-tight">
                    {developer.displayName}
                  </h2>
                  <p className="text-xs font-mono text-zinc-400 mt-0.5">
                    @{developer.username}
                  </p>
                  <p className="text-xs font-semibold text-yellow-500 mt-1.5">
                    {developer.title || 'Developer'}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2.5 bg-[#09090b] border border-zinc-850 p-3 rounded-lg text-center">
                <div>
                  <p className="text-sm font-extrabold text-zinc-150">{followersCount}</p>
                  <p className="text-[8px] uppercase text-zinc-500 font-bold tracking-wider">Followers</p>
                </div>
                <div>
                  <p className="text-sm font-extrabold text-zinc-150">{followingCount}</p>
                  <p className="text-[8px] uppercase text-zinc-500 font-bold tracking-wider">Following</p>
                </div>
                <div className="border-t border-zinc-850/50 pt-2 col-span-1">
                  <p className="text-sm font-extrabold text-zinc-150">{devProjects.length}</p>
                  <p className="text-[8px] uppercase text-zinc-500 font-bold tracking-wider">Projects</p>
                </div>
                <div className="border-t border-zinc-850/50 pt-2 col-span-1">
                  <p className="text-sm font-extrabold text-amber-400">
                    {devProjects.reduce((sum, p) => sum + (p.starsCount || 0), 0)}
                  </p>
                  <p className="text-[8px] uppercase text-zinc-500 font-bold tracking-wider">Public Stars</p>
                </div>
              </div>

              {/* Social Link Badges */}
              {(developer.githubUrl || developer.websiteUrl) && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {developer.githubUrl && (
                    <a 
                      href={developer.githubUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1 bg-[#1e1e24] hover:bg-zinc-800 border border-zinc-800 rounded text-[10px] font-semibold text-zinc-300 hover:text-white transition-colors"
                    >
                      <Github size={11} />
                      <span>GitHub</span>
                      <ExternalLink size={8} className="text-zinc-500" />
                    </a>
                  )}
                  {developer.websiteUrl && (
                    <a 
                      href={developer.websiteUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1 bg-[#1e1e24] hover:bg-zinc-800 border border-zinc-800 rounded text-[10px] font-semibold text-zinc-300 hover:text-white transition-colors"
                    >
                      <Globe size={11} />
                      <span>Website</span>
                      <ExternalLink size={8} className="text-zinc-500" />
                    </a>
                  )}
                </div>
              )}

              {/* Bio */}
              <div>
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Developer Bio</h4>
                <p className="text-xs text-zinc-350 leading-relaxed bg-[#0b0b0c] p-3 rounded-lg border border-zinc-850/60 max-h-[120px] overflow-y-auto custom-scrollbar">
                  {developer.bio || 'No developer bio specified yet.'}
                </p>
              </div>

              {/* Tech Stack & Skills */}
              <div>
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Tech Stack & Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {developer.techStack ? (
                    developer.techStack.split(',').map((skill, index) => (
                      <span 
                        key={index}
                        className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/25 text-yellow-500 rounded text-[9px] font-medium uppercase font-mono tracking-wider"
                      >
                        {skill.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] font-mono text-zinc-500 italic pl-1">
                      No tech stack specified.
                    </span>
                  )}
                </div>
              </div>

              {/* Connections & DMs */}
              {developer.uid !== currentUid && (
                <div className="pt-2 flex flex-col gap-2">
                  {/* Friendship control */}
                  {friendshipStatus === 'accepted' ? (
                    <div className="flex gap-1">
                      <span className="flex-1 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold flex items-center justify-center gap-1">
                        <Check size={11} />
                        <span>Connected Friend</span>
                      </span>
                      <button
                        onClick={handleDisconnectFriend}
                        disabled={actionLoading !== null}
                        className="px-2.5 py-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 text-red-400 rounded text-[10px] font-bold transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1"
                        title="Disconnect Friend"
                      >
                        <Trash2 size={11} />
                        <span>Unfriend</span>
                      </button>
                    </div>
                  ) : friendshipStatus === 'pending_sent' ? (
                    <button
                      disabled
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-850 text-zinc-500 rounded text-[10px] font-bold flex items-center justify-center gap-1 cursor-not-allowed"
                    >
                      <Clock size={11} />
                      <span>Request Pending</span>
                    </button>
                  ) : friendshipStatus === 'pending_received' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleRespondFriendRequest(true)}
                        disabled={actionLoading !== null}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Check size={11} />
                        <span>Accept Request</span>
                      </button>
                      <button
                        onClick={() => handleRespondFriendRequest(false)}
                        disabled={actionLoading !== null}
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-350 rounded text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleSendFriendRequest}
                      disabled={actionLoading !== null}
                      className="w-full px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <UserPlus size={11} />
                      <span>Connect Friend</span>
                    </button>
                  )}

                  {/* Follow & Message actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleToggleFollow}
                      disabled={actionLoading !== null}
                      className={cn(
                        "px-3 py-1.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1",
                        isFollowing
                          ? "bg-zinc-800/60 border border-zinc-750 text-zinc-400 hover:bg-zinc-800"
                          : "bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white"
                      )}
                    >
                      {isFollowing ? <Check size={11} /> : <UserPlus size={11} />}
                      <span>{isFollowing ? 'Following' : 'Follow'}</span>
                    </button>
                    <button
                      onClick={handleInitiateChatClick}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-[#1f1f26] border border-zinc-800 text-zinc-300 hover:text-white rounded text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <MessageSquare size={11} />
                      <span>Direct Message</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Public Projects */}
            <div className="p-6 md:w-[55%] flex flex-col space-y-4">
              <div>
                <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-1">
                  🖥️ Public Workspaces ({devProjects.length})
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Explore shared live workspaces and code repositories.
                </p>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[350px] custom-scrollbar flex-1 pr-1">
                {devProjects.length > 0 ? (
                  devProjects.map((proj) => (
                    <div 
                      key={proj.id}
                      onClick={() => {
                        if (onSelectProject) onSelectProject(proj);
                      }}
                      className="p-3 bg-[#0b0b0d] hover:bg-[#121215] border border-zinc-900 hover:border-zinc-800 rounded-lg cursor-pointer transition-all flex flex-col space-y-1.5 group"
                    >
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="text-xs font-bold text-zinc-200 group-hover:text-yellow-500 transition-colors truncate">
                          {proj.name}
                        </h4>
                        <div className="flex items-center gap-1 text-[9px] text-zinc-500 shrink-0">
                          <Star size={10} className="text-zinc-400 group-hover:text-yellow-500/85 transition-colors" />
                          <span>{proj.starsCount}</span>
                        </div>
                      </div>
                      
                      <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {proj.description || 'No detailed description set for this public repository.'}
                      </p>

                      <div className="flex justify-between items-center pt-1 shrink-0">
                        <div className="flex flex-wrap gap-1">
                          {proj.tags?.slice(0, 2).map((t, i) => (
                            <span key={i} className="px-1 text-[8px] font-mono border border-zinc-850 bg-zinc-900 text-zinc-400 rounded">
                              {t}
                            </span>
                          ))}
                        </div>
                        <span className={cn(
                          "text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border",
                          proj.status === 'Active' ? "bg-emerald-950/10 border-emerald-900/30 text-emerald-400" :
                          proj.status === 'Planning' ? "bg-blue-950/10 border-blue-900/30 text-blue-400" :
                          "bg-zinc-900 border-zinc-850 text-zinc-400"
                        )}>
                          {proj.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center border border-dashed border-zinc-850 rounded-lg bg-[#08080a]">
                    <p className="text-xs font-mono text-zinc-500 italic">No public projects published yet.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </motion.div>
    </div>
  );
}
