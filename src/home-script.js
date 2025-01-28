function setupHome() {
    const stages = document.querySelectorAll(".trainstage");

    function toggleDropped(e) {
        if (e.type === "keydown" && e.key !== " " && e.key !== "Enter" || !(e.target.closest(".card").classList.contains("upcard"))) return;
        
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
            let cur = Array.from(cards)[x];
            let scaleFactor = (100 - (Math.abs(x - i) * 1.9)) / 100;
            let brightFactor = (100 - (Math.abs(x - i) * 1.35)) / 100;

            cur.style.transform = `scale(${scaleFactor})`;

            if (x === i) {
                setTimeout( () => {
                    cur.style.transform = "none";
                }, 100);
            }
            cur.style.filter = `brightness(${brightFactor})`
        }

    }


    let cardView = false;
    let cards = document.querySelectorAll(".card");
    
    if (window.matchMedia("(width < 1450px) and (width > 600px)").matches) {
        updateCardStagger(document.querySelector(".upcard"));
        cardView = true;
    }
    
    window.onresize = () => {
        scrollFadeCards();
        if (window.matchMedia("(width < 1450px) and (width > 600px)").matches) {
            updateCardStagger(document.querySelector(".upcard"));
            cardView = true;
        } else if (cardView) {
            cardView = false;
            cards.forEach( c => {
                c.style.transform = "scale(1)";
                c.style.filter = "brightness(1)"
                setTimeout( () => {
                    c.style.transform = "none";
                    c.style.filter = "none";
                }, 100);
            });
        }
    }


    cards.forEach( (c) => {
        c.onclick = () => {            
            if (!cardView || isDragging) return;
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

    carousel.addEventListener('wheel', function (event) {
        let parentList = event.target.closest(".campaignlist, #wrap_stages");
        if (parentList && event.deltaY && parentList.style.overflowY === "auto") return;
        if (!cardView) return;
        momentum += 0.5 * (event.deltaY ? event.deltaY : event.deltaX);

        if (momentum > 10) {
            scrollCards(true);
            
        } else if (momentum < -10) {
            scrollCards(false);
        }

    }, {passive: true});


    function scrollCards (right) {
        if (!cardView) return;
        momentum = 0;
        let sibling = right ? document.querySelector(".upcard").nextElementSibling : document.querySelector(".upcard").previousElementSibling;
        if (!sibling) return;

        cards.forEach( (x) => {                
            if (x.classList.contains("upcard")) {
                x.classList.remove("upcard");
                x.style.zIndex -= 5;
            }   
        });
        
        sibling.classList.add("upcard");
        updateCardStagger(sibling);
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

    holding = false;
    carousel.addEventListener('pointerdown', (e) => {
        if (!cardView) return;
        holding = true;
        startX = e.clientX; 
        carousel.classList.add("grabbing");
    });

    let debounceScroll = 0;
    document.querySelector(".page.home").addEventListener('pointermove', (e) => {
        if (!cardView) return;
        if (!holding) return;
        if (debounceScroll) return;
        debounceScroll++;

        const deltaX =  startX - e.clientX;
        momentum += (deltaX / 30);

        if (momentum < -10 && document.getElementById("training").classList.contains("upcard")
            || momentum > 10 && document.getElementById("extreme").classList.contains("upcard")) {
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
        debounceScroll--;
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

    document.getElementById("leftnav").onclick = () => {
        if (document.getElementById("training").classList.contains("upcard")) {
            scrollCardsTo(Array.from(cards)[3]);
        } else {
            scrollCards(false);
        }
    }
    document.getElementById("rightnav").onclick = () => {
        if (document.getElementById("extreme").classList.contains("upcard")) {
            scrollCardsTo(Array.from(cards)[0]);
        } else {
            scrollCards(true);
        }
    }

    document.getElementById("nav1").onclick = () => {
        scrollCardsTo(Array.from(cards)[0]);
    };
    
    document.getElementById("nav2").onclick = () => {
        scrollCardsTo(Array.from(cards)[1]);
    };
    
    document.getElementById("nav3").onclick = () => {
        scrollCardsTo(Array.from(cards)[2]);
    };
    
    document.getElementById("nav4").onclick = () => {
        scrollCardsTo(Array.from(cards)[3]);
    };


    screen.orientation.addEventListener("change", scrollFadeCards);

    [...cards].forEach( c => {
        c.querySelector(".campaignlist, #wrap_stages").addEventListener("scroll", scrollFadeCards);
    });

    function scrollFadeCards() {
        [...cards].forEach( c => {
            verticalScroll(c.querySelector(".campaignlist, #wrap_stages"), 3);
        });
    }
}
