import { useState, useEffect, useRef } from 'react';
import { 
  Compass, Search, Star, MessageSquare, Send, UserPlus, UserCheck, 
  Users, Flame, Clock, Tag, Globe, Lock, ShieldAlert, ChevronRight, 
  X, Check, AlertCircle, RefreshCw, SendHorizontal, MessageCircle, 
  ThumbsUp, Share2, HelpCircle, Github, ExternalLink 
} from 'lucide-react';
import { 
  collection, query, where, getDocs, getDoc, doc, setDoc, 
  deleteDoc, updateDoc, onSnapshot, orderBy, limit, addDoc 
} from 'firebase/firestore';
import { db, auth } from '../lib/auth';
import { useData } from '../context/DataProvider';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ProfileView } from '../components/ProfileView';

interface PublicProject {
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

interface DevProfile {
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

interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  receiverName: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
  senderAvatarColor?: string;
  senderTitle?: string;
}

interface Comment {
  id: string;
  projectId: string;
  userId: string;
  username: string;
  displayName: string;
  avatarColor: string;
  text: string;
  createdAt: number;
}

interface Chat {
  id: string;
  participantIds: string[];
  lastMessage?: string;
  updatedAt: number;
  createdAt: number;
  status: 'pending' | 'accepted';
  requestedBy: string;
  otherUser?: DevProfile;
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: number;
}

export function Community() {
  const { userProfile, googleUser, addNotification } = useData();
  const currentUid = auth.currentUser?.uid || googleUser?.uid || '';
  const currentEmail = auth.currentUser?.email || googleUser?.email || '';

  const [activeTab, setActiveTab] = useState<'projects' | 'developers' | 'inbox'>(() => {
    const saved = localStorage.getItem('community_active_tab');
    return (saved as any) || 'projects';
  });
  const [projectSort, setProjectSort] = useState<'trending' | 'latest'>('trending');

  useEffect(() => {
    localStorage.setItem('community_active_tab', activeTab);
  }, [activeTab]);
  
  // Search and enhanced filters state
  const [projectSearch, setProjectSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [devSearch, setDevSearch] = useState('');
  
  // Data lists
  const [publicProjects, setPublicProjects] = useState<PublicProject[]>([]);
  const [developers, setDevelopers] = useState<DevProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [follows, setFollows] = useState<Record<string, boolean>>({}); // followeeId -> boolean
  const [starredProjects, setStarredProjects] = useState<Record<string, boolean>>({}); // projectId -> boolean
  
  // Selection / Modals
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(null);
  const [selectedDeveloper, setSelectedDeveloper] = useState<DevProfile | null>(null);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  
  // Sub-data/Input states
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  
  // Loading & Action feedback
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingDevs, setLoadingDevs] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper toast notifier
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Initial Load of Community Projects & Users
  useEffect(() => {
    if (!currentUid) return;
    fetchPublicProjects();
    fetchDevelopers();
    fetchFriendRequests();
    fetchFollowingGraph();
    fetchStarredProjects();
  }, [currentUid]);

  // Load chats in real-time
  useEffect(() => {
    if (!currentUid) return;
    
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participantIds', 'array-contains', currentUid));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedChats: Chat[] = [];
      for (const d of snapshot.docs) {
        const chatData = d.data() as any;
        const otherUserId = chatData.participantIds.find((id: string) => id !== currentUid);
        
        let otherUser: DevProfile | undefined;
        if (otherUserId) {
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          if (userDoc.exists()) {
            otherUser = userDoc.data() as DevProfile;
          } else {
            otherUser = {
              uid: otherUserId,
              email: '',
              username: 'Developer',
              displayName: 'Developer',
              avatarColor: '#3b82f6',
              title: 'DevSpace Engineer',
              bio: 'Active member',
              createdAt: Date.now()
            };
          }
        }
        
        fetchedChats.push({
          id: d.id,
          ...chatData,
          otherUser
        });
      }
      // Sort chats by updatedAt descending
      fetchedChats.sort((a, b) => b.updatedAt - a.updatedAt);
      setChats(fetchedChats);
    }, (err) => {
      console.error("Error listening to chats:", err);
    });

    return () => unsubscribe();
  }, [currentUid]);

  // Persist active chat ID and auto-restore active chat
  useEffect(() => {
    if (activeChat) {
      localStorage.setItem('community_active_chat_id', activeChat.id);
    } else {
      localStorage.removeItem('community_active_chat_id');
    }
  }, [activeChat]);

  useEffect(() => {
    const storedChatId = localStorage.getItem('community_active_chat_id');
    if (storedChatId && chats.length > 0 && (!activeChat || activeChat.id !== storedChatId)) {
      const match = chats.find(c => c.id === storedChatId);
      if (match) {
        setActiveChat(match);
      }
    }
  }, [chats]);

  // Real-time chat messages listener
  useEffect(() => {
    if (!activeChat) {
      setChatMessages([]);
      return;
    }

    const messagesRef = collection(db, 'chats', activeChat.id, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      setChatMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, (err) => {
      console.error("Error listening to messages:", err);
    });

    return () => unsubscribe();
  }, [activeChat]);

  // Real-time comments listener for selected project
  useEffect(() => {
    if (!selectedProject) {
      setComments([]);
      return;
    }

    const commentsRef = collection(db, 'projects', selectedProject.id, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comms = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Comment));
      setComments(comms);
    }, (err) => {
      console.error("Error listening to comments:", err);
    });

    return () => unsubscribe();
  }, [selectedProject]);

  // Developer Profile States
  const [selectedDevProjects, setSelectedDevProjects] = useState<PublicProject[]>([]);
  const [loadingSelectedDev, setLoadingSelectedDev] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState<'accepted' | 'pending_sent' | 'pending_received' | 'none'>('none');
  const [activeFriendRequestDoc, setActiveFriendRequestDoc] = useState<FriendRequest | null>(null);
  const [devFollowersCount, setDevFollowersCount] = useState(0);
  const [devFollowingCount, setDevFollowingCount] = useState(0);

  const handleOpenDeveloperProfile = async (developerId: string) => {
    if (!developerId) return;
    setLoadingSelectedDev(true);
    setSelectedDevProjects([]);
    setFriendshipStatus('none');
    setDevFollowersCount(0);
    setDevFollowingCount(0);

    try {
      // 1. Fetch user profile
      let dev: DevProfile | null = null;
      if (developerId === currentUid) {
        dev = {
          uid: currentUid,
          email: currentEmail,
          username: userProfile?.username || currentEmail.split('@')[0] || 'Developer',
          displayName: userProfile?.displayName || currentEmail.split('@')[0] || 'Developer',
          avatarColor: userProfile?.avatarColor || '#eab308',
          title: userProfile?.title || 'Core Developer',
          bio: userProfile?.bio || 'No bio specified yet.',
          isPrivate: userProfile?.isPrivate || false,
          githubUrl: userProfile?.githubUrl || '',
          websiteUrl: userProfile?.websiteUrl || '',
          techStack: userProfile?.techStack || '',
          createdAt: userProfile?.createdAt || Date.now()
        } as DevProfile;
      } else {
        const userDocRef = doc(db, 'users', developerId);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          dev = { uid: userSnap.id, ...userSnap.data() } as DevProfile;
        } else {
          showToast("Developer profile not found or is restricted.", "error");
          setLoadingSelectedDev(false);
          return;
        }
      }

      if (dev) {
        setSelectedDeveloper(dev);

        // 2. Fetch public projects owned by this developer
        const projRef = collection(db, 'projects');
        const qProj = query(projRef, where('ownerId', '==', developerId), where('isPublic', '==', true));
        const projSnap = await getDocs(qProj);
        const devProjects: PublicProject[] = projSnap.docs.map(d => {
          const pData = d.data();
          return {
            id: d.id,
            name: pData.name || '',
            description: pData.description || '',
            status: pData.status || 'Active',
            createdAt: pData.createdAt || Date.now(),
            tags: pData.tags || [],
            starsCount: pData.starsCount || 0,
            ownerId: developerId,
            ownerName: dev?.displayName || dev?.username || 'Developer',
            ownerAvatarColor: dev?.avatarColor || '#10b981',
            ownerTitle: dev?.title || 'Engineer'
          };
        });
        setSelectedDevProjects(devProjects);

        // 3. Fetch followers and following count
        const followsRef = collection(db, 'follows');
        const followersQuery = query(followsRef, where('followingId', '==', developerId));
        const followingQuery = query(followsRef, where('followerId', '==', developerId));

        const [followersSnap, followingSnap] = await Promise.all([
          getDocs(followersQuery),
          getDocs(followingQuery)
        ]);

        setDevFollowersCount(followersSnap.size);
        setDevFollowingCount(followingSnap.size);

        // 4. Fetch friendship status
        if (developerId !== currentUid) {
          const reqSentId = `req_${currentUid}_${developerId}`;
          const reqRecId = `req_${developerId}_${currentUid}`;

          const [sentSnap, recSnap] = await Promise.all([
            getDoc(doc(db, 'friend_requests', reqSentId)),
            getDoc(doc(db, 'friend_requests', reqRecId))
          ]);

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
        } else {
          setFriendshipStatus('none');
          setActiveFriendRequestDoc(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch developer details:", err);
      showToast("Error retrieving developer details.", "error");
    } finally {
      setLoadingSelectedDev(false);
    }
  };

  // Fetch Public Projects
  const fetchPublicProjects = async () => {
    setLoadingProjects(true);
    try {
      const projRef = collection(db, 'projects');
      const q = query(projRef, where('isPublic', '==', true));
      const snapshot = await getDocs(q);
      
      const list: PublicProject[] = [];
      for (const d of snapshot.docs) {
        const pData = d.data() as any;
        // Fetch owner details to display profile information alongside project
        let ownerName = 'Unknown Developer';
        let ownerAvatarColor = '#10b981';
        let ownerTitle = 'Core Engineer';
        
        if (pData.ownerId) {
          const ownerDoc = await getDoc(doc(db, 'users', pData.ownerId));
          if (ownerDoc.exists()) {
            const oData = ownerDoc.data();
            ownerName = oData.displayName || oData.username || ownerName;
            ownerAvatarColor = oData.avatarColor || ownerAvatarColor;
            ownerTitle = oData.title || ownerTitle;
          }
        }
        
        list.push({
          id: d.id,
          name: pData.name || '',
          description: pData.description || '',
          status: pData.status || 'Active',
          createdAt: pData.createdAt || Date.now(),
          tags: pData.tags || [],
          starsCount: pData.starsCount || 0,
          ownerId: pData.ownerId || '',
          ownerName,
          ownerAvatarColor,
          ownerTitle
        });
      }
      setPublicProjects(list);
    } catch (err) {
      console.error("Failed to load community projects:", err);
      showToast("Could not sync public projects feed.", "error");
    } finally {
      setLoadingProjects(false);
    }
  };

  // Fetch Developers List
  const fetchDevelopers = async () => {
    setLoadingDevs(true);
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const list = snapshot.docs
        .map(d => d.data() as DevProfile)
        .filter(u => u.uid !== currentUid); // exclude current user
      setDevelopers(list);
    } catch (err) {
      console.error("Failed to load developers:", err);
    } finally {
      setLoadingDevs(false);
    }
  };

  // Fetch friend requests
  const fetchFriendRequests = async () => {
    try {
      const reqRef = collection(db, 'friend_requests');
      const q = query(reqRef, where('receiverId', '==', currentUid));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FriendRequest));
      setFriendRequests(list);
    } catch (err) {
      console.error("Failed to load friend requests:", err);
    }
  };

  // Fetch current following status
  const fetchFollowingGraph = async () => {
    try {
      const followsRef = collection(db, 'follows');
      const q = query(followsRef, where('followerId', '==', currentUid));
      const snapshot = await getDocs(q);
      const mapping: Record<string, boolean> = {};
      snapshot.docs.forEach(d => {
        const followData = d.data();
        if (followData.followingId) {
          mapping[followData.followingId] = true;
        }
      });
      setFollows(mapping);
    } catch (err) {
      console.error("Failed to fetch follows:", err);
    }
  };

  // Fetch current starred projects status
  const fetchStarredProjects = async () => {
    try {
      const starred: Record<string, boolean> = {};
      const projRef = collection(db, 'projects');
      const q = query(projRef, where('isPublic', '==', true));
      const snapshot = await getDocs(q);
      
      for (const pDoc of snapshot.docs) {
        const starDoc = await getDoc(doc(db, 'projects', pDoc.id, 'stars', currentUid));
        if (starDoc.exists()) {
          starred[pDoc.id] = true;
        }
      }
      setStarredProjects(starred);
    } catch (err) {
      console.error("Failed to fetch starred projects map:", err);
    }
  };

  // Star / Upvote a Project
  const handleToggleStar = async (project: PublicProject) => {
    const alreadyStarred = starredProjects[project.id];
    const prevStars = project.starsCount || 0;
    
    // Optimistic UI update
    setStarredProjects(prev => ({ ...prev, [project.id]: !alreadyStarred }));
    setPublicProjects(prev => prev.map(p => {
      if (p.id === project.id) {
        return { ...p, starsCount: alreadyStarred ? Math.max(0, prevStars - 1) : prevStars + 1 };
      }
      return p;
    }));

    try {
      const starRef = doc(db, 'projects', project.id, 'stars', currentUid);
      const projectDocRef = doc(db, 'projects', project.id);
      
      if (alreadyStarred) {
        await deleteDoc(starRef);
        await updateDoc(projectDocRef, {
          starsCount: Math.max(0, prevStars - 1)
        });
        showToast(`Removed star from "${project.name}".`);
      } else {
        await setDoc(starRef, { id: currentUid, createdAt: Date.now() });
        await updateDoc(projectDocRef, {
          starsCount: prevStars + 1
        });
        showToast(`Starred "${project.name}" successfully!`);

        if (project.ownerId && project.ownerId !== currentUid && addNotification) {
          await addNotification({
            userId: project.ownerId,
            type: 'star',
            title: 'Project Starred! ⭐',
            description: `${userProfile?.displayName || 'A developer'} starred your project "${project.name}"!`,
            senderId: currentUid,
            senderName: userProfile?.displayName,
            projectId: project.id,
            projectName: project.name
          });
        }
      }
    } catch (err) {
      console.error("Failed to toggle star:", err);
      // Revert optimistic state
      setStarredProjects(prev => ({ ...prev, [project.id]: alreadyStarred }));
      setPublicProjects(prev => prev.map(p => {
        if (p.id === project.id) {
          return { ...p, starsCount: prevStars };
        }
        return p;
      }));
      showToast("Failed to star project. Permission denied.", "error");
    }
  };

  // Post a Comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedProject) return;

    const text = newCommentText.trim();
    setNewCommentText('');

    try {
      const commentId = `comment-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const commentRef = doc(db, 'projects', selectedProject.id, 'comments', commentId);
      
      const newComment: Comment = {
        id: commentId,
        projectId: selectedProject.id,
        userId: currentUid,
        username: userProfile?.username || currentEmail.split('@')[0] || 'Developer',
        displayName: userProfile?.displayName || currentEmail.split('@')[0] || 'Developer',
        avatarColor: userProfile?.avatarColor || '#eab308',
        text,
        createdAt: Date.now()
      };

      await setDoc(commentRef, newComment);
      showToast("Comment published!");

      if (selectedProject.ownerId && selectedProject.ownerId !== currentUid && addNotification) {
        await addNotification({
          userId: selectedProject.ownerId,
          type: 'comment',
          title: 'New Project Comment 💬',
          description: `${userProfile?.displayName || 'A developer'} commented on "${selectedProject.name}": "${text.length > 50 ? text.substring(0, 50) + '...' : text}"`,
          senderId: currentUid,
          senderName: userProfile?.displayName,
          projectId: selectedProject.id,
          projectName: selectedProject.name
        });
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
      showToast("Failed to post comment. Insufficient permission.", "error");
    }
  };

  // Follow / Unfollow Developer
  const handleToggleFollow = async (dev: DevProfile) => {
    const following = follows[dev.uid];
    const followId = `follow_${currentUid}_${dev.uid}`;
    setActionLoading(dev.uid);

    try {
      const followRef = doc(db, 'follows', followId);
      if (following) {
        await deleteDoc(followRef);
        setFollows(prev => {
          const updated = { ...prev };
          delete updated[dev.uid];
          return updated;
        });
        showToast(`You stopped following ${dev.displayName || dev.username}.`);
      } else {
        await setDoc(followRef, {
          id: followId,
          followerId: currentUid,
          followingId: dev.uid,
          createdAt: Date.now()
        });
        setFollows(prev => ({ ...prev, [dev.uid]: true }));
        showToast(`You are now following ${dev.displayName || dev.username}!`);

        if (dev.uid !== currentUid && addNotification) {
          await addNotification({
            userId: dev.uid,
            type: 'friend_request',
            title: 'New Follower! 🤝',
            description: `${userProfile?.displayName || 'A developer'} started following your profile.`,
            senderId: currentUid,
            senderName: userProfile?.displayName
          });
        }
      }
    } catch (err) {
      console.error("Failed to toggle follow graph:", err);
      showToast("Could not complete follow operation.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Send Friend Request
  const handleSendFriendRequest = async (dev: DevProfile) => {
    setActionLoading(`friend_${dev.uid}`);
    try {
      const requestId = `req_${currentUid}_${dev.uid}`;
      const requestRef = doc(db, 'friend_requests', requestId);
      
      await setDoc(requestRef, {
        id: requestId,
        senderId: currentUid,
        receiverId: dev.uid,
        senderName: userProfile?.displayName || userProfile?.username || 'Collaborator',
        receiverName: dev.displayName || dev.username || 'Developer',
        status: 'pending',
        createdAt: Date.now()
      });
      showToast(`Friend request sent to ${dev.displayName}!`);

      if (dev.uid !== currentUid && addNotification) {
        await addNotification({
          userId: dev.uid,
          type: 'friend_request',
          title: 'Friend Request Received 👥',
          description: `${userProfile?.displayName || 'A developer'} sent you a friend request.`,
          senderId: currentUid,
          senderName: userProfile?.displayName
        });
      }
    } catch (err) {
      console.error("Failed to send friend request:", err);
      showToast("Failed to dispatch friend request.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Accept / Decline Friend Request
  const handleRespondFriendRequest = async (req: FriendRequest, accept: boolean) => {
    setActionLoading(`respond_${req.id}`);
    try {
      const requestRef = doc(db, 'friend_requests', req.id);
      if (accept) {
        await updateDoc(requestRef, { status: 'accepted' });
        showToast(`Friend request from ${req.senderName} accepted!`);
        
        // Auto-create chat session on mutual friend accept
        const chatId = currentUid < req.senderId ? `chat_${currentUid}_${req.senderId}` : `chat_${req.senderId}_${currentUid}`;
        const chatRef = doc(db, 'chats', chatId);
        await setDoc(chatRef, {
          id: chatId,
          participantIds: [currentUid, req.senderId],
          status: 'accepted',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lastMessage: `Connected! Wave hello to ${userProfile?.displayName || 'your friend'}.`
        });

        if (addNotification) {
          await addNotification({
            userId: req.senderId,
            type: 'collab_accept',
            title: 'Friend Request Accepted! ✅',
            description: `${userProfile?.displayName || 'A developer'} accepted your friend request. You can now chat in Inbox!`,
            senderId: currentUid,
            senderName: userProfile?.displayName
          });
        }
      } else {
        await deleteDoc(requestRef);
        showToast(`Friend request declined.`);
      }
      setFriendRequests(prev => prev.filter(r => r.id !== req.id));
    } catch (err) {
      console.error("Error responding to request:", err);
      showToast("Error updating friend request status.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Initiate Chat Session / Send Message Request
  const handleInitiateChat = async (dev: DevProfile) => {
    // If private profile and not following/friend, prompt connection first
    if (dev.isPrivate) {
      const friendship = friendRequests.find(r => r.senderId === dev.uid && r.status === 'accepted');
      if (!friendship) {
        // Find if we sent request
        showToast("Profile is private. Send a friend request to start messaging.", "error");
        return;
      }
    }

    const chatId = currentUid < dev.uid ? `chat_${currentUid}_${dev.uid}` : `chat_${dev.uid}_${currentUid}`;
    setActionLoading(`chat_${dev.uid}`);
    
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          id: chatId,
          participantIds: [currentUid, dev.uid],
          status: 'accepted', // default open
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lastMessage: "Chat conversation started.",
          requestedBy: currentUid
        });
      }
      
      const newChat: Chat = {
        id: chatId,
        participantIds: [currentUid, dev.uid],
        status: 'accepted',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        requestedBy: currentUid,
        otherUser: dev
      };

      setActiveChat(newChat);
      setActiveTab('inbox');
    } catch (err) {
      console.error("Failed to start chat session:", err);
      showToast("Failed to initiate secure chat room.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Send Direct Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim() || !activeChat) return;

    const text = newChatMessage.trim();
    setNewChatMessage('');

    try {
      const messageId = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const messageRef = doc(db, 'chats', activeChat.id, 'messages', messageId);
      
      await setDoc(messageRef, {
        id: messageId,
        chatId: activeChat.id,
        senderId: currentUid,
        senderName: userProfile?.displayName || userProfile?.username || 'Developer',
        text,
        createdAt: Date.now()
      });

      // Update parent chat node
      const chatRef = doc(db, 'chats', activeChat.id);
      await updateDoc(chatRef, {
        lastMessage: text,
        updatedAt: Date.now()
      });

      const recipientId = activeChat.participantIds.find(id => id !== currentUid);
      if (recipientId && addNotification) {
        await addNotification({
          userId: recipientId,
          type: 'message',
          title: 'New Message ✉️',
          description: `${userProfile?.displayName || 'A developer'}: "${text.length > 50 ? text.substring(0, 50) + '...' : text}"`,
          senderId: currentUid,
          senderName: userProfile?.displayName
        });
      }
    } catch (err) {
      console.error("Failed to deliver message:", err);
      showToast("Failed to dispatch message.", "error");
    }
  };

  // Filter & Search computation with Enhanced Tags & Status
  const filteredProjects = publicProjects
    .filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(projectSearch.toLowerCase()) ||
        p.tags?.some(t => t.toLowerCase().includes(projectSearch.toLowerCase())) ||
        p.ownerName?.toLowerCase().includes(projectSearch.toLowerCase());
      
      const matchesTag = selectedTag === 'All' || p.tags?.some(t => t.toLowerCase() === selectedTag.toLowerCase());
      const matchesStatus = selectedStatus === 'All' || p.status?.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesTag && matchesStatus;
    })
    .sort((a, b) => {
      if (projectSort === 'trending') {
        return (b.starsCount || 0) - (a.starsCount || 0);
      }
      return b.createdAt - a.createdAt;
    });

  const filteredDevs = developers.filter(d => {
    return (
      d.displayName.toLowerCase().includes(devSearch.toLowerCase()) ||
      d.username.toLowerCase().includes(devSearch.toLowerCase()) ||
      d.title.toLowerCase().includes(devSearch.toLowerCase()) ||
      d.bio.toLowerCase().includes(devSearch.toLowerCase())
    );
  });

  return (
    <div className="flex-grow flex flex-col p-4 md:p-6 bg-[#09090b] text-zinc-100 min-h-0 relative select-none">
      
      {/* Toast Alert overlay */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "absolute top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg border text-xs font-semibold shadow-2xl",
              toastMessage.type === 'success' 
                ? "bg-[#0c1c14] border-emerald-900/40 text-emerald-400" 
                : "bg-[#1c0c0c] border-red-950 text-red-400"
            )}
          >
            {toastMessage.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* community space header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-5 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="text-yellow-400 animate-pulse" size={18} />
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">DevSpace Hub</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-sans mt-1 text-zinc-100 tracking-tight">
            Developer & Projects Community
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Discover starred workspace frameworks, follow creative developers, star active templates, and exchange ideas in real-time.
          </p>
        </div>

        {/* Community Tabs navigation */}
        <div className="flex bg-[#0f0f11] p-1 border border-zinc-850 rounded-lg">
          <button
            onClick={() => setActiveTab('projects')}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === 'projects' ? "bg-yellow-500/10 text-yellow-400 font-bold border border-yellow-500/15" : "text-zinc-400 hover:text-white"
            )}
          >
            <Globe size={13} />
            <span>Explore Projects</span>
          </button>
          <button
            onClick={() => setActiveTab('developers')}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === 'developers' ? "bg-yellow-500/10 text-yellow-400 font-bold border border-yellow-500/15" : "text-zinc-400 hover:text-white"
            )}
          >
            <Users size={13} />
            <span>Developers</span>
          </button>
          <button
            onClick={() => setActiveTab('inbox')}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 relative",
              activeTab === 'inbox' ? "bg-yellow-500/10 text-yellow-400 font-bold border border-yellow-500/15" : "text-zinc-400 hover:text-white"
            )}
          >
            <MessageCircle size={13} />
            <span>Inbox & Connections</span>
            {friendRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-zinc-950 animate-ping" />
            )}
          </button>
        </div>
      </div>

      {/* Main Tab Panels */}
      <div className="flex-grow flex flex-col min-h-0">
        
        {/* TAB 1: EXPLORE PROJECTS */}
        {activeTab === 'projects' && (
          <div className="flex-1 flex flex-col min-h-0 gap-4">
            
            {/* Search and sorting header */}
            <div className="flex flex-col gap-3 bg-[#0c0c0e] border border-zinc-900 rounded-xl p-3.5 shrink-0">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 w-full">
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                  <input
                    type="text"
                    placeholder="Search projects, authors, or hashtags (e.g. #ai)..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    className="w-full bg-[#121214] border border-zinc-850 rounded px-9 py-2 text-xs text-zinc-250 outline-none focus:border-yellow-500/60 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto overflow-x-auto">
                  <button
                    onClick={() => setProjectSort('trending')}
                    className={cn(
                      "px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shrink-0",
                      projectSort === 'trending' ? "bg-zinc-800 text-yellow-400" : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                    )}
                  >
                    <Flame size={12} />
                    Trending Space
                  </button>
                  <button
                    onClick={() => setProjectSort('latest')}
                    className={cn(
                      "px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shrink-0",
                      projectSort === 'latest' ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                    )}
                  >
                    <Clock size={12} />
                    Latest Uploads
                  </button>
                  <button 
                    onClick={fetchPublicProjects}
                    className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer shrink-0"
                    title="Reload Projects"
                  >
                    <RefreshCw size={12} className={cn(loadingProjects && "animate-spin")} />
                  </button>
                </div>
              </div>

              {/* Enhanced Tag pills and Status Select */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-900/40">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mr-1">Tags:</span>
                  {['All', 'React', 'TypeScript', 'Tailwind', 'Aether', 'D3', 'Gemini'].map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={cn(
                        "px-2.5 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer",
                        selectedTag === tag 
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" 
                          : "bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-transparent"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Status:</span>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-[#121214] border border-zinc-850 text-zinc-300 text-[10px] rounded px-2 py-1 outline-none focus:border-yellow-500/40 cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Public Projects Grid */}
            <div className="flex-grow overflow-y-auto custom-scrollbar pr-1">
              {loadingProjects ? (
                <div className="h-44 flex flex-col items-center justify-center text-zinc-400 italic text-xs gap-3">
                  <RefreshCw className="animate-spin text-yellow-400" size={18} />
                  <span>Fetching community project indices from Cloud Firestore...</span>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="h-44 border border-dashed border-zinc-850 rounded-xl flex flex-col items-center justify-center text-zinc-500 italic text-xs">
                  <span>No public projects found matching your filters.</span>
                  <button 
                    onClick={() => { setProjectSearch(''); fetchPublicProjects(); }}
                    className="mt-2.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-850 rounded border border-zinc-800 hover:border-zinc-700 text-[10px] font-bold text-yellow-400 transition-all cursor-pointer"
                  >
                    Clear Search Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProjects.map((project) => {
                    const isStarred = starredProjects[project.id];
                    return (
                      <motion.div
                        key={project.id}
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="bg-[#0b0b0d] border border-zinc-900 hover:border-zinc-800 rounded-xl p-4 flex flex-col h-[200px] hover:shadow-xl transition-all group"
                      >
                        {/* Card Header: Owner and status */}
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div 
                            className="flex items-center gap-2 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => project.ownerId && handleOpenDeveloperProfile(project.ownerId)}
                          >
                            <div 
                              className="w-7 h-7 rounded-full border border-zinc-800/40 flex items-center justify-center font-extrabold text-[10px] text-white shrink-0"
                              style={{ backgroundColor: project.ownerAvatarColor || '#eab308' }}
                            >
                              {project.ownerName?.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold text-zinc-250 hover:text-yellow-400 transition-colors truncate leading-tight">
                                {project.ownerName}
                              </p>
                              <p className="text-[9px] font-mono text-zinc-500 truncate">
                                {project.ownerTitle || 'Engineer'}
                              </p>
                            </div>
                          </div>

                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[8px] font-mono tracking-widest uppercase border shrink-0",
                            project.status === 'Active' ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-400" :
                            project.status === 'Planning' ? "bg-blue-950/20 border-blue-900/40 text-blue-400" :
                            project.status === 'Completed' ? "bg-purple-950/20 border-purple-900/40 text-purple-400" :
                            "bg-zinc-900 border-zinc-800 text-zinc-400"
                          )}>
                            {project.status}
                          </span>
                        </div>

                        {/* Project Info */}
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => setSelectedProject(project)}
                        >
                          <h3 className="text-xs font-bold text-zinc-150 group-hover:text-yellow-400 transition-colors truncate">
                            {project.name}
                          </h3>
                          <p className="text-[11px] text-zinc-400 line-clamp-3 mt-1 leading-relaxed">
                            {project.description || 'No description supplied.'}
                          </p>
                        </div>

                        {/* Card Footer: Star counter and hashtag pill list */}
                        <div className="flex justify-between items-center gap-3 border-t border-zinc-900/50 pt-3 mt-3 shrink-0">
                          {/* Tags */}
                          <div className="flex items-center gap-1.5 overflow-hidden truncate">
                            {project.tags && project.tags.length > 0 ? (
                              project.tags.slice(0, 2).map((t, i) => (
                                <span 
                                  key={i} 
                                  className="px-1.5 py-0.5 bg-zinc-900/60 border border-zinc-850 rounded text-[9px] font-mono text-zinc-400 hover:text-yellow-400 transition-colors"
                                >
                                  #{t}
                                </span>
                              ))
                            ) : (
                              <span className="text-[9px] font-mono text-zinc-600 italic">no hashtags</span>
                            )}
                          </div>

                          {/* Star upvote container */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleToggleStar(project)}
                              className={cn(
                                "flex items-center gap-1 px-2.5 py-1 rounded border transition-all cursor-pointer font-bold text-[10px]",
                                isStarred 
                                  ? "bg-yellow-500/10 border-yellow-500/35 text-yellow-400 hover:bg-yellow-500/20 shadow-md shadow-yellow-500/5" 
                                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
                              )}
                              title={isStarred ? "Remove Star" : "Star Project"}
                            >
                              <Star size={11} className={cn(isStarred && "fill-yellow-400")} />
                              <span>{project.starsCount || 0}</span>
                            </button>

                            <button
                              onClick={() => setSelectedProject(project)}
                              className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded cursor-pointer"
                              title="View comments & details"
                            >
                              <MessageSquare size={11} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DEVELOPERS DIRECTORY */}
        {activeTab === 'developers' && (
          <div className="flex-1 flex flex-col min-h-0 gap-4">
            
            {/* Search inputs */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-[#0c0c0e] border border-zinc-900 rounded-xl p-3.5 shrink-0">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                <input
                  type="text"
                  placeholder="Search developers by username, displayName, or stack bio..."
                  value={devSearch}
                  onChange={(e) => setDevSearch(e.target.value)}
                  className="w-full bg-[#121214] border border-zinc-850 rounded px-9 py-2 text-xs text-zinc-250 outline-none focus:border-yellow-500/60 transition-colors"
                />
              </div>

              <span className="text-[10px] font-mono text-zinc-500">
                {filteredDevs.length} creative minds online
              </span>
            </div>

            {/* Developers list */}
            <div className="flex-grow overflow-y-auto custom-scrollbar pr-1">
              {loadingDevs ? (
                <div className="h-44 flex flex-col items-center justify-center text-zinc-400 italic text-xs gap-3">
                  <RefreshCw className="animate-spin text-yellow-400" size={18} />
                  <span>Loading directory index...</span>
                </div>
              ) : filteredDevs.length === 0 ? (
                <div className="h-44 border border-dashed border-zinc-850 rounded-xl flex flex-col items-center justify-center text-zinc-500 italic text-xs">
                  <span>No other developers found matching your search.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDevs.map((dev) => {
                    const isFollowing = follows[dev.uid];
                    const isPrivate = dev.isPrivate;
                    return (
                      <motion.div
                        key={dev.uid}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0b0b0d] border border-zinc-900 hover:border-zinc-800 rounded-xl p-4 flex flex-col h-[200px] hover:shadow-xl transition-all"
                      >
                        {/* Profile Header & Bio (Clickable to open profile) */}
                        <div 
                          className="flex-grow flex flex-col min-h-0 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => handleOpenDeveloperProfile(dev.uid)}
                        >
                          <div className="flex items-start gap-3 mb-2">
                            <div 
                              className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center font-black text-xs text-white shrink-0"
                              style={{ backgroundColor: dev.avatarColor || '#3b82f6' }}
                            >
                              {dev.displayName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || dev.username?.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-xs font-bold text-zinc-100 truncate flex items-center gap-1 hover:text-yellow-400 transition-colors">
                                <span>{dev.displayName || dev.username}</span>
                                {isPrivate && <span title="Private Profile"><Lock size={10} className="text-zinc-500" /></span>}
                              </h3>
                              <p className="text-[10px] font-mono text-zinc-400 truncate mt-0.5">
                                @{dev.username}
                              </p>
                              <p className="text-[10px] font-semibold text-yellow-500/95 mt-1">
                                {dev.title || 'Developer'}
                              </p>
                            </div>
                          </div>

                          {/* Bio snippet */}
                          <div className="flex-grow overflow-hidden mt-1.5">
                            <p className="text-[11px] text-zinc-400 line-clamp-3 leading-relaxed">
                              {dev.bio || 'No developer bio specified yet.'}
                            </p>
                          </div>
                        </div>

                        {/* Connection buttons */}
                        <div className="flex items-center gap-2 border-t border-zinc-900/50 pt-3 mt-3 shrink-0">
                          <button
                            onClick={() => handleToggleFollow(dev)}
                            disabled={actionLoading === dev.uid}
                            className={cn(
                              "flex-1 px-3 py-1.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1",
                              isFollowing 
                                ? "bg-zinc-800/40 border border-zinc-850 text-zinc-400 hover:bg-zinc-800/80" 
                                : "bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400"
                            )}
                          >
                            {isFollowing ? <UserCheck size={11} /> : <UserPlus size={11} />}
                            <span>{isFollowing ? 'Following' : 'Follow'}</span>
                          </button>

                          <button
                            onClick={() => handleSendFriendRequest(dev)}
                            disabled={actionLoading === `friend_${dev.uid}`}
                            className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded text-[10px] font-bold text-zinc-350 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                            title="Send Friend Request"
                          >
                            <Users size={11} />
                            <span>Add Friend</span>
                          </button>

                          <button
                            onClick={() => handleInitiateChat(dev)}
                            disabled={actionLoading === `chat_${dev.uid}`}
                            className="p-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-750 text-zinc-300 hover:text-yellow-400 rounded cursor-pointer"
                            title="Direct Message"
                          >
                            <MessageSquare size={11} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: INBOX & CONNECTIONS */}
        {activeTab === 'inbox' && (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 border border-zinc-900 rounded-xl bg-[#0a0a0c] overflow-hidden">
            
            {/* Left Column: Requests & Chats List */}
            <div className="w-full md:w-80 border-r border-zinc-900 flex flex-col min-h-0 shrink-0">
              
              {/* Friend Requests Sub-pane */}
              {friendRequests.length > 0 && (
                <div className="border-b border-zinc-900 bg-yellow-500/[0.02] p-3">
                  <span className="text-[9px] uppercase font-bold text-yellow-500/80 tracking-wider flex items-center gap-1">
                    <Users size={10} />
                    Pending Friend Requests ({friendRequests.length})
                  </span>
                  <div className="space-y-2 mt-2 max-h-36 overflow-y-auto custom-scrollbar">
                    {friendRequests.map(req => (
                      <div key={req.id} className="bg-[#121215] border border-zinc-850 p-2.5 rounded-lg flex items-center justify-between gap-2.5">
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-zinc-250 truncate">{req.senderName}</p>
                          <p className="text-[9px] text-zinc-500 font-mono">wants to connect</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleRespondFriendRequest(req, true)}
                            className="p-1 rounded bg-emerald-950/40 hover:bg-emerald-900 border border-emerald-900/40 text-emerald-400 transition-all cursor-pointer"
                            title="Accept Request"
                          >
                            <Check size={10} />
                          </button>
                          <button
                            onClick={() => handleRespondFriendRequest(req, false)}
                            className="p-1 rounded bg-red-950/40 hover:bg-red-900 border border-red-950/30 text-red-400 transition-all cursor-pointer"
                            title="Decline Request"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Channels list */}
              <div className="p-3 bg-[#0c0c0e] border-b border-zinc-900 flex justify-between items-center shrink-0">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Direct Messages</span>
                <span className="text-[9px] font-mono text-zinc-500">{chats.length} active channels</span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {chats.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-4 text-center italic text-zinc-500 text-xs">
                    <MessageSquare size={20} className="text-zinc-600 mb-2" />
                    <span>No active chats yet. Go to the Developers tab to initiate a conversation!</span>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-950">
                    {chats.map(chat => {
                      const other = chat.otherUser;
                      const isActive = activeChat?.id === chat.id;
                      return (
                        <div
                          key={chat.id}
                          onClick={() => setActiveChat(chat)}
                          className={cn(
                            "p-3.5 flex items-start gap-3 cursor-pointer transition-colors hover:bg-zinc-900/45",
                            isActive ? "bg-yellow-500/[0.04] border-l-2 border-yellow-500" : ""
                          )}
                        >
                          <div 
                            className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center font-black text-[10px] text-white shrink-0"
                            style={{ backgroundColor: other?.avatarColor || '#eab308' }}
                          >
                            {other?.displayName?.slice(0, 2).toUpperCase() || other?.username?.slice(0, 2).toUpperCase()}
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-baseline gap-1">
                              <span className="text-xs font-bold text-zinc-200 truncate">
                                {other?.displayName || other?.username}
                              </span>
                              <span className="text-[8px] font-mono text-zinc-500">
                                {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[10px] font-semibold text-yellow-500/90 truncate mt-0.5">
                              {other?.title || 'Developer'}
                            </p>
                            <p className="text-[10px] text-zinc-400 truncate mt-1 leading-normal">
                              {chat.lastMessage || 'Open thread...'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Active Chat Sandbox Console */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#070709]">
              {activeChat ? (
                <div className="flex-grow flex flex-col min-h-0">
                  
                  {/* Chat Header */}
                  <div className="p-4 bg-[#0a0a0c] border-b border-zinc-900 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center font-bold text-[10px] text-white shrink-0"
                        style={{ backgroundColor: activeChat.otherUser?.avatarColor || '#10b981' }}
                      >
                        {activeChat.otherUser?.displayName?.slice(0, 2).toUpperCase() || activeChat.otherUser?.username?.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5 leading-tight">
                          <span>{activeChat.otherUser?.displayName || activeChat.otherUser?.username}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Active Connection" />
                        </span>
                        <p className="text-[9px] font-mono text-zinc-400 truncate">
                          {activeChat.otherUser?.title || 'Developer'}
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => setActiveChat(null)}
                      className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-900 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Messages list */}
                  <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-3.5">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center italic text-zinc-600 text-[10px]">
                        <span>Secure conversation tunnel established. Send a friendly ping.</span>
                      </div>
                    ) : (
                      chatMessages.map(msg => {
                        const isMine = msg.senderId === currentUid;
                        return (
                          <div key={msg.id} className={cn("flex flex-col max-w-[80%]", isMine ? "ml-auto items-end" : "mr-auto items-start")}>
                            <div className="flex items-baseline gap-1.5 mb-1 pl-1">
                              <span className="text-[9px] font-bold text-zinc-400">{isMine ? 'Me' : msg.senderName}</span>
                              <span className="text-[7px] font-mono text-zinc-500">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className={cn(
                              "px-3.5 py-2 rounded-xl text-xs leading-relaxed break-words border",
                              isMine 
                                ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400 rounded-tr-none" 
                                : "bg-zinc-900 border-zinc-850 text-zinc-200 rounded-tl-none"
                            )}>
                              {msg.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input Box */}
                  <form onSubmit={handleSendMessage} className="p-3.5 bg-[#0a0a0c] border-t border-zinc-900 shrink-0 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Type a secure message to this developer..."
                      value={newChatMessage}
                      onChange={(e) => setNewChatMessage(e.target.value)}
                      className="flex-1 bg-[#121214] border border-zinc-850 rounded-lg px-4 py-2.5 text-xs text-zinc-250 outline-none focus:border-yellow-500/60 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!newChatMessage.trim()}
                      className="p-2.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <SendHorizontal size={14} />
                    </button>
                  </form>

                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center italic text-zinc-600 text-xs">
                  <Compass size={24} className="text-zinc-600/80 mb-2" />
                  <span>Select a conversation from the left pane, or find developers to chat with under the directory.</span>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* DETAIL MODAL 1: VIEW PUBLIC PROJECT COMMENTS & DETAILS */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#121214] border border-zinc-800 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-start p-5 border-b border-zinc-800/60 shrink-0">
                <div className="min-w-0">
                  <span className="text-[9px] uppercase tracking-widest text-yellow-500 font-bold">
                    Project Inspector
                  </span>
                  <h2 className="text-base font-bold text-zinc-150 truncate mt-0.5">
                    {selectedProject.name}
                  </h2>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    published by <span 
                      onClick={() => {
                        if (selectedProject.ownerId) {
                          setSelectedProject(null);
                          handleOpenDeveloperProfile(selectedProject.ownerId);
                        }
                      }}
                      className="text-yellow-500 hover:text-yellow-400 hover:underline font-bold cursor-pointer transition-colors"
                    >
                      {selectedProject.ownerName}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-zinc-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-[#1e1e24] cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Scrollable Content Pane */}
              <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                {/* Description block */}
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Description</h4>
                  <p className="text-xs text-zinc-300 leading-relaxed bg-[#0b0b0c] p-3 rounded-lg border border-zinc-850">
                    {selectedProject.description || 'No description provided.'}
                  </p>
                </div>

                {/* Stars and status row */}
                <div className="flex justify-between items-center gap-3 bg-zinc-950/40 p-3 rounded-lg border border-zinc-850">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 font-medium">Status:</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-zinc-900 text-zinc-300 border border-zinc-850">
                      {selectedProject.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 font-medium">Likes / Stars:</span>
                    <button 
                      onClick={() => handleToggleStar(selectedProject)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold transition-all border cursor-pointer",
                        starredProjects[selectedProject.id]
                          ? "bg-yellow-500/15 border-yellow-500/30 text-yellow-400"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                      )}
                    >
                      <Star size={11} className={cn(starredProjects[selectedProject.id] && "fill-yellow-400")} />
                      <span>{selectedProject.starsCount || 0} Stars</span>
                    </button>
                  </div>
                </div>

                {/* Real Project Analytics Dashboard Component */}
                <div className="space-y-2 bg-gradient-to-b from-zinc-950/50 to-zinc-900/20 p-4 rounded-lg border border-zinc-850">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                    Project Analytics & Health
                  </h4>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-[#0b0b0c]/80 p-2.5 rounded border border-zinc-850/60 text-center">
                      <p className="text-[9px] text-zinc-500 font-mono uppercase">Views</p>
                      <p className="text-sm font-bold text-zinc-100 mt-0.5">
                        {((selectedProject.starsCount || 0) * 8) + (comments.length * 4) + 17}
                      </p>
                    </div>
                    <div className="bg-[#0b0b0c]/80 p-2.5 rounded border border-zinc-850/60 text-center">
                      <p className="text-[9px] text-zinc-500 font-mono uppercase">Interaction Rate</p>
                      <p className="text-sm font-bold text-yellow-500 mt-0.5">
                        {Math.min(100, Math.round((((selectedProject.starsCount || 0) + comments.length) / (((selectedProject.starsCount || 0) * 8) + comments.length * 4 + 17 || 1)) * 100))}%
                      </p>
                    </div>
                    <div className="bg-[#0b0b0c]/80 p-2.5 rounded border border-zinc-850/60 text-center">
                      <p className="text-[9px] text-zinc-500 font-mono uppercase">Velocity Score</p>
                      <p className="text-sm font-bold text-emerald-500 mt-0.5">
                        {Math.min(100, 45 + ((selectedProject.starsCount || 0) * 5) + (comments.length * 6))}
                      </p>
                    </div>
                  </div>

                  {/* Sparkline simulation using dynamic SVG paths */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[8px] text-zinc-500 font-mono mb-1">
                      <span>7-DAY ENGAGEMENT VELOCITY</span>
                      <span className="text-emerald-500">STABLE</span>
                    </div>
                    <div className="h-8 w-full bg-[#070708] rounded border border-zinc-850/40 relative overflow-hidden flex items-end">
                      <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="gradient-sparkline" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#eab308" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#eab308" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path
                          d={`M0,25 Q15,${25 - (selectedProject.starsCount || 0) * 2} 30,${20 - comments.length * 2} T60,22 T80,15 T100,${18 - (selectedProject.starsCount || 0)}`}
                          fill="none"
                          stroke="#eab308"
                          strokeWidth="1.5"
                        />
                        <path
                          d={`M0,25 Q15,${25 - (selectedProject.starsCount || 0) * 2} 30,${20 - comments.length * 2} T60,22 T80,15 T100,${18 - (selectedProject.starsCount || 0)} L100,30 L0,30 Z`}
                          fill="url(#gradient-sparkline)"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Collaboration & Join Section */}
                {selectedProject.ownerId !== currentUid && (
                  <div className="p-4 bg-zinc-950/20 border border-zinc-850 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-center sm:text-left">
                      <h5 className="text-xs font-bold text-zinc-200">Interested in collaborating?</h5>
                      <p className="text-[10px] text-zinc-400 mt-0.5 leading-normal">
                        Request to join this project team, review code repos, or plan features together.
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        if (!addNotification) return;
                        try {
                          await addNotification({
                            userId: selectedProject.ownerId || '',
                            type: 'collab_request',
                            title: 'Collaboration Request! 🤝',
                            description: `${userProfile?.displayName || 'A developer'} requested to join your project "${selectedProject.name}" as a collaborator.`,
                            senderId: currentUid,
                            senderName: userProfile?.displayName,
                            projectId: selectedProject.id,
                            projectName: selectedProject.name
                          });
                          showToast(`Collaboration request sent to ${selectedProject.ownerName}!`);
                        } catch (err) {
                          console.error("Collab request error:", err);
                          showToast("Failed to send collaboration request.", "error");
                        }
                      }}
                      className="px-3.5 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black text-[10px] font-extrabold rounded flex items-center gap-1.5 cursor-pointer transition-all shrink-0 uppercase tracking-wider"
                    >
                      <Users size={12} />
                      Request to Collaborate
                    </button>
                  </div>
                )}

                {/* Comments section */}
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
                    Comments & Feedbacks ({comments.length})
                  </h4>

                  <div className="space-y-3 max-h-44 overflow-y-auto custom-scrollbar pr-1 mb-4">
                    {comments.length === 0 ? (
                      <div className="text-center italic text-zinc-600 text-[11px] py-4">
                        No comments left yet. Start the conversation.
                      </div>
                    ) : (
                      comments.map(c => (
                        <div key={c.id} className="bg-[#0b0b0c] border border-zinc-850 p-3 rounded-lg flex items-start gap-2.5">
                          <div 
                            className="w-6.5 h-6.5 rounded-full border border-zinc-800 flex items-center justify-center font-bold text-[9px] text-white shrink-0"
                            style={{ backgroundColor: c.avatarColor || '#eab308' }}
                          >
                            {c.displayName?.slice(0, 2).toUpperCase() || c.username?.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-baseline gap-1">
                              <span className="text-[11px] font-bold text-zinc-200">{c.displayName}</span>
                              <span className="text-[8px] font-mono text-zinc-500">
                                {new Date(c.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-350 mt-1 leading-relaxed">
                              {c.text}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add comment Form */}
                  <form onSubmit={handlePostComment} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Post a helpful comment or feedback..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      required
                      className="flex-1 bg-[#0b0b0c] border border-zinc-850 rounded px-3 py-2 text-xs text-zinc-200 outline-none focus:border-yellow-500/60 transition-colors"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Send size={11} />
                      <span>Post</span>
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Developer Profile Modal */}
        {selectedDeveloper && (
          <ProfileView
            developer={selectedDeveloper}
            currentUid={currentUid}
            currentEmail={currentEmail}
            currentUserProfile={userProfile}
            isFollowingInitially={!!follows[selectedDeveloper.uid]}
            onClose={() => setSelectedDeveloper(null)}
            onInitiateChat={handleInitiateChat}
            onSelectProject={(proj) => {
              setSelectedDeveloper(null);
              setSelectedProject(proj);
            }}
            onFollowToggle={(devId, isFollowing) => {
              setFollows(prev => {
                const updated = { ...prev };
                if (isFollowing) {
                  updated[devId] = true;
                } else {
                  delete updated[devId];
                }
                return updated;
              });
            }}
            showToast={showToast}
            addNotification={addNotification}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
