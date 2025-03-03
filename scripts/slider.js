let _slider;

/**
 * register a callback for the slider
 * @param {Function} callback NOT an es6 function
 */
function sliderRegisterCallback(callback) {
    _slider.addEventListener("input", callback);
}

/**
 * remove a callback for the slider
 * @param {any} callback 
 */
function sliderRemoveCallback(callback) {
    _slider.removeEventListener("input", callback)
}

/**
 * @param {HTMLElementTagNameMap} selector CSS selector to select slider
 */
function sliderSet(selector) {
    _slider = document.querySelector(selector);
}

/**
 * @returns current slider value
 */
function sliderCurrentValue() {
    return _slider?.value
}
