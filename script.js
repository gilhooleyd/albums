
function parseText(text) {
    let lines = text.split("\n");
    let data = []
    let album = {
        text: "",
    };
    for (let line of lines) {
        if (line[0] == "#") {
            if (album.title) {
                data.push(album);
            }
            album = {
                text: "",
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
            album.text += line;
        }

    }
    data.push(album);
    return data.reverse();
}

function dataToHtml(data) {
    let parent = document.createElement("div");
    for (let album of data) {
        let div = document.createElement("div");

        let title = document.createElement("h1");
        title.innerText = album.title;
        div.appendChild(title);

        let artist = document.createElement("h2");
        artist.innerText = album.artist;
        div.appendChild(artist);

        let text = document.createElement("div");
        text.innerText = album.text;
        div.appendChild(text);

        parent.appendChild(div);
    }
    return parent;
}


let data = {};

fetch("./albums.md")
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text(); // Get the response body as text
    })
    .then(text => {
        data = parseText(text);
        document.body.appendChild(dataToHtml(parseText(text)));
    })
    .catch(error => {
        console.error('There was a problem fetching the file:', error);
        document.getElementById('fileContent').textContent = 'Error loading file.';
    });
