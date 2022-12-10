function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

// Autocomplte

let autocompleteData = [];

function showAutocompleteResults(data, searchText) {
    document.querySelector('.internal-list').innerHTML = '';
    document.querySelector('.definite-content').classList.add('show');
    data.forEach(result => {
        const buttonResult = document.createElement('button');
        buttonResult.className = 'inside-btn';
        buttonResult.addEventListener('click', () => { window.location = result.data.url; })
        let resultTitle = result.value;
        resultTitle = resultTitle.replaceAll(
            searchText,
            `<span class="high-light">${searchText}</span>`
        )
        buttonResult.innerHTML =
            `
                <span class="start">${resultTitle}</span>
                <span class="inside">${result.data.type}</span>
            `
        document.querySelector('.internal-list').append(buttonResult)
    })
}


function mainSearch(e) {
    e.stopPropagation();
    let searchText = e.target.value;

    if (searchText.length < 3) {
        document.querySelector('.definite-content').classList.remove('show');
    }

    if (searchText.length === 3) {
        fetch("../../responses/autocomplete.json")
            .then(res => res.json())
            .then(data => {
                autocompleteData = data.suggestions || [];
                if (autocompleteData.length > 0) {
                    showAutocompleteResults(autocompleteData, searchText)
                }
            })
    }
    if (searchText.length > 3) {
        const filteredAutocompleteData = autocompleteData
            .filter(result => result.value.toLowerCase().includes(searchText.toLowerCase()))
        showAutocompleteResults(filteredAutocompleteData, searchText);

    }

}
document.getElementById("mainSearchInput").addEventListener("click", mainSearch)
document.getElementById("mainSearchInput").addEventListener("input", mainSearch)


// Areas Search

let areas = [];
let selectedLocations = [];

function drawSelectedLocation(list) {
    document.querySelector('.chosen-location').innerHTML = '';
    list && list.length > 0 && list.forEach(item => {
        const locationSpan = document.createElement('span');
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = `<img src="./assets/images/icons/clear.svg" alt="">`;
        deleteBtn.addEventListener('click', () => {
            const newArray = selectedLocations.filter(loc => loc !== item);
            selectedLocations = newArray;
            drawSelectedLocation(selectedLocations)
        })
        locationSpan.append(item, deleteBtn);
        document.querySelector('.chosen-location').append(locationSpan)
    })
}

function showSelectedLocations(item) {
    if (selectedLocations.includes(item)) {
        const newArray = selectedLocations.filter(loc => loc !== item);
        selectedLocations = newArray;
    } else { selectedLocations.push(item); }
    drawSelectedLocation(selectedLocations)
}

function showLocations(list) {
    console.log(list)
    document.querySelector('.location-list').innerHTML = "";
    list.forEach(result => {
        const { hideRegion = false } = result || {};
        if (!hideRegion) {
            const regionBtn = document.createElement('button');
            regionBtn.innerHTML = `<span>${result.name}</span>`;
            regionBtn.addEventListener('click', () => {
                showSelectedLocations(result.name);
            })
            document.querySelector('.location-list').append(regionBtn);

        }
        result?.cities && result.cities.length > 0 && result.cities.forEach(city => {
            cityBtn = document.createElement('button');
            cityBtn.addEventListener('click', () => {
                showSelectedLocations(city.name);
            })
            cityBtn.innerHTML =
                `
                    <span>${city.name}</span>
                    <span class="region">${result.name}</span>
                `;
            document.querySelector('.location-list').append(cityBtn);
        })
    })
}

function loadLocations() {
    if (areas.length === 0) {
        document.getElementById('error-load').innerText = '';
        const loaderDiv = document.createElement('div')
        loaderDiv.className = 'loader'
        document.getElementById('error-load').append(loaderDiv)

        fetch("https://studika.ru/api/areas", {
            method: "POST"
        })
            .then(res => res.json())
            .then(data => {
                areas = data || [];
                document.getElementById('error-load').innerText = '';
                showLocations(areas)
            })
            .catch(error => {
                document.getElementById('error-load').innerText = ''
                const errorSpan = document.createElement('span')
                errorSpan.className = 'error'

                const retryBtn = document.createElement('button')
                retryBtn.className = 'link-btn'
                retryBtn.innerText = 'Перезагрузить'
                retryBtn.addEventListener('click', loadLocations)

                errorSpan.append('Произошла ошибка. ', retryBtn)
                document.getElementById('error-load').append(errorSpan)
            })
    }
}

function openLocation(e) {
    e.stopPropagation();
    document.querySelector('.location-search').classList.toggle('show');
    loadLocations()
}

function filterLocations() {
    const search = document.getElementById('locationSearchInput').value.toLowerCase();

    if (search.length === 0) {
        document.getElementById('clearBtn').classList.remove('show')
        showLocations(areas)
        return
    }

    document.getElementById('clearBtn').classList.add('show')
    const filteredAreas = [];

    areas.forEach(result => {
        if (result.name.toLowerCase().includes(search)) {
            let filteredCities = [];
            if (result?.cities && result?.cities?.length > 0) {
                filteredCities = result.cities.filter(city => city.name.toLowerCase().includes(search))
            }
            filteredAreas.push({
                ...result,
                cities: filteredCities
            })
        }
        else if (result?.cities && result?.cities?.length > 0) {
            let filteredCities = [];
            filteredCities = result.cities.filter(city => city.name.toLowerCase().includes(search))
            if (filteredCities?.length > 0) return filteredAreas.push({
                ...result,
                cities: filteredCities,
                hideRegion: true
            });
        }
    })
    if (filteredAreas.length === 0) {
        document.querySelector('.location-list').innerHTML = 'Ничего не найдено'
        return
    }

    showLocations(filteredAreas)
}

function saveLocations() {
    document.querySelector('.selected-location').innerText = selectedLocations.join(', ') || 'Любой регион';
    document.querySelector('.location-search').classList.remove('show');
    document.cookie = selectedLocations.join(',')
    fetch('/saveLocations', {
        method: 'POST',
        body: JSON.stringify(selectedLocations)
    })
}

document.getElementById('locationOpenBtn').addEventListener('click', openLocation)
document.getElementById('saveLocationsBtn').addEventListener('click', saveLocations)
document.getElementById('locationSearchInput').addEventListener('input', filterLocations)



document.querySelector('.location-search').addEventListener('click', (e) => {
    e.stopPropagation();
})

document.querySelector('body').addEventListener('click', (e) => {
    document.querySelector('.location-search').classList.remove('show');
    document.querySelector('.definite-content').classList.remove('show');
})



// Scroll Navigation

SCROLL_AMOUNT = 100;

function showHideNavArrows() {
    const navSection = document.querySelector('.nav');
    if (navSection.scrollWidth > navSection.offsetWidth) {
        document.getElementById('navScrollRightBtn').classList.remove('hide');
        document.querySelector('.nav').classList.add('right-shade')
    }
}

showHideNavArrows()

function navScrollLeft() {
    const currentXScroll = document.querySelector('.nav').scrollLeft;
    document.querySelector('.nav').scroll({ left: currentXScroll - SCROLL_AMOUNT, behavior: 'smooth' })
    if (currentXScroll - SCROLL_AMOUNT <= 0) {
        document.getElementById('navScrollLeftBtn').classList.add('hide');
        document.querySelector('.nav').classList.remove('left-shade')
    }
    document.getElementById('navScrollRightBtn').classList.remove('hide');
    document.querySelector('.nav').classList.add('right-shade')
}
function navScrollRight(e) {
    const currentXScroll = document.querySelector('.nav').scrollLeft;
    document.querySelector('.nav').scroll({ left: currentXScroll + SCROLL_AMOUNT, behavior: 'smooth' })
    if (document.querySelector('.nav').offsetWidth + currentXScroll + SCROLL_AMOUNT >= document.querySelector('.nav').scrollWidth) {
        document.getElementById('navScrollRightBtn').classList.add('hide');
        document.querySelector('.nav').classList.remove('right-shade')
    }
    document.getElementById('navScrollLeftBtn').classList.remove('hide');
    document.querySelector('.nav').classList.add('left-shade')
}

document.getElementById('navScrollLeftBtn').addEventListener('click', navScrollLeft)
document.getElementById('navScrollRightBtn').addEventListener('click', navScrollRight)

function clearLocation() {
    document.getElementById('locationSearchInput').value = ''
    filterLocations()
}

document.getElementById('clearBtn').addEventListener('click', clearLocation)


function loadCities() {
    const savedCities = document.cookie;
    if (!savedCities) return;
    selectedLocations = savedCities.split(',')
    saveLocations()
    drawSelectedLocation(selectedLocations)
}

loadCities()