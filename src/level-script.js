let ROWS;
let COLS;
let DOMAIN;
let SOLUTION;
let NEXT_LEVEL = null;
let tabdCells;



function initLevel() {
    document.documentElement.style.setProperty('--rows', ROWS);
    document.documentElement.style.setProperty('--cols', COLS);

    const level = Array.from(document.body.querySelectorAll(".page")).pop();

    const CROSSHAIRS_TOGGLE = level.querySelector("#crosshairs_toggle");
    const HIGHLIGHT_TOGGLE = level.querySelector("#highlight_toggle");
    const STICKY_TOGGLE = level.querySelector("#sticky_toggle");
    const CANCELOUT_TOGGLE = level.querySelector("#cancelout_toggle");

    const domain = level.querySelector("#domain");
    // fetch all inputs and cells
    const cellList = level.querySelectorAll('#grid span:not(.x_axis, .y_axis)');
    const domainList = domain.querySelectorAll('button');
    const entryList = Array.from(level.querySelectorAll('.entry')).map(x => x.firstChild);

    const MAXLENGTH = Math.max(...DOMAIN.map(num => num.toString().length));
    var undoStack = [];
    var redoStack = [];

    const undoButton = level.querySelector("#undo");
    const redoButton = level.querySelector("#redo");
    const pencilButton = level.querySelector("#pencil");

    var values = new Map();

    var use_highlight = HIGHLIGHT_TOGGLE.checked;
    var use_crosshairs = CROSSHAIRS_TOGGLE.checked;
    var use_sticky = STICKY_TOGGLE.checked;
    var use_cancelout = CANCELOUT_TOGGLE.checked;

    var cellActive = false;
    var domainActive = false;

    let candidateMode = false;


    const max = Math.max(ROWS, COLS);

    if (max < 3) {
        document.documentElement.style.setProperty('--fontFactor', 1 + (3 - max) / 2);
    } else if (max > 3) {
        document.documentElement.style.setProperty('--fontFactor', 1 + (3.5 - max) / max);
    } else {
        document.documentElement.style.setProperty('--fontFactor', 1);
    }

    
    if (ROWS > COLS) {
        document.documentElement.style.setProperty('--heightFactor', 1);
        document.documentElement.style.setProperty('--widthFactor', COLS / ROWS);
    } else if (COLS > ROWS) {
        document.documentElement.style.setProperty('--heightFactor', ROWS / COLS);
        document.documentElement.style.setProperty('--widthFactor', 1);
    } else {
        document.documentElement.style.setProperty('--heightFactor', 1);
        document.documentElement.style.setProperty('--widthFactor', 1);
    }
    



    HIGHLIGHT_TOGGLE.addEventListener("change", (e) => {
        use_highlight = HIGHLIGHT_TOGGLE.checked;
    });

    CROSSHAIRS_TOGGLE.addEventListener("change", (e) => {
        use_crosshairs = CROSSHAIRS_TOGGLE.checked;
    });

    STICKY_TOGGLE.addEventListener("change", (e) => {
        use_sticky = STICKY_TOGGLE.checked;
    });

    CANCELOUT_TOGGLE.addEventListener("change", (e) => {
        use_cancelout = CANCELOUT_TOGGLE.checked;
    });

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

        // Allow kid-gloved typing
        if (cell.classList.contains("given")) return;

        cell.tabIndex = 0;
        
        cell.addEventListener("keydown", inp);
    });


    function endInsert(e) {
        e.target.classList.remove("insert");
        e.target.removeEventListener("animationend", endInsert);
    }

    function endDismiss(e) {
        let text = e.target;
        text.classList.remove("dismiss");
        text.innerHTML = text.innerHTML.substring(0, text.innerHTML.length-1);
        text.removeEventListener("animationend", endDismiss);
        values.set(e.target.parentNode, text.innerHTML);
    }

    function endDismissWipe(e) {
        let text = e.target;
        text.classList.remove("dismiss");
        text.innerHTML = "";
        text.removeEventListener("animationend", endDismissWipe);
        values.set(e.target.parentNode, "");
    }
    

    function insert(cell, value) {
        let text = cell.querySelector("p");
        let opts = cell.querySelector("ul");

        if (candidateMode) {
            if (text.innerHTML.trim()) {
                text.classList.add("dismiss");
                text.addEventListener("animationend", endDismissWipe);
            }
            
            let newLi = document.createElement("li");
            newLi.innerText = value;

            if (opts === null) {
                opts = document.createElement("ul");
                opts.appendChild(newLi);
                cell.appendChild(opts);
                return;
            }
            opts.appendChild(newLi);
            
            return;
        }

        if (opts && opts.children) {
            opts.replaceChildren();
        }

        if (use_cancelout && text.innerHTML.trim() === value.trim()) {
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
            text.innerHTML = value;
            text.classList.add("insert");
            text.addEventListener("animationend", endInsert);
        }, 1); // ensure dismiss handler has been removed

        values.set(cell, value);
        checkGrid();


    }

    function inp (event) {
        let text = event.target.querySelector("p");
        
        if (!(text.innerText.length === MAXLENGTH) && DOMAIN.some(x => x.toString().startsWith(text.innerText + event.key))) {
            if (undoStack.length == 0) {
                undoButton.classList.add("usable");
            }
            undoStack.push([event.target, text.innerHTML]);
            redoStack = [];
            redoButton.classList.remove("usable");
            
            if (debounced === 0 || candidateMode) {

                let button = null;
                domainList.forEach( (b) => {
                    if (b.textContent.trim() === (text.innerText + event.key)) {
                        button = b;
                    }
                });

                if (button !== null) {
                    button.classList.add("pushed");
                    
                    debounced++;
                    
                }
                
                insert(event.target, text.innerText + event.key);
            }
            
        } else if (event.key === "Backspace") {
            if (undoStack.length == 0) {
                undoButton.classList.add("usable");
            }
            undoStack.push([event.target, text.innerHTML]);
            redoStack = [];
            redoButton.classList.remove("usable");
            
            flushInsert = new AnimationEvent("animationend");
            text.dispatchEvent(flushInsert);

            setTimeout(() => {
                text.classList.add("dismiss");
                text.addEventListener("animationend", endDismiss);
            }, 1); // ensure insert handler has been removed

        }
        checkGrid();
    }

    function checkGrid() {
        var flag = true;

        values.forEach((value, key) => {
            var row = parseInt(key.id.charAt(1));
            var col = parseInt(key.id.charAt(3));
            
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
                document.documentElement.style.setProperty('--successPrompt', "'Return home...'");
                
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
                    
                    if (debounced === 0) {
                        domain.classList.add("pushed");
                        
                        debounced++;
                    }
                    let text = this.querySelector("p");

                    
                    if (undoStack.length === 0) {
                        undoButton.classList.add("usable");
                    }
                    undoStack.push([this, this.firstChild.innerHTML]);
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

            if (use_sticky
                && !(level.querySelector("#grid").contains(document.activeElement))
                && document.activeElement.parentNode.id != "toolbar"
                && document.activeElement != document.body
                || pencilButtonClicked) {
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
        if (!use_highlight) return;
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
        let entry = "e" + this.id.charAt(1) + "e" + this.id.charAt(3);
        let enclose = level.querySelector("#" + entry).parentNode;
        enclose.classList.add("noticed");

        if (this.classList.contains("given")) {
            enclose.classList.add("given");
        }
    }

    function removeNoticeEntry (event) {
        let entry = "e" + this.id.charAt(1) + "e" + this.id.charAt(3);
        level.querySelector("#" + entry).parentNode.classList.remove("noticed");
    }


    function noticeCell (event) {
        let cell = "c" + this.id.charAt(1) + "-" + this.id.charAt(3);
        let td = level.querySelector("#" + cell)
        td.classList.add("noticed");

        if (td.classList.contains("given")) {
            this.parentNode.classList.add("given");
        }
    }

    function removeNoticeCell (event) {
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
        if (cell.classList.contains("given")) return;
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
                    let text = cell.querySelector("p")

                    if (undoStack.length == 0) {
                        undoButton.classList.add("usable");
                    }
                    undoStack.push([cell, text.innerHTML]);
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

            if (use_sticky
                && document.activeElement.parentNode.id != "domain"
                && document.activeElement.parentNode.id != "toolbar"
                && document.activeElement != document.body
                || pencilButtonClicked
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

        button.querySelector("p").onfocus = () => { button.focus(); };
        
    });


    

    level.querySelector('#propositions').addEventListener('scroll', (e) => {
        const el = e.currentTarget;
        horizontalVerticalScroll(el, 7);
    });

    level.querySelector('#domain').addEventListener('scroll', (e) => {
        const el = e.currentTarget;
        horizontalScroll(el, 7);
    });

    window.onresize = function(event) {
        horizontalVerticalScroll(level.querySelector("#propositions"), 7);

        horizontalScroll(level.querySelector("#domain"), 7);
    }




    // given the id of a cell, emphasize borders of cells in that row and column
    function crosshairs(id) {
        if (!use_crosshairs) return;
        for (var i = 0; i < cellList.length; i++) {
            // check that the cell matches in row or column
            if (cellList[i].id.slice(1,2) == id.slice(1,2) || cellList[i].id.slice(3) == id.slice(3)) {
                cellList[i].style.outlineColor = "black";

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
            event.preventDefault();
            event.target.closest("button").focus({preventScroll: true});

            if (event.target.closest("#domain").classList.contains("correct")) {                
                spawnRipple(event, event.target.closest("button"));
            } else if (event.target.nodeName === "P" && !cellActive) {
                spawnRipple(event, event.target);
            } else if (!cellActive) {
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
        let done = cell.firstChild.innerHTML;


        if (undone === "") {
            cell.firstChild.classList.add("dismiss");

            cell.firstChild.addEventListener("animationend", endDismiss);

        } else {
            insert(cell, undone);
        }

        if (redoStack.length === 0) {
            redoButton.classList.add("usable");
        }
        redoStack.push([cell, done]);
    }

    function redo(e) {
        if (redoStack.length === 0) return;
        let prevState = redoStack.pop();

        if (redoStack.length === 0) {
            redoButton.classList.remove("usable");
        }

        let cell = prevState[0];
        let redone = prevState[1];
        let done = cell.firstChild.innerHTML;



        if (redone === "") {
            cell.firstChild.classList.add("dismiss");

            cell.firstChild.addEventListener("animationend", endDismiss);
        } else {
            insert(cell, redone);
        }

        if (undoStack.length === 0) {
            undoButton.classList.add("usable");
        }
        undoStack.push([cell, done]);
    }

    undoButton.addEventListener("pointerdown", undo);

    redoButton.addEventListener("pointerdown", redo);

    pencilButton.addEventListener("pointerdown", candidateToggle);

    

    let pencilButtonClicked = false;
    function candidateToggle(e) {
        pencilButtonClicked = true;

        setTimeout( () => pencilButtonClicked = false, 10);
        candidateMode = !candidateMode;
        if (candidateMode) {
            e.target.classList.add("active");
        } else {
            e.target.classList.remove("active");
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

       setTimeout(() => {
        level.querySelector("#propositions").style.animationDuration = "0.14s";
    }, 250);

    
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

