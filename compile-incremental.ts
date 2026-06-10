import * as fs from 'fs';
import * as ts from 'typescript';

const filePath = 'src/pages/AgenticOS.tsx';
const content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

const startTarget = "{activeTab === 'office' && (";
const endTarget = "          {/* TERMINAL CHAT VIEW */}";

const startIndex = content.indexOf(startTarget);
const endIndex = content.indexOf(endTarget);

function getSurrounding(officeBlock: string) {
  return content.substring(0, startIndex) + officeBlock + content.substring(endIndex);
}

function checkCompile(testContent: string): { success: boolean, errors: string[] } {
  const tempFile = 'src/pages/AgenticOS.temp.tsx';
  fs.writeFileSync(tempFile, testContent, 'utf8');
  
  const program = ts.createProgram([tempFile], {
    jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2022,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    skipLibCheck: true
  });

  const diagnostics = ts.getPreEmitDiagnostics(program);
  const syntaxErrors = diagnostics.filter(d => 
    d.file && d.file.fileName.includes('AgenticOS.temp.tsx') && 
    (d.code === 1005 || d.code === 1381 || d.code === 1109)
  );

  fs.unlinkSync(tempFile);
  const errors = syntaxErrors.map(d => {
    if (d.file && d.start !== undefined) {
      const { line, character } = ts.getLineAndCharacterOfPosition(d.file, d.start);
      return `Line ${line + 1}, Col ${character + 1}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`;
    }
    return ts.flattenDiagnosticMessageText(d.messageText, '\n');
  });
  return { success: errors.length === 0, errors };
}

// Stage 1: Barebones structure
const stage1 = `{activeTab === 'office' && (
            <div className="flex-grow flex flex-col min-h-0 space-y-4">
               <div>Header</div>
               <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
                  <div>Grid</div>
                  {selectedAgentId && selectedAgent && (
                     <div>Selected Pane</div>
                  )}
                  {!selectedAgentId && (
                     <div>Backlog Pane</div>
                  )}
               </div>
            </div>
          )}
          
          `;

console.log("Stage 1 compiles?", checkCompile(getSurrounding(stage1)).success);
if (!checkCompile(getSurrounding(stage1)).success) {
  console.log("Stage 1 errors:", checkCompile(getSurrounding(stage1)).errors);
}
