import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Terminal, FolderGit2, Bot, ArrowRight, X, LayoutDashboard, Map, CheckSquare, Github, FileText, Send, Zap } from 'lucide-react';
import { useStore } from '../../store';
import { useNavigate } from 'react-router-dom';

const commands = [
  { id: '1', name: 'Dashboard', icon: LayoutDashboard, path: '/', shortcut: 'D' },
  { id: '2', name: 'Open Projects', icon: FolderGit2, path: '/projects', shortcut: 'P' },
  { id: '3', name: 'Open Project Brain', icon: Bot, path: '/brain', shortcut: 'B' },
  { id: '4', name: 'Issues & Tasks', icon: CheckSquare, path: '/issues', shortcut: 'I' },
  { id: '5', name: 'Roadmap', icon: Map, path: '/roadmap', shortcut: 'R' },
  { id: '6', name: 'GitHub Intelligence', icon: Github, path: '/github', shortcut: 'G' },
  { id: '7', name: 'Workspace Docs', icon: FileText, path: '/docs', shortcut: 'W' },
];

export function CommandPalette() {
  return null;
}
