let ROWS;
let COLS;
let DOMAIN;
let SOLUTION;
let NEXT_LEVEL = null;
let tabdCells;
let tabbed = false;
let MENU_TOGGLE = null;


function initLevel() {
    const level = Array.from(document.body.querySelectorAll(".page")).pop();

    level.style.setProperty('--rows', ROWS);
    level.style.setProperty('--cols', COLS);
    
    alignGrid();

    MENU_TOGGLE = level.querySelector("#menu_checkbox");
    const info = level.querySelector("#level_info");
    const notes = level.querySelector("#wrapnotes");

    const propositions = level.querySelector("#propositions");
    const domain = level.querySelector("#domain");
    let currentGrid = 1;

    const domainList = domain.querySelectorAll('button');
    const entryList = Array.from(level.querySelectorAll('.entry')).map(x => x.firstChild);
    const MAXLENGTH = Math.max(...DOMAIN.map(num => num.toString().length));    

    let cellActive = false;
    let domainActive = false;
    let candidateMode = false;

    const undoButton = level.querySelector("#undo");
    const redoButton = level.querySelector("#redo");
    const pencilButton = level.querySelector("#pencil");
    const addGridButton = level.querySelector("#nextgrid");
    const deleteGridButton = level.querySelector("#delgrid");

    const gridCarousel = level.querySelector("#grid_carousel");
    const cellList = () => gridStorage.get(currentGrid).get("cells");
    const values = () => gridStorage.get(currentGrid).get("values");
    const undoStack = () => gridStorage.get(currentGrid).get("undo");
    const redoStack = () => gridStorage.get(currentGrid).get("redo");

    let throttleGrid = false;
    
    const gridStorage = new Map();
    let firstGrid = new Map();
    gridStorage.set(1, firstGrid);
    firstGrid.set("undo", []);
    firstGrid.set("redo", []);

    initCells(1);
    firstGrid.set("values", new Map([...cellList()].map(k => [k.id, null])));

    function initCells(gridNum) {
        let newGrid = gridStorage.get(gridNum);
        
        newGrid.set("cells", level.querySelectorAll(`#g${gridNum} span`));

        // id cells with their coordinates
        cells = newGrid.get("cells");
        for (let i = 0; i < ROWS; i++) {
            for (let j = 0; j < COLS; j++) {
                const index = i * COLS + j;
                cells[index].id = `c${i+1}-${j+1}`;
            }
        }

        let spanCount = 1;
        cells.forEach((cell) => {
            cell.style.animationDelay = `${spanCount++ * 175}ms`;
            cell.addEventListener("mouseover", noticeEntry);
            cell.addEventListener("mouseleave", removeNoticeEntry);

            if (cell.classList.contains("given")) return;

            // Allow kid-gloved typing

            cell.tabIndex = 0;        
            cell.addEventListener("keydown", inp);

            
            cell.onfocus = lockCell;
            cell.onblur = fillCell;

            cell.addEventListener("pointerdown",  (event) => {
                if (!domainActive) {
                    spawnRipple(event, cell);
                    cell.focus({preventScroll: true});
                }
            });
        });
    }

    entryList.forEach( (entry) => {
        entry.addEventListener("mouseover", noticeCell);
        entry.addEventListener("mouseleave", removeNoticeCell);
        entry.addEventListener("pointerdown", jumpToCell);         
    });

    addGridButton.onclick = () => createNewGrid(false);


    let holdTimer;
    addGridButton.addEventListener("pointerdown", startPress);
    addGridButton.addEventListener("pointerup", endPress);

    function startPress() {
        holdTimer = setTimeout(() => {
            createNewGrid(true);
            addGridButton.onclick = "";
            function ignoreUp() {
                setTimeout( () => {
                    addGridButton.onclick = () => createNewGrid(false);
                    document.removeEventListener("pointerup", ignoreUp);
                    
                }, 50);
            }
            document.addEventListener("pointerup", ignoreUp);
        }, 500);
    }
    function endPress() {
        clearTimeout(holdTimer);
    }

    function createNewGrid(dupe=false) {
        if (scrolling || throttleGrid) return;
        throttleGrid = true;
        let gridNum = currentGrid; // just to avoid a change midway

        setTimeout( () => {throttleGrid = false;}, 400);
        let newGrid = document.createElement("div");
        let gridData = new Map();
        gridStorage.set(gridNum+1, gridData);
        gridData.set("values", dupe ? gridStorage.get(gridNum).get("values") : new Map([...cellList()].map( k => [k.id, null])));
        
        gridData.set("undo", dupe ? gridStorage.get(gridNum).get("undo") : []);
        gridData.set("redo", dupe ? gridStorage.get(gridNum).get("redo") : []);
        
        
        newGrid.classList.add("grid");
        gridStorage.get(gridNum).get("cells").forEach( cell => {
            let newSpan = document.createElement("span");
            let newP = document.createElement("p");

            if (cell.classList.contains("given")) {
                newP.innerText = cell.firstChild.innerText.trim();
                newSpan.classList.add("given");
            } else if (dupe) {
                if (cell.querySelector("ul")) {
                    newSpan.appendChild(cell.querySelector("ul").cloneNode(true));
                } else {
                    newP.innerText = cell.firstChild.innerText.trim();
                }            
            }

            newSpan.appendChild(newP);
            newGrid.appendChild(newSpan);
        });
        newGrid.id = "g" + ++gridNum;
        if (level.querySelector("#"+newGrid.id)) {
            for (let i = gridCarousel.children.length; i >= gridNum; i--) {
                level.querySelector("#g"+i).id = "g"+(i+1);
                gridStorage.set(i+1, gridStorage.get(i));
            }
        }
        gridCarousel.insertBefore(newGrid, level.querySelector("#g" + (gridNum+1)));

        initCells(gridNum);

        gridCarousel.scrollBy(
            {
                top: 0,
                left: newGrid.clientWidth,
                behavior: "smooth"
            }
        );

        updateGridbar(gridNum);

        

        setTimeout( () => noGridUpdate = false, 1000);
        newGrid.addEventListener("clearcrosshairs", () => crosshairs("not-a-cell", true));  
    };

    let gridBar = level.querySelector("#gridbar");
    function updateGridbar(num) {        

        if (gridbar.children.length === 0) {
            let first = document.createElement("span");
            first.classList.add("node");
            first.id = "n1";
            first.innerText = "I";
            gridbar.appendChild(first);
        }

        let node = document.createElement("span");
        node.classList.add("node");
        node.id = "n" + num;
        node.innerText = roman(num);

        
        if (gridbar.children.length >= num) {
            for (i = gridbar.children.length; i >= num; i--) {
                gridbar.querySelector("#n" + i).id = "n" + (i + 1);
                gridbar.querySelector("#n" + (i + 1)).innerText =  roman(i + 1);

                render = overlayMapping.get("n" + i);
                if (!render) continue;
                overlayMapping.set("n" + (i + 1), render);
                animatedMap.set("n" + (i + 1), true);
                animatedMap.set("n" + i, false);
                overlayMapping.delete("n" + i);

                render.id = "rn" + (1 + parseInt(render.id.substring(2)));
                render.innerText = roman(i+1);
            }
        }
        gridbar.insertBefore(node, gridbar.querySelector("#n" + ++num));
        

        let scroller = setInterval(() => {
            updateVisibleItems();

            if (overlayMapping.get("n" + num)) clearTimeout(scroller);

            gridbar.scrollBy({
                top: 0,
                left: 5
            });
        }, 10);
        setTimeout( () => {
            clearTimeout(scroller);
            
        }, 350);
    }

    function jumpToGrid(e, store=null) {
        let num = store || parseInt(e.target.id.substring(2));
        let diff = num - currentGrid;
        
        gridCarousel.scrollBy(
            {
                top: 0,
                left: diff * (30 + level.querySelector("#g1").clientWidth),
                behavior: "smooth"
            }
        );

    }

    let scrolling = false;
    gridCarousel.onscroll = () => {
        if (!scrolling) {
            [...gridCarousel.children].forEach(g => {
                [...g.children].forEach(span => {
                    span.tabIndex = -1;
                    span.blur();
                })});
        }
        scrolling = true;
        currentGrid = parseInt(getCenteredElement(gridCarousel).id.substring(1));
        alignGridBar();

        

        if (currentGrid === 1) {
            deleteGridButton.classList.remove("usable");
        } else {
            deleteGridButton.classList.add("usable");
        }

        if (undoStack().length) {
            undoButton.classList.add("usable");
        } else {
            undoButton.classList.remove("usable");
        }
        if (redoStack().length) {
            redoButton.classList.add("usable");
        } else {
            redoButton.classList.remove("usable");
        }

        
    };

    deleteGridButton.onclick = () => deleteGrid(currentGrid);
    function deleteGrid(num) {
        if (scrolling || throttleGrid) return;
        let grid = level.querySelector("#g" + num);
        grid.classList.add("deleting");
        jumpToGrid(null, (num === gridbar.children.length) ? num - 1 : num + 1);
        setTimeout (() => {
            grid.remove();
            gridCarousel.dispatchEvent(new Event("scroll"));
            
            setTimeout( () => {
                gridCarousel.dispatchEvent(new Event("scrollend"));

            }, 150);
        }, 400);
        
        

        level.querySelector("#n" + num).remove();
        overlayMapping.get("n" + num).remove();
        animatedMap.delete("n" + num);
        overlayMapping.delete("n" + num);

        if (gridbar.children.length === 1) {
            level.querySelector("#n" + 1).remove();
            overlayMapping.get("n" + 1).remove();
            animatedMap.delete("n" + 1);
            overlayMapping.delete("n" + 1);
        }

        
        for (i = num + 1; i <= gridBar.children.length + 1; i++) {
            level.querySelector("#g" + i).id = "g"+(-1 + parseInt(level.querySelector("#g" + i).id.substring(1)));
            gridbar.querySelector("#n" + i).id = "n" + (i - 1);
            gridbar.querySelector("#n" + (i - 1)).innerText =  roman(i - 1);
            animatedMap.set("n" + (i - 1), true);

            render = overlayMapping.get("n" + i);
            if (!render) continue;
            overlayMapping.set("n" + (i - 1), render);
            
            animatedMap.delete("n" + i);
            overlayMapping.delete("n" + i);

            render.id = "rn" + (-1 + parseInt(render.id.substring(2)));

            render.innerText = roman(i-1);
        }


        
    }

    function alignGridBar() {
        let newNode = level.querySelector("#n" + currentGrid);
        if (!newNode) return;
        let oldNode = level.querySelector(".chosen") || newNode;
        newNode.classList.add("chosen");
        level.querySelectorAll(`#gridbar span:not(#n${currentGrid})`).forEach(s => {s.classList.remove("chosen");});

        
        
        const containerScrollLeft = gridBar.scrollLeft;
        const containerVisibleRight = containerScrollLeft + gridBar.clientWidth;

        const newNodeLeft = newNode.offsetLeft;
        const newNodeRight = newNodeLeft + newNode.offsetWidth;

        const isNewNodeVisible = newNodeLeft >= containerScrollLeft && newNodeRight <= containerVisibleRight;


        if (!isNewNodeVisible) {
            gridBar.scrollTo({
                left: newNodeLeft - gridBar.clientWidth / 2 + newNode.offsetWidth / 2, 
                behavior: "smooth"
            });
        }

        updateVisibleItems();
    }

    gridCarousel.onscrollend = (e) => {
        scrolling = false;
        let curGrid = getCenteredElement(gridCarousel);
        
        [...curGrid.children].forEach(span => {
            if (span.classList.contains("given")) return;
            span.tabIndex = 0;
        });
        currentGrid = parseInt(curGrid.id.substring(1));

        alignGridBar();
        
        gridCarousel.focus();

        if (!("onscrollsnapchange" in window)) {
            setTimeout( () => {scrolling = false}, 450);
        }

    }



    level.querySelector("#tab_catch").addEventListener("focus", (e) => {
        if (scrolling) return;
        setTimeout( () => {
            try { [...cellList()].find( x => x.tabIndex === 0).focus({preventScroll: true});
                }
            catch {return; }
        }, 10);
    });

    level.querySelector("#backtab_catch").addEventListener("focus", (e) => {
        if (scrolling) return;
        try {
            if (!e.relatedTarget) {
                setTimeout( () => {
                    [...cellList()].find( x => x.tabIndex === 0).focus({preventScroll: true});
                }, 10);
            } else {
                setTimeout( () => {
                    [...cellList()].reverse().find( x => x.tabIndex === 0).focus({preventScroll: true});
                }, 10);
            }
        } catch { return; }
    });



    if (NEXT_LEVEL === "T1-2") {
        setTimeout(()=> {
            level.querySelector("#info").click();
            
        }, 425);
        level.style.setProperty('--noInfo', "0px");
    } else if (info.children.length) {
        level.querySelector("#info").classList.add("readme");
        level.style.setProperty('--noInfo', "0px");

    } else {
        level.querySelector("#info").remove();
        level.style.setProperty('--noInfo', "-54px");
    }



    level.querySelector("#notes_dialog").addEventListener("open", (e) => {
        setTimeout(()=>{
            e.target.querySelector("textarea").focus();
            
        }, 10);
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
        values().set(e.target.parentNode.id, text.innerText);
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
        values().set(e.target.parentNode.id, "");
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

        values().set(cell.id, value);
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
                if (undoStack().length == 0) {
                    undoButton.classList.add("usable");
                }
                
                opts.children[opts.children.length - 1].classList.add("dismiss");
                opts.children[opts.children.length - 1].addEventListener("transitionend", endDismiss);

                if (undoStack().length == 0) {
                    undoButton.classList.add("usable");
                }
                undoStack().push([event.target.id, optsCopy]);
                redoStack().length = 0;
                redoButton.classList.remove("usable");
                
                
                return;
            } else if (!text) {
                return;
            }
            if (undoStack().length == 0) {
                undoButton.classList.add("usable");
            }
            undoStack().push([event.target.id, text]);
            redoStack().length = 0;
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


        if (undoStack().length === 0) {
            undoButton.classList.add("usable");
        }

        if (opts) {
            undoStack().push([event.target.id, optsCopy]);
        } else {
            undoStack().push([event.target.id, text]);
        }
        
        redoStack().length = 0;
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

    let overlay = document.createElement("div");
    const overlayMapping = new Map();
    const animatedMap = new Map();
    overlay.className = "visible-items-overlay";

    level.appendChild(overlay);
    
    function updateVisibleItems() {
        if (!gridBar.children.length) return;
        const gridRect = gridBar.getBoundingClientRect();
        
        // Position the overlay exactly over gridBar's visible area
        overlay.style.left = gridRect.left + "px";
        overlay.style.top = gridRect.top + "px";
        overlay.style.width = gridRect.width + "px";
        overlay.style.height = gridRect.height + "px";
        // Determine visible items (horizontal check)
        const visibleItems = [...gridBar.children].filter(item => {
            const itemRect = item.getBoundingClientRect();
            return (itemRect.right > gridRect.left && itemRect.left < gridRect.right);
        });
        
        // Remove spans for items that are no longer visible
        overlayMapping.forEach((span, item) => {
            if (!visibleItems.includes(level.querySelector("#"+item))) {
                span.remove();
                overlayMapping.delete(item);
            }
        });
        
        visibleItems.forEach(item => {
            if (!overlayMapping.has(item.id)) {
                const span = document.createElement("span");
                span.id = "r"+item.id;
                span.onclick = jumpToGrid;
                span.textContent = item.textContent;
                // Check if this item has already animated before
                if (!animatedMap.get(item.id)) {
                    if (item.id === "n1") {
                        animatedMap.set(item.id, true);
                        span.classList.add("first");
                        span.addEventListener("transitionend", () => {
                            setTimeout( () => span.classList.remove("first"), 100);
                        });
                    }
                    else {
                        span.classList.add("new");
                        span.addEventListener("animationend", () => {
                            span.classList.remove("new");
                            animatedMap.set(item.id, true);
                        });
                    }
                }
                overlayMapping.set(item.id, span);
                overlay.appendChild(span);
            }
        });
        visibleItems.forEach((item, index) => {
            const span = overlayMapping.get(item.id);
            if (item.classList.contains("chosen"))
                span.classList.add("chosen")
            else
                span.classList.remove("chosen");
            if (overlay.children[index] !== span) {
                overlay.insertBefore(span, overlay.children[index] || null);
            }
        });
    }
    
    gridBar.addEventListener("scroll", updateVisibleItems);
    window.addEventListener("resize", updateVisibleItems);
    
    updateVisibleItems();


    function checkGrid() {
        let flag = true;

        values().forEach((value, key) => {
            let row = parseInt(key.charAt(1));
            let col = parseInt(key.charAt(3));
            if (value != SOLUTION[row - 1][col - 1]) {
                flag = false;
            }
        });

        if (flag) {
            // Suspense
            throttleGrid = true;
            setTimeout(success, 200); 
        }
    }





    function success() {
        crosshairs("not-a-cell");
        highlight("not-a-cell");

        level.querySelector("#g" + currentGrid).classList.add("correct");
        addGridButton.classList.add("fade");
        deleteGridButton.classList.add("fade");

        cellList()[0].addEventListener("animationend", () => {
            domain.classList.add("correct");
            cellActive = false;

            if (NEXT_LEVEL !== null) {
                domainList[0].querySelector("p").innerText = "Onwards..."
                domainList[0].onclick = () => {
                    setTimeout( () => {
                        Router(NEXT_LEVEL);
                    }, 100);

                };    
            } else {
                domainList[0].querySelector("p").innerText = "Return to level select...";                
                
                domainList[0].onclick = () => {
                    setTimeout( () => {
                        Router("index.html");
                    }, 100);
                };
            }
            setTimeout( () => {
                addGridButton.classList.remove("fade");
                deleteGridButton.classList.remove("fade");
                throttleGrid = false;
            }, 3000);
            horizontalScroll(level.querySelector("#domain"), 7);


        });

        document.activeElement.blur();
        

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

        
        cellList().forEach((cell) => {
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
        });
    }

    let debounced = 0;

    function lockCell () {
        this.classList.remove("retain");
        crosshairs(this.id);
        highlight(this.id);
        
        setTimeout(function () {
            cellActive = true;
            domainActive = false;


            domainList.forEach( (domain) => {
                domain.onfocus = function () {
                    pressButton(domain.textContent.trim());

                    let opts = this.querySelector("ul");

                    
                    if (undoStack().length === 0) {
                        undoButton.classList.add("usable");
                    }
                    
                    if (opts) {
                        undoStack().push([this.id, opts.cloneNode(true)]);
                    } else {
                        undoStack().push([this.id, this.firstChild.innerText.trim()]);
                    }

                    redoStack().length = 0;
                    redoButton.classList.remove("usable");
                    
                    insert(this, domain.textContent.trim());

                }.bind(this);

                domain.onblur = function () {};
            });
        }.bind(this), 5);
        
    }

    function fillCell (e) {
        if (document.activeElement === this || openingModal) {this.classList.add("retain"); return;}
        crosshairs("not-a-cell");
        highlight("not-a-cell");

        setTimeout(function () {
            cellActive = false;

            if (STICKY_TOGGLE.checked
                && !(document.activeElement.matches(".grid span"))
                && document.activeElement !== document.body
                && !tabbed
                || toolClicked
               ) {
                
                this.focus({preventScroll: true});
            } else {
                let r = this.querySelector(".ripple");

                if (r) {
                    try { r.remove(); } catch {}

                    let temp = this.style.transition;
                    this.style.transition = "none";
                    setTimeout( () => this.style.transition = temp, 10);
                }
                
                domainList.forEach((domain) => {
                    domain.blur();

                    domain.onfocus = chamberInput;
                    domain.onblur = releaseInput;
                });
            }
            
        }.bind(this), 1);
    }



    function highlight(id) {
        let pair = [];

        entryList.forEach( (entry) => {
            let yNum = level.querySelector("#y" + entry.id.charAt(1));
            let xNum = level.querySelector("#x" + entry.id.charAt(3));
            if (entry.id ===
                "e" + id.charAt(1) + "e" + id.charAt(3)) {
                entry.parentNode.classList.add("highlight");
                pair = [yNum, xNum];
            } else {
                entry.parentNode.classList.remove("highlight");
                yNum.classList.remove("highlight");
                xNum.classList.remove("highlight");
            }
        });

        pair.forEach(a => a.classList.add("highlight"));
    }

    function axisCue(y, x) {
        let yNum = level.querySelector(y);
        let xNum = level.querySelector(x);

        yNum.classList.add("cue");
        xNum.classList.add("cue");
    }

    function deAxisCue(y, x) {
        let yNum = level.querySelector(y);
        let xNum = level.querySelector(x);

        yNum.classList.remove("cue");
        xNum.classList.remove("cue");
    }

    function noticeEntry (event) {
        let entries;
        if (event.id) {
            entries = level.querySelectorAll("#e" + event.id.charAt(1) + "e" + event.id.charAt(3));
            axisCue("#y" + event.id.charAt(1), "#x" + event.id.charAt(3));
        } else {
            entries = level.querySelectorAll("#e" + this.id.charAt(1) + "e" + this.id.charAt(3));
            axisCue("#y" + this.id.charAt(1), "#x" + this.id.charAt(3));
        }
        if (entries.length === 0) {
            return;
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
            deAxisCue("#y" + event.id.charAt(1), "#x" + event.id.charAt(3));
            
        } else {
            entries = level.querySelectorAll("#e" + this.id.charAt(1) + "e" + this.id.charAt(3));
            deAxisCue("#y" + this.id.charAt(1), "#x" + this.id.charAt(3));
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
        if (scrolling) return;
        event.preventDefault();
        let cell = "c" + this.id.charAt(1) + "-" + this.id.charAt(3);
        window.setTimeout(() => {
            fakeRipple = new PointerEvent("pointerdown");
            fakeRipple.simulated = true;
            level.querySelector("#g" + currentGrid + " #" + cell).dispatchEvent(fakeRipple);
            level.querySelector("#g" + currentGrid + " #" + cell).focus({preventScroll: true});
        }, 0);
    }

    function chamberInput (e) {

        let button = e.target;
        button.classList.remove("retain");

        setTimeout(function () {
            domainActive = true;
            cellActive = false;

            cellList().forEach((cell) => {
                cell.onfocus = function () {
                    if (tabbed) return;
                    let text = cell.querySelector("p");
                    let opts = cell.querySelector("ul");
                    
                    if (undoStack().length == 0) {
                        undoButton.classList.add("usable");
                    }
                    if (opts) {
                        undoStack().push([cell.id, opts.cloneNode(true)]);
                    } else {
                        undoStack().push([cell.id, text.innerText.trim()]);
                    }


                    redoStack().length = 0;
                    redoButton.classList.remove("usable");

                    insert(cell, button.textContent.trim());

                };

                cell.onblur = function () {};
            }
                              );
        }, 5);
    }

    function releaseInput (e) {
        if (document.activeElement === this || openingModal) {this.classList.add("retain"); return;}
        setTimeout(function () {
            domainActive = false;
            e.target.onclick = "";

            if (STICKY_TOGGLE.checked
                && document.activeElement.parentNode.id !== "domain"
                && document.activeElement !== document.body
                && !tabbed
                || toolClicked
               ) {
                e.target.focus({preventScroll: true});

            } else {
                cellList().forEach((cell) => {
                    cell.blur();
                    cell.onfocus = lockCell;
                    cell.onblur = fillCell;
                });

            }
        }, 1);  // Tiny slowdown to avoid resetting cell.onfocus before we can actually use it!
        
    }

    let deselectReady = false;

    domainList.forEach( (button) => {
        button.onfocus = chamberInput;

        button.onblur = releaseInput;

        button.querySelector("p").addEventListener("transitionend", (e) => {
            if (e.target.classList.contains("ripple")) {
                deselectReady = button;
                button.addEventListener("blur", clearDeselect);
                return;
            }
            if (e.target === null || !(e.target.closest("button").classList.contains("pushed")) || e.elapsedTime < 0.08) return;
            e.target.closest("button").classList.remove("pushed");

            setTimeout( () => {debounced--;}, 85);
        });
        
    });

    function clearDeselect(e) {
        if (!e.relatedTarget) {
            deselectReady = false;
            e.target.removeEventListener("blur", clearDeselect);
        }
    }



    level.querySelector('#prop_container').addEventListener('scroll', (e) => {
        const el = e.currentTarget;
        verticalScroll(el, 7);
    });

    level.querySelector('#domain').addEventListener('scroll', (e) => {
        const el = e.currentTarget;
        horizontalScroll(el, 7);
    });


    window.onresize = function(event) {
        verticalScroll(propositions.parentNode, 7);
        horizontalScroll(domain, 7);
        fadeInfo();
    }

    screen.orientation.addEventListener("change", (event) => {
        verticalScroll(propositions.parentNode, 7);
        horizontalScroll(domain, 7);
        fadeInfo();
    });

    // given the id of a cell, emphasize borders of cells in that row and column
    function crosshairs(id, flush=false) {
        if (!CROSSHAIRS_TOGGLE.checked && !flush) return;
        for (let i = 0; i < cellList().length; i++) {
            // check that the cell matches in row or column
            if (cellList()[i].id.slice(1,2) == id.slice(1,2) || cellList()[i].id.slice(3) == id.slice(3)) {
                cellList()[i].style.outlineColor = "var(--baseColor)";

            }
            // reset the styles of other cells without messing up the axis labels
            else if (! cellList()[i].classList.contains("y_axis") && ! cellList()[i].classList.contains("x_axis")) {
                cellList()[i].style.outlineColor = "transparent";

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


    level.querySelectorAll('#domain button').forEach(element => {
        element.addEventListener("pointerdown", (event) => {
            if (event.target === document.activeElement) {
                
                return;
            } else if (event.target.nodeName === "P" && !cellActive) {
                element.focus({preventScroll: true});
                spawnRipple(event, event.target);
            } else if (!cellActive) {
                element.focus({preventScroll: true});
                spawnRipple(event, event.target.querySelector("p"));
            }
        });

        element.addEventListener("click", (event) => {
            if (event.target === deselectReady) {
                deselectReady.blur();
                deselectReady = false;
            }
        })
    });


    function undo(e) {
        if (undoStack().length === 0) return;
        let prevState = undoStack().pop();

        if (undoStack().length === 0) {
            undoButton.classList.remove("usable");
        }

        let cell = level.querySelector("#g" + currentGrid + " #"+prevState[0]);
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

        if (redoStack().length === 0) {
            redoButton.classList.add("usable");
        }
        redoStack().push([cell.id, doneCopy]);

    }


    function redo(e) {
        if (redoStack().length === 0) return;
        let prevState = redoStack().pop();

        if (redoStack().length === 0) {
            redoButton.classList.remove("usable");
        }

        let cell = level.querySelector("#g" + currentGrid + " #"+prevState[0]);
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

        if (undoStack().length === 0) {
            undoButton.classList.add("usable");
        }
        

        undoStack().push([cell.id, doneCopy]);
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



    level.querySelectorAll("#pencil, #undo, #redo, #nextgrid, #delgrid").forEach(li => {
        li.addEventListener("pointerdown", (event) => {
            event.target.classList.add("nudged");

            event.target.addEventListener("pointerup", (event) => {
                event.target.classList.remove("nudged");
            })
        })
    });

    level.querySelector("#wrap_home_level").addEventListener("pointerdown", (e) => {
        e.target.closest("#wrap_home_level").classList.add("nudged");
        e.target.closest("#wrap_home_level").addEventListener("pointerup", (e) => {
            e.target.closest("#wrap_home_level").classList.remove("nudged");
        });
    });



    document.onkeydown = (e) => {

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

        if (e.key === "p") {
            createNewGrid(false);
            return;
        }

        if (e.key === "P") {
            createNewGrid(true);
            return;
        }
        if (e.key === "x") {
            deleteGrid(currentGrid);
            return;
        }

        if (e.key === "Escape") {
            document.activeElement.blur();
            return;
        }

        if (e.key === "ArrowRight") {
            e.preventDefault();
            gridCarousel.scrollBy(
                {
                    top: 0,
                    left: level.querySelector(".grid").clientWidth,
                    behavior: "smooth"
                }
            );
        }

        if (e.key === "ArrowLeft") {
            e.preventDefault();
            gridCarousel.scrollBy(
                {
                    top: 0,
                    left: -1 * level.querySelector(".grid").clientWidth,
                    behavior: "smooth"
                }
            );
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            propositions.parentNode.scrollBy(
                {
                    top: level.querySelector("#propositions li").clientHeight,
                    left: 0,
                    behavior: "smooth"
                }
            );
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            propositions.parentNode.scrollBy(
                {
                    top: -1 * level.querySelector("#propositions li").clientHeight,
                    left: 0,
                    behavior: "smooth"
                }
            );
        }

        

        let button = (Array.from(domainList).find(x => x.firstChild.textContent.trim() === e.key));
        if (button  && !document.activeElement.matches(".grid span")) {
            button.dispatchEvent(new PointerEvent("pointerdown"));

            setTimeout( () => {
                document.dispatchEvent(new PointerEvent("pointerup"));


            }, 5);
            button.click();

        }
    };

    level.querySelector("#wrap_home_level").onclick = function () {
        if (window.event.ctrlKey || window.event.shiftKey) {
            // Interestingly, Chrome will only actually focus the
            // new window if you were holding shift
            window.open("index.html", '_blank').focus();
        } else {
            Router("index.html");
        }
    }
    function fadeInfo() {
        verticalScroll(info, 7);     
        if (info.style.overflow !== "visible") {
            info.classList.add("overflowing");
        } else {
            info.classList.remove("overflowing");
        }
    }


    info.parentNode.addEventListener("open", () => {
        info.scroll(0,0);
        fadeInfo();        
    });
    info.addEventListener("scroll", () => {
        fadeInfo();
    });


    function alignGrid() {
        const max = Math.max(ROWS, COLS);
        if (max > 3) {
            level.style.setProperty('--fontFactor', 1 + (3.25 - max) / max);
            level.style.setProperty('--lanscapeFontFactor', 1 + (3.25 - max) / max);
        } else if (max < 3) {
            level.style.setProperty('--fontFactor', 1);
            level.style.setProperty('--landscapeFontFactor', 1);
        } else {
            level.style.setProperty('--fontFactor', 1);
            level.style.setProperty('--landscapeFontFactor', 1);
        }
        level.style.setProperty('--boostProps', 1);
        
        if (ROWS > COLS) {
            level.style.setProperty('--heightFactor', 1);
            level.style.setProperty('--widthFactor', COLS / ROWS);
            level.style.setProperty('--landscapeHeightFactor', 1);
            level.style.setProperty('--landscapeWidthFactor', COLS / ROWS);
        } else if (COLS > ROWS) {
            level.style.setProperty('--heightFactor', (ROWS / COLS));
            level.style.setProperty('--widthFactor', 1);
            if (ROWS < 3) {
                level.style.setProperty('--boostProps', 1.075);

                level.style.setProperty('--landscapeHeightFactor', 1.2 * (ROWS / COLS));
                level.style.setProperty('--landscapeWidthFactor', 1.2);
                level.style.setProperty('--landscapeFontFactor', 1);
            } else {
                level.style.setProperty('--landscapeHeightFactor', (ROWS / COLS));
                level.style.setProperty('--landscapeWidthFactor', 1);
            }
        } else {
            if (ROWS === 2) {
                level.style.setProperty('--heightFactor',0.65);
                level.style.setProperty('--widthFactor', 0.65);
                level.style.setProperty('--landscapeHeightFactor', 0.7);
                level.style.setProperty('--landscapeWidthFactor', 0.7);
            } else {
                level.style.setProperty('--heightFactor', 1);
                level.style.setProperty('--widthFactor', 1);
                level.style.setProperty('--landscapeHeightFactor', 1);
                level.style.setProperty('--landscapeWidthFactor', 1);
            }

        }
    }
}
function roman(n) {
    const romanNumerals = [
        [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
        [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
        [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
    ];
    
    let result = '';
    for (let [value, symbol] of romanNumerals) {
        while (n >= value) {
            result += symbol;
            n -= value;
        }
    }
    return result;
}
