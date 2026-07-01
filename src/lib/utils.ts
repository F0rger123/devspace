import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractRepoName(input: string): string {
  const clean = input.trim();
  if (!clean) return "";
  
  // Try parsing as a URL
  try {
    const urlString = clean.startsWith("http") ? clean : `https://${clean}`;
    const url = new URL(urlString);
    if (url.hostname.includes("github.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0]}/${parts[1]}`.replace(/\.git$/, "");
      }
    }
  } catch (e) {
    // Ignore and proceed to regex/manual splitting
  }

  // Regex patterns to capture owner/repo from various formats
  // e.g., github.com/owner/repo or git@github.com:owner/repo.git or owner/repo
  const gitUrlPattern = /(?:github\.com[:\/])?([^/]+)\/([^/]+?)(?:\.git)?$/i;
  const match = clean.match(gitUrlPattern);
  if (match) {
    const owner = match[1].trim();
    const repoName = match[2].trim();
    if (owner && repoName) {
      return `${owner}/${repoName}`;
    }
  }

  // Fallback to simple slash check
  if (clean.includes("/")) {
    const parts = clean.split("/").map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`.replace(/\.git$/, "");
    }
  }

  return clean;
}

