let cardWidth;

function setupHome(page) {
    const stages = page.querySelectorAll(".trainstage");
    const trainingCard = page.querySelector("#training");
    const extremeCard = page.querySelector("#extreme");
    const wrapStages = page.querySelector("#wrap_stages");
    const scrollContainers = page.querySelectorAll("#wrap_stages, .campaignlist");
    let carousel = page.querySelector("#wrap_cards");

    let cards = page.querySelectorAll(".card");
    let cardsArray = [...cards];
    let upcard = page.querySelector(".upcard");

    
    page.querySelectorAll(".card li").forEach( (li) => {
        li.onfocus = (e) => {
            let thisCard = e.target.closest(".card");

            if (!thisCard.classList.contains("upcard")) {
                if (cardView) scrollCardsTo(thisCard);
                else if (mobileView) mobileScrollTo(thisCard);
            }
        };
    });

    page.querySelectorAll(".card").forEach( c => {
        let category = "highest" + c.id[0].toUpperCase() + c.id.substring(1);
        if (localStorage.getItem(category)) {
            c.querySelectorAll(".level-button").forEach( (b) => {
                highest = parseFloat(localStorage.getItem(category));
                strHighest = localStorage.getItem(category);
                if (c.id === "training") {
                    if (parseFloat(b.id[1] + "." +  b.id.substring(3)) <= highest) {
                        b.classList.add("solved");
                        b.classList.remove("locked");
                    } else if ((parseFloat(b.id[1] + "." +  b.id.substring(3)) - 0.1).toFixed(4) == highest) {
                        b.classList.remove("locked");
                    } else if (!page.querySelector("#T" + strHighest[0] + "-" + (1 + parseInt(strHighest.substring(2))))) {
                        if (parseInt(b.id[1]) === parseInt((""+highest)[0]) + 1 && b.id.substring(3) == 1) {
                            b.classList.remove("locked");
                        }
                    }
                } else if (parseFloat(b.id.substring(1)) <= highest) {
                    b.classList.remove("locked");
                    b.classList.add("solved");
                } else if (parseFloat(b.id.substring(1)) - 1 == highest) {
                    b.classList.remove("locked");
                }    })}});

    function toggleDropped(e) {
        if (e.type === "keydown" && e.key !== " " && e.key !== "Enter") return;
        
        let target = e.target.closest(".trainstage");

        page.querySelectorAll(".dropped + ul > .level-button").forEach((b) => {
            b.tabIndex = -1;
        });

        if (target.classList.contains("dropped")) {
            target.classList.remove("dropped");
            target.tabIndex = 0;
            verticalScroll(wrapStages, 10);
            
        } else {
            let diff;
            stages.forEach((s) => {
                s.blur();
                s.classList.remove("dropped");
                s.tabIndex = 0;
            });

            let captureHeight = wrapStages.scrollTop;
            let targetPos = (parseInt(target.id.substring(1)) - 1) * 23.5;
            let sign = (wrapStages.scrollTop - targetPos) < 0 ? 1 : -1;
            let x = setInterval( () => {   
                verticalScroll(wrapStages, 3);
            }, 5);

            setTimeout( () => clearInterval(x), 400);

            target.classList.add("dropped");
            page.querySelectorAll(".dropped + ul > .level-button:not(.locked)").forEach((b) => {
                b.tabIndex = 0;
            });
            target.tabIndex = -1;
        }
        target.blur();
        
    }

    stages.forEach( (stage) => {
        stage.onclick = toggleDropped;
        stage.onkeydown = toggleDropped;
        stage.tabIndex = 0;
    });

    page.querySelector(".dropped").tabIndex = -1;

    page.querySelectorAll(".level-button:not(.locked)").forEach((b) => {
        
        b.onclick = function (e) {
            if ((mobileView || cardView) && !(e.target.closest(".card").classList.contains("upcard"))) return;
            
            setTimeout( () => {
                Router(e.target.id);
            }, 15);
        };
        
        b.onkeydown = function (e) {
            if (e.key !== " " && e.key !== "Enter" || !(e.target.closest(".card").classList.contains("upcard"))) return;
            
            
            setTimeout(function () {
                Router(e.target.id);
            }, 15);
        };
    });


    page.querySelectorAll(".level-button").forEach(b => {
        b.tabIndex = -1;

        b.addEventListener("pointerdown", (e) => {
            if (mobileView && cardView && !e.target.closest(".card").classList.contains("upcard")) return;
            b.classList.add("nudged");
        });
    });

    page.querySelectorAll(".dropped + ul > .level-button:not(.locked), .campaignlist .level-button:not(.locked)").forEach( b => b.tabIndex = 0 );


    page.querySelector("#main-header").onclick = function () {
        Router("index.html");
    }

    page.querySelector("#shortcut").onclick = function () {
        Router('T1-1');
        page.querySelector("#about_dialog").classList.add("hide");
        
        page.querySelector("#about_dialog").addEventListener("transitionend", closeDialog);
    }

    page.querySelectorAll(".locked").forEach(l => l.onfocus = () => {l.blur();});




    // smaller laptop screens, stacked effect
    let cardView = false;
    // carousel effect
    let mobileView = false;

    // (default for desktop: all cards visible)


    let debounceScroll = 0;
    let debounceMobile = 0;

    if (window.matchMedia("(width < 1450px) and (width > 600px)").matches) {
        cardView = true;
        updateCardStagger();
    } else if (window.matchMedia("(width <= 600px)").matches) {
        mobileView = true;
    }

    window.onresize = () => {
        scrollFadeCards();

        if (window.matchMedia("(width >= 1450px)").matches) {
            mobileView = false;
            if (cardView) {
                cardView = false;
                // revert overwritten styles
                cards.forEach( c => {
                    c.style.transform = "scale(1)";
                    c.style.filter = "brightness(1)"
                    setTimeout( () => {
                        c.style.transform = "";
                        c.style.filter = "";
                    }, 100);
                });
            }
        } else if (window.matchMedia("(width < 1450px) and (width > 600px)").matches) {
            cardView = true;
            mobileView = false;
            updateCardStagger(); 
        } else {
            mobileView = true;
            if (cardView) {
                // revert overwritten styles
                cardView = false;
                cards.forEach( c => {
                    c.style.transform = "scale(1)";
                    c.style.filter = "brightness(1)"
                    setTimeout( () => {
                        c.style.transform = "";
                        c.style.filter = "";
                    }, 100);
                });
            }
            mobileScrollTo(upcard);
        }
    };


    // card view - style cards according to focused one
    function updateCardStagger() {
        let i = 0;
        let j = 4;
        let hitTop = false;
        cards.forEach( (x) => {
            x.classList.remove("hover");
            if (x === upcard) {
                hitTop = true;
                x.style.zIndex = j--;
                x.style.transform = "scale(1)";
                return;
            }

            x.style.zIndex = j;
            
            i = (hitTop) ? i : i + 1;
            j = (hitTop) ? j - 1 : j + 1;
        });
        
        
        upcard.style.zIndex = parseInt(upcard.style.zIndex) + 5;

        for (let x = 0; x < 4; ++x) {
            let cur = cardsArray[x];
            let scaleFactor = (100 - (Math.abs(x - i) * 1.9)) / 100;
            let brightFactor = (100 - (Math.abs(x - i) * 1.35)) / 100;
            let shadow = (x == i) ? "drop-shadow(0px 2px 10px light-dark(#0000, #000))" : (x < i)
                ? "drop-shadow(-5px 2px 15px light-dark(#0000, #000))"
                : "drop-shadow(5px 2px 15px light-dark(#0000, #000))"

            cur.style.transform = `scale(${scaleFactor})`;

            if (x === i) {
                setTimeout( () => {
                    if (cur.classList.contains("upcard"))
                        cur.style.transform = "none";
                }, 100);
            }
            cur.style.filter = `${shadow} brightness(${brightFactor})`
        }
    }







    cards.forEach( (c) => {
        c.onclick = () => {
            if (mobileView) 
                mobileScrollTo(c);
            else if (cardView)
                scrollCardsTo(c);
        };
        
        c.addEventListener("mouseover", (e) => {
            e.target.closest(".card").classList.add("hover");
        });
        c.addEventListener("mousemove", (e) => {
            e.target.closest(".card").classList.add("hover");
        });

        c.addEventListener("mouseleave", (e) => {
            e.target.closest(".card").classList.remove("hover");
        });
        
    });

    let momentum = 0;
    let swiping = false;

    carousel.onscroll = mobileSwipe;

    function mobileSwipe() {
        if (mobileView && !debounceMobile) {
            swiping = true;
            carousel.style.scrollSnapType = "x mandatory";
        } else {
            swiping = false;
            carousel.style.scrollSnapType = "none";
        }
        updateMobile();             
    }


    carousel.addEventListener('wheel', function (event) {
        if (debounceScroll || debounceMobile || swiping) return;
        if (!cardView && !mobileView) return;

        if (mobileView && event.deltaX && !carousel.classList.contains("noswipe")) {
            if (extremeCard.classList.contains("upcard") && event.deltaX >= 0) return;
            if (trainingCard.classList.contains("upcard") && event.deltaX <= 0) return;
            swiping = true;
            carousel.style.scrollSnapType = "x mandatory";
            return;
        }
        let parentList = event.target.closest(".campaignlist, #wrap_stages");
        if (parentList && event.deltaY && parentList.style.overflowY === "auto") return;

        momentum += 0.15 * (event.deltaY ? event.deltaY : event.deltaX);

        if (event.deltaY < 0 && momentum > 0 || event.deltaY > 0 && momentum < 0) momentum = 0;

        if (momentum > 10) {
            if (mobileView) {
                mobileScroll(true);
            } else {
                scrollCards(true);
            }
            
        } else if (momentum < -10) {
            if (mobileView) {
                mobileScroll(false);
            } else {
                scrollCards(false);
            }
        }

    }, {passive: true});


    function scrollCards (right) {
        if (!cardView || debounceScroll) return;
        momentum = 0;
        let sibling = right ? upcard.nextElementSibling : upcard.previousElementSibling;
        if (!sibling) return;

        debounceScroll++;
        
        cards.forEach( (x) => {                
            if (x.classList.contains("upcard")) {
                x.classList.remove("upcard");
                x.style.zIndex -= 5;
            }   
        });
        
        sibling.classList.add("upcard");
        upcard = sibling;
        updateCardStagger();
        debounceScroll--;
    }

    function scrollCardsTo (c) {
        if (!cardView || debounceScroll) return;
        if (c.classList.contains("upcard")) return;
        cards.forEach( (x) => {
            if (x.classList.contains("upcard")) {
                x.classList.remove("upcard");
                x.style.zIndex -= 5;
            }
        });
        
        c.classList.add("upcard");
        upcard = c;
        updateCardStagger();

    }

    touchMode = mobileView;
    document.onpointerdown = (e) => {
        if (e.pointerType !== "mouse" && !e.target.closest("#navbar")) {
            touchMode = true;
        } else {
            touchMode = false;
            
        }
    };


    function updateMobile() {
        upcard = getCenteredElement(carousel);
        cardsArray.forEach( c => { if (c !== upcard) c.classList.remove("upcard")});
        upcard.classList.add("upcard");
    }

    function mobileScroll(right) {
        if (debounceMobile || swiping) return;
        debounceMobile++;
        carousel.classList.add("noswipe");
        momentum = 0;
        carousel.addEventListener("scrollend", rebounceMobile);

        let amt = right ? cardWidth + 20 : -cardWidth - 20;
        let capture = carousel.scrollLeft;
        carousel.scrollBy({
            top: 0,
            left: amt,
            behavior: "smooth",
        });

        
    }

    function rebounceMobile() {
        debounceMobile--;
        
        carousel.classList.remove("noswipe");

        carousel.removeEventListener("scrollend", rebounceMobile);
    }

    function mobileScrollTo(destination) {
        if (debounceMobile || swiping) return;
        if (destination === getCenteredElement(carousel)) return;

        debounceMobile++;
        carousel.classList.add("noswipe");
        momentum = 0;
        carousel.addEventListener("scrollend", rebounceMobile);


        let diff = cardsArray.indexOf(destination) - cardsArray.indexOf(getCenteredElement(carousel));
        let amt = diff * (cardWidth + 20);
        carousel.scrollBy({
            top: 0,
            left: amt,
            behavior: "smooth",
        });
        updateMobile();
    }

    carousel.onscrollend = event => {
        if (swiping) {
            swiping = false;
            setTimeout(()=> {
                swiping = false;
                updateMobile();             
            }, 500);
        }
    };


    const leftnav = page.querySelector("#leftnav");
    const rightnav = page.querySelector("#rightnav");

    leftnav.onpointerdown = (e) => {
        e.target.classList.add("nudged");

    }
    rightnav.onpointerdown = (e) => {
        e.target.classList.add("nudged");
    }


    leftnav.onclick = () => {
        if (mobileView && trainingCard.classList.contains("upcard")) {
            mobileScrollTo(extremeCard);
        } else if (mobileView) {
            mobileScroll(false);
        } else if (trainingCard.classList.contains("upcard")) {
            scrollCardsTo(extremeCard);
        } else {
            scrollCards(false);
        }
    }
    rightnav.onclick = () => {
        if (mobileView && extremeCard.classList.contains("upcard")) {
            mobileScrollTo(trainingCard);
        } else if (mobileView) {
            mobileScroll(true);
        } else if (extremeCard.classList.contains("upcard")) {
            scrollCardsTo(trainingCard);
        } else {
            scrollCards(true);
        }
    }

    page.querySelector("#nav1").onclick = () => {
        if (mobileView) {
            mobileScrollTo(trainingCard);
        } else if (cardView) {
            scrollCardsTo(trainingCard);
        }
    };

    page.querySelector("#nav2").onclick = () => {
        if (mobileView) {
            mobileScrollTo(cardsArray[1]);
        } else if (cardView) {
            scrollCardsTo(cardsArray[1]);
        }
    };

    page.querySelector("#nav3").onclick = () => {
        if (mobileView) {
            mobileScrollTo(cardsArray[2]);
        } else if (cardView) {
            scrollCardsTo(cardsArray[2]);
        }
    };

    page.querySelector("#nav4").onclick = () => {
        if (mobileView) {
            mobileScrollTo(cardsArray[3]);
        } else if (cardView) {
            scrollCardsTo(cardsArray[3]);
        }
    };


    screen.orientation.addEventListener("change", scrollFadeCards);

    scrollContainers.forEach( c => {
        c.addEventListener("scroll", scrollFadeCards);
    });

    function scrollFadeCards() {
        verticalScroll(wrapStages, 5);
        cardsArray.slice(1).forEach( c => {
            verticalScroll(c.querySelector(".campaignlist"), 1);
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft" && !document.querySelector("dialog[open]")) {
            e.preventDefault();
            leftnav.click();
        } else if (e.key === "ArrowRight" && !document.querySelector("dialog[open]")) {
            e.preventDefault();
            rightnav.click();
        }
    })

}

//// HAXXXXX ////
let typed = "";
document.addEventListener("keydown", (event) => {
    typed += event.key.toLowerCase();
    if (typed.includes("dean")) {
        typed = "";
        let difficulty = prompt("Which difficulty?");
        difficulty = difficulty ? difficulty.toLowerCase().trim() : "training";
        
        const level = prompt("Up to which level?");

        localStorage.setItem("highest" + difficulty[0].toUpperCase() + difficulty.substring(1), level);
        window.location.reload(true);
    }
    if (typed.length > 100) 
        typed = typed.slice(-96);
});
