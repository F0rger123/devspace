import { aetherDesktopIntelligence } from '../src/lib/aetherDesktopIntelligence';
import { aetherAliasRegistry } from '../src/lib/aetherAliasRegistry';
import { aetherConversationalEngine } from '../src/lib/aetherConversationalEngine';
import { resolveCanonicalAetherIntent } from '../src/lib/aetherCanonicalIntentResolver';

async function runDesktopVerification() {
  console.log('====================================================');
  console.log(' DEVSPACE NATIVE DESKTOP CAPABILITIES VERIFICATION');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${testName}${detail ? ` — ${detail}` : ''}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
    }
  }

  // 1. INSTALLED APP DISCOVERY & ALIASING
  console.log('\n--- 1. Installed App Discovery & Aliases ---');
  const installedApps = await aetherDesktopIntelligence.getInstalledApps();
  assert(installedApps.length > 0, 'Installed app directory populated', `Found ${installedApps.length} apps`);
  
  const hasChrome = installedApps.some(a => (a.name || '').toLowerCase().includes('chrome') || (a.executable || '').toLowerCase().includes('chrome'));
  const hasVSCode = installedApps.some(a => (a.name || '').toLowerCase().includes('code') || (a.executable || '').toLowerCase().includes('code'));
  const hasTerminal = installedApps.some(a => (a.name || '').toLowerCase().includes('terminal') || (a.executable || '').toLowerCase().includes('terminal') || (a.name || '').toLowerCase().includes('bash'));
  const hasSpotify = installedApps.some(a => (a.name || '').toLowerCase().includes('spotify') || (a.executable || '').toLowerCase().includes('spotify'));

  assert(hasChrome, 'Chrome discovered in app registry');
  assert(hasVSCode, 'VS Code discovered in app registry');
  assert(hasTerminal, 'Terminal discovered in app registry');
  assert(hasSpotify, 'Spotify discovered in app registry');

  // Test alias creation and resolution
  aetherAliasRegistry.saveAlias({
    alias: 'my browser',
    target: 'Google Chrome',
    type: 'desktop_app',
    description: 'Custom browser shortcut'
  });
  const resolvedTarget = aetherAliasRegistry.resolveAlias('my browser');
  assert(resolvedTarget === 'Google Chrome', 'Alias Registry resolves user-defined shortcut ("my browser" -> "Google Chrome")');

  // 2. CANONICAL INTENT RESOLUTION FOR NATIVE DESKTOP DIRECTIVES
  console.log('\n--- 2. Desktop Directives Canonical Intent Resolution ---');
  const openChromeIntent = resolveCanonicalAetherIntent('open Chrome', {});
  assert(openChromeIntent.intent === 'launch_app' && openChromeIntent.entities.appName.toLowerCase().includes('chrome'), 'Resolves "open Chrome" to launch_app');

  const openVSCodeIntent = resolveCanonicalAetherIntent('open in VS Code', { activeProjectId: 'proj-1' });
  assert(openVSCodeIntent.intent === 'desktop_open_vscode', 'Resolves "open in vs code" to desktop_open_vscode');

  const openTerminalIntent = resolveCanonicalAetherIntent('open terminal', { activeProjectId: 'proj-1' });
  assert(openTerminalIntent.intent === 'desktop_open_terminal', 'Resolves "open terminal" to desktop_open_terminal');

  const openFileIntent = resolveCanonicalAetherIntent('open file /home/user/document.pdf', {});
  assert(openFileIntent.intent === 'desktop_open_file' && openFileIntent.entities.path.includes('document.pdf'), 'Resolves "open file" to desktop_open_file');

  const searchFilesIntent = resolveCanonicalAetherIntent('find files for authentication', {});
  assert(searchFilesIntent.intent === 'desktop_search_files' && searchFilesIntent.entities.query.includes('authentication'), 'Resolves "find files" to desktop_search_files');

  const openWorkspaceIntent = resolveCanonicalAetherIntent('open my workspace', {});
  assert(openWorkspaceIntent.intent === 'open_workspace', 'Resolves "open my workspace" to open_workspace');

  // 3. DESKTOP INTELLIGENCE ORCHESTRATION
  console.log('\n--- 3. Aether Desktop Intelligence Orchestration ---');
  const launchChromeRes = await aetherDesktopIntelligence.launchApp('Google Chrome');
  assert(launchChromeRes.success, 'Launch Chrome via Desktop Intelligence', launchChromeRes.message);

  const launchVSCodeRes = await aetherDesktopIntelligence.launchApp('Visual Studio Code');
  assert(launchVSCodeRes.success, 'Launch VS Code via Desktop Intelligence', launchVSCodeRes.message);

  const launchSpotifyRes = await aetherDesktopIntelligence.launchApp('Spotify');
  assert(launchSpotifyRes.success, 'Launch Spotify via Desktop Intelligence', launchSpotifyRes.message);

  const launchTerminalRes = await aetherDesktopIntelligence.launchApp('Terminal');
  assert(launchTerminalRes.success, 'Launch Terminal via Desktop Intelligence', launchTerminalRes.message);

  const openTerminalProjRes = await aetherDesktopIntelligence.openTerminalInProject(process.cwd());
  assert(openTerminalProjRes.success, 'Open Terminal in Project Directory', openTerminalProjRes.message);

  const openVSCodeProjRes = await aetherDesktopIntelligence.openVSCodeInProject(process.cwd());
  assert(openVSCodeProjRes.success, 'Open VS Code in Project Directory', openVSCodeProjRes.message);

  const openFileFolderRes = await aetherDesktopIntelligence.openFileOrFolder(process.cwd());
  assert(openFileFolderRes.success, 'Open File/Folder Location', openFileFolderRes.message);

  // 4. MULTI-STEP WORKSPACE WORKFLOW EXECUTION
  console.log('\n--- 4. Multi-Step Workspace Workflow Execution ---');
  const workspaceTurn = await aetherConversationalEngine.processUserMessageAsync('open my workspace', [
    { id: 'proj-test', name: 'DevSpace Platform' }
  ], 'proj-test');

  assert(workspaceTurn.responseText.includes('Workspace'), 'Conversational Engine executes "open my workspace"', workspaceTurn.statusText);

  console.log('\n====================================================');
  console.log(` RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runDesktopVerification().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
