let cardWidth;
let supportsSnapChanging = ("onscrollsnapchanging" in window);

function setupHome() {
    const stages = document.querySelectorAll(".trainstage");
    const trainingCard = document.getElementById("training");
    const extremeCard = document.getElementById("extreme");
    const wrapStages = document.getElementById("wrap_stages");
    const scrollContainers = document.querySelectorAll("#wrap_stages, .campaignlist");
    
    let cardView = false;
    let mobileView = false;
    let debounceScroll = 0;

    let cards = document.querySelectorAll(".card");
    let cardsArray = [...cards];
    let frontCard = cardsArray.indexOf(document.querySelector(".upcard"));

    
    document.querySelectorAll(".card li").forEach( (li) => {
        li.onfocus = (e) => {
            let thisCard = e.target.closest(".card");
            if (!thisCard.classList.contains("upcard")) {
                scrollCardsTo(thisCard);
            }
        };
    });

    function toggleDropped(e) {
        if (e.type === "keydown" && e.key !== " " && e.key !== "Enter") return;
        
        let target = e.target.closest(".trainstage");

        document.querySelectorAll(".dropped + ul > .level-button:not(.locked)").forEach((b) => {
            b.tabIndex = -1;
        });

        if (target.classList.contains("dropped")) {
            target.classList.remove("dropped");
            target.tabIndex = 0;
            
        } else {
            stages.forEach((s) => {
                s.classList.remove("dropped");
                s.tabIndex = 0;
            });

            target.classList.add("dropped");
            document.querySelectorAll(".dropped + ul > .level-button:not(.locked)").forEach((b) => {
                b.tabIndex = 0;
            });
            target.tabIndex = -1;
        }
        target.blur();
        
    }

    let block = false;
    wrapStages.addEventListener("animationend", (e) => {
        if (block) return;
        block = true;
        verticalScroll(wrapStages, vh(70) >= 450 ? 100 : 1);
        setTimeout( () => {block = false}, 10);
    });

    stages.forEach( (stage) => {
        stage.onclick = toggleDropped;
        stage.onkeydown = toggleDropped;
        stage.tabIndex = 0;
    });

    document.querySelector(".dropped").tabIndex = -1;

    document.querySelectorAll(".level-button:not(.locked)").forEach((b) => {
        b.tabIndex = -1;
        
        b.onclick = function (e) {
            // e.target.classList.add("activated");

            if (!e.target.closest(".card").classList.contains("upcard")) return;
            
            setTimeout( () => {
                Router(e.target.id);
                history.pushState({loc:e.target.id}, "");
            }, 15);
        };
        
        b.onkeydown = function (e) {
            if (e.key !== " " && e.key !== "Enter" || !(e.target.closest(".card").classList.contains("upcard"))) return;
            
            
            setTimeout(function () {
                Router(e.target.id);
                history.pushState({loc:e.target.id}, "");
            }, 15);
        };
    });

    document.querySelectorAll(".dropped + ul > .level-button").forEach( b => b.tabIndex = 0 );

    document.querySelectorAll(".level-button").forEach(b => {
        b.addEventListener("pointerdown", (e) => {
            if (!e.target.closest(".card").classList.contains("upcard")) return;
            b.classList.add("nudged");
        });
    });


    document.getElementById("main-header").onclick = function () {
        Router("index.html");
        history.pushState({loc:"index.html"}, "");
    }

    document.getElementById("shortcut").onclick = function () {
        Router('T1-1');
        history.pushState({loc:'T1-1'}, "");
        document.getElementById("about_dialog").classList.add("hide");
        
        document.getElementById("about_dialog").addEventListener("transitionend", closeDialog);
    }

    function updateCardStagger(upcard) {
        
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

            cur.style.transform = `scale(${scaleFactor})`;

            if (x === i) {
                setTimeout( () => {
                    if (cur.classList.contains("upcard"))
                        cur.style.transform = "none";
                }, 100);
            }
            cur.style.filter = `brightness(${brightFactor})`
        }

    }



    if (window.matchMedia("(width < 1450px) and (width > 600px)").matches) {
        cardView = true;
        updateCardStagger(document.querySelector(".upcard"));
    } else if (window.matchMedia("(width <= 600px)").matches) {
        mobileView = true;
        updateMobile();
    }

    window.onresize = () => {
        scrollFadeCards();
        if (window.matchMedia("(width < 1450px) and (width > 600px)").matches) {
            updateCardStagger(document.querySelector(".upcard"));
            cardView = true;
            mobileView = false;
        } else if (cardView) {
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

        if (window.matchMedia("(width <= 600px)").matches) {
            mobileView = true;
            mobileScrollTo(document.querySelector(".upcard"));
        }
    }


    cards.forEach( (c) => {
        c.onclick = () => {            
            if (isDragging) return;
            
            if (mobileView) {
                mobileScrollTo(c);
            }
            if (!cardView) return;
            
            isDragging = false;

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

    let carousel = document.getElementById("wrap_cards");
    let momentum = 0;
    let swiping = false;
    
    carousel.addEventListener('wheel', function (event) {
        if (supportsSnapChanging && mobileView && event.deltaX) {
            swiping = true;
            carousel.style.scrollSnapType = "x mandatory";
            carousel.scrollBy(0,0)
            return;
        }
        swiping = false;
        carousel.style.scrollSnapType = "";

        let parentList = event.target.closest(".campaignlist, #wrap_stages");
        if (parentList && event.deltaY && parentList.style.overflowY === "auto") return;
        if (!cardView && !mobileView) return;

        momentum += 0.15 * (event.deltaY ? event.deltaY : event.deltaX);

        if (event.deltaY < 0 && momentum > 0 || event.deltaY > 0 && momentum < 0) momentum = 0;

        if (debounceScroll) return;
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
        let sibling = right ? document.querySelector(".upcard").nextElementSibling : document.querySelector(".upcard").previousElementSibling;
        if (!sibling) return;

        debounceScroll++;
        
        cards.forEach( (x) => {                
            if (x.classList.contains("upcard")) {
                x.classList.remove("upcard");
                x.style.zIndex -= 5;
            }   
        });
        
        sibling.classList.add("upcard");
        updateCardStagger(sibling);
        debounceScroll--;
    }

    function scrollCardsTo (c) {
        if (!cardView) return;
        if (c.classList.contains("upcard")) return;
        cards.forEach( (x) => {
            if (x.classList.contains("upcard")) {
                x.classList.remove("upcard");
                x.style.zIndex -= 5;
            }
        });
        
        c.classList.add("upcard");
        updateCardStagger(c);

    }

    let isDragging = false;
    let startX = 0;
    let initialLeft = 0;

    let holding = false;
    carousel.parentNode.addEventListener('pointerdown', (e) => {
        if (!cardView) return;
        event.preventDefault();

        holding = true;
        startX = e.clientX; 
        carousel.classList.add("grabbing");
    });


    document.addEventListener('pointermove', (e) => {
        if (!cardView) return;
        if (!holding) return;

        const deltaX =  startX - e.clientX;
        momentum += (deltaX / 30);

        if (momentum < -10 && trainingCard.classList.contains("upcard")
            || momentum > 10 && extremeCard.classList.contains("upcard")) {
            momentum = 0;
            startX = e.clientX;
        } else if (momentum > 10) {
            isDragging = true;

            scrollCards(true);
            startX = e.clientX;
        } else if (momentum < -10) {
            isDragging = true;

            scrollCards(false);
            startX = e.clientX;
        }
    });

    document.addEventListener('pointerup', (e) => {
        if (!cardView) return;
        holding = false;
        carousel.classList.remove("grabbing");

        if (isDragging) {
            setTimeout( () => {
                isDragging = false;
            }, 5);
        }
    });

    let debounceMobile = 0;
    function mobileScroll(right) {
        if (debounceMobile) return;
        debounceMobile++;
        momentum = 0;
        carousel.addEventListener("scrollend", rebounceMobile);

        let amt = right ? cardWidth : -cardWidth;
        let capture = carousel.scrollLeft;
        carousel.scrollBy({
            top: 0,
            left: amt,
            behavior: "smooth",
        });        

        setTimeout( () => {
            if (capture !== carousel.scrollLeft) {
                frontCard = right ? (frontCard === 3 ? 3 : ++frontCard)
                    : (frontCard === 0 ? 0 : --frontCard);
                
                updateMobile();
            } else {carousel.dispatchEvent(new Event("scrollend")); }
        }, 100);

        
    }

    function rebounceMobile() {
        debounceMobile--;
        carousel.removeEventListener("scrollend", rebounceMobile);
    }

    function mobileScrollTo(card) {
        if (debounceMobile) return;
        let destination = cardsArray.indexOf(card);
        if (destination === frontCard) return;
        debounceMobile++;
        momentum = 0;
        carousel.addEventListener("scrollend", rebounceMobile);



        let amt = (destination - frontCard) * 346;
        carousel.scrollBy({
            top: 0,
            left: amt,
            behavior: "smooth",
        });
        frontCard = destination;
        updateMobile();
    }

    function updateMobile() {
        cardsArray.map( (c) => {
            if (c===cardsArray[frontCard])
                c.classList.add("upcard");
            else
                c.classList.remove("upcard")});
    }

    if (supportsSnapChanging) {
        carousel.onscrollsnapchanging = event => {
            if (!swiping) return;
            frontCard = cardsArray.indexOf(event.snapTargetInline);
            updateMobile();
            
        };
        carousel.onscrollsnapend = event => {
            if (!swiping) return;
            swiping = false;
        };
        carousel.onscrollend = () => {carousel.style.scrollSnapType = "";};
    } else {
        carousel.style.touchAction = "none";
        carousel.style.overflow = "hidden";
    }


    
    const leftnav = document.getElementById("leftnav");
    const rightnav = document.getElementById("rightnav");

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

    document.getElementById("nav1").onclick = () => {
        if (mobileView) {
            mobileScrollTo(trainingCard);
        } else if (cardView) {
            scrollCardsTo(trainingCard);
        }
    };

    document.getElementById("nav2").onclick = () => {
        if (mobileView) {
            mobileScrollTo(cardsArray[1]);
        } else if (cardView) {
            scrollCardsTo(cardsArray[1]);
        }
    };

    document.getElementById("nav3").onclick = () => {
        if (mobileView) {
            mobileScrollTo(cardsArray[2]);
        } else if (cardView) {
            scrollCardsTo(cardsArray[2]);
        }
    };

    document.getElementById("nav4").onclick = () => {
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
        verticalScroll(wrapStages, vh(70) >= 450 ? 100 : 1);
        cardsArray.slice(1).forEach( c => {
            verticalScroll(c.querySelector(".campaignlist"), 1);
        });
    }
}
