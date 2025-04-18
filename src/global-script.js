let openingModal = false;

const ROOT = document.documentElement;

const STICKY_TOGGLE = document.querySelector("#sticky_toggle");
const CROSSHAIRS_TOGGLE = document.querySelector("#crosshairs_toggle");
const DYNAMIC_TOGGLE = document.querySelector("#dynamic_toggle");
const CANCELOUT_TOGGLE = document.querySelector("#cancelout_toggle");
const THEMES = document.querySelectorAll(".theme");
const TOOLS_TOGGLE = document.querySelector("#tools_toggle");

const parser = new DOMParser();


function showModal(id) {
    openingModal = true;
    let modal = document.getElementById(id);
    modal.showModal();
    modal.dispatchEvent(new Event("open"));

    setTimeout(()=> {openingModal = false;}, 100);
    if (id==="info_dialog") {
        let info = document.getElementById("info");
        info.classList.remove("readme");
        info.classList.add("banish");
        setTimeout( () => {
            info.classList.remove("banish");
        }, 300);
    }

    if (id==="settings_dialog") {
        setTimeout( ()=> {
            
            document.querySelector("#" + (cacheTheme || "litlight")).parentNode.focus();
            
        }, 100);
    }
}

document.getElementById("configs").addEventListener("scroll", (e) => verticalScroll(e.target, 7));
window.addEventListener("resize", () => verticalScroll(document.getElementById("configs"), 7));
screen.orientation.addEventListener("change", (event) => {verticalScroll(document.getElementById("configs"), 7)});

function closeDialog (event) {
    event.target.closest("dialog").close();
    event.target.closest("dialog").classList.remove("hide");

    document.querySelectorAll(".dialog_button").forEach( (d) => {
        d.blur();
    });
    
    event.target.closest("dialog").removeEventListener("transitionend", closeDialog);

    try {document.querySelector(".retain").focus(); } catch {}
}

document.querySelectorAll("dialog .tristate").forEach((toggle) => {
    toggle.addEventListener("input", (e) => {
        if (!toggle.checked && toggle.classList.contains("top")) {
            toggle.classList.remove("top");
        } else if (!toggle.checked && !toggle.classList.contains("top")) {
            toggle.checked = true;
            toggle.classList.add("top");
        }
        updateComplexConfigs();
    });
});
document.querySelectorAll("dialog .toggle").forEach((toggle) => {
    toggle.addEventListener("pointerup", (e) => {
        e.target.blur();
    });
});

function initDialogs() {
    const dialogList = document.querySelectorAll('dialog');

    dialogList.forEach((dialog) => {
        dialog.addEventListener('pointerdown', (e) => {
            if (e.target.tagName !== 'DIALOG')
                return;

            dialogActive = true;

            const rect = e.target.getBoundingClientRect();

            const clickedInDialog = (
                rect.top <= e.clientY &&
                    e.clientY <= rect.top + rect.height &&
                    rect.left <= e.clientX &&
                    e.clientX <= rect.left + rect.width
            );

            if (clickedInDialog === false) {
                e.target.classList.add("hide");
                
                e.target.addEventListener("transitionend", closeDialog);
            }});

        dialog.addEventListener('keydown', (e) => {
            if (e.key === "Escape" || (document.activeElement.nodeName === "DIALOG" && e.key === " ")) {
                e.preventDefault();
                dialog.classList.add("hide");

                dialog.addEventListener("transitionend", closeDialog);
            }
        });

        dialog.ontoggle = () => {dialog.focus({preventScroll: true});}
    });

    document.querySelectorAll(".close").forEach( (closeButton) => {
        closeButton.addEventListener("click", (e) => {
            closeButton.parentNode.classList.add("hide");
            closeButton.parentNode.addEventListener("transitionend", closeDialog);
        });
    });


    document.querySelectorAll(".dialog_button").forEach(li => {
        li.addEventListener("pointerdown", (event) => {
            openingModal = true;
            event.target.classList.add("nudged");
            event.target.addEventListener("pointerup", (event) => {
                event.target.classList.remove("nudged");
            });
            
        });

        li.addEventListener("keydown", (e) => {
            if (e.key !== " " && e.key !== "Enter") return;
            showModal(li.id + "_dialog");      
        });

    });



    if (localStorage.getItem("highestTraining") && (localStorage.getItem("highestTraining").charAt(0) !== "1" || ["1.6", "1.7"].includes(localStorage.getItem("highestTraining")))) {
        document.getElementById("hideMatrixTools").removeAttribute("checked");
    } else {
        document.getElementById("hideMatrixTools").checked = true;
    }
}

document.body.addEventListener("pointerup", (e) => {
    openingModal = false;
    document.querySelectorAll(".nudged").forEach((elem) => {
        let rect = elem.getBoundingClientRect();
        let overOriginalSize = (e.clientX < rect.left - 4 || e.clientX > rect.right + 4 || 
                                e.clientY < rect.top - 4 || e.clientY > rect.bottom + 4) ? false :
            (e.clientX < rect.left || e.clientX > rect.right || 
             e.clientY < rect.top || e.clientY > rect.bottom);
        if (overOriginalSize) {
            elem.click();
        } 
        elem.classList.remove("nudged");
        
    });
});


function updateComplexConfigs() {
    document.querySelectorAll("dialog .tristate").forEach(toggle => {
        if (toggle === DYNAMIC_TOGGLE) {
            if (toggle.classList.contains("top")) {
                document.querySelector("#" + toggle.id + " + p").innerText = "Treat literal entries the same as cells";
            } else {
                document.querySelector("#" + toggle.id + " + p").innerText = "Highlight literal entries corresponding to the active cell";
            }
        } else if (toggle == TOOLS_TOGGLE) {
            if (toggle.classList.contains("top")) {
                document.querySelector("#" + toggle.id + " + p").innerText = "Allow new matrices to be added and removed";
            } else {
                document.querySelector("#" + toggle.id + " + p").innerText = "Allow new matrices to be added";
            }
        }
    });

    
    ROOT.style.setProperty("--entryCursor", DYNAMIC_TOGGLE.classList.contains("top") ? "pointer" : "default");

    
}


CROSSHAIRS_TOGGLE.addEventListener("change", () => {
    if (!CROSSHAIRS_TOGGLE.checked) {
        let grid = document.querySelector("#grid");
        if (!grid) return;
        grid.dispatchEvent(new Event("clearcrosshairs"));
    }
})
THEMES.forEach( t => {
    t.previousElementSibling.addEventListener("change", () => {
        updateTheme();
        if (t.previousElementSibling.checked) {
            localStorage.setItem("theme", t.id);
        }
    });

    t.parentNode.addEventListener("keydown", (e) => {
        if (e.key === " " || e.key === "enter") {
            e.target.click();
        }
    })
});

[STICKY_TOGGLE, CROSSHAIRS_TOGGLE, DYNAMIC_TOGGLE, CANCELOUT_TOGGLE, TOOLS_TOGGLE].forEach(t => {
    t.addEventListener("change", () => {
        if (t.classList.contains("tristate"))
            localStorage.setItem(t.id.split("_")[0], [t.checked, t.classList.contains("top")]);
        else
            localStorage.setItem(t.id.split("_")[0], t.checked);
    });
});

let cacheSticky = localStorage.getItem("sticky");
let cacheCrosshairs = localStorage.getItem("crosshairs");
let cacheDynamic = localStorage.getItem("dynamic");
let cacheCancelout = localStorage.getItem("cancelout");
let cacheTheme = localStorage.getItem("theme");
let cacheTools = localStorage.getItem("tools");

if (cacheSticky !== null) {
    if (cacheSticky === "true") {
        STICKY_TOGGLE.checked = true;
    } else {
        STICKY_TOGGLE.removeAttribute("checked");
    }
}

if (cacheCrosshairs !== null) {
    if (cacheCrosshairs === "true") {
        CROSSHAIRS_TOGGLE.checked = true;
    } else {
        CROSSHAIRS_TOGGLE.removeAttribute("checked");
    }
}

if (cacheDynamic !== null) {
    switch (cacheDynamic) {
    case "true,true":
        ROOT.style.setProperty("--entryCursor", "pointer");
        DYNAMIC_TOGGLE.checked = true;
        DYNAMIC_TOGGLE.classList.add("top");
        break;
    case "true,false":
        ROOT.style.setProperty("--entryCursor", "default");
        DYNAMIC_TOGGLE.checked = true;
        DYNAMIC_TOGGLE.classList.remove("top");
        break;
    default:
        ROOT.style.setProperty("--entryCursor", "default");
        DYNAMIC_TOGGLE.checked = false;
        DYNAMIC_TOGGLE.classList.remove("top");
    }
}


if (cacheCancelout !== null) {
    if (cacheCancelout === "true") {
        CANCELOUT_TOGGLE.checked = true;
    } else {
        CANCELOUT_TOGGLE.removeAttribute("checked");
    }
}

if (cacheTheme !== null) {
    THEMES.forEach( t => {
        if (t.id === cacheTheme) {
            t.previousElementSibling.checked = true;
        } else {
            t.removeAttribute("checked");
        }
    });
}

if (cacheTools !== null) {
    switch (cacheTools) {
    case "true,true":
        TOOLS_TOGGLE.checked = true;
        TOOLS_TOGGLE.classList.add("top");
        break;
    case "true,false":
        TOOLS_TOGGLE.checked = true;
        TOOLS_TOGGLE.classList.remove("top");
        break;
    default:
        TOOLS_TOGGLE.checked = false;
        TOOLS_TOGGLE.classList.remove("top");
    }
}

updateTheme();
updateComplexConfigs();

function updateTheme() {
    ROOT.classList.add("notransitions");
    let theme = Array.from(THEMES).find(t => t.previousElementSibling.checked);

    if (theme.id === "litlight") {

        ROOT.style.setProperty('--bgColor', '#FFF');
        ROOT.style.setProperty('--baseColor', '#000');
        ROOT.style.setProperty('--bracketColor', '#000');

        ROOT.style.setProperty('--card', '#F5F5F5');
        ROOT.style.setProperty('--alpha', '0.15');

        ROOT.style.setProperty('--lightestShade', 'hsl(50, 20%, 94%)');
        ROOT.style.setProperty('--lighterShade', 'hsl(50, 25%, 91%)');
        ROOT.style.setProperty('--darkShade', 'hsl(50, 25%, 50%)');
        ROOT.style.setProperty('--darkerShade', 'hsl(50, 30%, 35%)');
        ROOT.style.setProperty('--darkestShade', 'hsl(50, 35%, 25%)');

        ROOT.style.setProperty('--focusColor', 'hsl(50, 45%, 80%)');
        ROOT.style.setProperty('--emphasisColor', 'hsl(50, 40%, 45%)');

        ROOT.style.setProperty('--softShade', 'hsl(50, 40%, 85%)');
        ROOT.style.setProperty('--softerShade', 'hsl(50, 40%, 77.5%)');
        ROOT.style.setProperty('--hardShade', 'hsl(50, 40%, 70%)');
        ROOT.style.setProperty('--harderShade', 'hsl(50, 40%, 62.5%)');


        ROOT.style.setProperty('--correctColor', 'hsl(50, 35%, 35%)');

        ROOT.style.setProperty('--hueShiftIcons', '');

        ROOT.style.colorScheme = "light";
        ROOT.classList.remove("dark");

    } else if (theme.id === "frostlight") {

        ROOT.style.setProperty('--bgColor', '#FFF');
        ROOT.style.setProperty('--baseColor', '#000');
        ROOT.style.setProperty('--bracketColor', '#000');

        ROOT.style.setProperty('--card', '#F5F5F5');
        ROOT.style.setProperty('--alpha', '0.15');

        ROOT.style.setProperty('--lightestShade', 'hsl(200, 20%, 94%)');
        ROOT.style.setProperty('--lighterShade', 'hsl(200, 25%, 91%)');
        ROOT.style.setProperty('--darkShade', 'hsl(200, 25%, 50%)');
        ROOT.style.setProperty('--darkerShade', 'hsl(200, 30%, 35%)');
        ROOT.style.setProperty('--darkestShade', 'hsl(200, 35%, 25%)');

        ROOT.style.setProperty('--focusColor', 'hsl(200, 45%, 80%)');
        ROOT.style.setProperty('--emphasisColor', 'hsl(200, 40%, 45%)');

        
        ROOT.style.setProperty('--softShade', 'hsl(200, 40%, 85%)');
        ROOT.style.setProperty('--softerShade', 'hsl(200, 40%, 77.5%)');
        ROOT.style.setProperty('--hardShade', 'hsl(200, 40%, 70%)');
        ROOT.style.setProperty('--harderShade', 'hsl(200, 40%, 62.5%)');
        ROOT.style.setProperty('--correctColor', 'hsl(200, 35%, 35%)');

        ROOT.style.setProperty('--hueShiftIcons', '');

        ROOT.style.colorScheme = "light";
        ROOT.classList.remove("dark");


    } else if (theme.id === "litdark") {

        ROOT.style.setProperty('--bgColor', 'hsl(50, 18%, 6%)');
        ROOT.style.setProperty('--baseColor', 'hsl(50, 0%, 87%)');
        ROOT.style.setProperty('--bracketColor', 'hsl(50, 20%, 45%)');

        ROOT.style.setProperty('--card', 'hsl(50, 90%, 2%)');
        ROOT.style.setProperty('--alpha', '1');

        ROOT.style.setProperty('--lightestShade', 'hsl(50, 20%, 45%)');
        ROOT.style.setProperty('--lighterShade', 'hsl(50, 25%, 37.5%)');
        ROOT.style.setProperty('--darkShade', 'hsl(50, 25%, 35%)');
        ROOT.style.setProperty('--darkerShade', 'hsl(50, 30%, 30%)');
        ROOT.style.setProperty('--darkestShade', 'hsl(50, 30%, 20%)');

        ROOT.style.setProperty('--focusColor', 'hsl(50, 40%, 30%)');
        ROOT.style.setProperty('--emphasisColor', 'hsl(50, 60%, 18%)');

        ROOT.style.setProperty('--softShade', 'hsl(50, 28%, 45%)');
        ROOT.style.setProperty('--softerShade', 'hsl(50, 28%, 37.5%)');
        ROOT.style.setProperty('--hardShade', 'hsl(50, 28%, 35%)');
        ROOT.style.setProperty('--harderShade', 'hsl(50, 28%, 27.5%)');
        ROOT.style.setProperty('--correctColor', 'hsl(50, 35%, 35%)');

        ROOT.style.setProperty('--hueShiftIcons', 'brightness(0) invert(0.87)');
        
        ROOT.style.colorScheme = "dark";
        ROOT.classList.add("dark");


    } else if (theme.id === "frostdark") {

        ROOT.style.setProperty('--bgColor', 'hsl(200, 18%, 6%)');
        ROOT.style.setProperty('--baseColor', 'hsl(200, 0%, 87%)');
        ROOT.style.setProperty('--bracketColor', 'hsl(200, 20%, 45%)');

        ROOT.style.setProperty('--card', 'hsl(200, 60%, 3%)');
        ROOT.style.setProperty('--alpha', '1');

        ROOT.style.setProperty('--lightestShade', 'hsl(200, 20%, 45%)');
        ROOT.style.setProperty('--lighterShade', 'hsl(200, 25%, 37.5%)');
        ROOT.style.setProperty('--darkShade', 'hsl(200, 25%, 35%)');
        ROOT.style.setProperty('--darkerShade', 'hsl(200, 30%, 30%)');
        ROOT.style.setProperty('--darkestShade', 'hsl(200, 30%, 20%)');

        ROOT.style.setProperty('--focusColor', 'hsl(200, 40%, 30%)');
        ROOT.style.setProperty('--emphasisColor', 'hsl(200, 60%, 18%)');

        
        ROOT.style.setProperty('--softShade', 'hsl(200, 28%, 45%)');
        ROOT.style.setProperty('--softerShade', 'hsl(200, 28%, 37.5%)');
        ROOT.style.setProperty('--hardShade', 'hsl(200, 28%, 35%)');
        ROOT.style.setProperty('--harderShade', 'hsl(200, 28%, 27.5%)');
        ROOT.style.setProperty('--correctColor', 'hsl(200, 35%, 35%)');

        ROOT.style.setProperty('--hueShiftIcons', 'brightness(0) invert(0.87)');

        ROOT.style.colorScheme = "dark";
        ROOT.classList.add("dark");

    }

    setTimeout( () => ROOT.classList.remove("notransitions"), 5);

    
}


function killOpenDialog () {
    let openDialog = document.querySelector("dialog[open]");
    if (openDialog) {
        openDialog.classList.add("hide");
        openDialog.addEventListener("transitionend", closeDialog);
    }
}

document.addEventListener('keydown', (e) => {

    if (document.activeElement.nodeName === "TEXTAREA") return;
    if (e.key === "u") {
        try {
            undo();
        } catch {}
    }

    if (e.key === "r") {
        try {
            redo();
        } catch {}
    }

    if (e.key === "c") {
        try {
            candidateToggle();
        } catch {}
    }

    if (e.key === "m") {
        try {
            MENU_TOGGLE.checked = !MENU_TOGGLE.checked;
        } catch {}
    }

    
    if (e.key === "h") {
        Router("index.html");
    }

    if (e.key === "Tab") {
        tabbed = true;
        setTimeout(() => { tabbed = false }, 10);
    }

    if (e.key === "i") {
        if (document.querySelector("#info") || document.querySelector("#about")) {
            killOpenDialog();
            try {
                document.querySelector("#info").click();
            } catch {
                document.querySelector("#about").click();
            }
        }
    }

    if (e.key === "s") {
        killOpenDialog();
        document.querySelector("#settings").click();
    }

    if (e.key === "d") {
        if (document.querySelector("#dictionary")) {
            killOpenDialog();
            document.querySelector("#dictionary").click();
        }
    }
    if (e.key === "n") {
        if (document.querySelector("#notes")) {
            killOpenDialog();
            document.querySelector("#notes").click();
        }
    }
});


let homeSource, homePageObj;

async function memHome() {
    homeSource = await (await fetch('src/home.html')).text();
    homePageObj = parser.parseFromString(homeSource, 'text/html');
}

memHome();

function latestGrid(diff, level) {
    
    let nextLevel;
    if (diff === "Training") {
        nextLevel = homePageObj.querySelector(`#${diff[0]}${level[0] + "-" + ""+(parseInt(level.substring(2)) + 1)}`);
        if (!nextLevel && level[0] === "5") return level;
        if (!nextLevel) {
            nextLevel = homePageObj.querySelector(`#${diff[0]}${parseInt(level[0]) + 1}-1`);
        }
    } else {
        nextLevel = homePageObj.querySelector(`#${diff[0]}${level+1}`);
    }


    return nextLevel.id.substring(1).replace('-', '.') || level;
    
}

function verticalScroll(el, moe) {
    el.style.overflowY = "auto";
    const isScrollable = (el.scrollHeight > el.clientHeight + 1);
    if (!isScrollable) {
        el.style.maskImage = "";
        el.style.overflow = "visible";
        return;
    }
    el.style.overflowY = "auto";

    
    // One pixel is added to the height to account for non-integer heights.
    const isScrolledToBottom = el.scrollHeight < el.clientHeight + el.scrollTop + moe;
    const isScrolledToTop = isScrolledToBottom ? false : el.scrollTop < moe;

    let top = 0;
    let bottom=0;
    
    if (!isScrolledToBottom) {
        bottom = el.dataset.masksize || 40;
    }

    if (!isScrolledToTop) {
        top = el.dataset.masksize || 40;
    }

    el.style.maskImage = `linear-gradient(to bottom, transparent 0, black ${top}px, black calc(100% - ${bottom}px), transparent 100%)`;

}



function horizontalScroll(el, moe) {
    const isScrollable = (el.scrollWidth > el.clientWidth + 1);

    if (!isScrollable) {
        el.style.maskImage = "";
        el.style.overflow = "visible";

        return;
    }

    el.style.overflowX = "auto";

    
    // One pixel is added to the height to account for non-integer heights.
    const isScrolledToRight = el.scrollWidth  < el.clientWidth + el.scrollLeft + moe;
    const isScrolledToLeft = isScrolledToRight ? false : el.scrollLeft < moe;


    let left = 0;
    let right = 0;
    
    if (!isScrolledToRight) {
        right = el.dataset.masksize || 40;
    }

    if (!isScrolledToLeft) {
        left = el.dataset.masksize || 40;
    }

    el.style.maskImage = `linear-gradient(to right, transparent 0, black ${left}px, black calc(100% - ${right}px), transparent 100%)`;
}


function vh(percent) {
    var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    return (percent * h) / 100;
}

function vw(percent) {
    var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    return (percent * w) / 100;
}

function getCenteredElement(carousel) {
    const carouselCenter = carousel.scrollLeft + carousel.clientWidth / 2;

    let closesElement = null;
    let closestDistance = Infinity;

    

    [...carousel.children].forEach(el => {
        const elCenter = el.offsetLeft + el.offsetWidth / 2;
        const distance = Math.abs(carouselCenter - elCenter);

        if (distance < closestDistance) {
            closestDistance = distance;
            closestElement = el;
        }
    });
    return closestElement;
}

function observedMap(map, callback) {
    return new Proxy(map, {
        get(target, prop, receiver) {
            if (prop === Symbol.iterator) {
                return Map.prototype[Symbol.iterator].bind(target);
            }
            if (prop === 'size') {
                return target.size;
            }

            if (prop === "unobserve") {
                callback = (a,b,c) => {};
                return;
            }

            if (['entries', 'keys', 'values', 'forEach'].includes(prop)) {
                return Map.prototype[prop].bind(target);
            }
            if (['set', 'delete', 'clear', 'get'].includes(prop)) {
                return function (...args) {
                    // do the real operation
                    const result = Reflect.apply(target[prop], target, args);
                    // notify
                    callback(prop, args, target);
                    // if get() returned a nested Map, wrap it too
                    if (prop === 'get' && result instanceof Map) {
                        return observedMap(result, callback);
                    }
                    return result;
                };
            }
            return Reflect.get(target, prop, receiver);
        }
    });
}

const serialize = (data) => {
    if (data instanceof Node) {
        return new XMLSerializer().serializeToString(data);
    }

    if (data instanceof Map) {
        const newMap = new Map();
        for (let [key, value] of data.entries()) {
            newMap.set(key, serialize(value));
        }
        return newMap;
    }

    if (Array.isArray(data)) {
        return data.map(item => serialize(item));
    }

    if (typeof data === 'object' && data !== null) {
        const result = {};
        for (let key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                result[key] = serialize(data[key]);
            }
        }
        return result;
    }
    return data;
};


function mapify(obj) {
    if (obj && typeof obj === 'object' && !Array.isArray(obj) && Object.keys(obj).length) {
        const m = new Map(Object.entries(obj));
        for (const [k, v] of m) {
            m.set(k, mapify(v));
        }
        return m;
    }
    return obj;
}

Map.prototype.toJSON = function() {
    const obj = {};
    for (const [k, v] of this) {
        obj[k] = v && typeof v.toJSON === 'function' ? v.toJSON() : v;
    }
    return obj;
};


//// HAXXXXX ////


document.addEventListener("keydown", async (event) => {
    typed += event.key.toLowerCase();
    if (typed.includes("dean")) {
        typed = "";
        hackLevel();
    }
    if (typed.length > 100) 
        typed = typed.slice(-96);
});

let aboutClickCount = 0;
let clearAboutClickCount;
let typed = "";
let hacking;

async function hackLevel() {
    clearTimeout(clearAboutClickCount);
    aboutClickCount = 0;
    typed = "";

    let openDialog = document.querySelector("dialog[open]");
    if (openDialog) {
        openDialog.classList.add("hide");
        openDialog.addEventListener("transitionend", closeDialog);
    }
    let difficulty = prompt("Which difficulty?");
    difficulty = difficulty ? difficulty.toLowerCase().trim() : "training";

    if (!["training", "normal", "difficult", "extreme"].includes(difficulty)) {
        alert("Not a valid difficulty.");
        hacking = false;
        return;
    }
    
    const level = prompt(`What is the last ${difficulty[0].toUpperCase() + difficulty.substring(1)} level you completed?`);
    hacking = false;
    if (!level) return;

    var response = await fetch(`src/levels/${difficulty[0].toUpperCase() + level.replace(".", "-")}.html`);
    if (!response.ok) {
        alert("That level does not (yet) exist.");
        window.location.reload();
        return;
    }

    localStorage.setItem("highest" + difficulty[0].toUpperCase() + difficulty.substring(1), level);
    localStorage.removeItem("gridStorage" + difficulty[0].toUpperCase() + difficulty.substring(1));
        localStorage.removeItem("notes" + difficulty[0].toUpperCase() + difficulty.substring(1));
    Router("index.html");
    window.location.reload(true);
}
