async function parseDataFile(text) {
    const lines = text.split('\n').reduce((acc, line) => {
        const match = line.match(/^([^=]+)=(.*)$/); // Match key and value
        if (match) {
            const key = match[1].trim(); // Capture group 1: key
            const value = match[2].trim(); // Capture group 2: value

            if (key === 'propositions') {
                acc[key] = value.split('@').map(item => item.trim()); // Split propositions by @
            } else if (value.includes(',')) {
                acc[key] = value.split(',').map(item => item.trim()); // Split other keys with comma-separated values
            } else {
                acc[key] = value; // Handle plain strings
            }
        }
        return acc;
    }, {});


    // Extract parsed data
    const levelNumber = lines['levelNumber'].trim();
    const difficulty = lines['difficulty'].trim();
    const nextLevel = lines['nextLevel'].trim();
    const domain = lines['domain'].map(Number);
    const rows = parseInt(lines['rows'], 10);
    const cols = parseInt(lines['cols'], 10);
    const given = lines['given'];
    const solution = lines['solution'].map(x => parseInt(x) || null);
    const propositions = lines['propositions'];

    // Generate files
    generateHTMLFile(levelNumber, difficulty, rows, cols, given, propositions, domain);
    generateJSFile(levelNumber, difficulty, rows, cols, solution, domain, nextLevel);
}

async function generateHTMLFile(levelNumber, difficulty, rows, cols, given, propositions, domain) {
    const parser = new DOMParser();
    
    let templateText = await (await fetch('level-template.html')).text();
    let page = parser.parseFromString(templateText, 'text/html');

    page.getElementById("level").innerHTML = levelNumber;
    page.getElementById("difficulty").innerHTML = difficulty;

    for (let i =0; i < propositions.length; i++ ) {
        let varCounter = 1;

        // identify entries to wrap in spans
        const pattern = /\\lang\s*\\begin\{smallmatrix\}\s*([\s\S]*?)\s*\\end\{smallmatrix\}\s*\\rang/g;

        propositions[i] = propositions[i].replace(pattern, (match, content) => {
            const [n, _, m] = content.split("\\").map(s => s.trim());

            let id;
            if (!isNaN(n) && !isNaN(m)) {
                id = `${n}e${m}`;
            } else {
                id = `v${varCounter++}`;
            }

            return `\\kern0.08em <span class="entry" id="e${id}">\\( ${match} \\)</span> \\kern0.08em`;
        });

        li = page.createElement("li");
        li.innerHTML = propositions[i];

        li.childNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                node.textContent = `\\( ${node.textContent.trim()} \\)`;
            }
        });

        propositions[i] = li;
    }
    
    
    page.getElementById("propositions").append(...propositions);

    
    for (let i = 1; i <= rows; i++) {
        num = document.createElement("span");
        num.innerHTML = i;
        page.getElementById("y-axis").appendChild(num);
    }      
    for (let i = 1; i <= cols; i++) {
        num = document.createElement("span");
        num.innerHTML = i;
        page.getElementById("x-axis").appendChild(num);
    }

    
    given.forEach( (cell) => {
        let newCell = document.createElement("span");
        let p = document.createElement("p");
        if (cell !== "?") {
            p.innerHTML = cell;
            newCell.classList.add("given");
        }
        newCell.appendChild(p);
        page.getElementById("grid").appendChild(newCell);
    });


    domain.forEach( (n) => {
        let button = document.createElement("button");
        let p = document.createElement("p");

        p.innerHTML = n;

        button.appendChild(p);
        
        page.getElementById("domain").appendChild(button);
    });

    createDownload(`${difficulty.charAt(0)}${levelNumber.replace('.', '-')}.html`, page.body.outerHTML);
}


function generateJSFile(levelNumber, difficulty, rows, cols, solution, domain, nextLevel) {
    const solArray = [];
    for (let i = 0; i < rows; i++) {
        solArray.push(solution.slice(i * cols, (i + 1) * cols));  
    }

    const script = `
        ROWS = ${rows};
        COLS = ${cols};
        DOMAIN = ${JSON.stringify(domain)};
        SOLUTION = ${JSON.stringify(solArray)};
        NEXT_LEVEL = "${nextLevel}";
       `;

    createDownload(`${difficulty.charAt(0)}${levelNumber.replace('.', '-')}.js`, script);
}

function createDownload(filename, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
