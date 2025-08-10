
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
    document.body.replaceChildren(dataToHtml(data));
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
    let parent = document.createElement("div");

    let button = document.createElement("button");
    button.innerText = data.opts.filter_reviews ? "Show Reviewed Albums" : "Hide Reviewed Albums";
    button.classList.add("inline");
    button.addEventListener('click', () => {
        data.opts.filter_reviews = !data.opts.filter_reviews;
        updateDOM(data);
    });
    parent.appendChild(button);

    let genre_select = document.createElement("select");
    genre_select.classList.add("inline");
    genre_select.addEventListener('change', function(event) {
        data.opts.genre = event.target.value;
        updateDOM(data);
    });
    parent.appendChild(genre_select);

    button = document.createElement("button");
    button.classList.add("inline");
    button.innerText = "Shuffle"
    button.addEventListener('click', () => {
        shuffle(data.albums);
        updateDOM(data);
    });
    parent.appendChild(button);

    button = document.createElement("button");
    button.classList.add("inline");
    button.innerText = "Reset"
    button.addEventListener('click', () => {
        data.albums.sort((a, b) => a.number - b.number);
        data.opts = make_opts();
        updateDOM(data);
    });
    parent.appendChild(button);

    let allAlbums = document.createElement("div");
    allAlbums.classList.add("all-albums");
    parent.appendChild(allAlbums);
    for (let album of data.albums) {
        if (data.opts.filter_reviews && album.user_review) {
            continue;
        }
        if (data.opts.genre && album.genre != data.opts.genre) {
            continue;
        }
        let div = document.createElement("div");
        div.classList.add("album-card");

        let title = document.createElement("h1");
        title.innerText = album.title;
        title.classList.add("album-title");
        div.appendChild(title);

        let artist = document.createElement("h2");
        artist.innerText = album.artist;
        artist.classList.add("album-artist");
        div.appendChild(artist);

        let genre = document.createElement("h3");
        genre.innerText = album.genre;
        div.appendChild(genre);

        let number = document.createElement("div");
        number.innerText = 'No: ' + album.number;
        div.appendChild(number);

        let text = document.createElement("div");
        text.innerHTML = album.text.join(" <br> ");
        text.classList.add("album-review", "hide");

        let button = document.createElement("button");
        button.innerText = "Open Review";
        button.classList.add("album-review-button");
        button.addEventListener('click', () => {
            text.classList.toggle('hide');
            if (text.classList.contains('hide')) {
                button.textContent = 'Open Review';
            } else {
                button.textContent = 'Hide Review';
            }
        });
        div.appendChild(button);

        let spotify = document.createElement("button");
        spotify.innerText = "Open in Spotify";
        spotify.addEventListener('click', () => {
        });
        div.appendChild(spotify);

        let user_rating = document.createElement("div");
        user_rating.classList.add("user-review-data");
        user_rating.innerText = album.user_review ?? "";
        div.appendChild(user_rating);

        let review = document.createElement("button");
        review.innerText = "Rate";
        review.addEventListener('click', () => {
            let user_review = div.querySelector(".user-review");
            if (user_review) {
                user_review.remove();
            } else {
                let user_review = createReview((rating) => {
                    album.user_review = rating;
                    save();
                    updateDOM(data);
                });
                div.appendChild(user_review);
            }
        });
        div.appendChild(review);


        div.appendChild(text);

        allAlbums.appendChild(div);
    }

    for (let genre of data.genres) {
        var op = new Option();
        op.text = genre;
        op.value = genre;
        genre_select.options.add(op);
    }
    genre_select.value = data.opts.genre;
    return parent;
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
    document.body.appendChild(dataToHtml(data));
}
