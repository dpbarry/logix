function showModal(id) {
    let modal = document.getElementById(id);
    modal.showModal();
    modal.dispatchEvent(new Event("open"));

    if (id=="info_dialog") {
        let info = document.getElementById("info");
        info.classList.remove("readme");
        info.classList.add("banish");
        setTimeout( () => {
            info.classList.remove("banish");
        }, 300);
    }
}


function closeDialog (event) {
    event.target.closest("dialog").close();
    event.target.closest("dialog").classList.remove("hide");

    document.querySelectorAll(".dialog_button").forEach( (d) => {
        d.blur();
    });
    
    event.target.closest("dialog").removeEventListener("transitionend", closeDialog);    
}

function initDialogs() {
    const dialogList = document.querySelectorAll('dialog');

    dialogList.forEach((dialog) => {
        dialog.addEventListener('click', (e) => {
            if (e.target.tagName !== 'DIALOG')
                return;

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
            if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {

                e.preventDefault();
                dialog.classList.add("hide");

                dialog.addEventListener("transitionend", closeDialog);
            }
        });

        dialog.ontoggle = () => {dialog.focus();}
    });

    document.querySelectorAll(".close").forEach( (closeButton) => {
        closeButton.addEventListener("click", (e) => {
            closeButton.parentNode.classList.add("hide");
            closeButton.parentNode.addEventListener("transitionend", closeDialog);
        });
    });

    document.querySelectorAll("dialog input").forEach((toggle) => {
        toggle.addEventListener("pointerup", (e) => {
            e.target.focus();
            // i.e., the dialog
        });
    });

    document.querySelectorAll(".dialog_button").forEach(li => {
        li.addEventListener("pointerdown", (event) => {
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

    document.body.addEventListener("pointerup", (e) => {
        document.querySelectorAll(".nudged").forEach((elem) => {
            elem.classList.remove("nudged");
            
        });
    });
}


const CROSSHAIRS_TOGGLE = document.querySelector("#crosshairs_toggle");
const STICKY_TOGGLE = document.querySelector("#sticky_toggle");
const CANCELOUT_TOGGLE = document.querySelector("#cancelout_toggle");
const THEMES = document.querySelectorAll(".theme");

const ROOT = document.documentElement;

THEMES.forEach( t => {
    t.addEventListener("change", () => {
        updateTheme();
        if (t.checked) {
            localStorage.setItem("theme", t.id);

        }
    });
});

[CROSSHAIRS_TOGGLE, STICKY_TOGGLE, CANCELOUT_TOGGLE].forEach(t => {
    t.addEventListener("change", () => {
        localStorage.setItem(t.id.split("_")[0], t.checked);
    });
});

updateTheme();

let cacheCrosshairs = localStorage.getItem("crosshairs");
let cacheSticky = localStorage.getItem("sticky");
let cacheCancelout = localStorage.getItem("cancelout");
let cacheTheme = localStorage.getItem("theme");

if (cacheCrosshairs !== null) {
    if (cacheCrosshairs === "true") {
        CROSSHAIRS_TOGGLE.checked = true;
    } else {
        CROSSHAIRS_TOGGLE.removeAttribute("checked");
    }
}

if (cacheSticky !== null) {
    if (cacheSticky === "true") {
        STICKY_TOGGLE.checked = true;
    } else {
        STICKY_TOGGLE.removeAttribute("checked");
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
            t.checked = true;
            updateTheme();
        } else {
            t.removeAttribute("checked");
        }
    });
}


function updateTheme() {
    let theme = Array.from(THEMES).find(t => t.checked);

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
        ROOT.style.setProperty('--correctColor', 'hsl(130, 35%, 35%)');

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
        ROOT.style.setProperty('--correctColor', 'hsl(130, 35%, 35%)');

        ROOT.style.setProperty('--hueShiftIcons', '');

        ROOT.style.colorScheme = "light";
        ROOT.classList.remove("dark");


    } else if (theme.id === "litdark") {

        ROOT.style.setProperty('--bgColor', 'hsl(50, 18%, 6%)');
        ROOT.style.setProperty('--baseColor', 'hsl(50, 0%, 88%)');
        ROOT.style.setProperty('--bracketColor', 'hsl(50, 20%, 45%)');

        ROOT.style.setProperty('--card', 'hsl(50, 90%, 2%)');
        ROOT.style.setProperty('--alpha', '1');

        ROOT.style.setProperty('--lightestShade', 'hsl(50, 20%, 45%)');
        ROOT.style.setProperty('--lighterShade', 'hsl(50, 25%, 37.5%)');
        ROOT.style.setProperty('--darkShade', 'hsl(50, 25%, 35%)');
        ROOT.style.setProperty('--darkerShade', 'hsl(50, 30%, 30%)');
        ROOT.style.setProperty('--darkestShade', 'hsl(50, 30%, 20%)');

        ROOT.style.setProperty('--focusColor', 'hsl(50, 40%, 30%)');
        ROOT.style.setProperty('--emphasisColor', 'hsl(50, 60%, 20%)');
        ROOT.style.setProperty('--correctColor', 'hsl(130, 35%, 35%)');

        ROOT.style.setProperty('--hueShiftIcons', 'brightness(0) invert(0.9)');
        
        ROOT.style.colorScheme = "dark";
        ROOT.classList.add("dark");


    } else if (theme.id === "frostdark") {

        ROOT.style.setProperty('--bgColor', 'hsl(200, 18%, 6%)');
        ROOT.style.setProperty('--baseColor', 'hsl(200, 0%, 88%)');
        ROOT.style.setProperty('--bracketColor', 'hsl(200, 20%, 45%)');

        ROOT.style.setProperty('--card', 'hsl(200, 60%, 3%)');
        ROOT.style.setProperty('--alpha', '1');

        ROOT.style.setProperty('--lightestShade', 'hsl(200, 20%, 45%)');
        ROOT.style.setProperty('--lighterShade', 'hsl(200, 25%, 37.5%)');
        ROOT.style.setProperty('--darkShade', 'hsl(200, 25%, 35%)');
        ROOT.style.setProperty('--darkerShade', 'hsl(200, 30%, 30%)');
        ROOT.style.setProperty('--darkestShade', 'hsl(200, 30%, 20%)');

        ROOT.style.setProperty('--focusColor', 'hsl(200, 40%, 30%)');
        ROOT.style.setProperty('--emphasisColor', 'hsl(200, 55%, 20%)');
        ROOT.style.setProperty('--correctColor', 'hsl(130, 35%, 35%)');

        ROOT.style.setProperty('--hueShiftIcons', 'brightness(0) invert(0.9)');

        ROOT.style.colorScheme = "dark";
        ROOT.classList.add("dark");

    }
}


function killOpenDialog () {
    let openDialog = document.querySelector("dialog[open]");
    if (openDialog) {
        openDialog.classList.add("hide");
        openDialog.addEventListener("transitionend", closeDialog);
    }
}
document.addEventListener('keydown', (e) => {

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
            changed = new AnimationEvent("change");
            MENU_TOGGLE.dispatchEvent(changed);
        } catch {}
    }

    if (e.key === "h") {
        Router("index.html");
        history.pushState({loc:"index.html"}, "");
    }

    if (e.key === "Tab") {
        tabbed = true;
        setTimeout(() => { tabbed = false }, 10);
    }

    if (e.key === "i" || e.key === "a") {
        killOpenDialog();
        try {
            document.querySelector("#info").click();
        } catch {
            document.querySelector("#about").click();
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


function verticalScroll(el, moe) {
    el.style.overflow = "auto";
    const isScrollable = (el.scrollHeight - moe > el.clientHeight);
    if (!isScrollable) {
        el.style.maskImage = "";
        el.style.overflow = "visible";

        return;
    }
    el.style.overflowY = "auto";

    
    // One pixel is added to the height to account for non-integer heights.
    const isScrolledToBottom = el.scrollHeight < el.clientHeight + el.scrollTop + 1;
    const isScrolledToTop = isScrolledToBottom ? false : el.scrollTop === 0;

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
    const isScrollable = (el.scrollWidth - moe > el.clientWidth);

    if (!isScrollable) {
        el.style.maskImage = "";
        el.style.overflow = "visible";

        return;
    }

    el.style.overflowX = "auto";

    
    // One pixel is added to the height to account for non-integer heights.
    const isScrolledToRight = el.scrollWidth  < el.clientWidth + el.scrollLeft + 1;
    const isScrolledToLeft = isScrolledToRight ? false : el.scrollLeft === 0;


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

        let left = isScrolledToLeft ? 0 : ( el.dataset.masksize || 40 );
        let right = isScrolledToRight ? 0 : ( el.dataset.masksize || 40 );

        horizontalMask = `linear-gradient(to right, transparent 0, black ${left}px, black calc(100% - ${right}px), transparent 100%)`;
    }

    isScrollable = el.scrollHeight - moe > el.clientHeight;

    if (!isScrollable) {
        el.style.overflowY = "visible";
    } else {
        el.style.overflowY = "auto";

        const isScrolledToBottom = el.scrollHeight < el.clientHeight + el.scrollTop + 1;
        const isScrolledToTop = el.scrollTop === 0;

        let top = isScrolledToTop ? 0 : ( el.dataset.masksize || 45 );
        let bottom = isScrolledToBottom ? 0 : ( el.dataset.masksize || 45 );

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
function vh(percent) {
    var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    return (percent * h) / 100;
}

function vw(percent) {
    var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    return (percent * w) / 100;
}
