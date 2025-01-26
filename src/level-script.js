let ROWS;
let COLS;
let DOMAIN;
let SOLUTION;
let NEXT_LEVEL = null;
let tabdCells;
let tabbed = false;
let MENU_TOGGLE = null;


function initLevel() {
    ROOT.style.setProperty('--rows', ROWS);
    ROOT.style.setProperty('--cols', COLS);

    const level = Array.from(document.body.querySelectorAll(".page")).pop();

    MENU_TOGGLE = level.querySelector("#menu_checkbox");

    const propositions = level.querySelector("#propositions");
    const domain = level.querySelector("#domain");
    // fetch all inputs and cells
    const cellList = level.querySelectorAll('#grid span:not(.x_axis, .y_axis)');
    const domainList = domain.querySelectorAll('button');
    const entryList = Array.from(level.querySelectorAll('.entry')).map(x => x.firstChild);

    const MAXLENGTH = Math.max(...DOMAIN.map(num => num.toString().length));
    let undoStack = [];
    let redoStack = [];

    const undoButton = level.querySelector("#undo");
    const redoButton = level.querySelector("#redo");
    const pencilButton = level.querySelector("#pencil");

    let values = new Map();

    tabMenu();
    
    let cellActive = false;
    let domainActive = false;
    
    let candidateMode = false;


    const max = Math.max(ROWS, COLS);

    if (max < 3) {
        ROOT.style.setProperty('--fontFactor', 1 + (3 - max) / 2);
    } else if (max > 3) {
        ROOT.style.setProperty('--fontFactor', 1 + (3.5 - max) / max);
    } else {
        ROOT.style.setProperty('--fontFactor', 1);
    }

    
    if (ROWS > COLS) {
        ROOT.style.setProperty('--heightFactor', 1);
        ROOT.style.setProperty('--widthFactor', COLS / ROWS);
    } else if (COLS > ROWS) {
        ROOT.style.setProperty('--heightFactor', ROWS / COLS);
        ROOT.style.setProperty('--widthFactor', 1);
    } else {
        ROOT.style.setProperty('--heightFactor', 1);
        ROOT.style.setProperty('--widthFactor', 1);
    }
    

    MENU_TOGGLE.addEventListener("change", (e) => {
        tabMenu();
    });

    function tabMenu() {
        if (MENU_TOGGLE.checked) {
            level.querySelectorAll("#menu li").forEach( (li) => {
                li.tabIndex = 0;
            });
        } else {
            level.querySelectorAll("#menu li").forEach( (li) => {
                li.tabIndex = -1;
            });
        }
    }

    level.querySelector("#tab_catch").addEventListener("focus", (e) => {
        if (MENU_TOGGLE.checked) {
            setTimeout( () => {
                level.querySelector("#menu li").focus();
            }, 10);
        } else {
            setTimeout( () => {
                Array.from(cellList).find( x => x.tabIndex === 0).focus();
            }, 10);
        }
    });

    level.querySelector("#backtab_catch").addEventListener("focus", (e) => {
        if (!e.relatedTarget) {
            setTimeout( () => {
                Array.from(cellList).find( x => x.tabIndex === 0).focus();
            }, 10);
        } else {
            setTimeout( () => {
                Array.from(cellList).reverse().find( x => x.tabIndex === 0).focus();
            }, 10);
        }
    });

    if (NEXT_LEVEL === "T1-2") {
        setTimeout(()=> {
            level.querySelector("#info").click();
            
        }, 250);
    }

    tabdCells = [...Array(ROWS)].map(e => Array(COLS).fill(null));
    
    // id cells with their coordinates
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            const index = i * COLS + j; 
            cellList[index].id = `c${i+1}-${j+1}`;
            tabdCells[i][j] = cellList[index]; 
        }
    }


    cellList.forEach((cell) => {
        // Set up values map
        values.set(cell, null);

        if (cell.classList.contains("given")) return;

        // Allow kid-gloved typing

        cell.tabIndex = 0;        
        cell.addEventListener("keydown", inp);
    });


    function endInsert(e) {
        e.target.classList.remove("insert");
        e.target.removeEventListener("animationend", endInsert);
    }

    function endDismiss(e) {

        if (e.target.nodeName === "LI") {
            e.target.remove();
            return;
        }
        let text = e.target;
        text.classList.remove("dismiss");
        text.innerText = text.innerText.substring(0, text.innerText.length-1);
        text.removeEventListener("animationend", endDismiss);
        values.set(e.target.parentNode, text.innerText);
    }

    function endDismissWipe(e) {
        if (e.target.nodeName === "LI") {
            e.target.parentNode.remove();
            return;
        }
        let text = e.target;
        text.classList.remove("dismiss");
        text.innerText = "";
        text.removeEventListener("animationend", endDismissWipe);
        values.set(e.target.parentNode, "");
    }
    

    function insert(cell, value) {
        let text = cell.querySelector("p");
        let opts = cell.querySelector("ul");

        if (candidateMode) {

            // For now, not possible to type multi-digit numbers..
            if (!DOMAIN.some(x => x.toString().trim() === value.trim())) {
                return;
            }

            if (text.innerText.trim()) {
                text.classList.add("dismiss");
                text.addEventListener("animationend", endDismissWipe);
            }

            let newLi = document.createElement("li");
            newLi.innerText = value.trim();

            if (opts === null) {
                opts = document.createElement("ul");
                opts.appendChild(newLi);
                cell.appendChild(opts);
                return;
            }

            let match = Array.from(opts.children).find( x => x.innerText.trim() === value.trim());
            if (match) {
                match.classList.add("dismiss");
                match.addEventListener("transitionend", endDismiss);
                if (!CANCELOUT_TOGGLE.checked) {
                    opts.appendChild(newLi);
                }
            } else {
                opts.appendChild(newLi);
            }
            
            return;
        }

        if (opts) {
            opts.remove();
        }

        if ( CANCELOUT_TOGGLE.checked && text.innerText.trim() === value.trim()) {
            flushInsert = new AnimationEvent("animationend");
            text.dispatchEvent(flushInsert);

            setTimeout(() => {
                text.classList.add("dismiss");
                text.addEventListener("animationend", endDismissWipe);
            }, 1); // ensure insert handler has been removed
            return;
        }
        flushDismiss = new AnimationEvent("animationend");
        text.dispatchEvent(flushDismiss);
        
        setTimeout(() => {
            text.innerText = value.trim();
            text.classList.add("insert");
            text.addEventListener("animationend", endInsert);
        }, 1); // ensure dismiss handler has been removed

        values.set(cell, value);
        checkGrid();
    }

    function inp (event) {
        let node = event.target.querySelector("p");
        let text = node.innerText.trim();
        let opts = event.target.querySelector("ul");
        let optsCopy = opts ? opts.cloneNode(true) : null;

        let button = null;

        if (event.key === "Backspace") {
            if (opts) {
                if (undoStack.length == 0) {
                    undoButton.classList.add("usable");
                }
                
                opts.children[opts.children.length - 1].classList.add("dismiss");
                opts.children[opts.children.length - 1].addEventListener("transitionend", endDismiss);

                if (undoStack.length == 0) {
                    undoButton.classList.add("usable");
                }
                undoStack.push([event.target, optsCopy]);
                redoStack = [];
                redoButton.classList.remove("usable");
                
                
                return;
            } else if (!text) {
                return;
            }
            if (undoStack.length == 0) {
                undoButton.classList.add("usable");
            }
            undoStack.push([event.target, text]);
            redoStack = [];
            redoButton.classList.remove("usable");
            
            flushInsert = new AnimationEvent("animationend");
            node.dispatchEvent(flushInsert);

            setTimeout(() => {
                node.classList.add("dismiss");
                node.addEventListener("animationend", endDismiss);
            }, 1); // ensure insert handler has been removed

            return;
        } else if (text.length < MAXLENGTH) {
            if (DOMAIN.some(x => x.toString().startsWith(text + event.key))) {
                pressButton(text + event.key);
                insert(event.target, text + event.key);
            } else if (DOMAIN.some(x => x.toString().startsWith(event.key))) {
                pressButton(event.key);
                insert(event.target, event.key);
            } else {
                return;
            }
        } else if (DOMAIN.some(x => x.toString().startsWith(event.key))) {
            pressButton(event.key);
            insert(event.target, event.key);   
        } else {
            return;
        }


        if (undoStack.length === 0) {
            undoButton.classList.add("usable");
        }

        if (opts) {
            undoStack.push([event.target, optsCopy]);
        } else {
            undoStack.push([event.target, text]);
        }
        
        redoStack = [];
        redoButton.classList.remove("usable");


        
        checkGrid();
    }

    function pressButton(text) {
        let button = null;
        if (debounced === 0) {

            domainList.forEach( (b) => {
                if (b.textContent.trim() === (text)) {
                    button = b;
                }
            });

            if (button !== null) {
                button.classList.add("pushed");
                
                debounced++;
            }
        }
    }

    function checkGrid() {
        let flag = true;

        values.forEach((value, key) => {
            let row = parseInt(key.id.charAt(1));
            let col = parseInt(key.id.charAt(3));
            
            if (value != SOLUTION[row - 1][col - 1]) {
                flag = false;
            }
        });

        if (flag) {
            // Partly for suspense
            setTimeout(success, 200); 
        }
    }




    function success() {
        crosshairs("not-a-cell");
        highlight("not-a-cell");

        level.querySelector("#grid").classList.add("correct");

        tabdCells[0][0].addEventListener("animationend", () => {
            
            if (NEXT_LEVEL !== null) {
                domain.classList.add("correct");
                domainList[0].onclick = () => {
                    Router(NEXT_LEVEL);
                    history.pushState({loc:NEXT_LEVEL}, "");
                };
            } else {
                ROOT.style.setProperty('--successPrompt', "'Return home...'");
                
                domain.classList.add("correct");
                
                
                domainList[0].onclick = () => {
                    Router("index.html");
                    history.pushState({loc:"index.html"}, "");
                };
            }
            horizontalScroll(level.querySelector("#domain"), 7);


        });

        

        domainList.forEach((button) => {
            button.onfocus = "";
            button.onblur = "";
            button.blur();
        });

        setTimeout( () => {
            domainList[0].tabIndex = 0;
        }, 150);
        domainList[0].addEventListener("pointerdown", () => {
            domainList[0].classList.add("activated");
        })

        
        cellList.forEach((cell) => {
            cell.tabIndex = -1;
            cell.onfocus = function () {this.blur();};
            cell.onblur = "";
            cell.removeEventListener("keydown", inp);
        });

        undoButton.removeEventListener("pointerdown", undo);
        redoButton.removeEventListener("pointerdown", redo);
        undoButton.classList.remove("usable");
        redoButton.classList.remove("usable");
        pencilButton.classList.remove("usable");

        entryList.forEach((entry) => {
            entry.parentNode.style.pointerEvents = "none";
        })
        
        // Only blur what might be a domain button after handler is removed
        document.activeElement.blur();

    }



    let debounced = 0;

    function lockCell () {
        crosshairs(this.id);
        highlight(this.id);
        
        setTimeout(function () {
            cellActive = true;
            domainActive = false;


            domainList.forEach( (domain) => {
                domain.onfocus = function () {
                    pressButton(domain.textContent.trim());

                    let opts = this.querySelector("ul");

                    
                    if (undoStack.length === 0) {
                        undoButton.classList.add("usable");
                    }
                    
                    if (opts) {
                        undoStack.push([this, opts.cloneNode(true)]);
                    } else {
                        undoStack.push([this, this.firstChild.innerText.trim()]);
                    }

                    redoStack = [];
                    redoButton.classList.remove("usable");
                    
                    insert(this, domain.textContent.trim());

                }.bind(this);

                domain.onblur = function () {};
            });
        }.bind(this), 5);
        
    }

    function fillCell () {


        crosshairs("not-a-cell");
        highlight("not-a-cell");

        setTimeout(function () {
            cellActive = false;

            if (STICKY_TOGGLE.checked
                && !(document.activeElement.matches("#grid span"))
                && document.activeElement !== document.body
                && !tabbed
                || toolClicked) {

                this.focus();

            } else {
                domainList.forEach((domain) => {
                    domain.blur();

                    domain.onfocus = chamberInput;
                    domain.onblur = releaseInput;
                });

            }
            
        }.bind(this), 1);
    }

    cellList.forEach( (cell) => {
        cell.onfocus = lockCell;
        cell.onblur = fillCell;
    });

    function highlight(id) {
        entryList.forEach( (entry) => {

            if (entry.id ===
                "e" + id.charAt(1) + "e" + id.charAt(3)) {
                entry.parentNode.classList.add("highlight");
            } else {
                entry.parentNode.classList.remove("highlight");
            }
        });
    }

    function noticeEntry (event) {
        let entries;
        if (event.id) {
            entries = level.querySelectorAll("#e" + event.id.charAt(1) + "e" + event.id.charAt(3));
        } else {
            entries = level.querySelectorAll("#e" + this.id.charAt(1) + "e" + this.id.charAt(3));
        }
        entries.forEach( (entry) => {
            if (entry === null) return;
            
            let enclose = entry.parentNode;
            enclose.classList.add("noticed");

            if (level.querySelector("#c" + entry.id.charAt(1) + "-" + entry.id.charAt(3)).classList.contains("given")) {
                enclose.classList.add("given");
            }
            
        });
    }

    function removeNoticeEntry (event) {
        let entries;
        if (event.id) {
            entries = level.querySelectorAll("#e" + event.id.charAt(1) + "e" + event.id.charAt(3));
        } else {
            entries = level.querySelectorAll("#e" + this.id.charAt(1) + "e" + this.id.charAt(3));
        }
        entries.forEach( (entry) => {
            if (entry === null) return;
            
            entry.parentNode.classList.remove("noticed");
        });

    }



    function noticeCell (event) {
        noticeEntry(this);
        let cell = "c" + this.id.charAt(1) + "-" + this.id.charAt(3);
        let td = level.querySelector("#" + cell)
        td.classList.add("noticed");

        if (td.classList.contains("given")) {
            this.parentNode.classList.add("given");
        }
    }

    function removeNoticeCell (event) {
        removeNoticeEntry(this);
        let cell = "c" + this.id.charAt(1) + "-" + this.id.charAt(3);
        level.querySelector("#" + cell).classList.remove("noticed");
    }

    function jumpToCell (event) {
        event.preventDefault();
        let cell = "c" + this.id.charAt(1) + "-" + this.id.charAt(3);
        window.setTimeout(() => {
            fakeRipple = new PointerEvent("pointerdown");
            fakeRipple.simulated = true;
            level.querySelector("#" + cell).dispatchEvent(fakeRipple);
            level.querySelector("#" + cell).focus();
        }, 0);
    }

    cellList.forEach( (cell) => {
        cell.addEventListener("mouseover", noticeEntry);
        cell.addEventListener("mouseleave", removeNoticeEntry);
    });
    entryList.forEach( (entry) => {
        entry.addEventListener("mouseover", noticeCell);
        entry.addEventListener("mouseleave", removeNoticeCell);
        entry.addEventListener("pointerdown", jumpToCell);         
    });


    function chamberInput (e) {
        let button = e.target;
        
        setTimeout(function () {
            domainActive = true;
            cellActive = false;
            
            cellList.forEach((cell) => {
                cell.onfocus = function () {
                    if (tabbed) return;
                    let text = cell.querySelector("p");
                    let opts = cell.querySelector("ul");
                    
                    if (undoStack.length == 0) {
                        undoButton.classList.add("usable");
                    }
                    if (opts) {
                        undoStack.push([cell, opts.cloneNode(true)]);
                    } else {
                        undoStack.push([cell, text.innerText.trim()]);
                    }


                    redoStack = [];
                    redoButton.classList.remove("usable");

                    insert(cell, button.textContent.trim());

                };

                cell.onblur = function () {};
            }
                            );
        }, 5);
    }

    function releaseInput (e) {
        setTimeout(function () {
            domainActive = false;

            if (STICKY_TOGGLE.checked
                && document.activeElement.parentNode.id !== "domain"
                && document.activeElement !== document.body
                && !tabbed
                || toolClicked
               ) {
                e.target.focus({preventScroll: true});

            } else {
                cellList.forEach((cell) => {
                    cell.blur();
                    cell.onfocus = lockCell;
                    cell.onblur = fillCell;
                });

            }
        }, 1);  // Tiny slowdown to avoid resetting cell.onfocus before we can actually use it!
        
    }

    domainList.forEach( (button) => {
        button.onfocus = chamberInput;

        button.onblur = releaseInput;

        button.querySelector("p").addEventListener("transitionend", (e) => {
            if (e.target === null || e.target.classList.contains("ripple") || !(e.target.closest("button").classList.contains("pushed")) || e.elapsedTime < 0.08) return;
            e.target.closest("button").classList.remove("pushed");

            setTimeout( () => {debounced--;}, 85);
        });
        
    });




    level.querySelector('#prop_container').addEventListener('scroll', (e) => {
        const el = e.currentTarget;
        horizontalVerticalScroll(el, 7);
    });

    level.querySelector('#domain').addEventListener('scroll', (e) => {
        const el = e.currentTarget;
        horizontalScroll(el, 7);
    });


    window.onresize = function(event) {
        horizontalVerticalScroll(propositions.parentNode, 7);
        horizontalScroll(domain, 7);
        centerPropositions(propositions.parentNode);
    }

    screen.orientation.addEventListener("change", (event) => {
        horizontalVerticalScroll(propositions.parentNode, 7);
        centerPropositions(propositions.parentNode);
        horizontalScroll(domain, 7);
    });

    // given the id of a cell, emphasize borders of cells in that row and column
    function crosshairs(id) {
        if (!CROSSHAIRS_TOGGLE.checked) return;
        for (let i = 0; i < cellList.length; i++) {
            // check that the cell matches in row or column
            if (cellList[i].id.slice(1,2) == id.slice(1,2) || cellList[i].id.slice(3) == id.slice(3)) {
                cellList[i].style.outlineColor = "var(--baseColor)";

            }
            // reset the styles of other cells without messing up the axis labels
            else if (! cellList[i].classList.contains("y_axis") && ! cellList[i].classList.contains("x_axis")) {
                cellList[i].style.outlineColor = "transparent";

            }
        }
    }

    rippleStack = [];
    function spawnRipple(mouseEvent, element) {
        rippleStack.push(element);
        level.querySelectorAll(".ripple").forEach((r) => {
            if (element === rippleStack[rippleStack.length-1])
                r.remove();
        });
        rippleStack = rippleStack.slice(rippleStack.length-1);
        if (element !== rippleStack[rippleStack.length-1])
            return;
        // Create a ripple element <div class="ripple">
        const rippleEl = document.createElement('div');
        rippleEl.classList.add('ripple');
        // Position the ripple
        let x = element.offsetWidth / (Math.floor(Math.random() * 5)+1);
        let y = element.offsetHeight / (Math.floor(Math.random() * 5)+1);
        if (!mouseEvent.simulated) {
            x = mouseEvent.offsetX;
            y = mouseEvent.offsetY;
        }
        
        rippleEl.style.left = `${x}px`;
        rippleEl.style.top = `${y}px`;
        element.appendChild(rippleEl);
        requestAnimationFrame(() => {
            rippleEl.classList.add('run');
        });
        // Remove ripple element when the transition is done
        rippleEl.addEventListener('transitionend', () => {
            rippleEl.remove();
        });
        return rippleEl;
    }


    level.querySelectorAll('#grid span:not(.x_axis, .y_axis)').forEach(element => {
        element.addEventListener("pointerdown",  (event) => {
            if (!domainActive) {
                spawnRipple(event, element);
                element.focus({preventScroll: true});
            }
        });
    });

    level.querySelectorAll('#domain button').forEach(element => {
        element.addEventListener("pointerdown", (event) => {

            if (event.target.closest("#domain").classList.contains("correct")) {                
                spawnRipple(event, event.target.closest("button"));
                
            } else if (event.target.nodeName === "P" && !cellActive) {
                element.focus({preventScroll: true});
                spawnRipple(event, event.target);
            } else if (!cellActive) {
                element.focus({preventScroll: true});
                spawnRipple(event, event.target.querySelector("p"));
            }


        })
    })


    
    function undo(e) {
        if (undoStack.length === 0) return;
        let prevState = undoStack.pop();

        if (undoStack.length === 0) {
            undoButton.classList.remove("usable");
        }

        let cell = prevState[0];
        let undone = prevState[1];
        let done = cell.querySelector("ul") ? cell.querySelector("ul") : cell.firstChild.innerText.trim();
        let doneCopy = done.nodeName === "UL" ? done.cloneNode(true) : done;
        
        if (undone.nodeName === "UL") {
            if (done.nodeName !== "UL") {

                cell.firstChild.classList.add("dismiss");
                cell.firstChild.addEventListener("animationend", endDismissWipe);

                cell.appendChild(undone);
            } else if (undone.children.length === done.children.length) {

                done.children[done.children.length - 1].remove();
                done.appendChild(undone.children[undone.children.length - 1]);
            } else if (done.children.length < undone.children.length) {
                let doneSet = new Set(Array.from(done.children).map(x => x.innerText.trim()));
                done.appendChild(
                    Array.from(undone.children).find(x => !(doneSet.has(x.innerText.trim()))));
            } else {
                
                done.children[done.children.length - 1].classList.add("dismiss");
                done.children[done.children.length - 1].addEventListener("transitionend", endDismiss);
            }
        } else if (undone === "") {
            if (done.nodeName === "UL") {
                done.firstChild.classList.add("dismiss");
                done.firstChild.addEventListener("transitionend", endDismissWipe);
            } else {
                cell.firstChild.classList.add("dismiss");
                cell.firstChild.addEventListener("animationend", endDismissWipe);
            }
        } else {
            if (done.nodeName === "UL") {
                done.firstChild.classList.add("dismiss");
                done.firstChild.addEventListener("transitionend", endDismissWipe);
            }
            let temp = candidateMode;
            candidateMode = false;
            insert(cell, undone);
            candidateMode = temp;
        }

        if (redoStack.length === 0) {
            redoButton.classList.add("usable");
        }
        redoStack.push([cell, doneCopy]);

    }


    function redo(e) {
        if (redoStack.length === 0) return;
        let prevState = redoStack.pop();

        if (redoStack.length === 0) {
            redoButton.classList.remove("usable");
        }

        let cell = prevState[0];
        let redone = prevState[1];
        let done = cell.querySelector("ul") ? cell.querySelector("ul") : cell.firstChild.innerText.trim();
        let doneCopy = done.nodeName === "UL" ? done.cloneNode(true) : done;


        if (redone.nodeName === "UL") {
            if (done.nodeName !== "UL") {
                cell.firstChild.classList.add("dismiss");
                cell.firstChild.addEventListener("animationend", endDismissWipe);

                cell.appendChild(redone);
            } else if (done.children.length === redone.children.length) {
                done.children[done.children.length - 1].remove();
                done.appendChild(redone.children[redone.children.length - 1]);
            } else if (done.children.length < redone.children.length) {
                let doneSet = new Set(Array.from(done.children).map(x => x.innerText.trim()));
                done.appendChild(
                    Array.from(redone.children).find(x => !(doneSet.has(x.innerText.trim()))));
            } else {
                done.children[done.children.length - 1].classList.add("dismiss");
                done.children[done.children.length - 1].addEventListener("transitionend", endDismiss);
            }
        } else if (redone === "") {
            if (done.nodeName == "UL") {
                done.firstChild.classList.add("dismiss");
                done.firstChild.addEventListener("transitionend", endDismissWipe);
            } else {
                cell.firstChild.classList.add("dismiss");

                cell.firstChild.addEventListener("animationend", endDismissWipe);
            }
        } else {
            if (done.nodeName == "UL") {
                done.firstChild.classList.add("dismiss");
                done.firstChild.addEventListener("transitionend", endDismissWipe);
            }
            let temp = candidateMode;
            candidateMode = false;
            insert(cell, redone);
            candidateMode = temp;
        }

        if (undoStack.length === 0) {
            undoButton.classList.add("usable");
        }
        

        undoStack.push([cell, doneCopy]);
    }


    undoButton.addEventListener("click", undo);

    redoButton.addEventListener("click", redo);

    pencilButton.addEventListener("click", candidateToggle);

    [undoButton, redoButton, pencilButton].forEach( b => {
        b.addEventListener("click", () => {
            toolClicked = true;

            setTimeout( () => toolClicked = false, 10);
            
        });
    });

    let toolClicked = false;
    function candidateToggle(e) {
        candidateMode = !candidateMode;
        if (candidateMode) {
            pencilButton.classList.add("active");
        } else {
            pencilButton.classList.remove("active");
        }
    }



    level.querySelectorAll("#pencil, #undo, #redo").forEach(li => {
        li.addEventListener("pointerdown", (event) => {
            event.target.classList.add("nudged");

            event.target.addEventListener("pointerup", (event) => {
                event.target.classList.remove("nudged");
            })
        })
    });


    document.addEventListener('keydown', (e) => {

        if (e.key === "u") {
            undo();
            return;
        }

        if (e.key === "r") {
            redo();
            return;
        }

        if (e.key === "c") {
            candidateToggle();
            return;
        }

        if (e.key === "Escape") {
            document.activeElement.blur();
            return;
        }

        let button = (Array.from(domainList).find(x => x.firstChild.textContent.trim() === e.key));
        if (button && document.activeElement !== button && !document.activeElement.matches("#grid span")) {
            button.focus({preventScroll: true});
        }
    });


    level.querySelector("#wrap_home_level").onclick = function () {
        if (window.event.ctrlKey || window.event.shiftKey) {
            // Interestingly, Chrome will only actually focus the
            // new window if you were holding shift
            window.open("index.html", '_blank').focus();
        } else {
            Router("index.html");
            history.pushState({loc:"index.html"}, "");
        }
    }
}


function verticalScroll(el, moe) {
    const isScrollable = (el.scrollHeight - moe > el.clientHeight);
    if (!isScrollable) {
        el.style.maskImage = "";
        el.style.overflowY = "visible";

        return;
    }

    el.style.overflowY = "auto";

    
    // One pixel is added to the height to account for non-integer heights.
    const isScrolledToBottom = el.scrollHeight < el.clientHeight + el.scrollTop + 1;
    const isScrolledToTop = isScrolledToBottom ? false : el.scrollTop === 0;

    let top = 0;
    let bottom =0;
    
    if (!isScrolledToBottom) {
        bottom = 40;
    }

    if (!isScrolledToTop) {
        top = 40;
    }

    el.style.maskImage = `linear-gradient(to bottom, transparent 0, black ${top}px, black calc(100% - ${bottom}px), transparent 100%)`;

}



function horizontalScroll(el, moe) {
    const isScrollable = (el.scrollWidth - moe > el.clientWidth);

    if (!isScrollable) {
        el.style.maskImage = "";
        el.style.overflowX = "visible";

        return;
    }

    el.style.overflowX = "auto";

    
    // One pixel is added to the height to account for non-integer heights.
    const isScrolledToRight = el.scrollWidth  < el.clientWidth + el.scrollLeft + 1;
    const isScrolledToLeft = isScrolledToRight ? false : el.scrollLeft === 0;


    let left = 0;
    let right = 0;
    
    if (!isScrolledToRight) {
        right = 40;
    }

    if (!isScrolledToLeft) {
        left = 40;
    }

    el.style.maskImage = `linear-gradient(to right, transparent 0, black ${left}px, black calc(100% - ${right}px), transparent 100%)`;
}

function horizontalVerticalScroll(el, moe) {
    let horizontalMask = "";
    let verticalMask = "";

    let isScrollable = el.scrollWidth - moe > el.clientWidth;

    if (!isScrollable) {
        el.style.overflowX = "visible";
    } else {
        el.style.overflowX = "auto";

        const isScrolledToRight = el.scrollWidth < el.clientWidth + el.scrollLeft + 1;
        const isScrolledToLeft = el.scrollLeft === 0;

        let left = isScrolledToLeft ? 0 : 40;
        let right = isScrolledToRight ? 0 : 40;

        horizontalMask = `linear-gradient(to right, transparent 0, black ${left}px, black calc(100% - ${right}px), transparent 100%)`;
    }

    isScrollable = el.scrollHeight - moe > el.clientHeight;

    if (!isScrollable) {
        el.style.overflowY = "visible";
    } else {
        el.style.overflowY = "auto";

        const isScrolledToBottom = el.scrollHeight < el.clientHeight + el.scrollTop + 1;
        const isScrolledToTop = el.scrollTop === 0;

        let top = isScrolledToTop ? 0 : 40;
        let bottom = isScrolledToBottom ? 0 : 40;

        verticalMask = `linear-gradient(to bottom, transparent 0, black ${top}px, black calc(100% - ${bottom}px), transparent 100%)`;
    }

    if (horizontalMask && verticalMask) {
        el.style.maskImage = `${horizontalMask}, ${verticalMask}`;
        el.style.maskComposite = "intersect"; 
    } else if (horizontalMask) {
        el.style.maskImage = horizontalMask;
    } else if (verticalMask) {
        el.style.maskImage = verticalMask;
    } else {
        el.style.maskImage = "";
    }

    
}

function centerPropositions(el) {
    el.scrollLeft = (el.firstElementChild.offsetWidth - el.offsetWidth) / 2;
}
