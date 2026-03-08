const fs = require('fs');

let content = fs.readFileSync('README.md', 'utf-8');

// FIX ENCODING ISSUES - using hex codes
const fixes = {
  'â€"': '\u2014',  // em dash
  'â€¢': '\u2022',  // bullet
  'âœ…': '\u2705',  // checkmark
  'â†'': '\u2192',  // arrow right
  'âš¡': '\u26A1',  // lightning
  'ðŸ"–': '\uD83D\uDCD6',  // book
  'ðŸŒ': '\uD83C\uDF0D',  // globe
  'ðŸŽ¯': '\uD83C\uDFAF',  // target
  'ðŸ†': '\uD83C\uDFC6',  // trophy
  'ðŸŒµ': '\uD83C\uDF35',  // cactus
  'ðŸŒ¾': '\uD83C\uDF3E',  // wheat
  'ðŸ'°': '\uD83D\uDCB0',  // money bag
  'ðŸ"„': '\uD83D\uDCC4',  // document
  'ðŸ¦': '\uD83C\uDFE6',  // bank
  'ðŸ'¸': '\uD83D\uDCB8',  // money with wings
  'ðŸ'¡': '\uD83D\uDCA1',  // lightbulb
  'ðŸ"—': '\uD83D\uDD17',  // link
  'ðŸ¤–': '\uD83E\uDD16',  // robot
  'ðŸ"': '\uD83D\uDCC1',  // folder
  'ðŸ"œ': '\uD83D\uDCDC',  // scroll
  'ðŸ"š': '\uD83D\uDCDA',  // books
  'ðŸ§ª': '\uD83E\uDDEA',  // test tube
  'ðŸŒ': '\uD83C\uDF10',  // globe with meridians
  'ðŸ"‚': '\uD83D\uDCC2',  // open file folder
  'ðŸ› ï¸': '\uD83D\uDEE0\uFE0F',  // hammer and wrench
  'ðŸ¤': '\uD83E\uDD1D',  // handshake
  'ðŸ™': '\uD83D\uDE4F',  // folded hands
  'ðŸ"ž': '\uD83D\uDCDE',  // telephone
  'ðŸ—ºï¸': '\uD83D\uDDFA\uFE0F',  // world map
  'ðŸ"Š': '\uD83D\uDCCA',  // bar chart
  'ðŸ"': '\uD83D\uDD10',  // lock with key
  'ðŸš€': '\uD83D\uDE80',  // rocket
  'âœ¨': '\u2728',  // sparkles
  'ðŸ"': '\uD83D\uDCDD',  // memo
  'â­': '\u2B50',  // star
  'â�¤ï¸': '\u2764\uFE0F',  // heart
  'ðŸ'¥': '\uD83D\uDC65',  // people
  'ðŸŽ¥': '\uD83C\uDFA5',  // video camera
  'â¬†': '\u2B06',  // up arrow
  'â„¢': '\u2122',  // trademark
  'â›"ï¸': '\u26D3\uFE0F',  // chains
  'ðŸ"„': '\uD83D\uDD04',  // counterclockwise arrows
};

for (const [bad, good] of Object.entries(fixes)) {
  content = content.split(bad).join(good);
}

// ADD VIDEO DEMO AND LIVE DEMO LINKS after badges
if (!content.includes('Video Demo')) {
  content  = content.replace(
    /(Tests.*?TEST_REPORT\.md\)\])\n\n(\[Documentation\])/,
    '$1\n\n**\uD83C\uDFA5 [Video Demo](https://drive.google.com/file/d/1OX3mnvSMMniS60oWdNz8SggKG3nes6VC/view?usp=sharing) \u2022 \uD83C\uDF10 [Live Demo](https://web3edubrasil.github.io/climprotocol/)**\n\n$2'
  );
}

// UPDATE TABLE OF CONTENTS  
if (!content.includes('- [CRE Workflow Simulation]')) {
  content = content.replace(
    /(- \[Usage\]\(#-usage\))\n(- \[Testing\])/,
    '$1\n- [CRE Workflow Simulation](#-cre-workflow-simulation)\n$2'
  );
}

if (!content.includes('- [Team]')) {
  content= content.replace(
    /(- \[Documentation\]\(#-documentation\))\n(- \[Contributing\])/,
    '$1\n- [Team](#-team)\n$2'
  );
}

// ADD CRE WORKFLOW SIMULATION SECTION
if (!content.includes('## \uD83D\uDD04 CRE Workflow Simulation')) {
  const creSection = `---

## \uD83D\uDD04 CRE Workflow Simulation

### Execute Complete Chainlink CRE Workflow

The CRE (Chainlink Runtime Environment) workflow demonstrates all 8 Chainlink capabilities in action.

#### Run the Simulation

\`\`\`powershell
# Windows
.\\run-cre-workflow.ps1 -Execute

# Linux/macOS
cd cre-workflow/my-workflow
bun install
bun run simulate-execution.ts
\`\`\`

#### What It Does

- \u2705 **Cron Trigger** \u2014 Runs every 5 minutes
- \u2705 **EVM Read** \u2014 Reads active events from Sepolia contracts
- \u2705 **HTTP Fetch** \u2014 Fetches real precipitation data from Open-Meteo API
- \u2705 **DON Consensus** \u2014 Multiple nodes aggregate data
- \u2705 **Compute** \u2014 Evaluates drought conditions
- \u2705 **EVM Write** \u2014 Triggers settlement transactions
- \u2705 **Event Listening** \u2014 Monitors settlement completion
- \u2705 **Loop** \u2014 Continuous monitoring cycle

#### Expected Output

\`\`\`
\uD83D\uDD0D Step 1/8: Cron Trigger - Checking for events...
\uD83D\uDD0D Step 2/8: EVM Read - Found 1 active event
\uD83D\uDD0D Step 3/8: HTTP Fetch - Querying Open-Meteo API...
\uD83D\uDD0D Step 4/8: DON Consensus - Aggregating responses...
\uD83D\uDD0D Step 5/8: Compute - Precipitation: 142mm (Trigger: 150mm)
\uD83D\uDD0D Step 6/8: EVM Write - Triggering settlement...
\uD83D\uDD0D Step 7/8: Event Listening - Settlement completed
\uD83D\uDD0D Step 8/8: Loop - Waiting for next cycle...
\u2705 CRE Workflow Complete!
\`\`\`

**\uD83D\uDCA1 Note:** This simulation demonstrates the complete workflow even if events are not yet ready for settlement, showing all 8 CRE capabilities in action.

---`;

  // Replace old CRE section if exists
  if (content.match(/### CRE Workflow Simulation[\s\S]*?---\n\n## /)) {
    content = content.replace(
      /### CRE Workflow Simulation[\s\S]*?---\n\n## /,
      creSection + '\n\n## '
    );
  } else {
    // Insert before Testing section
    content = content.replace(
      /---\n\n## \uD83E\uDDEA Testing/,
      creSection + '\n\n## \uD83E\uDDEA Testing'
    );
  }
}

// ADD TEAM SECTION
if (!content.includes('## \uD83D\uDC65 Team')) {
  const teamSection = `---

## \uD83D\uDC65 Team

Clim Protocol is built by a dedicated team passionate about climate resilience and blockchain innovation:

| Name | Email | Role |
|------|-------|------|
| **C\u00E1ssio Chagas** | web3edubrasil@gmail.com | Project Lead & Smart Contracts |
| **Davi Marques** | davimqz2003@gmail.com | Blockchain Developer |
| **Leonardo Roberto** | leoroberto@gmail.com | Frontend & Web3 Integration |
| **Alex Joubert** | joubert2006@hotmail.com | CRE Workflow & Backend |

**Contact:** For questions or collaboration opportunities, reach out to any team member via email.

---`;

  // Replace old maintainers section if exists
  if (content.match(/### Maintainers[\s\S]*?### Community[\s\S]*?---/)) {
    content = content.replace(
      /### Maintainers[\s\S]*?### Community[\s\S]*?---/,
      teamSection
    );
  } else {
    // Insert before Contributing section
    content = content.replace(
      /---\n\n## \uD83E\uDD1D Contributing/,
      teamSection + '\n\n## \uD83E\uDD1D Contributing'
    );
  }
}

// UPDATE CONTACT SECTION
content = content.replace(
  /- \*\*Repository:\*\* https:\/\/github\.com\/YOUR_USERNAME\/climprotocol/g,
  '- **Repository:** https://github.com/web3edubrasil/climprotocol'
);

content = content.replace(
  /- \*\*Issues:\*\* https:\/\/github\.com\/YOUR_USERNAME\/climprotocol\/issues/g,
  '- **Live Demo:** https://web3edubrasil.github.io/climprotocol/'
);

content = content.replace(
  /- \*\*Discussions:\*\* https:\/\/github\.com\/YOUR_USERNAME\/climprotocol\/discussions/g,
  '- **Video Demo:** https://drive.google.com/file/d/1OX3mnvSMMniS60oWdNz8SggKG3nes6VC/view?usp=sharing'
);

fs.writeFileSync('README.md', content, 'utf-8');

console.log('\u2705 README updated successfully!');
console.log('\u2705 Fixed encoding issues');
console.log('\u2705 Added video demo link');
console.log('\u2705 Added deployed site link');
console.log('\u2705 Added CRE workflow execution section');
console.log('\u2705 Added team members');
