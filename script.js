// import a list of cities for the search dropdown list
import { czechCityList } from './czechCitytList.js'

// object with parameters for working with the API
const param = {
	URLweather: 'https://api.openweathermap.org/data/3.0/onecall?',
	URLgeocode: 'https://api.openweathermap.org/geo/1.0/direct?',
	URLReverseGeocode: 'https://api.openweathermap.org/geo/1.0/reverse?',
	appid: '2e9a31481bcd594b03b69f26d91f78cd',
	// default location - Prague
	latitude: 50.07950241230674,
	longitude: 14.432664913915392,
	// key for storing the entered location for reverse geocoding
	enteredLocation: '',
}

// constants for working with DOM elements
const inputField = document.querySelector('.input')
const cityList = document.querySelector('.city-list')
const errorMessage = document.getElementById('error-message')
const errorMessageOfLocation = document.getElementById('location-error-message')
const inputExampleMessage = document.getElementById('input-explanation-info')
const loader = document.querySelector('.loader-wrapper')
// variable for storing the name of the city for which the weather is displayed
let cityNameForShowWeather = 'Praha, CZ'

// if geolocation is supported
if (navigator.geolocation) {
	// get the coordinates of the user's location
	navigator.geolocation.getCurrentPosition(
		function (position) {
			param.latitude = position.coords.latitude
			param.longitude = position.coords.longitude

			// get the name of the city using reverse geocoding
			;(async () => {
				try {
					const response = await fetch(
						`${param.URLReverseGeocode}lat=${param.latitude}&lon=${param.longitude}&limit=1&appid=${param.appid}`
					)
					const data = await response.json()
					cityNameForShowWeather = `${data[0].name}, ${data[0].country}`
				} catch (error) {
					console.error('An error occurred while receiving the reverse geocode:', error)
				}
			})()

			// get the weather for the user's location
			getWeather()
		},
		// If the user does not allow access to geolocation, get the weather for the default location
		function (error) {
			getWeather()
		},
		{ enableHighAccuracy: true }
	)
	// If geolocation is not supported
} else {
	// get the weather for the default location
	getWeather()
}

// when entering a value in the input field, get the geocoding and display the list of cities
inputField.addEventListener('input', (e) => {
	// get the value of the input field for geocoding
	param.enteredLocation = e.target.value.toLowerCase().trim()

	// An object for replacing Czech letters with Latin letters for searching on an English keyboard layout
	const chars = {
		ů: 'u',
		á: 'a',
		é: 'e',
		ř: 'r',
		í: 'i',
		č: 'c',
		ž: 'z',
		ý: 'y',
		š: 's',
		ď: 'd',
		ť: 't',
		ň: 'n',
		ó: 'o',
		ú: 'u',
		ě: 'e',
	}

	if (e.target.value.length > 2) {
		// filter the array of cities by the entered value and display the corresponding elements of the list
		const filteredCityList = czechCityList.filter((city) => {
			if (
				city.name
					.toLowerCase()
					.replace(/[ůáéříčžýšďťňóúě]/g, (char) => chars[char])
					.includes(e.target.value.toLowerCase().replace(/[ůáéříčžýšďťňóúě]/g, (char) => chars[char])) &&
				city.name[0].toLowerCase().replace(/[ůáéříčžýšďťňóúě]/g, (char) => chars[char]) ===
					e.target.value[0].toLowerCase().replace(/[ůáéříčžýšďťňóúě]/g, (char) => chars[char])
			) {
				return city
			}
		})
		cityList.innerHTML = ''
		filteredCityList.forEach((city) => {
			const cityItem = document.createElement('div')
			cityItem.textContent = city.name
			cityList.appendChild(cityItem)
			cityItem.classList.add('city-item')

			// When click on a list item, get the weather for the selected city
			cityItem.addEventListener('click', () => {
				param.latitude = city.coord.lat
				param.longitude = city.coord.lon
				cityNameForShowWeather = `${city.name}, ${city.country}`
				getWeather()
			})
		})
	} else {
		cityList.innerHTML = ''
	}
})

// when presssed Enter, get the geocoding, get and output the weather for the entered location
inputField.addEventListener('keyup', (e) => {
	if (e.key === 'Enter' && e.target.value.length > 1) {
		inputField.value = ''
		cityList.innerHTML = ''
		inputExampleMessage.classList.add('explanation-info-hidden')
		inputField.blur()
		getCoordinates()
	}
})

// when clicking on the document
document.addEventListener('click', (e) => {
	e.preventDefault()
	// when clicking on elements that are not an input field or are an element of a list - clear the input field and the list
	if (!e.target.classList.contains('input') || e.target.classList.contains('city-item')) {
		inputField.value = ''
		cityList.innerHTML = ''
	}

	// when clicking on elements that are input fields or error messages - hide the error messages
	if (e.target.classList.contains('input') || e.target.classList.contains('error-message')) {
		errorMessage.classList.add('error-message-hidden')
		errorMessageOfLocation.classList.add('error-message-hidden')
	}

	// when clicking on the input field, if it is empty, - display a message of the input format. Otherwise, hide it. Hide or show the title
	if (e.target.classList.contains('input')) {
		inputExampleMessage.classList.remove('explanation-info-hidden')
		document.querySelector('.current-title').style.visibility = 'hidden'
	} else {
		inputExampleMessage.classList.add('explanation-info-hidden')
		document.querySelector('.current-title').style.visibility = 'visible'
	}
})

// geocoding function for the entered location
async function getCoordinates() {
	let responce = await fetch(`${param.URLgeocode}q=${param.enteredLocation}&appid=${param.appid}`)
	if (responce.ok) {
		let data = await responce.json()
		if (data.length === 0) {
			errorMessageOfLocation.classList.remove('error-message-hidden')
		} else {
			param.latitude = data[0].lat
			param.longitude = data[0].lon
			cityNameForShowWeather = `${data[0].name}, ${data[0].country}`
			getWeather()
		}
	} else {
		errorMessage.classList.remove('error-message-hidden')
	}
}

// the function of getting the weather
async function getWeather() {
	loader.style.display = 'block'

	let responce = await fetch(
		`${param.URLweather}lat=${param.latitude}&lon=${param.longitude}&units=metric&appid=${param.appid}`
	)
	if (responce.ok) {
		let data = await responce.json()
		showWeather(data)
	} else {
		errorMessage.classList.remove('error-message-hidden')
		loader.style.display = 'none'
	}
}

// weather output function
function showWeather(data) {
	// the function of getting the formatted date
	function getFormattedDate(unixTimestamp) {
		const date = new Date(unixTimestamp * 1000)
		const options = {
			weekday: 'long',
			day: 'numeric',
			month: 'numeric',
			year: 'numeric',
		}
		const formattedDate = date.toLocaleDateString('en-GB', options)
		return formattedDate.replace(/\//g, '.')
	}

	// the function of getting the formatted time
	function getFormattedTime(unixTimestamp) {
		const date = new Date(unixTimestamp * 1000)
		const options = {
			hour: 'numeric',
			minute: 'numeric',
		}
		const formattedTime = date.toLocaleTimeString('en-GB', options)
		return formattedTime
	}

	// show current weather
	document.querySelector('.current-city-value').textContent = cityNameForShowWeather
	document.querySelector('.current-icon img').src = `img/${data.current.weather[0].icon}.svg`

	document.querySelector('.current-description').textContent = data.current.weather[0].description

	document.querySelector('.current-temperature-value').innerHTML =
		Math.round(data.current.temp) > 0
			? `+${Math.round(data.current.temp)}&#176;C`
			: `${Math.round(data.current.temp)}&#176;C`

	document.querySelector('.current-feels-like').innerHTML = `feels like ${
		Math.round(data.current.feels_like) > 0
			? `+${Math.round(data.current.feels_like)}&#176;C`
			: `${Math.round(data.current.feels_like)}&#176;C`
	}`

	document.querySelector('.current-date').textContent = getFormattedDate(data.current.dt)

	document.querySelector('.current-humidity-value	').textContent = `${data.current.humidity}%`

	document.querySelector('.current-cloudiness-value').textContent = `${data.current.clouds}%`

	document.querySelector('.current-wind-speed').textContent = `${data.current.wind_speed} m/s`
	document.querySelector('.current-wind-direction').style.transform = `rotate(${data.current.wind_deg}deg)`

	document.querySelector('.current-pressure-value').textContent = `${data.current.pressure} hPa`

	document.querySelector('.current-sunrise-value').textContent = getFormattedTime(data.current.sunrise)
	document.querySelector('.current-sunset-value').textContent = getFormattedTime(data.current.sunset)

	// show daily weather
	for (let i = 0; i < 8; i++) {
		document.querySelectorAll('.daily-date')[i].textContent = getFormattedDate(data.daily[i].dt)

		document.querySelectorAll('.daily-icon img')[i].src = `img/${data.daily[i].weather[0].icon}.svg`

		document.querySelectorAll('.daily-description')[i].textContent = data.daily[i].summary

		document.querySelectorAll('.daily-temp-min-value')[i].innerHTML = `${
			Math.round(data.daily[i].temp.min) > 0
				? `+${Math.round(data.daily[i].temp.min)}&#176;C`
				: `${Math.round(data.daily[i].temp.min)}&#176;C`
		}`

		document.querySelectorAll('.daily-temp-max-value')[i].innerHTML = `${
			Math.round(data.daily[i].temp.max) > 0
				? `+${Math.round(data.daily[i].temp.max)}&#176;C`
				: `${Math.round(data.daily[i].temp.max)}&#176;C`
		}`

		document.querySelectorAll('.daily-temp-morn-value')[i].innerHTML = `${
			Math.round(data.daily[i].temp.morn) > 0
				? `+${Math.round(data.daily[i].temp.morn)}&#176;C`
				: `${Math.round(data.daily[i].temp.morn)}&#176;C`
		}`

		document.querySelectorAll('.daily-temp-day-value')[i].innerHTML = `${
			Math.round(data.daily[i].temp.day) > 0
				? `+${Math.round(data.daily[i].temp.day)}&#176;C`
				: `${Math.round(data.daily[i].temp.day)}&#176;C`
		}`

		document.querySelectorAll('.daily-temp-eve-value')[i].innerHTML = `${
			Math.round(data.daily[i].temp.eve) > 0
				? `+${Math.round(data.daily[i].temp.eve)}&#176;C`
				: `${Math.round(data.daily[i].temp.eve)}&#176;C`
		}`

		document.querySelectorAll('.daily-temp-night-value')[i].innerHTML = `${
			Math.round(data.daily[i].temp.night) > 0
				? `+${Math.round(data.daily[i].temp.night)}&#176;C`
				: `${Math.round(data.daily[i].temp.night)}&#176;C`
		}`

		document.querySelectorAll('.daily-pop-value')[i].textContent = `${Math.round(data.daily[i].pop * 100)}%`

		document.querySelectorAll('.daily-humidity-value')[i].textContent = `${data.daily[i].humidity}%`

		document.querySelectorAll('.daily-cloudiness-value')[i].textContent = `${data.daily[i].clouds}%`

		document.querySelectorAll('.daily-wind-speed')[i].textContent = `${data.daily[i].wind_speed} m/s`

		document.querySelectorAll('.daily-wind-direction')[i].style.transform = `rotate(${data.daily[i].wind_deg}deg)`

		document.querySelectorAll('.daily-pressure-value')[i].textContent = `${data.daily[i].pressure} hPa`

		document.querySelectorAll('.daily-sunrise-value')[i].textContent = getFormattedTime(data.daily[i].sunrise)

		document.querySelectorAll('.daily-sunset-value')[i].textContent = getFormattedTime(data.daily[i].sunset)
	}
	// show hourly weather
	for (let i = 0; i < 24; i++) {
		document.querySelectorAll('.hourly-time')[i].textContent = `${getFormattedTime(data.hourly[i].dt)}`
		document.querySelectorAll('.hourly-date')[i].textContent = `${getFormattedDate(data.hourly[i].dt)}`
		document.querySelectorAll('.hourly-icon img')[i].src = `img/${data.hourly[i].weather[0].icon}.svg`
		document.querySelectorAll('.hourly-description')[i].textContent = data.hourly[i].weather[0].description
		document.querySelectorAll('.hourly-temperature-value')[i].innerHTML = `${
			Math.round(data.hourly[i].temp) > 0
				? `+${Math.round(data.hourly[i].temp)}&#176;C`
				: `${Math.round(data.hourly[i].temp)}&#176;C`
		}`
		document.querySelectorAll('.hourly-feels-like-value')[i].innerHTML = `${
			Math.round(data.hourly[i].feels_like) > 0
				? `+${Math.round(data.hourly[i].feels_like)}&#176;C`
				: `${Math.round(data.hourly[i].feels_like)}&#176;C`
		}`
		document.querySelectorAll('.hourly-pop-value')[i].textContent = `${Math.round(data.hourly[i].pop * 100)}%`
		document.querySelectorAll('.hourly-humidity-value')[i].textContent = `${data.hourly[i].humidity}%`
		document.querySelectorAll('.hourly-cloudiness-value')[i].textContent = `${data.hourly[i].clouds}%`
		document.querySelectorAll('.hourly-wind-value')[i].textContent = `${data.hourly[i].wind_speed} m/s`
	}

	// start the carousel function
	slider('.slider-wrapper', '.slide', 'daily-prev-button', 'daily-next-button', 'daily-progress-bar')
	slider(
		'.hourly-slider-wrapper',
		'.hourly-slide-item',
		'hourly-prev-button',
		'hourly-next-button',
		'hourly-progress-bar'
	)

	// showing the weather block
	loader.style.display = 'none'

	setTimeout(() => {
		document.querySelector('.weather-body').style.visibility = 'visible'
		document.querySelector('.weather-search').style.visibility = 'visible'
		document.querySelector('.weather-body').style.animation = 'showWeather 1s ease forwards'
		document.querySelector('.weather-search').style.animation = 'showWeather 1s ease forwards'
		document.querySelector('.current-title').style.visibility = 'visible'
	}, 200)
	
	document.querySelector('.weather-body').style.visibility = 'visible'
	document.querySelector('.weather-search').style.visibility = 'visible'
	document.querySelector('.weather-body').style.animation = 'showWeather 1s ease forwards'
	document.querySelector('.weather-search').style.animation = 'showWeather 1s ease forwards'
	document.querySelector('.current-title').style.visibility = 'visible'
	setTimeout(() => {
		document.querySelector('.weather-body').style.animation = ''
		document.querySelector('.weather-search').style.animation = ''
	}, 1200)
}

// slider function
function slider(sliderElement, slideElements, prevButtonElement, nextButtonElement, progressElement) {
	const slider = document.querySelector(sliderElement)
	const sliderItems = document.querySelectorAll(slideElements)
	const slideWidth = sliderItems[0].offsetWidth
	const prevButton = document.getElementById(prevButtonElement)
	const nextButton = document.getElementById(nextButtonElement)

	let counter = 0
	let x1 = null

	slider.addEventListener('touchstart', handleTouchStart)
	slider.addEventListener('touchmove', handleTouchMove)
	prevButton.addEventListener('click', handlePrevButton)
	nextButton.addEventListener('click', handleNextButton)

	function handleTouchStart(event) {
		event.preventDefault()
		x1 = event.touches[0].clientX
		inputField.value = ''
		cityList.innerHTML = ''
		inputExampleMessage.classList.add('explanation-info-hidden')
		inputField.blur()
		document.querySelector('.current-title').style.visibility = 'visible'
	}

	function handleTouchMove(event) {
		event.preventDefault()
		if (!x1) {
			return
		}
		let x2 = event.touches[0].clientX
		let xDiff = x2 - x1

		// right swipe
		if (xDiff > 0 && Math.abs(xDiff) > slideWidth / 6) {
			if (counter - 1 === -1) {
				counter = sliderItems.length - 1
			} else {
				counter--
			}
			sliderItems[counter].style.animationName = 'slideInSwipeRight'

			if (counter === sliderItems.length - 1) {
				sliderItems[0].style.animationName = 'slideOutSwipeRight'
			} else sliderItems[counter + 1].style.animationName = 'slideOutSwipeRight'

			setTimeout(() => {
				sliderItems.forEach((item) => {
					item.style.animationName = ''
				})
			}, 600)

			switchSlide()
			switchProgress()

			// left swipe
		} else if (xDiff < 0 && Math.abs(xDiff) > slideWidth / 6) {
			if (counter + 1 === sliderItems.length) {
				counter = 0
			} else {
				counter++
			}
			sliderItems[counter].style.animationName = 'slideInSwipeLeft'

			if (counter === 0) {
				sliderItems[sliderItems.length - 1].style.animationName = 'slideOutSwipeLeft'
			} else sliderItems[counter - 1].style.animationName = 'slideOutSwipeLeft'

			setTimeout(() => {
				sliderItems.forEach((item) => {
					item.style.animationName = ''
				})
			}, 600)

			switchSlide()
			switchProgress()
		}
	}

	function handlePrevButton() {
		prevButton.removeEventListener('click', handlePrevButton)
		if (counter - 1 === -1) {
			counter = sliderItems.length - 1
		} else {
			counter--
		}
		sliderItems[counter].style.animationName = 'slideInSwipeLeft'

		if (counter === sliderItems.length - 1) {
			sliderItems[0].style.animationName = 'slideOutSwipeLeft'
		} else sliderItems[counter + 1].style.animationName = 'slideOutSwipeLeft'
		switchSlide()
		switchProgress()
		this.style.animation = 'slideOutSwipeLeft 0.6s ease'
		setTimeout(() => {
			this.style.animation = ''
			prevButton.addEventListener('click', handlePrevButton)
		}, 600)
	}
	function handleNextButton() {
		nextButton.removeEventListener('click', handleNextButton)
		if (counter + 1 === sliderItems.length) {
			counter = 0
		} else {
			counter++
		}
		sliderItems[counter].style.animationName = 'slideInSwipeRight'

		if (counter === 0) {
			sliderItems[sliderItems.length - 1].style.animationName = 'slideOutSwipeRight'
		} else sliderItems[counter - 1].style.animationName = 'slideOutSwipeRight'

		switchSlide()
		switchProgress()
		this.style.animation = 'slideOutSwipeRight 0.6s ease'
		setTimeout(() => {
			this.style.animation = ''
			sliderItems.forEach((item) => {
				item.style.animationName = ''
			})
			nextButton.addEventListener('click', handleNextButton)
		}, 600)
	}

	function switchSlide() {
		slider.removeEventListener('touchstart', handleTouchStart)
		slider.removeEventListener('touchmove', handleTouchMove)
		x1 = null

		for (let i = 0; i < sliderItems.length; i++) {
			sliderItems[i].classList.add('slide-hidden')
		}
		sliderItems[counter].classList.remove('slide-hidden')

		setTimeout(() => {
			sliderItems[counter].style.animationName = ''
			slider.addEventListener('touchstart', handleTouchStart)
			slider.addEventListener('touchmove', handleTouchMove)
		}, 600)
	}
	switchSlide()

	// progress bar function for the slider
	const progressItems = document.getElementById(progressElement).children
	function switchProgress() {
		for (let i = 0; i < progressItems.length; i++) {
			progressItems[i].style.backgroundColor = 'transparent'
		}
		progressItems[counter].style.backgroundColor = 'rgba(30, 41, 82, 0.612)'
	}
	switchProgress()
}

// switch button function for switching between hourly and daily weather
function switcherButton() {
	const switcher = document.querySelector('.switch')
	const switcherSlider = document.querySelector('.switch-slider')

	switcher.addEventListener('touchstart', mooveSwitcher)
	switcher.addEventListener('click', mooveSwitcher)

	function mooveSwitcher(e) {
		e.preventDefault()
		document.querySelector('.current-title').style.visibility = 'visible'
		inputField.value = ''
		cityList.innerHTML = ''
		inputExampleMessage.classList.add('explanation-info-hidden')
		inputField.blur()

		switcherSlider.classList.toggle('transform')

		if (switcherSlider.classList.contains('transform')) {
			switcherSlider.textContent = 'Hourly'
			document.querySelector('.title-right').style.animationName = 'titleFadeOut'
			document.querySelector('.title-left').style.animationName = 'titleFadeIn'
			document.querySelector('.hourly').style.animation = 'titleFadeIn 0.3s ease forwards'
			document.querySelector('.daily').style.animation = 'titleFadeOut 0.3s ease forwards'
		} else {
			switcherSlider.textContent = 'Daily'
			document.querySelector('.title-right').style.animationName = 'titleFadeIn'
			document.querySelector('.title-left').style.animationName = 'titleFadeOut'
			document.querySelector('.hourly').style.animation = 'titleFadeOut 0.3s ease forwards'
			document.querySelector('.daily').style.animation = 'titleFadeIn 0.3s ease forwards'
		}
	}
}
switcherButton()
