
function shuffle(arr) {
    let i = arr.length;
    while(--i > 0){
        let j = Math.floor(Math.random()*(i+1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function make_opts() {
    return {
        filter_reviews: false,
        genre: null,
    };
};

let version = 1;
function make_data() {
    return {
        opts: make_opts(),
        albums: [],
        genres: new Set(),
        version: version,
    }
};

let data = make_data();

function load_md() {
    fetch("./albums.md")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text(); // Get the response body as text
        })
        .then(text => {
            data = parseText(text);
            updateDOM(data);
        })
        .catch(error => {
            console.error('There was a problem fetching the file:', error);
            document.getElementById('fileContent').textContent = 'Error loading file.';
        });
}

function save() {
    localStorage.setItem("albums", JSON.stringify(data));
}

function load() {
    let str = localStorage.getItem("albums");
    if (!str) { return; }
    return JSON.parse(str);
}

function updateDOM(data) {
    dataToHtml(data);
}


function parseText(text) {
    let lines = text.split("\n");
    let data = make_data();
    let number = 501;
    let album = {
        title: "",
        artist: "",
        genre: "",
        text: [],
        number: number,
        user_review: null,
    };
    for (let line of lines) {
        if (line[0] == "#") {
            if (album.title) {
                data.albums.push(album);
            }
            number -= 1;
            album = {
                text: [],
                number: number,
            };
            album.title = line.split(":")[1].trim();
            album.title = album.title.substring(1, album.title.length - 1);
        } else if (line.startsWith("artist:")) {
            album.artist = line.split(": ")[1];
        } else if (line.startsWith("year:")) {
            album.year = line.split(": ")[1];
        } else if (line.startsWith("label:")) {
            album.label = line.split(": ")[1];
        } else if (line.startsWith("genre:")) {
            album.genre = line.split(": ")[1];
            data.genres.add(album.genre);
        } else {
            album.text.push(line);
        }

    }
    data.albums.push(album);
    data.albums = data.albums.reverse();
    data.genres = Array.from(data.genres).sort();
    return data;
}

function dataToHtml(data) {
    let albums = ["div.all-albums"];
    for (let album of data.albums) {
        if (data.opts.filter_reviews && album.user_review) {
            continue;
        }
        if (data.opts.genre && album.genre != data.opts.genre) {
            continue;
        }
        albums.push([`div.album-card`, { id: album.number},
            ["h1.album-title", album.title],
            ["h2.album-artist", album.artist],
            ["h3.album-genre", album.genre],
            ["div", `No: ${album.number}`],
            ["div.user-review-data", album.user_review ?? ""],
            ["button.album-review-button", {
                onclick: (e) => {
                    let open = e.target.innerText == "Open Review";
                    e.target.innerText = open ? "Hide Review" : "Open Review";
                    e.target.parentElement.getElementsByClassName("album-review")[0].classList.toggle("hide");
                }
            }, "Open Review"],
            ["button", "Open in Spotify"],
            ["button", {
                onclick: (e) => {
                    let parent = e.target.parentElement;
                    let user_review = parent.querySelector(".user-review");
                    if (user_review) {
                        user_review.remove();
                    } else {
                        let user_review = createReview((rating) => {
                            let user_review = parent.querySelector(".user-review");
                            user_review.remove();
                            album.user_review = rating;
                            save();
                            updateDOM(data);
                        });
                        parent.appendChild(user_review);
                    }
                }
            }, "Rate"],
            ["div.album-review.hide", album.text.map((t) => ["p", t])],
        ]);
    };
    RV.render(document.body, [
        ["button.inline", {
            onclick: () => {
                data.opts.filter_reviews = !data.opts.filter_reviews;
                updateDOM(data);
            },
        }, (data.opts.filter_reviews ? "Show" : "Hide") + " Reviewed Albums"],
        ["button.inline", {
            onclick: () => {
                shuffle(data.albums);
                updateDOM(data);
            },
        }, "Shuffle"],
        ["select.inline", {
            onchange: (e) => {
                data.opts.genre = e.target.value;
                updateDOM(data);
            },
        }, data.genres.map((g) => ["option", g])],
        ["button.inline", {
            onclick: () => {
                data.albums.sort((a, b) => a.number - b.number);
                data.opts = make_opts();
                updateDOM(data);
            },
        }, "Reset"],
        ["div", albums]
    ]);
}

function createReview(callback) {
    let parent = document.createElement("div");
    parent.classList.add("user-review");
    parent.style.fontSize = "30px";

    let stars = document.createElement("div");
    stars.dataset.value = 0;
    for (let i = 0; i < 10; i++) {
        const star = document.createElement('span');
        star.textContent = '★';
        star.style.color = "#d1d5db";
        star.dataset.value = i + 1;
        stars.appendChild(star);
    }
    function updateStarColors(rating) {
        stars.querySelectorAll('span').forEach((star, index) => {
            if (index < rating) {
                star.style.color = "#fcd34d";
            } else {
                star.style.color = "#d1d5db";
            }
        });
    }

    stars.addEventListener('mouseover', (event) => {
        const hoveredStar = event.target.closest('span[data-value]');
        if (hoveredStar) {
            const value = parseInt(hoveredStar.dataset.value);
            updateStarColors(value);
        }
    });
    stars.addEventListener('click', (event) => {
        const clickedStar = event.target.closest('span[data-value]');
        if (clickedStar) {
            let currentRating = parseInt(clickedStar.dataset.value);
            callback(currentRating);
        }
    });
    parent.appendChild(stars);
    return parent;
}


data = load();
if ((!data) || ((data.version ?? 0) != version)) {
    console.log("load" + data.version);
    load_md();
} else {
    dataToHtml(data);
}
