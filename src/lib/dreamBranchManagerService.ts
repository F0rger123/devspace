export interface DreamBranchItem {
  id: string;
  branchName: string;
  dreamTitle: string;
  status: 'open' | 'merged' | 'stale' | 'rejected' | 'duplicate' | 'orphaned';
  healthScore: number;
  lastActive: number;
  commitCount: number;
}

class DreamBranchManagerService {
  private branches: DreamBranchItem[] = [
    { id: 'b1', branchName: 'dream/universal-action-engine', dreamTitle: 'Universal Action Engine', status: 'merged', healthScore: 100, lastActive: Date.now() - 3600000, commitCount: 5 },
    { id: 'b2', branchName: 'dream/ast-verification-pass', dreamTitle: 'AST Verification Routine', status: 'open', healthScore: 95, lastActive: Date.now() - 7200000, commitCount: 3 },
    { id: 'b3', branchName: 'dream/stale-css-cleanup', dreamTitle: 'Stale CSS Optimization', status: 'stale', healthScore: 60, lastActive: Date.now() - 86400000 * 14, commitCount: 1 },
    { id: 'b4', branchName: 'dream/orphaned-legacy-router', dreamTitle: 'Legacy Router Refactor', status: 'orphaned', healthScore: 40, lastActive: Date.now() - 86400000 * 30, commitCount: 2 },
    { id: 'b5', branchName: 'dream/dup-action-registry', dreamTitle: 'Action Registry Duplicate', status: 'duplicate', healthScore: 30, lastActive: Date.now() - 86400000 * 5, commitCount: 1 },
  ];

  public getBranchHealthOverview() {
    const total = this.branches.length;
    const open = this.branches.filter(b => b.status === 'open').length;
    const merged = this.branches.filter(b => b.status === 'merged').length;
    const stale = this.branches.filter(b => b.status === 'stale' || b.status === 'orphaned' || b.status === 'duplicate').length;

    return {
      total,
      open,
      merged,
      stale,
      branches: this.branches,
      recommendedCleanup: stale > 0 ? `Recommend batch archiving ${stale} stale/duplicate branches to optimize repository index.` : 'Branch repository is clean and optimal.',
    };
  }

  public batchCleanStaleBranches(): { success: boolean; message: string; count: number } {
    const initialCount = this.branches.length;
    this.branches = this.branches.filter(b => b.status === 'open' || b.status === 'merged');
    const cleaned = initialCount - this.branches.length;
    return {
      success: true,
      message: `Successfully cleaned ${cleaned} stale/duplicate Dream branches.`,
      count: cleaned,
    };
  }

  public batchMergeOpenBranches(): { success: boolean; message: string; count: number } {
    let mergedCount = 0;
    this.branches.forEach(b => {
      if (b.status === 'open') {
        b.status = 'merged';
        b.healthScore = 100;
        mergedCount++;
      }
    });
    return {
      success: true,
      message: `Batch merged ${mergedCount} open Dream branches into main line.`,
      count: mergedCount,
    };
  }
}

export const dreamBranchManager = new DreamBranchManagerService();
