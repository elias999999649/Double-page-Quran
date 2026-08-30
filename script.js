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
let oldMushafGlyphMap = null;


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

function getStoredMushaf() {
    const stored = localStorage.getItem("quran_mushaf");
    return stored === "old" ? "old" : "modern";
}

function setStoredMushaf(mushaf) {
    const normalized = mushaf === "old" ? "old" : "modern";
    localStorage.setItem("quran_mushaf", normalized);
    return normalized;
}

function getPagePath(pageNumber) {

    const padded =
        String(pageNumber)
            .padStart(3, "0");

    const folder = getStoredMushaf() === "old"
        ? "pagesoldmushaf"
        : "pages";

    return `${folder}/${padded}.svg`;

}


/* ================================= */
/* SEITEN AKTUALISIEREN              */
/* ================================= */

function updatePages() {

    const isOldMushaf = getStoredMushaf() === "old";

    if (isOldMushaf) {
        leftPage.style.display = "none";
        rightPage.style.display = "none";
        oldLeftPage.style.display = "flex";
        oldRightPage.style.display = "flex";
        renderOldPage(oldLeftPage, leftPageNumber);
        renderOldPage(oldRightPage, rightPageNumber);
        leftPage.removeAttribute("src");
        rightPage.removeAttribute("src");
        leftPage.alt = "";
        rightPage.alt = "";
    } else {
        leftPage.style.display = "block";
        rightPage.style.display = "block";
        oldLeftPage.style.display = "none";
        oldRightPage.style.display = "none";
        oldLeftPage.innerHTML = "";
        oldRightPage.innerHTML = "";
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
    }

    if (!isOldMushaf) {
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
    }


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

    // Automatisches Preloading der Nachbarseiten im Hintergrund
    preloadAdjacentPages();

}

async function loadOldMushafData() {
    if (oldMushafPages) return oldMushafPages;
    const response = await fetch("old-mushaf-pages.json");
    if (!response.ok) throw new Error("Old Mushaf Daten konnten nicht geladen werden");
    oldMushafPages = await response.json();
    return oldMushafPages;
}

async function loadOldMushafGlyphMap() {
    if (oldMushafGlyphMap) return oldMushafGlyphMap;
    const response = await fetch("pagesoldmushaf/qpc-v1-glyph-codes-wbw.json");
    if (!response.ok) throw new Error("Old Mushaf Glyph-Daten konnten nicht geladen werden");
    const glyphData = await response.json();
    oldMushafGlyphMap = Object.fromEntries(
        Object.values(glyphData).map((entry) => [String(entry.id), entry.text || ""])
    );
    return oldMushafGlyphMap;
}

function renderOldPage(container, pageNumber) {
    if (!container) return;
    container.style.display = "flex";
    
    // Wenn Daten schon da sind, direkt rendern ohne "Lade Seite ..." flackern
    if (oldMushafPages && oldMushafGlyphMap) {
        renderOldPageContent(container, pageNumber, oldMushafPages, oldMushafGlyphMap);
    } else {
        container.innerHTML = "<div class='old-page-loading'>Lade Seite ...</div>";
    }

    Promise.all([
        loadOldMushafData(),
        loadOldMushafGlyphMap()
    ]).then(([pages, glyphMap]) => {
        renderOldPageContent(container, pageNumber, pages, glyphMap);
    }).catch(() => {
        container.innerHTML = "<div class='old-page-error'>Old Mushaf konnte nicht geladen werden.</div>";
    });
}

function renderOldPageContent(container, pageNumber, pages, glyphMap) {
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
        const from = Number(line.first);
        const to = Number(line.last);
        const hasRange = Number.isInteger(from) && Number.isInteger(to) && from > 0 && to >= from;
        const glyphs = hasRange
            ? Array.from({ length: to - from + 1 }, (_, index) => {
                const glyphId = from + index;
                return glyphMap[String(glyphId)] || "";
            }).join("")
            : "";
        
        let extraClass = "";
        if (line.type === "surah_name") extraClass = "surah-name";
        else if (line.type === "basmallah") extraClass = "basmallah";

        // Nur normale Ayah-Zeilen ohne Glyphen als "empty" markieren
        const isEmpty = !glyphs && line.type !== "surah_name" && line.type !== "basmallah";
        return `<div class="old-mushaf-line ${line.centered ? "centered" : ""} ${extraClass} ${isEmpty ? "empty" : ""}">${glyphs}</div>`;
    }).join("");
}

/* ================================= */
/* PRELOADING FÜR BLITZSCHNELLES BLÄTTERN */
/* ================================= */

function preloadAdjacentPages() {
    const isOldMushaf = getStoredMushaf() === "old";
    const nextLeft = leftPageNumber + 2;
    const nextRight = rightPageNumber + 2;
    const prevLeft = leftPageNumber - 2;
    const prevRight = rightPageNumber - 2;

    const pagesToPreload = [nextLeft, nextRight, prevLeft, prevRight].filter(p => p >= 1 && p <= TOTAL_PAGES);

    if (isOldMushaf) {
        // Vorladen der JSONs und TTF Fonts für den alten Mushaf
        Promise.all([loadOldMushafData(), loadOldMushafGlyphMap()]).then(([pages, glyphMap]) => {
            pagesToPreload.forEach(pageNumber => {
                const fontName = `old-page-${pageNumber}`;
                if (!document.getElementById(fontName)) {
                    const fontStyle = document.createElement("style");
                    fontStyle.id = fontName;
                    fontStyle.textContent = `@font-face { font-family: '${fontName}'; src: url('pagesoldmushaf/p${pageNumber}.ttf') format('truetype'); }`;
                    document.head.appendChild(fontStyle);
                }
            });
        }).catch(() => {});
    } else {
        // Vorladen der SVG Bilder für den modernen Mushaf
        pagesToPreload.forEach(pageNumber => {
            const img = new Image();
            img.src = getPagePath(pageNumber);
        });
    }
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

    const isOld = getStoredMushaf() === "old";
    const targetLeft = isOld ? oldLeftPage : leftPage;
    const targetRight = isOld ? oldRightPage : rightPage;

    if (targetLeft) {
        targetLeft.style.transform = `scale(${zoomLevel})`;
        targetLeft.style.transformOrigin = "center center";
    }
    if (targetRight) {
        targetRight.style.transform = `scale(${zoomLevel})`;
        targetRight.style.transformOrigin = "center center";
    }

    // Falls die jeweils andere Ansicht existiert, setzen wir deren Scale sicherheitshalber zurück,
    // damit sie keine unerwünschten Effekte hat (wobei sie ohnehin ausgeblendet sein sollte).
    if (isOld) {
        if (leftPage) leftPage.style.transform = "none";
        if (rightPage) rightPage.style.transform = "none";
    } else {
        if (oldLeftPage) oldLeftPage.style.transform = "none";
        if (oldRightPage) oldRightPage.style.transform = "none";
    }


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
    de: { label: "Deutsch", pages: "Seiten", jump: "Zu Seite", open: "Öffnen", language: "Sprache", help: "← / → Blättern | F Vollbild | T Design | S Ansicht | I Suren", index: "Suren", mushaf: "Mushaf", theme: "Design", view: "Ansicht", zoom: "Zoom", fullscreen: "Vollbild", prev: "Zurück", next: "Weiter", single: "Einzelseite", double: "Doppelseite", indexTitle: "Suren-Index", mushafTitle: "Mushaf-Ausgabe", modern: "Moderner Mushaf", old: "Alter Mushaf", active: "Aktiv", select: "Auswählen", page: "Seite" },
    ar: { label: "العربية", pages: "صفحات", jump: "اذهب إلى الصفحة", open: "فتح", language: "اللغة", help: "← / → للتنقل | F ملء الشاشة | T المظهر | S العرض | I السور", index: "السور", mushaf: "المصحف", theme: "المظهر", view: "العرض", zoom: "تكبير", fullscreen: "ملء الشاشة", prev: "السابق", next: "التالي", single: "صفحة واحدة", double: "صفحتان", indexTitle: "فهرس السور", mushafTitle: "إصدار المصحف", modern: "المصحف الحديث", old: "المصحف القديم", active: "مفعل", select: "اختيار", page: "صفحة" },
    en: { label: "English", pages: "Pages", jump: "Go to page", open: "Open", language: "Language", help: "← / → Browse | F Fullscreen | T Theme | S View | I Surahs", index: "Surahs", mushaf: "Mushaf", theme: "Theme", view: "View", zoom: "Zoom", fullscreen: "Fullscreen", prev: "Prev", next: "Next", single: "Single page", double: "Double page", indexTitle: "Surah index", mushafTitle: "Mushaf edition", modern: "Modern Mushaf", old: "Old Mushaf", active: "Active", select: "Select", page: "Page" },
    tr: { label: "Türkçe", pages: "Sayfalar", jump: "Sayfaya git", open: "Aç", language: "Dil", help: "← / → Gezin | F Tam ekran | T Tema | S Görünüm | I Sureler", index: "Sureler", mushaf: "Mushaf", theme: "Tema", view: "Görünüm", zoom: "Yakınlaştır", fullscreen: "Tam ekran", prev: "Geri", next: "İleri", single: "Tek sayfa", double: "Çift sayfa", indexTitle: "Sure dizini", mushafTitle: "Mushaf sürümü", modern: "Modern Mushaf", old: "Eski Mushaf", active: "Aktif", select: "Seç", page: "Sayfa" },
    ur: { label: "اردو", pages: "صفحات", jump: "صفحہ پر جائیں", open: "کھولیں", language: "زبان", help: "← / → براؤز | F مکمل اسکرین | T تھیم | S منظر | I سورتیں", index: "سورتیں", mushaf: "مصحف", theme: "تھیم", view: "منظر", zoom: "زوم", fullscreen: "اسکرین", prev: "پیچھے", next: "آگے", single: "ایک صفحہ", double: "دو صفحات", indexTitle: "سورتوں کی فہرست", mushafTitle: "مصحف کا ایڈیشن", modern: "جدید مصحف", old: "پرانا مصحف", active: "فعال", select: "منتخب کریں", page: "صفحہ" },
    id: { label: "Bahasa Indonesia", pages: "Halaman", jump: "Ke halaman", open: "Buka", language: "Bahasa", help: "← / → Jelajah | F Layar penuh | T Tema | S Tampilan | I Surah", index: "Surah", mushaf: "Mushaf", theme: "Tema", view: "Tampilan", zoom: "Zoom", fullscreen: "Layar penuh", prev: "Kembali", next: "Lanjut", single: "Satu halaman", double: "Dua halaman", indexTitle: "Indeks surah", mushafTitle: "Edisi mushaf", modern: "Mushaf modern", old: "Mushaf lama", active: "Aktif", select: "Pilih", page: "Halaman" },
    fr: { label: "Français", pages: "Pages", jump: "Aller à la page", open: "Ouvrir", language: "Langue", help: "← / → Parcourir | F Plein écran | T Thème | S Vue | I Sourates", index: "Sourates", mushaf: "Mushaf", theme: "Thème", view: "Vue", zoom: "Zoom", fullscreen: "Plein écran", prev: "Retour", next: "Suivant", single: "Page seule", double: "Deux pages", indexTitle: "Index des sourates", mushafTitle: "Édition du mushaf", modern: "Mushaf moderne", old: "Ancien mushaf", active: "Actif", select: "Sélectionner", page: "Page" }
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

// ... existing code ...
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
// ... existing code ...
    modalBody.addEventListener("click", (event) => {
        const languageItem = event.target.closest("[data-language]");
        const pageItem = event.target.closest("[data-page]");
        const mushafItem = event.target.closest("[data-mushaf]");

        if (languageItem) {
            applyLanguage(languageItem.dataset.language);
            closeInfoModal();
            return;
        }

        if (pageItem) {
            const targetPage = Number(pageItem.dataset.page);
            if (!Number.isNaN(targetPage)) {
                goToPage(targetPage);
                closeInfoModal();
            }
            return;
        }

        if (mushafItem) {
            setStoredMushaf(mushafItem.dataset.mushaf);
            updatePages();
            closeInfoModal();
        }
    });
}

if (closeModalButton) closeModalButton.addEventListener("click", closeInfoModal);
if (infoModal) {
    infoModal.addEventListener("click", (event) => {
        if (event.target === infoModal) closeInfoModal();
    });
}

const surahButton = document.getElementById("surahButton");
const mushafButton = document.getElementById("mushafButton");

if (!localStorage.getItem("quran_mushaf")) {
    localStorage.setItem("quran_mushaf", "modern");
}

const surahs = [
    [1, "Al-Fatiha", 1], [2, "Al-Baqarah", 2], [3, "Ali 'Imran", 50],
    [4, "An-Nisa", 77], [5, "Al-Ma'idah", 106], [6, "Al-An'am", 128],
    [7, "Al-A'raf", 151], [8, "Al-Anfal", 177], [9, "At-Tawbah", 187],
    [10, "Yunus", 208], [11, "Hud", 221], [12, "Yusuf", 235],
    [13, "Ar-Ra'd", 248], [14, "Ibrahim", 255], [15, "Al-Hijr", 262],
    [16, "An-Nahl", 272], [17, "Al-Isra", 281], [18, "Al-Kahf", 293],
    [19, "Maryam", 306], [20, "Ta-Ha", 312], [21, "Al-Anbiya", 321],
    [22, "Al-Hajj", 332], [23, "Al-Mu'minun", 342], [24, "An-Nur", 350],
    [25, "Al-Furqan", 359], [26, "Ash-Shu'ara", 367], [27, "An-Naml", 376],
    [28, "Al-Qasas", 384], [29, "Al-'Ankabut", 396], [30, "Ar-Rum", 404],
    [31, "Luqman", 411], [32, "As-Sajdah", 415], [33, "Al-Ahzab", 418],
    [34, "Saba", 428], [35, "Fatir", 435], [36, "Ya-Sin", 440],
    [37, "As-Saffat", 446], [38, "Sad", 453], [39, "Az-Zumar", 460],
    [40, "Ghafir", 467], [41, "Fussilat", 477], [42, "Ash-Shura", 483],
    [43, "Az-Zukhruf", 489], [44, "Ad-Dukhan", 496], [45, "Al-Jathiyah", 499],
    [46, "Al-Ahqaf", 506], [47, "Muhammad", 510], [48, "Al-Fath", 514],
    [49, "Al-Hujurat", 518], [50, "Qaf", 520], [51, "Adh-Dhariyat", 523],
    [52, "At-Tur", 526], [53, "An-Najm", 528], [54, "Al-Qamar", 531],
    [55, "Ar-Rahman", 534], [56, "Al-Waqi'ah", 537], [57, "Al-Hadid", 542],
    [58, "Al-Mujadilah", 545], [59, "Al-Hashr", 548], [60, "Al-Mumtahanah", 551],
    [61, "As-Saff", 553], [62, "Al-Jumu'ah", 554], [63, "Al-Munafiqun", 556],
    [64, "At-Taghabun", 558], [65, "At-Talaq", 560], [66, "At-Tahrim", 562],
    [67, "Al-Mulk", 564], [68, "Al-Qalam", 566], [69, "Al-Haqqah", 568],
    [70, "Al-Ma'arij", 570], [71, "Nuh", 572], [72, "Al-Jinn", 574],
    [73, "Al-Muzzammil", 575], [74, "Al-Muddaththir", 577], [75, "Al-Qiyamah", 579],
    [76, "Al-Insan", 581], [77, "Al-Mursalat", 583], [78, "An-Naba", 585],
    [79, "An-Nazi'at", 586], [80, "'Abasa", 587], [81, "At-Takwir", 587],
    [82, "Al-Infitar", 588], [83, "Al-Mutaffifin", 589], [84, "Al-Inshiqaq", 590],
    [85, "Al-Buruj", 591], [86, "At-Tariq", 592], [87, "Al-A'la", 593],
    [88, "Al-Ghashiyah", 594], [89, "Al-Fajr", 595], [90, "Al-Balad", 596],
    [91, "Ash-Shams", 596], [92, "Al-Lail", 597], [93, "Ad-Duhaa", 597],
    [94, "Ash-Sharh", 598], [95, "At-Tin", 598], [96, "Al-'Alaq", 599],
    [97, "Al-Qadr", 599], [98, "Al-Bayyinah", 600], [99, "Az-Zalzalah", 600],
    [100, "Al-'Adiyat", 600], [101, "Al-Qari'ah", 601], [102, "At-Takathur", 601],
    [103, "Al-'Asr", 601], [104, "Al-Humazah", 602], [105, "Al-Fil", 602],
    [106, "Quraysh", 602], [107, "Al-Ma'un", 603], [108, "Al-Kawthar", 603],
    [109, "Al-Kafirun", 603], [110, "An-Nasr", 603], [111, "Al-Masad", 603],
    [112, "Al-Ikhlas", 604], [113, "Al-Falaq", 604], [114, "An-Nas", 604]
];

if (surahButton) {
    surahButton.addEventListener("click", () => {
        const t = translations[currentLanguage];
        const items = surahs.map(([number, name, page]) =>
            `<button class="modal-item" type="button" data-page="${page}"><span>${number}. ${name}</span><span>${t.page} ${page}</span></button>`
        ).join("");
        openInfoModal(t.indexTitle, items);
    });
}

if (mushafButton) {
    mushafButton.addEventListener("click", () => {
        const t = translations[currentLanguage];
        const selected = getStoredMushaf();
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
            setStoredMushaf(mushafItem.dataset.mushaf);
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