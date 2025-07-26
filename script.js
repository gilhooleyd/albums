let data = {};

function save() {
    localStorage.setItem("albums", JSON.stringify(data));
}

function load() {
    let str = localStorage.getItem("albums");
    if (!str) { return; }
    return JSON.parse(str);
}


function parseText(text) {
    let lines = text.split("\n");
    let data = []
    let number = 501;
    let album = {
        text: [],
        number: number,
    };
    for (let line of lines) {
        if (line[0] == "#") {
            if (album.title) {
                data.push(album);
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
        } else {
            album.text.push(line);
        }

    }
    data.push(album);
    return data.reverse();
}

function dataToHtml(data) {
    let parent = document.createElement("div");
    parent.classList.add("all-albums");
    for (let album of data) {
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
                    console.log("HI");
                    album.user_review = rating;
                    console.log(album);
                    user_review.remove();
                    user_rating.innerText = album.user_review;
                    save();
                });
                div.appendChild(user_review);
            }
        });
        div.appendChild(review);


        div.appendChild(text);

        parent.appendChild(div);
    }
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
    stars.addEventListener('mouseout', () => {
        updateStarColors(stars.dataset.value);
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
if (!data) {
    fetch("./albums.md")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text(); // Get the response body as text
        })
        .then(text => {
            data = parseText(text);
            document.body.appendChild(dataToHtml(data));
        })
        .catch(error => {
            console.error('There was a problem fetching the file:', error);
            document.getElementById('fileContent').textContent = 'Error loading file.';
        });
} else {
    document.body.appendChild(dataToHtml(data));
}
