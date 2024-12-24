let ROWS = 3;
let COLS = 3;
let MAXLENGTH = 1;
let DOMAIN = [1, 2, 3]
let SOLUTION = [[3, null, 2], [1, 3, null], [null, 3, 1]];

let tabdCells = [[null, null, null], [null, null, null], [null, null, null]];

function initLevel() {
    
    const CROSSHAIRS_TOGGLE = document.getElementById("crosshairs_toggle");
    const HIGHLIGHT_TOGGLE = document.getElementById("highlight_toggle");
    const STICKY_TOGGLE = document.getElementById("sticky_toggle");

    // fetch all inputs and cells
    const cellList = document.querySelectorAll('td:not(.x_axis, .y_axis)');
    const domainList = document.querySelectorAll('#domain button');
    const entryList = document.querySelectorAll('.entry');

    var undoStack = [];
    var redoStack = [];

    const undoButton = document.getElementById("undo");
    const redoButton = document.getElementById("redo");
    const pencilButton = document.getElementById("pencil");

    var values = new Map();

    var use_highlight = HIGHLIGHT_TOGGLE.checked;
    var use_crosshairs = CROSSHAIRS_TOGGLE.checked;
    var use_sticky = STICKY_TOGGLE.checked;


    HIGHLIGHT_TOGGLE.addEventListener("change", (e) => {
        use_highlight = HIGHLIGHT_TOGGLE.checked;
    });

    CROSSHAIRS_TOGGLE.addEventListener("change", (e) => {
        use_crosshairs = CROSSHAIRS_TOGGLE.checked;
    });

    STICKY_TOGGLE.addEventListener("change", (e) => {
        use_sticky = STICKY_TOGGLE.checked;
    });


    
    // Show propositions when they're rendered (should be near-instant)
    document.fonts.ready.then(() => {
        document.querySelectorAll("#propositions li").forEach((li) => {
            li.style.visibility = "visible";
        });
        verticalScroll(document.querySelector('#propositions'), 7);
        horizontalScroll(document.querySelector('#domain'));
    });

    // id cells with their coordinates
    for (let i=0, j=0; i < cellList.length; i++) {
        let row = 1+Math.floor(j/ROWS);
        let col = 1+j%COLS;
        cellList[i].id = `c${row}.${col}`;
        tabdCells[row-1][col-1] = cellList[i];
        j++;
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
    }

    function insert(cell, value) {
        let text = cell.querySelector("p");
        
        flushDismiss = new AnimationEvent("animationend");
        text.dispatchEvent(flushDismiss);
        
        text.innerHTML = value;
        
        text.classList.add("insert");
        text.addEventListener("animationend", endInsert);
    }

    function inp (event) {
        let text = event.target.querySelector("p");

        if (DOMAIN.includes(parseInt(event.key)) || event.key === "Backspace") { 
            if (undoStack.length == 0) {
                undoButton.classList.add("usable");
            }
            undoStack.push([event.target, text.innerHTML]);
            redoStack = [];
            redoButton.classList.remove("usable");
        }
        
        if (DOMAIN.includes(parseInt(event.key))) {
            insert(event.target, event.key);
            
        } else if (event.key === "Backspace") {
            text.classList.add("dismiss");

            text.addEventListener("animationend", endDismiss);
        }
        values.set(event.target, text.innerHTML);
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
            setTimeout(success, 125); 
        }
    }

    

    function animateGridSuccess (i) {
        if (i > ROWS) return;

        var transitionStage = "";
        var delay = 0;
        
        if (i == 1) {
            transitionStage = "background-size 0.4s ease-in";
        }
        else if (i < ROWS) {
            transitionStage = "background-size .24s linear";
            delay = 399;
        }
        else if (i == ROWS) {
            transitionStage = "background-size .4s ease-out";
            delay = 239;
        }

        setTimeout(function (stage) {
            tabdCells[ROWS-i].forEach((td) => {
                td.style.transition = this;
                td.classList.add("correct");
                td.classList.remove("noticed");
            });
            animateGridSuccess(i+1);
        }.bind(transitionStage), delay);
    }

    function success() {
        crosshairs("not-a-cell");
        highlight("not-a-cell");
        
        animateGridSuccess(1);

        document.getElementById("domain").classList.add("correct");
        
        domainList.forEach((button) => {
            button.onfocus = "";
            button.onblur = "";
        });
        
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
            entry.removeEventListener("mouseover", noticeCell);
            entry.removeEventListener("mouseleave", removeNoticeCell);
            entry.removeEventListener("pointerdown", jumpToCell);
            entry.classList.add("correct");
        })
        
        // Only blur what might be a domain button after handler is removed
        document.activeElement.blur();

    }

    function endActivated(e) {
        let domain = e.target;
        if (e.target.nodeName === "P")
            domain = e.target.parentNode;
        domain.classList.remove("activated");
        domain.removeEventListener("animationend", endPull);
    }

    function lockCell () {
        crosshairs(this.id);
        highlight(this.id);

        setTimeout(function () {
            domainList.forEach( (domain) => {
                domain.onfocus = function () {
                    domain.querySelector(".ripple").remove();

                    let text = this.querySelector("p");


                    domain.classList.add("activated");
                    domain.addEventListener("animationend", endActivated);
                    
                    if (undoStack.length === 0) {
                        undoButton.classList.add("usable");
                    }
                    undoStack.push([this, this.firstChild.innerHTML]);
                    redoStack = [];
                    redoButton.classList.remove("usable");
                    
                    insert(this, domain.textContent);

                    values.set(this, domain.textContent);

                    checkGrid();
                }.bind(this);

                domain.onblur = function () {};
            });
        }.bind(this), 5);
        
    }

    function fillCell () {
        crosshairs("not-a-cell");
        highlight("not-a-cell");

        setTimeout(function () {
            if (use_sticky && !(document.getElementById("grid").contains(document.activeElement))
                && document.activeElement.parentNode.id != "toolbar" && document.activeElement != document.body) {
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
                entry.classList.add("highlight");
            } else {
                entry.classList.remove("highlight");
            }
        }
                         );
    }

    function noticeCell (event) {
        let cell = "c" + this.id.charAt(1) + "." + this.id.charAt(3);
        document.getElementById(cell).classList.add("noticed");
    }

    function removeNoticeCell (event) {
        let cell = "c" + this.id.charAt(1) + "." + this.id.charAt(3);
        document.getElementById(cell).classList.remove("noticed");
    }

    function jumpToCell (event) {
        event.preventDefault();
        let cell = "c" + this.id.charAt(1) + "." + this.id.charAt(3);
        window.setTimeout(() => {
            fakeRipple = new PointerEvent("pointerdown");
            fakeRipple.simulated = true;
            document.getElementById(cell).dispatchEvent(fakeRipple);
            document.getElementById(cell).focus();
        }, 0);
    }


    entryList.forEach( (entry) => {
        entry.addEventListener("mouseover", noticeCell);
        entry.addEventListener("mouseleave", removeNoticeCell);
        entry.addEventListener("pointerdown", jumpToCell);         
    });


    function chamberInput (e) {
        let button = e.target;
        setTimeout(function () {
            cellList.forEach((cell) => {
                cell.onfocus = function () {
                    cell.querySelector(".ripple").remove();
                    let text = cell.querySelector("p")

                    if (undoStack.length == 0) {
                        undoButton.classList.add("usable");
                    }
                    undoStack.push([cell, text.innerHTML]);
                    redoStack = [];
                    redoButton.classList.remove("usable");

                    insert(cell, button.textContent);

                    values.set(cell,button.textContent);

                    checkGrid();
                };

                cell.onblur = function () {};
            }
                            );
        }, 5);
    }

    function releaseInput (e) {
        setTimeout(function () {
            if (use_sticky && document.activeElement.parentNode.id != "domain" && document.activeElement.parentNode.id != "toolbar"
                && document.activeElement != document.body) {
                e.target.focus();
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

        button.addEventListener("pointerdown", function (e) {
            e.target.closest("button").classList.add("pushed");
        });

        button.addEventListener("pointerup", function (e) {
            e.target.closest("button").classList.remove("pushed");
        })
    });


    function verticalScroll(el, moe) {
        const isScrollable = (el.scrollHeight - moe > el.clientHeight);
        
        // GUARD: If element is not scrollable, remove all classes
        if (!isScrollable) {
            el.classList.remove('is-bottom-overflowing', 'is-top-overflowing');
            return;
        }
        
        // Otherwise, the element is overflowing!
        // Now we just need to find out which direction it is overflowing to (can be both).
        // One pixel is added to the height to account for non-integer heights.
        const isScrolledToBottom = el.scrollHeight < el.clientHeight + el.scrollTop + 1;
        const isScrolledToTop = isScrolledToBottom ? false : el.scrollTop === 0;
        el.classList.toggle('is-bottom-overflowing', !isScrolledToBottom);
        el.classList.toggle('is-top-overflowing', !isScrolledToTop);
    }



    function horizontalScroll(el) {
        const isScrollable = (el.scrollWidth > el.clientWidth);

        // GUARD: If element is not scrollable, remove all classes
        if (!isScrollable) {
            el.classList.remove('is-left-overflowing', 'is-right-overflowing');
            return;
        }
        
        // Otherwise, the element is overflowing!
        // Now we just need to find out which direction it is overflowing to (can be both).
        // One pixel is added to the height to account for non-integer heights.
        const isScrolledToRight = el.scrollWidth < el.clientWidth + el.scrollRight + 1;
        const isScrolledToLeft = isScrolledToRight ? false : el.scrollLeft === 0;
        el.classList.toggle('is-right-overflowing', !isScrolledToRight);
        el.classList.toggle('is-left-overflowing', !isScrolledToLeft);
    }

    document.querySelector('#propositions').addEventListener('scroll', (e) => {
        const el = e.currentTarget;
        verticalScroll(el, 7);
    });

    document.querySelector('#domain').addEventListener('scroll', (e) => {
        const el = e.currentTarget;
        horizontalScroll(el);
    });

    window.onresize = function(event) {
        verticalScroll(document.querySelector('#propositions'), 7);
    }


    horizontalScroll(document.querySelector('#domain'));


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
        document.querySelectorAll(".ripple").forEach((r) => {
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

    document.querySelectorAll('td:not(.x_axis, .y_axis)').forEach(element => {
        element.addEventListener("pointerdown",  (event) => {
            let x = spawnRipple(event, element);
            if (document.body.contains(x)) {
                element.focus();
            }
        });
    });

    document.querySelectorAll('#domain button').forEach(element => {
        element.addEventListener("pointerdown", (event) => {
            if (event.target.closest("#domain").classList.contains("correct")) {
                spawnRipple(event, event.target.closest("button"));
            } else {
                spawnRipple(event, event.target.closest("p"));
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




    document.getElementById("level").onclick = function () {
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
