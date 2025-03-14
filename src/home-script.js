let cardWidth;
let supportsSnapChanging = ("onscrollsnapchanging" in window);

function setupHome(page) {
    const stages = page.querySelectorAll(".trainstage");
    const trainingCard = page.querySelector("#training");
    const extremeCard = page.querySelector("#extreme");
    const wrapStages = page.querySelector("#wrap_stages");
    const scrollContainers = page.querySelectorAll("#wrap_stages, .campaignlist");
    let carousel = page.querySelector("#wrap_cards");

    let cardView = false;
    let mobileView = false;
    let debounceScroll = 0;

    let cards = page.querySelectorAll(".card");
    let cardsArray = [...cards];
    let frontCard = cardsArray.indexOf(page.querySelector(".upcard"));

    
    page.querySelectorAll(".card li").forEach( (li) => {
        li.onfocus = (e) => {
            let thisCard = e.target.closest(".card");

            if (!thisCard.classList.contains("upcard")) {
                if (cardView) scrollCardsTo(thisCard);
                else if (mobileView) mobileScrollTo(thisCard);
            }
        };
    });

    function toggleDropped(e) {
        if (e.type === "keydown" && e.key !== " " && e.key !== "Enter") return;
        
        let target = e.target.closest(".trainstage");

        page.querySelectorAll(".dropped + ul > .level-button").forEach((b) => {
            b.tabIndex = -1;
        });

        if (target.classList.contains("dropped")) {
            target.classList.remove("dropped");
            target.tabIndex = 0;
            
        } else {
            stages.forEach((s) => {
                s.blur();
                s.classList.remove("dropped");
                s.tabIndex = 0;
            });

            target.classList.add("dropped");
            page.querySelectorAll(".dropped + ul > .level-button:not(.locked)").forEach((b) => {
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

    page.querySelector(".dropped").tabIndex = -1;

    page.querySelectorAll(".level-button:not(.locked)").forEach((b) => {
        
        b.onclick = function (e) {
            // e.target.classList.add("activated");

            if ((mobileView || cardView) && !(e.target.closest(".card").classList.contains("upcard"))) return;
            
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
        history.pushState({loc:"index.html"}, "");
    }

    page.querySelector("#shortcut").onclick = function () {
        Router('T1-1');
        history.pushState({loc:'T1-1'}, "");
        page.querySelector("#about_dialog").classList.add("hide");
        
        page.querySelector("#about_dialog").addEventListener("transitionend", closeDialog);
    }

    page.querySelectorAll(".locked").forEach(l => l.onfocus = () => {l.blur();});

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



    if (window.matchMedia("(width < 1450px) and (width > 600px)").matches) {
        cardView = true;
        updateCardStagger(page.querySelector(".upcard"));
    } else if (window.matchMedia("(width <= 600px)").matches) {
        mobileView = true;
        cardView = false;

        updateMobile();
    }

    window.onresize = () => {
        scrollFadeCards();

        let upcard = page.querySelector(".upcard");

        if (window.matchMedia("(width >= 1450px)").matches) {
            
            if (cardView) {

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
            mobileView = false;
        } else if (window.matchMedia("(width < 1450px) and (width > 600px)").matches) {
            if (!upcard) {
                trainingCard.classList.add("upcard");
                upcard = trainingCard;
            }
            
            updateCardStagger(upcard);
            cardView = true;
            mobileView = false;
        } else {
            mobileView = true;
            if (cardView) {
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
            mobileScrollTo(page.querySelector(".upcard") || trainingCard);
        }
    };


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

    let momentum = 0;
    let swiping = false;

    carousel.onscroll = mobileSwipe;

    function mobileSwipe() {
        if (supportsSnapChanging && mobileView && !debounceMobile) {
            swiping = true;
            carousel.style.scrollSnapType = "x mandatory";
            carousel.scrollBy(0,0)
            return;
        }
    }

    
    carousel.addEventListener('wheel', function (event) {
        if (debounceScroll || debounceMobile || swiping) return;
        if (!cardView && !mobileView) return;

        if (supportsSnapChanging && mobileView && event.deltaX && !carousel.classList.contains("noswipe")) {
            if (extremeCard.classList.contains("upcard") && event.deltaX >= 0) return;
            if (trainingCard.classList.contains("upcard") && event.deltaX <= 0) return;
            swiping = true;

            carousel.style.scrollSnapType = "x mandatory";
            carousel.scrollBy(0,0)
            return;
        }
        carousel.onscroll = "";

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
        let sibling = right ? page.querySelector(".upcard").nextElementSibling : page.querySelector(".upcard").previousElementSibling;
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
        if (!cardView && !mobileView || e.target.closest("#navbar")) return;
        event.preventDefault();

        holding = true;
        startX = e.clientX;
        startY = e.clientY;
        if (!e.target.matches(".level-button, .trainstage")) { carousel.classList.add("grabbing");
                                                             }
    });


    document.addEventListener('pointermove', (e) => {
        if (!cardView && !mobileView) return;
        if (!holding) return;
        if (touchMode && supportsSnapChanging && mobileView) return;
        carousel.classList.add("grabbing");

        const deltaY = startY - e.clientY;
        const cont = e.target.closest(".campaignlist, #wrap_stages");
        if (cont?.style.overflowY && cont.style.overflowY !== "visible" && deltaY) {
            cont.scrollBy(0, deltaY);
            startY = e.clientY;
            return;
        }
        const deltaX =  startX - e.clientX;
        if (deltaX < 0 && momentum > 0 || deltaX > 0 && momentum < 0) momentum = 0;

        momentum += (deltaX / 62);



        if (momentum < -10 && trainingCard.classList.contains("upcard")
            || momentum > 10 && extremeCard.classList.contains("upcard")) {
            momentum = 0;
            startX = e.clientX;
        } else if (momentum > 10) {
            isDragging = true;
            if (mobileView) mobileScroll(true);
            else scrollCards(true);
            startX = e.clientX;
        } else if (momentum < -10) {
            isDragging = true;

            if (mobileView) mobileScroll(false);
            else scrollCards(false);
            startX = e.clientX;
        }
    });

    touchMode = mobileView;
    document.onpointerdown = (e) => {
        if (e.pointerType !== "mouse" && !e.target.closest("#navbar")) {
            touchMode = true;
            carousel.onscroll = mobileSwipe;
        } else {
            touchMode = false;
            
        }
    };

    document.addEventListener('pointerup', (e) => {
        if (!cardView && !mobileView) return;

        holding = false;

        carousel.classList.remove("grabbing");
        carousel.onscroll = "";
        
        if (isDragging) {
            setTimeout( () => {
                isDragging = false;
            }, 5);
        }
    });

    document.addEventListener('touchend', (e) => {

        if (!cardView && !mobileView) return;

        holding = false;
        carousel.onscroll = "";
        
        carousel.classList.remove("grabbing");
        if (isDragging) {
            setTimeout( () => {
                isDragging = false;

            }, 5);
        }
    });

    let debounceMobile = 0;
    function mobileScroll(right) {
        if (debounceMobile || swiping) return;
        debounceMobile++;
        carousel.classList.add("noswipe");
        momentum = 0;
        carousel.addEventListener("scrollend", rebounceMobile);
        carousel.onscroll = "";

        let amt = right ? cardWidth + 20 : -cardWidth - 20;
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

        carousel.classList.remove("noswipe");

        carousel.removeEventListener("scrollend", rebounceMobile);
        
    }

    function mobileScrollTo(card) {
        if (debounceMobile || swiping) return;
        let destination = cardsArray.indexOf(card);

        if (destination === frontCard) return;

        debounceMobile++;
        carousel.classList.add("noswipe");
        momentum = 0;
        carousel.addEventListener("scrollend", rebounceMobile);
        carousel.onscroll = "";


        let amt = (destination - frontCard) * (cardWidth + 20);
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
            frontCard = cardsArray.indexOf(event.snapTargetInline);
            updateMobile();
            
        };
        carousel.onscrollend = event => {
            swiping = false;

            carousel.style.scrollSnapType = "";
            carousel.onscroll = "";
        };
    } else {
        carousel.style.touchAction = "none";
        carousel.style.overflow = "hidden";
    }

    
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
        verticalScroll(wrapStages, vh(70) >= 450 ? 100 : 1);
        cardsArray.slice(1).forEach( c => {
            verticalScroll(c.querySelector(".campaignlist"), 1);
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") {
            e.preventDefault();
            leftnav.click();
        } else if (e.key === "ArrowRight" || e.key === " ") {
            e.preventDefault();
            rightnav.click();
        }
    })

}
