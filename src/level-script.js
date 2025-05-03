/*jshint esversion: 10 */

let ROWS;
let COLS;
let DOMAIN;
let SOLUTION;
let NEXT_LEVEL = null;
let tabbed = false;
let MENU_TOGGLE = null;

function initLevel() {
    // Always query level instead of document because there can be two levels at once during page transition
    const level = Array.from(document.body.querySelectorAll('.page.level')).pop(); 
    
    const thisLevel = level.querySelector('#level').innerText;
    const thisDifficulty = level.querySelector('#difficulty').innerText;
    const cacheHighestLevel = localStorage.getItem('highest' + thisDifficulty) || '0';

    level.style.setProperty('--rows', ROWS);
    level.style.setProperty('--cols', COLS);
    // Uses ROWS/COLS to adjust CSS of grid
    alignGrid(); 

    
    const MENU_TOGGLE = level.querySelector('#menu_checkbox');

    const info = level.querySelector('#level_info'); // i.e., the text container
    const notes = level.querySelector('#wrapnotes textarea'); // the textarea
    const dict = level.querySelector('#dict_box'); // the scrollable wrapper
    
    const propositions = level.querySelector('#propositions');
    const entryList = [...level.querySelectorAll('.entry')].map((x) => x.firstChild);

    const domain = level.querySelector('#domain');
    const domainList = domain.querySelectorAll('button');
    const gridCarousel = level.querySelector('#grid_carousel');

    const undoButton = level.querySelector('#undo');
    const redoButton = level.querySelector('#redo');
    const pencilButton = level.querySelector('#pencil');
    const addGridButton = level.querySelector('#nextgrid');
    const deleteGridButton = level.querySelector('#delgrid');

    const gridBar = level.querySelector('#gridbar');
    const overlay = level.querySelector('#visible-items');

    // Convenience functions to retrieve attributes of the current grid
    const cellList = () => gridStorage.get(currentGrid).get('cells');
    const values = () => gridStorage.get(currentGrid).get('values');
    const undoStack = () => gridStorage.get(currentGrid).get('undo');
    const redoStack = () => gridStorage.get(currentGrid).get('redo');

    // For restricting keyboard input
    const MAXLENGTH = Math.max(...DOMAIN.map((num) => num.toString().length)); 

    // Flags
    let cellActive = false;
    let domainActive = false;
    let candidateMode = false;

    let gridStorage; // Keeps track of concurrent grids, potentially saved to cache	

    // Tracks the visibility of grid labels
    const overlayMapping = new Map();
    const animatedMap = new Map();
    
    // Tracks the current grid
    let currentGrid = 1;

    // Handler for observedMaps (i.e., the cached gridStorage)
    const updateGridStorage = (method, args, obj) => {
	localStorage.setItem(
	    `gridStorage${thisDifficulty}`,
	    JSON.stringify(serialize(gridStorage)) // store the entire gridStorage object as JSON w/ elements serialized
	);
    };

    const fetchCacheGridStorage = localStorage.getItem(`gridStorage${thisDifficulty}`);
    const cacheGridStorage = 
	  fetchCacheGridStorage 
	  ? new observedMap(new Map(mapify(JSON.parse(fetchCacheGridStorage))), updateGridStorage)
	  : null;

    if (thisLevel === latestGrid(thisDifficulty, cacheHighestLevel)) {
	if (cacheGridStorage) {
	    try {
		cacheGridStorage.forEach((v) => {
		    v.get('cells');
		    v.get('values');
		    v.get('undo');
		    v.get('redo');
		});
		gridStorage = cacheGridStorage;
		reviveGrids();
		notes.value =
		    localStorage.getItem(`notes${thisDifficulty}`) ||
		    '';
	    } catch {
		gridStorage = observedMap(new Map(), updateGridStorage);
		cleanStart();
	    }
	} else {
	    gridStorage = observedMap(new Map(), updateGridStorage);
	    cleanStart();
	    if (info.children.length && thisLevel !== "1.1") {
		level.querySelector('#info').classList.add('readme');
	    }
	}
    } else {
	gridStorage = new Map();
	successStart();
    }

    level.querySelector('#g1').classList.add('current');

    function cleanStart() {
	const firstGrid = new Map();
	gridStorage.set(1, firstGrid);
	firstGrid.set('undo', []);
	firstGrid.set('redo', []);

	initCells(1);
	firstGrid.set(
	    'values',
	    new Map([...cellList()].map((k) => [k.id, null]))
	);
    }

    function successStart() {
	const firstGrid = new Map();
	gridStorage.set(1, firstGrid);
	firstGrid.set('undo', []);
	firstGrid.set('redo', []);
	firstGrid.set('values', new Map());
	initCells(1);

	cellList().forEach((c) => {
	    const row = parseInt(c.id.charAt(1), 10);
	    const col = parseInt(c.id.charAt(3), 10);
	    const val = SOLUTION[row - 1][col - 1];

	    firstGrid.get('values').set(c.id, val);
	    if (val !== null) {
		c.firstChild.innerText = val;
	    }
	    c.style.animationDelay = '0s';
	    c.tabIndex = -1;
	    c.onfocus = null;
	    c.onblur = null;
	});

	level.querySelector('#g1').classList.add('forceSolved');
	if (parseFloat(cacheHighestLevel).toFixed(3) < 1.6) {
	    domain.classList.add('correct');
	    domainList[0].firstChild.style.animationDuration =
		'0s';
	    domainList[0].querySelector('p').innerText = 'Onwards...';
	    domainList[0].onclick = () => {
		setTimeout(() => {
		    Router(NEXT_LEVEL);
		}, 100);
	    };
	}
    }

    function reviveGrids() {
	const clone = new observedMap(new Map(), updateGridStorage);
	gridStorage.forEach((v, k) => clone.set(parseInt(k, 10), v));
	gridStorage = clone;

	initCells(1);
	updateWrapdo();

	gridCarousel.classList.add('preventAnimation');
	setTimeout(() =>
	    gridCarousel.classList.remove('preventAnimation'),
	    500
	);

	cellList().forEach((c) => {
	    const val = gridStorage
		  .get(1)
		  .get('values')
		  .get(c.id);
	    if (!val) return;

	    if (val && !parseInt(val, 10)) {
		const ul = document.createElement('ul');
		val
		    .map((x) =>
			parser
			    .parseFromString(x, 'text/xml')
			    .querySelector('li')
		    )
		    .forEach((li) => ul.appendChild(li));
		c.appendChild(ul);
	    } else {
		c.firstChild.innerText = val.trim();
	    }
	});


	for (let i = 2; i <= gridStorage.size; i++) {
	    const newGrid = document.createElement('div');
	    newGrid.classList.add('grid');
	    newGrid.id = `g${i}`;

	    gridStorage
		.get(1)
		.get('cells')
		.forEach((cell) => {
		    const newSpan = document.createElement('span');
		    const newP = document.createElement('p');
		    newSpan.appendChild(newP);
		    newGrid.appendChild(newSpan);
		});
	    gridCarousel.appendChild(newGrid);
	    initCells(i);

	    updateGridBar(i, true);
	    level.querySelector('#n1').classList.add('chosen');
	    animatedMap.set(`n${i}`, true);

	    let j = 0;
	    gridStorage.get(i).get("cells").forEach(cell => {
		if (gridStorage.get(1).get("cells")[j].classList.contains("given")) {
		    cell.querySelector("p").innerText = gridStorage.get(1).get("cells")[j].querySelector("p").innerText;
		    cell.classList.add("given");
		} else {
		    let val = gridStorage.get(i).get("values").get(cell.id);
		    if (val && !parseInt(val)) {
			let ul = document.createElement("ul");
			val.map(x => parser.parseFromString(x, "text/xml").querySelector("li")).forEach(li => ul.appendChild(li));
			cell.appendChild(ul);
		    } else {
			cell.querySelector("p").innerText = gridStorage.get(i).get("values").get(cell.id) || "";
		    }
		}
		j++;
	    });
	}
    }

    function initCells(gridNum) {
	let newGrid = gridStorage.get(gridNum);
	newGrid.set("cells", level.querySelectorAll(`#g${gridNum} span`));

	let cells = newGrid.get("cells");
	for (let i = 0; i < ROWS; i++) {
	    for (let j = 0; j < COLS; j++) {
		const index = i * COLS + j;
		cells[index].id = `c${i + 1}-${j + 1}`;
	    }
	}

	let spanCount = 1;
	cells.forEach((cell) => {
	    cell.style.animationDelay = `${spanCount++ * 175}ms`;
	    cell.addEventListener("mouseover", noticeEntry);
	    cell.addEventListener("mouseover", () => axisCue("#y" + cell.id.charAt(1), "#x" + cell.id.charAt(3)));
	    cell.addEventListener("mouseleave", removeNoticeEntry);
	    cell.addEventListener("mouseover", () => deAxisCue("#y" + cell.id.charAt(1), "#x" + cell.id.charAt(3)));

	    if (cell.classList.contains("given")) return;

	    cell.tabIndex = 0;
	    cell.addEventListener("keydown", inp);

	    cell.onfocus = lockCell;
	    cell.onblur = fillCell;

	    cell.addEventListener("pointerdown", (event) => {
		if (!domainActive) {
		    spawnRipple(event, cell);
		    cell.focus({
			preventScroll: true
		    });
		}
	    });
	});
    }

    entryList.forEach((entry) => {
	entry.addEventListener("mouseover", noticeCell);
	entry.addEventListener("mouseleave", () => deAxisCue("#y" + entry.id.charAt(1), "#x" + entry.id.charAt(3)));
	entry.addEventListener("mouseover", () => {
	    if (DYNAMIC_TOGGLE.checked) axisCue("#y" + entry.id.charAt(1), "#x" + entry.id.charAt(3));
	});
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
		setTimeout(() => {
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

    let throttleGrid = false;

    function createNewGrid(dupe = false) {
	if (scrolling || throttleGrid) return;

	throttleGrid = true;
	let gridNum = currentGrid;

	setTimeout(() => {
	    throttleGrid = false;
	}, 700);

	let newGrid = document.createElement("div");
	let gridData = new Map();

	gridStorage.set(gridNum + 1, gridData);

	gridData.set("values", dupe ? gridStorage.get(gridNum).get("values") : new Map([...cellList()].map(k => [k.id, null])));
	gridData.set("undo", dupe ? gridStorage.get(gridNum).get("undo") : []);
	gridData.set("redo", dupe ? gridStorage.get(gridNum).get("redo") : []);

	newGrid.classList.add("grid");

	gridStorage.get(gridNum).get("cells").forEach(cell => {
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

	if (level.querySelector("#" + newGrid.id)) {
	    for (let i = gridCarousel.children.length; i >= gridNum; i--) {
		level.querySelector("#g" + i).id = "g" + (i + 1);
		gridStorage.set(i + 1, gridStorage.get(i));
	    }
	}

	gridCarousel.insertBefore(newGrid, level.querySelector("#g" + (gridNum + 1)));

	initCells(gridNum);
	updateGridBar(gridNum);

	setTimeout(() => jumpToGrid(null, gridNum), 0);
	setTimeout(() => noGridUpdate = false, 1000);
    }

    function updateGridBar(num, noscroll = false) {
	if (gridBar.children.length === 0) {
	    let first = document.createElement("span");
	    first.classList.add("node");
	    first.id = "n1";
	    first.innerText = "I";
	    gridBar.appendChild(first);
	}

	let node = document.createElement("span");
	node.classList.add("node");
	node.id = "n" + num;
	node.innerText = roman(num);

	if (gridBar.children.length >= num) {
	    for (let i = gridBar.children.length; i >= num; i--) {
		gridBar.querySelector("#n" + i).id = "n" + (i + 1);
		gridBar.querySelector("#n" + (i + 1)).innerText = roman(i + 1);

		let render = overlayMapping.get("n" + i);
		if (!render) continue;

		overlayMapping.set("n" + (i + 1), render);
		animatedMap.set("n" + (i + 1), true);
		animatedMap.set("n" + i, false);
		overlayMapping.delete("n" + i);

		render.id = "rn" + (1 + parseInt(render.id.substring(2)));
		render.innerText = roman(i + 1);
	    }
	}

	gridBar.insertBefore(node, gridBar.querySelector("#n" + ++num));

	let scroller = setInterval(() => {
	    updateVisibleItems();
	    if (overlayMapping.get("n" + num)) clearTimeout(scroller);

	    gridBar.scrollBy({
		top: 0,
		left: noscroll ? 0 : 5
	    });
	}, 10);

	setTimeout(() => {
	    clearTimeout(scroller);
	}, 350);
    }

    function jumpToGrid(e, store = null) {
	let num = store || parseInt(e.target.id.substring(2));
	let diff = num - currentGrid;

	gridCarousel.scrollBy({
	    top: 0,
	    left: diff * (30 + level.querySelector("#g1").clientWidth),
	    behavior: "smooth"
	});
    }

    let scrolling = false;
    gridCarousel.onscroll = (e) => {
	if (!scrolling) {
	    [...gridCarousel.children].forEach(g => {
		[...g.children].forEach(span => {
		    span.tabIndex = -1;
		    span.blur();
		});
	    });
	}

	scrolling = true;
	currentGrid = parseInt(getCenteredElement(gridCarousel).id.substring(1));

	level.querySelectorAll(".grid").forEach(g => {
	    if (parseInt(g.id.substring(1)) === currentGrid) {
		g.classList.add("current");
	    } else {
		g.classList.remove('current');
	    }
	});

	alignGridBar();

	if (currentGrid === 1) {
	    deleteGridButton.classList.remove("usable");
	} else {
	    deleteGridButton.classList.add("usable");
	}

	updateWrapdo();
    };

    function updateWrapdo() {
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
    }

    deleteGridButton.onclick = () => deleteGrid(currentGrid);

    function deleteGrid(num) {
	if (scrolling || throttleGrid || level.querySelector(".insert, .dismiss")) return;

	throttleGrid = true;
	let grid = level.querySelector("#g" + num);

	grid.classList.add("deleting");

	jumpToGrid(null, (num === gridBar.children.length) ? num - 1 : num + 1);

	setTimeout(() => {
	    grid.remove();
	    gridCarousel.dispatchEvent(new Event("scroll"));

	    gridStorage.forEach((v, k) => {
		if (k <= num) return;
		gridStorage.set(k - 1, v);
	    });

	    gridStorage.delete(gridStorage.size);
	    throttleGrid = false;

	    setTimeout(() => {
		gridCarousel.dispatchEvent(new Event("scrollend"));
	    }, 150);
	}, 400);

	level.querySelector("#n" + num).remove();
	overlayMapping.get("n" + num).remove();
	animatedMap.delete("n" + num);
	overlayMapping.delete("n" + num);

	if (gridBar.children.length === 1) {
	    level.querySelector("#n1").remove();
	    overlayMapping.get("n1").remove();
	    animatedMap.delete("n1");
	    overlayMapping.delete("n1");
	}

	for (let i = num + 1; i <= gridBar.children.length + 1; i++) {
	    level.querySelector("#g" + i).id = "g" + (parseInt(level.querySelector("#g" + i).id.substring(1)) - 1);
	    gridBar.querySelector("#n" + i).id = "n" + (i - 1);
	    gridBar.querySelector("#n" + (i - 1)).innerText = roman(i - 1);
	    animatedMap.set("n" + (i - 1), true);

	    let render = overlayMapping.get("n" + i);
	    if (!render) continue;

	    overlayMapping.set("n" + (i - 1), render);
	    animatedMap.delete("n" + i);
	    overlayMapping.delete("n" + i);

	    render.id = "rn" + (parseInt(render.id.substring(2)) - 1);
	    render.innerText = roman(i - 1);
	}
    }

    function alignGridBar() {
	let newNode = level.querySelector("#n" + currentGrid);
	if (!newNode) return;

	newNode.classList.add("chosen");

	level.querySelectorAll(`#gridbar span:not(#n${currentGrid})`).forEach(s => {
	    s.classList.remove("chosen");
	});

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
	    if (!span.classList.contains("given")) {
		span.tabIndex = 0;
	    }
	});

	currentGrid = parseInt(curGrid.id.substring(1));
	alignGridBar();
	gridCarousel.focus();

	if (!("onscrollsnapchange" in window)) {
	    setTimeout(() => {
		scrolling = false;
	    }, 450);
	}
    };


    // Focus traps
    level.querySelector("#tab_catch").addEventListener("focus", (e) => {
	if (scrolling) return;
	setTimeout(() => {
	    try {
		[...cellList()].find(x => x.tabIndex === 0).focus({
		    preventScroll: true
		});
	    } catch {
		return;
	    }
	}, 10);
    });

    level.querySelector("#backtab_catch").addEventListener("focus", (e) => {
	if (scrolling) return;
	try {
	    if (!e.relatedTarget) {
		setTimeout(() => {
		    [...cellList()].find(x => x.tabIndex === 0).focus({
			preventScroll: true
		    });
		}, 10);
	    } else {
		setTimeout(() => {
		    [...cellList()].reverse().find(x => x.tabIndex === 0).focus({
			preventScroll: true
		    });
		}, 10);
	    }
	} catch {
	    return;
	}
    });

    // Menu preferences
    if (localStorage.getItem("menuPreference")) {
	MENU_TOGGLE.checked = localStorage.getItem("menuPreference") === "true";
    } else if (thisDifficulty === "Training" && thisLevel === "1.1") {
	MENU_TOGGLE.checked = true;
	if (cacheHighestLevel === "0") {
	    setTimeout(() => {
		level.querySelector("#info").click();
	    }, 425);
	}
	level.style.setProperty('--noInfo', "0px");
    }

    if (!info.children.length) {
	level.querySelector("#info").remove();
	level.style.setProperty('--noInfo', "-54px");
    } else {
	level.style.setProperty('--noInfo', "0px");
    }

    // Notes dialog
    level.querySelector("#notes_dialog").addEventListener("open", (e) => {
	if (hacking) return;
	setTimeout(() => {
	    e.target.querySelector("textarea").focus();
	}, 10);
    });

    level.querySelector("#notes_dialog textarea").oninput = (e) => {
	localStorage.setItem(`notes${thisDifficulty}`, e.target.value);
    };

    // Animation end handlers
    function endInsert(e) {
	e.target.classList.remove("insert");
	e.target.removeEventListener("animationend", endInsert);
    }

    function endDismiss(e) {
	if (e.target.nodeName === "LI") {
	    e.target.remove();
	    return;
	}
	const text = e.target;
	text.classList.remove("dismiss");
	text.innerText = text.innerText.slice(0, -1);
	text.removeEventListener("animationend", endDismiss);

	if (!text.parentNode.querySelector("ul")) {
	    values().set(e.target.parentNode.id, text.innerText);
	}
    }

    function endDismissWipe(e) {
	if (e.target.nodeName === "LI") {
	    e.target.parentNode.remove();
	    return;
	}
	const text = e.target;
	text.classList.remove("dismiss");
	text.innerText = "";
	text.removeEventListener("animationend", endDismissWipe);

	if (!text.parentNode.querySelector("ul li")) {
	    values().set(e.target.parentNode.id, "");
	}
    }

    // Insert value
    function insert(cell, value) {
	const text = cell.querySelector("p");
	let opts = cell.querySelector("ul");

	if (candidateMode) {
	    if (!DOMAIN.some(x => x.toString().trim() === value.trim())) return;

	    if (text.innerText.trim()) {
		text.classList.add("dismiss");
		text.addEventListener("animationend", endDismissWipe);
	    }

	    const newLi = document.createElement("li");
	    newLi.innerText = value.trim();

	    if (!opts) {
		opts = document.createElement("ul");
		opts.appendChild(newLi);
		cell.appendChild(opts);
	    } else {
		const match = Array.from(opts.children).find(x => x.innerText.trim() === value.trim());
		if (match) {
		    match.classList.add("dismiss");
		    match.addEventListener("transitionend", endDismiss);
		    if (!CANCELOUT_TOGGLE.checked) {
			opts.appendChild(newLi);
		    }
		} else {
		    opts.appendChild(newLi);
		}
	    }
	    values().set(cell.id, [...cell.querySelectorAll('li')]);
	    return;
	}


	if (opts) opts.remove();

	if (CANCELOUT_TOGGLE.checked && text.innerText.trim() === value.trim()) {
	    flushInsert = new AnimationEvent("animationend");
	    text.dispatchEvent(flushInsert);

	    setTimeout(() => {
		text.classList.add("dismiss");
		text.addEventListener("animationend", endDismissWipe);
	    }, 1);
	    return;
	}

	flushDismiss = new AnimationEvent("animationend");
	text.dispatchEvent(flushDismiss);

	setTimeout(() => {
	    text.innerText = value.trim();
	    text.classList.add("insert");
	    text.addEventListener("animationend", endInsert);
	}, 1);

	values().set(cell.id, value);
	checkGrid();
    }

    // Handle input (key typing)
    function inp(event) {
	const node = event.target.querySelector("p");
	const text = node.innerText.trim();
	const opts = event.target.querySelector("ul");
	const optsCopy = opts ? opts.cloneNode(true) : null;

	if (event.key === "Backspace") {
	    if (opts) {
		if (undoStack().length === 0) {
		    undoButton.classList.add("usable");
		}
		opts.children[opts.children.length - 1].classList.add("dismiss");
		opts.children[opts.children.length - 1].addEventListener("transitionend", endDismiss);

		if (undoStack().length === 0) {
		    undoButton.classList.add("usable");
		}
		undoStack().push([event.target.id, optsCopy]);
		redoStack().length = 0;
		redoButton.classList.remove("usable");
		return;
	    } else if (!text) {
		return;
	    }
	    if (undoStack().length === 0) {
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
	    }, 1);
	    return;
	}

	if (text.length < MAXLENGTH) {
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

    // Press virtual button
    function pressButton(text) {
	if (debounced === 0) {
	    let button = null;
	    domainList.forEach(b => {
		if (b.textContent.trim() === text) {
		    button = b;
		}
	    });
	    if (button !== null) {
		button.classList.add("pushed");
		debounced++;
	    }
	}
    }

    // Update visible grid items
    function updateVisibleItems() {
	if (!gridBar.children.length) return;

	const gridRect = gridBar.getBoundingClientRect();
	const visibleItems = [...gridBar.children].filter(item => {
	    const itemRect = item.getBoundingClientRect();
	    return itemRect.right > gridRect.left && itemRect.left < gridRect.right;
	});

	overlayMapping.forEach((span, item) => {
	    if (!visibleItems.includes(level.querySelector("#" + item))) {
		span.remove();
		overlayMapping.delete(item);
	    }
	});

	visibleItems.forEach(item => {
	    if (!overlayMapping.has(item.id)) {
		const span = document.createElement("span");
		span.id = "r" + item.id;
		span.onclick = jumpToGrid;
		span.textContent = item.textContent;

		if (!animatedMap.get(item.id)) {
		    if (item.id === "n1") {
			animatedMap.set(item.id, true);
			span.classList.add("first");
			span.addEventListener("transitionend", () => {
			    setTimeout(() => span.classList.remove("first"), 100);
			});
		    } else {
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
	    span.classList.toggle("chosen", item.classList.contains("chosen"));
	    if (overlay.children[index] !== span) {
		overlay.insertBefore(span, overlay.children[index] || null);
	    }
	});
    }

    gridBar.addEventListener("scroll", updateVisibleItems);
    updateVisibleItems();


    // Check if the grid is correct
    function checkGrid() {
	let flag = true;

	values().forEach((value, key) => {
            console.log(value, key, SOLUTION)
	    let row = parseInt(key.charAt(1));
	    let col = parseInt(key.charAt(3));
	    if (value != SOLUTION[row - 1][col - 1]) {
		flag = false;
	    }
	});

	if (flag) {
	    throttleGrid = true;
	    setTimeout(success, 200);
	}
    }

    // Success function to handle grid completion
    function success() {
	highlight("not-a-cell");

	// Check and update highest level
	if (parseFloat(cacheHighestLevel) < parseFloat(thisLevel)) {
	    localStorage.setItem("highest" + thisDifficulty, thisLevel);
	    localStorage.removeItem("gridStorage" + thisDifficulty);
	    localStorage.removeItem("notes" + thisDifficulty);
	    try {
		gridStorage.unobserve();
	    } catch {}
	}

	// Mark the level as correct
	level.querySelector("#g" + currentGrid).classList.add("correct");
	addGridButton.classList.add("fade");
	deleteGridButton.classList.add("fade");

	// Handle animation end for level completion
	cellList()[0].addEventListener("animationend", () => {
	    domain.classList.add("correct");
	    cellActive = false;

	    if (NEXT_LEVEL !== null) {
		domainList[0].querySelector("p").innerText = "Onwards...";
		domainList[0].onclick = () => {
		    setTimeout(() => {
			Router(NEXT_LEVEL);
		    }, 100);
		};
	    } else {
		domainList[0].querySelector("p").innerText = "Return to level select...";
		domainList[0].onclick = () => {
		    setTimeout(() => {
			Router("index.html");
		    }, 100);
		};
	    }

	    // Reset UI elements
	    setTimeout(() => {
		addGridButton.classList.remove("fade");
		deleteGridButton.classList.remove("fade");
		throttleGrid = false;
	    }, 3000);
	});

	// Blur active element and reset focus
	document.activeElement.blur();
	domainList.forEach((button) => {
	    button.onfocus = "";
	    button.onblur = "";
	    button.blur();
	});

	setTimeout(() => {
	    domainList[0].tabIndex = 0;
	}, 150);

	// Add activation effect
	domainList[0].addEventListener("pointerdown", () => {
	    domainList[0].classList.add("activated");
	});

	// Reset cell interactions
	cellList().forEach((cell) => {
	    cell.tabIndex = -1;
	    cell.onfocus = function() {
		this.blur();
	    };
	    cell.onblur = "";
	    cell.removeEventListener("keydown", inp);
	});

	// Disable undo/redo actions
	undoButton.removeEventListener("pointerdown", undo);
	redoButton.removeEventListener("pointerdown", redo);
	undoButton.classList.remove("usable");
	redoButton.classList.remove("usable");
	pencilButton.classList.remove("usable");

	// Disable pointer events on entries
	entryList.forEach((entry) => {
	    entry.parentNode.style.pointerEvents = "none";
	});
    }
    let debounced = 0;

    // Lock the current cell

    function lockCell () {
        this.classList.remove("retain");
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


    // Fill cell with values
    function fillCell(e) {
	if (document.activeElement === this || openingModal) {
	    this.classList.add("retain");
	    return;
	}

	highlight("not-a-cell");

	setTimeout(function() {
	    cellActive = false;

	    if ((STICKY_TOGGLE.checked
                 && !(document.activeElement.matches(".grid span"))
                 && document.activeElement !== document.body
                 && !tabbed)
                || toolClicked
	       ) {
		this.focus({
		    preventScroll: true,
		});
	    } else {
		let r = this.querySelector(".ripple");

		if (r) {
		    try {
			r.remove();
		    } catch {}

		    let temp = this.style.transition;
		    this.style.transition = "none";
		    setTimeout(() => (this.style.transition = temp), 10);
		}

		domainList.forEach((domain) => {
		    domain.blur();

		    domain.onfocus = chamberInput;
		    domain.onblur = releaseInput;
		});
	    }
	}.bind(this), 5);
    }

    // --- Toggles for Settings --- 
    DYNAMIC_TOGGLE.onchange = () => {
	if (!DYNAMIC_TOGGLE.checked) {
	    entryList.forEach((e) => e.parentNode.classList.remove("highlight"));
	}
    };

    CROSSHAIRS_TOGGLE.onchange = () => {
	if (!CROSSHAIRS_TOGGLE.checked) {
	    level.querySelectorAll("#x-axis span, #y-axis span").forEach((l) => {
		l.classList.remove("cue");
		l.classList.remove("highlight");
	    });
	}
    };

    MENU_TOGGLE.onchange = () => {
	localStorage.setItem("menuPreference", MENU_TOGGLE.checked);
    };

    // --- Highlighting and Entry Notice Functions ---
    function highlight(id) {
	let pair = [];

	entryList.forEach((entry) => {
	    let yNum = level.querySelector("#y" + entry.id.charAt(1));
	    let xNum = level.querySelector("#x" + entry.id.charAt(3));
	    if (entry.id === "e" + id.charAt(1) + "e" + id.charAt(3)) {
		if (DYNAMIC_TOGGLE.checked) entry.parentNode.classList.add("highlight");
		pair = [yNum, xNum];
	    } else {
		entry.parentNode.classList.remove("highlight");
		yNum.classList.remove("highlight");
		xNum.classList.remove("highlight");
	    }
	});

	if (CROSSHAIRS_TOGGLE.checked) pair.forEach((a) => a.classList.add("highlight"));
    }

    // Cue the axis for highlight
    function axisCue(y, x) {
	if (!CROSSHAIRS_TOGGLE.checked) return;
	let yNum = level.querySelector(y);
	let xNum = level.querySelector(x);

	yNum.classList.add("cue");
	xNum.classList.add("cue");
    }

    // De-cue the axis
    function deAxisCue(y, x) {
	let yNum = level.querySelector(y);
	let xNum = level.querySelector(x);

	yNum.classList.remove("cue");
	xNum.classList.remove("cue");
    }

    // Notice and remove entry for the highlighted cells
    function noticeEntry(event) {
	if (!DYNAMIC_TOGGLE.checked) return;
	let entries;
	if (event.id) {
	    entries = level.querySelectorAll("#e" + event.id.charAt(1) + "e" + event.id.charAt(3));
	} else {
	    entries = level.querySelectorAll("#e" + this.id.charAt(1) + "e" + this.id.charAt(3));
	}
	if (entries.length === 0) {
	    return;
	}
	entries.forEach((entry) => {
	    if (entry === null) return;

	    let enclose = entry.parentNode;
	    enclose.classList.add("noticed");
	    if (level.querySelector("#c" + entry.id.charAt(1) + "-" + entry.id.charAt(3)).classList.contains("given")) {
		enclose.classList.add("given");
	    }
	});
    }

    function removeNoticeEntry(event) {
	let entries;
	if (event.id) {
	    entries = level.querySelectorAll("#e" + event.id.charAt(1) + "e" + event.id.charAt(3));
	} else {
	    entries = level.querySelectorAll("#e" + this.id.charAt(1) + "e" + this.id.charAt(3));
	}
	entries.forEach((entry) => {
	    if (entry === null) return;
	    entry.parentNode.classList.remove("noticed");
	});
    }

    // Notice the highlighted cell
    function noticeCell(event) {
	if (!DYNAMIC_TOGGLE.checked) return;
	noticeEntry(this);
	let cell = "c" + this.id.charAt(1) + "-" + this.id.charAt(3);
	let td = level.querySelector("#" + cell);
	td.classList.add("noticed");

	if (td.classList.contains("given")) {
	    this.parentNode.classList.add("given");
	}
    }

    // Remove the highlighted cell notice
    function removeNoticeCell(event) {
	removeNoticeEntry(this);
	let cell = "c" + this.id.charAt(1) + "-" + this.id.charAt(3);
	level.querySelector("#" + cell).classList.remove("noticed");
    }

    // Jump to the specified cell
    function jumpToCell(event) {
	if (scrolling || !DYNAMIC_TOGGLE.classList.contains("top")) return;
	event.preventDefault();
	let cell = "c" + this.id.charAt(1) + "-" + this.id.charAt(3);
	window.setTimeout(() => {
	    fakeRipple = new PointerEvent("pointerdown");
	    fakeRipple.simulated = true;
	    level.querySelector("#g" + currentGrid + " #" + cell).dispatchEvent(fakeRipple);
	    level.querySelector("#g" + currentGrid + " #" + cell).focus({
		preventScroll: true,
	    });
	}, 0);
    }

    // --- Input and Release Functions ---
    function chamberInput(e) {
	let button = e.target;
	button.classList.remove("retain");

	setTimeout(function() {
	    domainActive = true;
	    cellActive = false;

	    cellList().forEach((cell) => {
		cell.onfocus = function() {
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

		cell.onblur = function() {};
	    });
	}, 5);
    }

    function releaseInput(e) {
	if (this.classList.contains("retain")) {
	    this.classList.remove("retain");
	    return;
	}

	if (document.activeElement === this || openingModal) {
	    this.classList.add("retain");
	    return;
	}

	setTimeout(function() {
	    domainActive = false;
	    e.target.onclick = "";

	    if ((STICKY_TOGGLE.checked
                 && document.activeElement.parentNode.id !== "domain"
                 && document.activeElement !== document.body
                 && !tabbed
                 || toolClicked
	        )) {
		e.target.focus({
		    preventScroll: true,
		});
	    } else {
		cellList().forEach((cell) => {
		    cell.blur();
		    cell.onfocus = lockCell;
		    cell.onblur = fillCell;
		});
	    }
	}, 1);
    }

    let deselectReady = false;

    domainList.forEach((button) => {
	button.onfocus = chamberInput;
	button.onblur = releaseInput;

	button.querySelector("p").addEventListener("transitionend", (e) => {
	    if (e.target.classList.contains("ripple")) {
		deselectReady = button;
		button.addEventListener("blur", clearDeselect);
		return;
	    }

	    if (!e.target || !e.target.closest("button").classList.contains("pushed") || e.elapsedTime < 0.08) {
		return;
	    }

	    e.target.closest("button").classList.remove("pushed");

	    setTimeout(() => {
		debounced--;
	    }, 85);
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

    window.onresize = function() {
	updateVisibleItems();
	verticalScroll(propositions.parentNode, 7);
	verticalScroll(dict, 7);
	verticalScroll(info, 7);
    };

    screen.orientation.addEventListener("change", () => {
	updateVisibleItems();
	verticalScroll(propositions.parentNode, 7);
	verticalScroll(dict, 7);
	verticalScroll(info, 7);
    });

    let rippleStack = [];

    function spawnRipple(mouseEvent, element) {
	rippleStack.push(element);
	level.querySelectorAll(".ripple").forEach((r) => {
	    if (element === rippleStack[rippleStack.length - 1]) {
		r.remove();
	    }
	});
	rippleStack = rippleStack.slice(rippleStack.length - 1);

	if (element !== rippleStack[rippleStack.length - 1]) return;

	// Create a ripple element
	const rippleEl = document.createElement('div');
	rippleEl.classList.add('ripple');

	// Position the ripple
	let x = element.offsetWidth / (Math.floor(Math.random() * 5) + 1);
	let y = element.offsetHeight / (Math.floor(Math.random() * 5) + 1);

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

    level.querySelectorAll('#domain button').forEach((element) => {
	element.addEventListener("pointerdown", (event) => {
	    if (event.target === document.activeElement) {
		return;
	    } else if (event.target.nodeName === "P" && !cellActive) {
		element.focus({
		    preventScroll: true
		});
		spawnRipple(event, event.target);
	    } else if (!cellActive) {
		element.focus({
		    preventScroll: true
		});
		spawnRipple(event, event.target.querySelector("p"));
	    }
	});

	element.addEventListener("click", (event) => {
	    if (event.target === deselectReady) {
		deselectReady.blur();
		deselectReady = false;
	    }
	});
    });

    function undo(e) {
	if (undoStack().length === 0) return;

	const prevState = undoStack().pop();

	if (undoStack().length === 0) {
	    undoButton.classList.remove("usable");
	}

	const cell = level.querySelector("#g" + currentGrid + " #" + prevState[0]);
	const undone = prevState[1];
	const done = cell.querySelector("ul") ? cell.querySelector("ul") : cell.firstChild.innerText.trim();
	const doneCopy = done.nodeName === "UL" ? done.cloneNode(true) : done;

	if (undone.nodeName === "UL") {
	    if (done.nodeName !== "UL") {
		cell.firstChild.classList.add("dismiss");
		cell.firstChild.addEventListener("animationend", endDismissWipe);
		cell.appendChild(undone);
	    } else if (undone.children.length === done.children.length) {
		done.children[done.children.length - 1].remove();
		done.appendChild(undone.children[undone.children.length - 1]);
	    } else if (done.children.length < undone.children.length) {
		const doneSet = new Set(Array.from(done.children).map(x => x.innerText.trim()));
		done.appendChild(
		    Array.from(undone.children).find(x => !doneSet.has(x.innerText.trim()))
		);
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
	    const temp = candidateMode;
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

	const prevState = redoStack().pop();

	if (redoStack().length === 0) {
	    redoButton.classList.remove("usable");
	}

	const cell = level.querySelector("#g" + currentGrid + " #" + prevState[0]);
	const redone = prevState[1];
	const done = cell.querySelector("ul") ? cell.querySelector("ul") : cell.firstChild.innerText.trim();
	const doneCopy = done.nodeName === "UL" ? done.cloneNode(true) : done;

	if (redone.nodeName === "UL") {
	    if (done.nodeName !== "UL") {
		cell.firstChild.classList.add("dismiss");
		cell.firstChild.addEventListener("animationend", endDismissWipe);
		cell.appendChild(redone);
	    } else if (done.children.length === redone.children.length) {
		done.children[done.children.length - 1].remove();
		done.appendChild(redone.children[redone.children.length - 1]);
	    } else if (done.children.length < redone.children.length) {
		const doneSet = new Set(Array.from(done.children).map(x => x.innerText.trim()));
		done.appendChild(
		    Array.from(redone.children).find(x => !doneSet.has(x.innerText.trim()))
		);
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
	    const temp = candidateMode;
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

    [undoButton, redoButton, pencilButton].forEach(b => {
	b.addEventListener("click", () => {
	    toolClicked = true;

	    setTimeout(() => toolClicked = false, 10);
	});
    });

    let toolClicked = false;

    function candidateToggle(e) {
	candidateMode = !candidateMode;
	pencilButton.classList.toggle("active", candidateMode);
    }

    level.querySelectorAll("#pencil, #undo, #redo, #nextgrid, #delgrid").forEach(li => {
	li.addEventListener("pointerdown", (event) => {
	    event.target.classList.add("nudged");

	    event.target.addEventListener("pointerup", () => {
		event.target.classList.remove("nudged");
	    });
	});
    });

    level.querySelector("#wrap_home_level").addEventListener("pointerdown", (e) => {
	e.target.closest("#wrap_home_level").classList.add("nudged");
	e.target.closest("#wrap_home_level").addEventListener("pointerup", () => {
	    e.target.closest("#wrap_home_level").classList.remove("nudged");
	});
    });


    // Global keydown event listener
    document.onkeydown = (e) => {
	const hideMatrixTools = document.getElementById("hideMatrixTools").checked;
	const toolsToggle = TOOLS_TOGGLE.checked;
	const gridWidth = level.querySelector(".grid").clientWidth;
	const box = level.querySelector("dialog[open] #dict_box, dialog[open] #level_info") || propositions.parentNode;
	const propositionHeight = level.querySelector("#propositions li").clientHeight;

	switch (e.key) {
	case "u":
	    undo();
	    break;
	case "r":
	    redo();
	    break;
	case "c":
	    candidateToggle();
	    break;
	case "p":
	case "P":
	    if (!hideMatrixTools && toolsToggle) {
		createNewGrid(e.key === "P");
	    }
	    break;
	case "x":
	    if (!hideMatrixTools && TOOLS_TOGGLE.classList.contains("top") && currentGrid !== 1) {
		deleteGrid(currentGrid);
	    }
	    break;
	case "Escape":
	    document.activeElement.blur();
	    break;
	case "ArrowRight":
	    e.preventDefault();
	    gridCarousel.scrollBy({
		top: 0,
		left: gridWidth,
		behavior: "smooth"
	    });
	    break;
	case "ArrowLeft":
	    e.preventDefault();
	    gridCarousel.scrollBy({
		top: 0,
		left: -gridWidth,
		behavior: "smooth"
	    });
	    break;
	case "ArrowDown":
	    e.preventDefault();
	    box.scrollBy({
		top: propositionHeight,
		left: 0,
		behavior: "smooth"
	    });
	    break;
	case "ArrowUp":
	    e.preventDefault();
	    box.scrollBy({
		top: -propositionHeight,
		left: 0,
		behavior: "smooth"
	    });
	    break;
	default:
	    handleButtonKeyPress(e);
	    break;
	}
    };

    // Handle keypress for button activation
    function handleButtonKeyPress(e) {
	const button = Array.from(domainList).find(x => x.firstChild.textContent.trim() === e.key);
	if (button && !document.activeElement.matches(".grid span")) {
	    button.dispatchEvent(new PointerEvent("pointerdown"));
	    setTimeout(() => document.dispatchEvent(new PointerEvent("pointerup")), 5);
	    button.click();
	}
    }

    // Home level click handling
    level.querySelector("#wrap_home_level").onclick = function() {
	if (window.event.ctrlKey || window.event.shiftKey) {
	    window.open("index.html", '_blank').focus();
	} else {
	    Router("index.html");
	}
    };

    // Info and dictionary scroll handling
    info.parentNode.addEventListener("open", () => {
	info.scroll(0, 0);
	verticalScroll(info, 7);
    });
    info.addEventListener("scroll", () => verticalScroll(info, 7));

    dict.closest("dialog").addEventListener("open", () => verticalScroll(dict, 7));
    dict.addEventListener("scroll", () => verticalScroll(dict, 7));

    // Dict header click handling
    [...level.querySelector("#dict_headings").children].forEach(h => {
	h.onclick = () => verticalScroll(dict, 7);
    });

    // Dict input change event for reset scroll
    level.querySelectorAll("input[name='dict_header']").forEach(i =>
	i.onchange = () => dict.scrollTo(0, 0)
    );

    // Display dict symbols and terms based on local storage
    level.querySelectorAll("#dict_symbols li, #dict_terms li").forEach(li => {
	const highestTraining = parseFloat(localStorage.getItem("highestTraining") || "1").toFixed(4);
	if (li.className.startsWith("t") && (parseFloat(li.className[1] + "." + li.className.substring(3)) - 0.1).toFixed(4) <= highestTraining) {
	    li.classList.add("visible");
	}
    });

    // Update visibility of dict symbols/terms based on difficulty
    ["Normal", "Difficult", "Extreme"].forEach(category => {
	const firstChar = category[0].toLowerCase();
	const highest = localStorage.getItem("highest" + category) || firstChar + "0";

	level.querySelectorAll("#dict_symbols li, #dict_terms li").forEach(li => {
	    if (li.className.startsWith(firstChar) && parseInt(li.className.substring(1)) <= parseInt(highest.substring(1))) {
		li.classList.add("visible");
	    }
	});
    });

    // Function to align the grid based on rows and columns
    function alignGrid() {
	const max = Math.max(ROWS, COLS);

	// Adjust font factors based on grid size
	const fontFactor = max > 3 ? 1 + (3.25 - max) / max : 1;
	level.style.setProperty('--fontFactor', fontFactor);
	level.style.setProperty('--landscapeFontFactor', fontFactor);
	level.style.setProperty('--boostProps', 1);

	// Adjust layout based on rows vs columns
	if (ROWS > COLS) {
	    level.style.setProperty('--heightFactor', 1);
	    level.style.setProperty('--widthFactor', COLS / ROWS);
	    level.style.setProperty('--landscapeHeightFactor', 1);
	    level.style.setProperty('--landscapeWidthFactor', COLS / ROWS);
	} else if (COLS > ROWS) {
	    level.style.setProperty('--heightFactor', ROWS / COLS);
	    level.style.setProperty('--widthFactor', 1);

	    if (ROWS < 3 && COLS > 3) {
		level.style.setProperty('--boostProps', 1.075);
		level.style.setProperty('--landscapeHeightFactor', 1.2 * (ROWS / COLS));
		level.style.setProperty('--landscapeWidthFactor', 1.2);
		level.style.setProperty('--landscapeFontFactor', 1);
	    } else {
		level.style.setProperty('--landscapeHeightFactor', ROWS / COLS);
		level.style.setProperty('--landscapeWidthFactor', 1);
	    }
	} else {
	    if (ROWS === 2) {
		level.style.setProperty('--heightFactor', 0.65);
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

// Function to convert a number to roman numerals
function roman(n) {
    const romanNumerals = [
	[1000, 'M'],
	[900, 'CM'],
	[500, 'D'],
	[400, 'CD'],
	[100, 'C'],
	[90, 'XC'],
	[50, 'L'],
	[40, 'XL'],
	[10, 'X'],
	[9, 'IX'],
	[5, 'V'],
	[4, 'IV'],
	[1, 'I']
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
