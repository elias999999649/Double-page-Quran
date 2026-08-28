const TOTAL_PAGES = 604;


/*
    --------------------------------------------------
    WICHTIG:

    Bei einem arabischen Mushaf befindet sich
    die frühere Seite rechts.

    Daher:

        links  = Seite 2
        rechts = Seite 1

    Danach:

        links  = Seite 4
        rechts = Seite 3

    Danach:

        links  = Seite 6
        rechts = Seite 5
    --------------------------------------------------
*/


let rightPageNumber = 1;
let leftPageNumber = 2;


let zoomLevel = 1;

const MIN_ZOOM = 0.8;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.1;


/* ================================= */
/* ELEMENTE                         */
/* ================================= */

const leftPage =
    document.getElementById(
        "leftPage"
    );


const rightPage =
    document.getElementById(
        "rightPage"
    );

const oldLeftPage = document.getElementById("oldLeftPage");
const oldRightPage = document.getElementById("oldRightPage");
let oldMushafPages = null;


const pageInfo =
    document.getElementById(
        "pageInfo"
    );


const previousButton =
    document.getElementById(
        "previousButton"
    );


const nextButton =
    document.getElementById(
        "nextButton"
    );


const zoomOutButton =
    document.getElementById(
        "zoomOut"
    );


const zoomInButton =
    document.getElementById(
        "zoomIn"
    );


const zoomValue =
    document.getElementById(
        "zoomValue"
    );


const fullscreenButton =
    document.getElementById(
        "fullscreenButton"
    );


const pageInput =
    document.getElementById(
        "pageInput"
    );


const openPageButton =
    document.getElementById(
        "openPageButton"
    );


/* ================================= */
/* SEITEN-URL                        */
/* ================================= */

function getPagePath(pageNumber) {

    const padded =
        String(pageNumber)
            .padStart(3, "0");

    const folder = localStorage.getItem("quran_mushaf") === "old"
        ? "pagesoldmushaf"
        : "pages";

    return `${folder}/${padded}.svg`;

}


/* ================================= */
/* SEITEN AKTUALISIEREN              */
/* ================================= */

function updatePages() {

    const isOldMushaf = localStorage.getItem("quran_mushaf") === "old";

    if (isOldMushaf) {
        leftPage.style.display = "none";
        rightPage.style.display = "none";
        renderOldPage(oldLeftPage, leftPageNumber);
        renderOldPage(oldRightPage, rightPageNumber);
    } else {
        leftPage.style.display = "block";
        rightPage.style.display = "block";
        oldLeftPage.style.display = "none";
        oldRightPage.style.display = "none";
    }

    leftPage.src =
        getPagePath(
            leftPageNumber
        );


    rightPage.src =
        getPagePath(
            rightPageNumber
        );


    leftPage.alt =
        `Mushaf Seite ${leftPageNumber}`;


    rightPage.alt =
        `Mushaf Seite ${rightPageNumber}`;


    /*
        Wir schreiben bewusst:

            Seiten 2 – 1

        weil die physische Buchreihenfolge
        rechts nach links gelesen wird.
    */

    pageInfo.textContent =
        `${translations?.[currentLanguage]?.pages || "Seiten"} ${leftPageNumber} – ${rightPageNumber}`;


    pageInput.value =
        rightPageNumber;


    updateNavigation();

}

async function loadOldMushafData() {
    if (oldMushafPages) return oldMushafPages;
    const response = await fetch("old-mushaf-pages.json");
    if (!response.ok) throw new Error("Old Mushaf Daten konnten nicht geladen werden");
    oldMushafPages = await response.json();
    return oldMushafPages;
}

function renderOldPage(container, pageNumber) {
    if (!container) return;
    container.style.display = "flex";
    container.innerHTML = "<div class='old-page-loading'>Lade Seite ...</div>";
    loadOldMushafData().then((pages) => {
        const lines = pages[String(pageNumber)] || [];
        const fontName = `old-page-${pageNumber}`;
        if (!document.getElementById(fontName)) {
            const fontStyle = document.createElement("style");
            fontStyle.id = fontName;
            fontStyle.textContent = `@font-face { font-family: '${fontName}'; src: url('pagesoldmushaf/p${pageNumber}.ttf') format('truetype'); }`;
            document.head.appendChild(fontStyle);
        }
        container.style.fontFamily = `'${fontName}'`;
        container.innerHTML = lines.map((line) => {
            const count = Number.isInteger(line.first) && Number.isInteger(line.last)
                ? line.last - line.first + 1
                : 0;
            const glyphs = count > 0
                ? Array.from({ length: count }, (_, index) =>
                    String.fromCharCode(64336 + line.first + index)
                ).join("")
                : "";
            return `<div class="old-mushaf-line ${line.centered ? "centered" : ""} ${count ? "" : "empty"}">${glyphs}</div>`;
        }).join("");
    }).catch(() => {
        container.innerHTML = "<div class='old-page-error'>Old Mushaf konnte nicht geladen werden.</div>";
    });
}


/* ================================= */
/* NAVIGATION                        */
/* ================================= */

function updateNavigation() {

    /*
        Am Anfang befinden wir uns auf:

            2 | 1

        Deshalb kann man nicht
        weiter zurück.
    */

    previousButton.disabled =
        rightPageNumber <= 1;


    /*
        Am Ende:

            604 | 603

        bzw. je nach Darstellung
        die letzte Seite.
    */

    nextButton.disabled =
        rightPageNumber + 2 > TOTAL_PAGES;

}


/* ================================= */
/* NÄCHSTE DOPPELSEITE               */
/* ================================= */

function nextSpread() {

    /*
        Wenn wir z.B. haben:

            2 | 1

        wird daraus:

            4 | 3
    */

    if (
        rightPageNumber + 2 >
        TOTAL_PAGES
    ) {

        return;

    }


    rightPageNumber += 2;

    leftPageNumber += 2;


    /*
        updatePages lädt die
        neuen SVG-Dateien.
    */

    updatePages();

}


/* ================================= */
/* VORHERIGE DOPPELSEITE             */
/* ================================= */

function previousSpread() {

    if (
        rightPageNumber <= 1
    ) {

        return;

    }


    rightPageNumber -= 2;

    leftPageNumber -= 2;


    updatePages();

}


/* ================================= */
/* ZU EINER SEITE SPRINGEN           */
/* ================================= */

function goToPage(pageNumber) {

    pageNumber =
        Number.parseInt(
            pageNumber,
            10
        );


    if (
        Number.isNaN(pageNumber)
    ) {

        return;

    }


    if (
        pageNumber < 1
    ) {

        pageNumber = 1;

    }


    if (
        pageNumber > TOTAL_PAGES
    ) {

        pageNumber = TOTAL_PAGES;

    }


    /*
        Eingabe 1:

            links  = 2
            rechts = 1


        Eingabe 2:

            links  = 2
            rechts = 1


        Eingabe 3:

            links  = 4
            rechts = 3


        Eingabe 4:

            links  = 4
            rechts = 3
    */


    if (
        pageNumber % 2 === 1
    ) {

        rightPageNumber =
            pageNumber;


        leftPageNumber =
            Math.min(
                pageNumber + 1,
                TOTAL_PAGES
            );

    } else {

        rightPageNumber =
            pageNumber - 1;


        leftPageNumber =
            pageNumber;

    }


    updatePages();

}


/* ================================= */
/* ZOOM                              */
/* ================================= */

function updateZoom() {

    document.documentElement
        .style
        .setProperty(
            "--zoom",
            zoomLevel
        );


    /*
        Wir verändern nicht das SVG.

        Wir verändern nur die Größe
        der Buchansicht.
    */

    leftPage.style.transform =
        `scale(${zoomLevel})`;

    rightPage.style.transform =
        `scale(${zoomLevel})`;


    /*
        transform-origin sorgt dafür,
        dass die Seite nicht aus ihrer
        Position verschwindet.
    */

    leftPage.style.transformOrigin =
        "center center";

    rightPage.style.transformOrigin =
        "center center";


    zoomValue.textContent =
        `${Math.round(
            zoomLevel * 100
        )}%`;

}


/* ================================= */
/* ZOOM OUT                          */
/* ================================= */

function zoomOut() {

    zoomLevel =
        Math.max(
            MIN_ZOOM,
            zoomLevel - ZOOM_STEP
        );


    updateZoom();

}


/* ================================= */
/* ZOOM IN                           */
/* ================================= */

function zoomIn() {

    zoomLevel =
        Math.min(
            MAX_ZOOM,
            zoomLevel + ZOOM_STEP
        );


    updateZoom();

}


/* ================================= */
/* FULLSCREEN                        */
/* ================================= */

async function toggleFullscreen() {

    try {

        if (
            !document.fullscreenElement
        ) {

            await document.documentElement
                .requestFullscreen();

        } else {

            await document.exitFullscreen();

        }

    } catch (error) {

        console.error(
            "Vollbild konnte nicht aktiviert werden:",
            error
        );

    }

}


/* ================================= */
/* BUTTONS                           */
/* ================================= */

const themeToggleBtn = document.getElementById("themeToggle");
const singleDoubleToggleBtn = document.getElementById("singleDoubleToggle");
const languageButton = document.getElementById("languageButton");
const infoModal = document.getElementById("infoModal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const closeModalButton = document.getElementById("closeModal");

const translations = {
    de: { label: "Deutsch", pages: "Seiten", jump: "Zu Seite", open: "Öffnen", language: "Sprache", help: "← / → Blättern | F Vollbild | T Design | S Ansicht | I Suren", index: "Suren", bookmarks: "Lesezeichen", mushaf: "Mushaf", theme: "Design", view: "Ansicht", zoom: "Zoom", fullscreen: "Vollbild", prev: "Zurück", next: "Weiter", single: "Einzelseite", double: "Doppelseite", indexTitle: "Suren-Index", bookmarksTitle: "Meine Lesezeichen", mushafTitle: "Mushaf-Ausgabe", modern: "Moderner Mushaf", old: "Alter Mushaf", active: "Aktiv", select: "Auswählen", page: "Seite", noBookmarks: "Keine Lesezeichen vorhanden." },
    ar: { label: "العربية", pages: "صفحات", jump: "اذهب إلى الصفحة", open: "فتح", language: "اللغة", help: "← / → للتنقل | F ملء الشاشة | T المظهر | S العرض | I السور", index: "السور", bookmarks: "الإشارات", mushaf: "المصحف", theme: "المظهر", view: "العرض", zoom: "تكبير", fullscreen: "ملء الشاشة", prev: "السابق", next: "التالي", single: "صفحة واحدة", double: "صفحتان", indexTitle: "فهرس السور", bookmarksTitle: "إشاراتي المرجعية", mushafTitle: "إصدار المصحف", modern: "المصحف الحديث", old: "المصحف القديم", active: "مفعل", select: "اختيار", page: "صفحة", noBookmarks: "لا توجد إشارات مرجعية." },
    en: { label: "English", pages: "Pages", jump: "Go to page", open: "Open", language: "Language", help: "← / → Browse | F Fullscreen | T Theme | S View | I Surahs", index: "Surahs", bookmarks: "Bookmarks", mushaf: "Mushaf", theme: "Theme", view: "View", zoom: "Zoom", fullscreen: "Fullscreen", prev: "Prev", next: "Next", single: "Single page", double: "Double page", indexTitle: "Surah index", bookmarksTitle: "My bookmarks", mushafTitle: "Mushaf edition", modern: "Modern Mushaf", old: "Old Mushaf", active: "Active", select: "Select", page: "Page", noBookmarks: "No bookmarks saved." },
    tr: { label: "Türkçe", pages: "Sayfalar", jump: "Sayfaya git", open: "Aç", language: "Dil", help: "← / → Gezin | F Tam ekran | T Tema | S Görünüm | I Sureler", index: "Sureler", bookmarks: "Yer imleri", mushaf: "Mushaf", theme: "Tema", view: "Görünüm", zoom: "Yakınlaştır", fullscreen: "Tam ekran", prev: "Geri", next: "İleri", single: "Tek sayfa", double: "Çift sayfa", indexTitle: "Sure dizini", bookmarksTitle: "Yer imlerim", mushafTitle: "Mushaf sürümü", modern: "Modern Mushaf", old: "Eski Mushaf", active: "Aktif", select: "Seç", page: "Sayfa", noBookmarks: "Kayıtlı yer imi yok." },
    ur: { label: "اردو", pages: "صفحات", jump: "صفحہ پر جائیں", open: "کھولیں", language: "زبان", help: "← / → براؤز | F مکمل اسکرین | T تھیم | S منظر | I سورتیں", index: "سورتیں", bookmarks: "بک مارکس", mushaf: "مصحف", theme: "تھیم", view: "منظر", zoom: "زوم", fullscreen: "اسکرین", prev: "پیچھے", next: "آگے", single: "ایک صفحہ", double: "دو صفحات", indexTitle: "سورتوں کی فہرست", bookmarksTitle: "میرے بک مارکس", mushafTitle: "مصحف کا ایڈیشن", modern: "جدید مصحف", old: "پرانا مصحف", active: "فعال", select: "منتخب کریں", page: "صفحہ", noBookmarks: "کوئی بک مارک محفوظ نہیں۔" },
    id: { label: "Bahasa Indonesia", pages: "Halaman", jump: "Ke halaman", open: "Buka", language: "Bahasa", help: "← / → Jelajah | F Layar penuh | T Tema | S Tampilan | I Surah", index: "Surah", bookmarks: "Bookmark", mushaf: "Mushaf", theme: "Tema", view: "Tampilan", zoom: "Zoom", fullscreen: "Layar penuh", prev: "Kembali", next: "Lanjut", single: "Satu halaman", double: "Dua halaman", indexTitle: "Indeks surah", bookmarksTitle: "Bookmark saya", mushafTitle: "Edisi mushaf", modern: "Mushaf modern", old: "Mushaf lama", active: "Aktif", select: "Pilih", page: "Halaman", noBookmarks: "Belum ada bookmark." },
    fr: { label: "Français", pages: "Pages", jump: "Aller à la page", open: "Ouvrir", language: "Langue", help: "← / → Parcourir | F Plein écran | T Thème | S Vue | I Sourates", index: "Sourates", bookmarks: "Favoris", mushaf: "Mushaf", theme: "Thème", view: "Vue", zoom: "Zoom", fullscreen: "Plein écran", prev: "Retour", next: "Suivant", single: "Page seule", double: "Deux pages", indexTitle: "Index des sourates", bookmarksTitle: "Mes favoris", mushafTitle: "Édition du mushaf", modern: "Mushaf moderne", old: "Ancien mushaf", active: "Actif", select: "Sélectionner", page: "Page", noBookmarks: "Aucun favori enregistré." }
};

let currentLanguage = localStorage.getItem("quran_language") || "de";

function applyLanguage(language) {
    if (!translations[language]) return;
    currentLanguage = language;
    localStorage.setItem("quran_language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" || language === "ur" ? "rtl" : "ltr";
    const t = translations[language];
    document.querySelector(".page-jump label").textContent = t.jump;
    openPageButton.textContent = t.open;
    document.querySelector(".keyboard-help").textContent = t.help;
    pageInfo.textContent = `${t.pages} ${leftPageNumber} – ${rightPageNumber}`;
    
    surahButton.title = t.index;
    surahButton.querySelector(".button-label").textContent = t.index;
    bookmarkButton.title = t.bookmarks;
    bookmarkButton.querySelector(".button-label").textContent = t.bookmarks;
    mushafButton.title = t.mushaf;
    mushafButton.querySelector(".button-label").textContent = t.mushaf;
    languageButton.title = t.language;
    languageButton.querySelector(".button-label").textContent = t.language;
    themeToggleBtn.title = t.theme;
    themeToggleBtn.querySelector(".button-label").textContent = t.theme;
    singleDoubleToggleBtn.title = t.view;
    singleDoubleToggleBtn.querySelector(".button-label").textContent = t.view;
    zoomOutButton.title = t.zoom;
    zoomOutButton.querySelector(".button-label").textContent = t.zoom;
    fullscreenButton.title = t.fullscreen;
    fullscreenButton.querySelector(".button-label").textContent = t.fullscreen;
    previousButton.querySelector(".page-button-label").textContent = t.prev;
    nextButton.querySelector(".page-button-label").textContent = t.next;
    previousButton.title = t.prev;
    nextButton.title = t.next;
    previousButton.setAttribute("aria-label", t.prev);
    nextButton.setAttribute("aria-label", t.next);
    updateViewButtonText();
}

function openInfoModal(title, content) {
    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    infoModal.classList.add("active");
}

function updateViewButtonText() {
    if (!singleDoubleToggleBtn || !translations[currentLanguage]) return;
    const t = translations[currentLanguage];
    const label = isSinglePageMode ? t.single : t.double;
    singleDoubleToggleBtn.title = label;
    singleDoubleToggleBtn.setAttribute("aria-label", label);
    singleDoubleToggleBtn.querySelector(".button-label").textContent = label;
}

function closeInfoModal() {
    infoModal.classList.remove("active");
}

if (languageButton) {
    languageButton.addEventListener("click", () => {
        const options = Object.entries(translations).map(([code, translation]) =>
            `<button class="modal-item language-item" type="button" data-language="${code}">${translation.label}<span>${code.toUpperCase()}</span></button>`
        ).join("");
        openInfoModal(translations[currentLanguage].language, options);
    });
}

if (modalBody) {
    modalBody.addEventListener("click", (event) => {
        const item = event.target.closest("[data-language]");
        if (!item) return;
        applyLanguage(item.dataset.language);
        closeInfoModal();
    });
}

if (closeModalButton) closeModalButton.addEventListener("click", closeInfoModal);
if (infoModal) {
    infoModal.addEventListener("click", (event) => {
        if (event.target === infoModal) closeInfoModal();
    });
}

const surahButton = document.getElementById("surahButton");
const bookmarkButton = document.getElementById("bookmarkButton");
const mushafButton = document.getElementById("mushafButton");

const surahs = [
    [1, "Al-Fatiha", 1], [2, "Al-Baqarah", 2], [3, "Ali 'Imran", 50],
    [4, "An-Nisa", 77], [5, "Al-Ma'idah", 106], [6, "Al-An'am", 128],
    [7, "Al-A'raf", 151], [8, "Al-Anfal", 177], [9, "At-Tawbah", 187],
    [10, "Yunus", 208], [11, "Hud", 221], [12, "Yusuf", 235],
    [18, "Al-Kahf", 293], [36, "Ya-Sin", 440], [55, "Ar-Rahman", 531],
    [67, "Al-Mulk", 562], [112, "Al-Ikhlas", 604], [113, "Al-Falaq", 604], [114, "An-Nas", 604]
];

function getBookmarks() {
    try {
        return JSON.parse(localStorage.getItem("quran_bookmarks") || "[]");
    } catch {
        return [];
    }
}

if (surahButton) {
    surahButton.addEventListener("click", () => {
        const t = translations[currentLanguage];
        const items = surahs.map(([number, name, page]) =>
            `<button class="modal-item" type="button" data-page="${page}"><span>${number}. ${name}</span><span>${t.page} ${page}</span></button>`
        ).join("");
        openInfoModal(t.indexTitle, items);
    });
}

if (bookmarkButton) {
    bookmarkButton.addEventListener("click", () => {
        const t = translations[currentLanguage];
        const bookmarks = getBookmarks();
        if (!bookmarks.includes(rightPageNumber)) {
            bookmarks.push(rightPageNumber);
            bookmarks.sort((a, b) => a - b);
            localStorage.setItem("quran_bookmarks", JSON.stringify(bookmarks));
        }
        const items = bookmarks.length
            ? bookmarks.map((page) => `<button class="modal-item" type="button" data-page="${page}"><span>${t.page} ${page}</span><span>${t.open}</span></button>`).join("")
            : `<p>${t.noBookmarks}</p>`;
        openInfoModal(t.bookmarksTitle, items);
    });
}

if (mushafButton) {
    mushafButton.addEventListener("click", () => {
        const t = translations[currentLanguage];
        const selected = localStorage.getItem("quran_mushaf") || "modern";
        const items = `
            <button class="modal-item" type="button" data-mushaf="modern">
                <span>${t.modern}</span><span>${selected === "modern" ? t.active : t.select}</span>
            </button>
            <button class="modal-item" type="button" data-mushaf="old">
                <span>${t.old}</span><span>${selected === "old" ? t.active : t.select}</span>
            </button>`;
        openInfoModal(t.mushafTitle, items);
    });
}

if (modalBody) {
    modalBody.addEventListener("click", (event) => {
        const pageItem = event.target.closest("[data-page]");
        const mushafItem = event.target.closest("[data-mushaf]");
        if (pageItem) {
            goToPage(Number(pageItem.dataset.page));
            closeInfoModal();
        }
        if (mushafItem) {
            localStorage.setItem("quran_mushaf", mushafItem.dataset.mushaf);
            updatePages();
            closeInfoModal();
        }
    });
}

let currentThemeIndex = Number(localStorage.getItem("quran_theme_index") || 0);
const themes = ["theme-classic", "theme-sepia", "theme-dark", "theme-ocean"];

document.body.classList.add(themes[currentThemeIndex]);

if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
        document.body.classList.remove(...themes);
        currentThemeIndex = (currentThemeIndex + 1) % themes.length;
        document.body.classList.add(themes[currentThemeIndex]);
        localStorage.setItem("quran_theme_index", currentThemeIndex);
    });
}

let isSinglePageMode = false;
const leftPageContainer = document.getElementById("leftPageContainer");
const rightPageContainer = document.getElementById("rightPageContainer");
const bookSpine = document.querySelector(".book-spine");

if (singleDoubleToggleBtn) {
    singleDoubleToggleBtn.addEventListener("click", () => {
        isSinglePageMode = !isSinglePageMode;
        localStorage.setItem("quran_single_page", String(isSinglePageMode));
        if (isSinglePageMode) {
            if (leftPageContainer) leftPageContainer.style.display = "none";
            if (bookSpine) bookSpine.style.display = "none";
        } else {
            if (leftPageContainer) leftPageContainer.style.display = "";
            if (bookSpine) bookSpine.style.display = "";
        }
        updateViewButtonText();
    });
}

isSinglePageMode = localStorage.getItem("quran_single_page") === "true";
if (isSinglePageMode && leftPageContainer && bookSpine) {
    leftPageContainer.style.display = "none";
    bookSpine.style.display = "none";
}

previousButton.addEventListener(
    "click",
    previousSpread
);


nextButton.addEventListener(
    "click",
    nextSpread
);


zoomOutButton.addEventListener(
    "click",
    zoomOut
);


zoomInButton.addEventListener(
    "click",
    zoomIn
);


fullscreenButton.addEventListener(
    "click",
    toggleFullscreen
);


openPageButton.addEventListener(
    "click",
    function () {

        goToPage(
            pageInput.value
        );

    }
);


/* ================================= */
/* ENTER                             */
/* ================================= */

pageInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter"
        ) {

            goToPage(
                pageInput.value
            );

        }

    }
);


/* ================================= */
/* TASTATUR                          */
/* ================================= */

document.addEventListener(
    "keydown",
    function (event) {

        /*
            Wenn der Cursor im Eingabefeld
            steht, sollen Pfeiltasten
            nicht die Seiten wechseln.
        */

        if (
            document.activeElement === pageInput
        ) {

            return;

        }


        /*
            RECHTSPFEIL

            Nach rechts blättern wir
            zurück.

            Deshalb ist die Buchnavigation
            bewusst anders herum.
        */

        if (
            event.key === "ArrowRight"
        ) {

            previousSpread();

        }


        /*
            LINKSPFEIL

            Nach links blättern wir
            weiter im Quran.
        */

        if (
            event.key === "ArrowLeft"
        ) {

            nextSpread();

        }


        if (
            event.key === "+"
        ) {

            zoomIn();

        }


        if (
            event.key === "-"
        ) {

            zoomOut();

        }

        if (event.key.toLowerCase() === "f") {
            toggleFullscreen();
        }

        if (event.key.toLowerCase() === "t" && themeToggleBtn) {
            themeToggleBtn.click();
        }

        if (event.key.toLowerCase() === "s" && singleDoubleToggleBtn) {
            singleDoubleToggleBtn.click();
        }

        if (event.key.toLowerCase() === "i" && surahButton) {
            surahButton.click();
        }

        if (event.key === "Escape" && infoModal) {
            closeInfoModal();
        }

    }
);


/* ================================= */
/* START                             */
/* ================================= */

updatePages();

updateZoom();

applyLanguage(currentLanguage);