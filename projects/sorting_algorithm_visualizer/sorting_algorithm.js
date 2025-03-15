const visualizer = document.getElementById("visualizer");
const algorithmSelect = document.getElementById("algorithm");
const sizeSlider = document.getElementById("size");
const speedSlider = document.getElementById("speed");
const shuffleButton = document.getElementById("shuffle");
const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const colorModeSelect = document.getElementById("colorMode");
const colorPicker = document.getElementById("colorPicker");
const gradientStartPicker = document.getElementById("gradientStart");
const gradientEndPicker = document.getElementById("gradientEnd");

let array = [];
let isSorting = false;
let colorMode = "height"; // Default color mode
let minValue = 20, maxValue = 320;

// Default Colors
let monochromeColor = "#00FFFF";
let gradientStartColor = "#0000FF";
let gradientEndColor = "#FF0000";

// Generate and display an array
function generateArray(size) {
    if (isSorting) return;
    array = [];
    visualizer.innerHTML = "";

    for (let i = 0; i < size; i++) {
        let value = Math.floor(Math.random() * (maxValue - minValue)) + minValue;
        let bar = document.createElement("div");
        bar.classList.add("bar");
        bar.style.height = `${value}px`;
        bar.style.backgroundColor = getColor(value, minValue, maxValue);
        visualizer.appendChild(bar);
        array.push(value);
    }
}

// Get color based on selected mode
function getColor(value, min, max) {
    if (colorMode === "height") {
        let percentage = (value - min) / (max - min);
        return interpolateColor(gradientStartColor, gradientEndColor, percentage);
    } else if (colorMode === "monochrome") {
        return monochromeColor;
    } else if (colorMode === "monochrome-gradient") {
        let percentage = (value - min) / (max - min);
        return blendWithBlack(monochromeColor, percentage);
    }
    return "#FFFFFF";
}

function blendWithBlack(color, percentage) {
    let colorRGB = hexToRgb(color);
    
    let r = Math.floor(colorRGB.r * percentage);
    let g = Math.floor(colorRGB.g * percentage);
    let b = Math.floor(colorRGB.b * percentage);
    
    return `rgb(${r}, ${g}, ${b})`;
}

// Interpolate between two colors
function interpolateColor(startColor, endColor, percentage) {
    let start = hexToRgb(startColor);
    let end = hexToRgb(endColor);
    let r = Math.floor(start.r + percentage * (end.r - start.r));
    let g = Math.floor(start.g + percentage * (end.g - start.g));
    let b = Math.floor(start.b + percentage * (end.b - start.b));
    return `rgb(${r}, ${g}, ${b})`;
}

// Convert hex to RGB
function hexToRgb(hex) {
    let bigint = parseInt(hex.substring(1), 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

// Update bars with correct colors
function updateBars() {
    const bars = document.querySelectorAll(".bar");
    array.forEach((value, index) => {
        bars[index].style.height = `${value}px`;
        bars[index].style.backgroundColor = getColor(value, minValue, maxValue);
    });
}

// Swap function
function swap(arr, i, j) {
    [arr[i], arr[j]] = [arr[j], arr[i]];
}

// Delay for animation
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Reset Sorting State
function resetSortingState() {
    isSorting = false;
    updateBars();
}

// Sorting Functions
// Bubble Sort
async function bubbleSort() {
    if (isSorting) return;
    isSorting = true;
    let bars = document.querySelectorAll(".bar");
    let ascending = document.getElementById("sortOrder").value === "asc";

    for (let i = 0; i < array.length - 1; i++) {
        for (let j = 0; j < array.length - 1 - i; j++) {
            if (!isSorting) return;

            let condition = ascending ? array[j] > array[j + 1] : array[j] < array[j + 1];
            if (condition) {
                bars[j].style.backgroundColor = "red";
                bars[j + 1].style.backgroundColor = "red";
                await delay(100 - speedSlider.value);

                swap(array, j, j + 1);
                updateBars();

                bars[j].style.backgroundColor = getColor(array[j], minValue, maxValue);
                bars[j + 1].style.backgroundColor = getColor(array[j + 1], minValue, maxValue);
            }
        }
    }
    resetSortingState();
    await finishAnimation();
}

// Selection Sort
async function selectionSort() {
    if (isSorting) return;
    isSorting = true;
    let bars = document.querySelectorAll(".bar");
    let ascending = document.getElementById("sortOrder").value === "asc";

    for (let i = 0; i < array.length - 1; i++) {
        if (!isSorting) return;

        let minOrMaxIndex = i;
        bars[minOrMaxIndex].style.backgroundColor = "yellow";

        for (let j = i + 1; j < array.length; j++) {
            if (!isSorting) return;

            bars[j].style.backgroundColor = "red";
            await delay(100 - speedSlider.value);

            let condition = ascending ? array[j] < array[minOrMaxIndex] : array[j] > array[minOrMaxIndex];
            if (condition) {
                bars[minOrMaxIndex].style.backgroundColor = getColor(array[minOrMaxIndex], minValue, maxValue);
                minOrMaxIndex = j;
                bars[minOrMaxIndex].style.backgroundColor = "yellow";
            } else {
                bars[j].style.backgroundColor = getColor(array[j], minValue, maxValue);
            }
        }

        if (minOrMaxIndex !== i) {
            swap(array, i, minOrMaxIndex);
            updateBars();
            await delay(100 - speedSlider.value);
        }
    }
    resetSortingState();
    await finishAnimation();
}

// Insertion Sort
async function insertionSort() {
    if (isSorting) return;
    isSorting = true;
    let bars = document.querySelectorAll(".bar");
    let ascending = document.getElementById("sortOrder").value === "asc";

    for (let i = 1; i < array.length; i++) {
        if (!isSorting) return;

        let key = array[i];
        let j = i - 1;
        bars[i].style.backgroundColor = "yellow";
        await delay(100 - speedSlider.value);

        while (j >= 0) {
            let condition = ascending ? array[j] > key : array[j] < key;
            if (!condition) break;

            if (!isSorting) return;

            bars[j].style.backgroundColor = "red";
            array[j + 1] = array[j];
            j--;
            await delay(100 - speedSlider.value);
            updateBars();
        }

        array[j + 1] = key;
        bars[i].style.backgroundColor = getColor(array[i], minValue, maxValue);
    }
    resetSortingState();
    await finishAnimation();
}

// Merge Sort
async function mergeSort(left = 0, right = array.length - 1) {
    if (!isSorting) return;
    if (left >= right) return;

    let mid = Math.floor((left + right) / 2);

    await mergeSort(left, mid);
    await mergeSort(mid + 1, right);
    await merge(left, mid, right);

    // If this is the final merge step (when left is 0 and right is last index)
    if (left === 0 && right === array.length - 1) {
        resetSortingState();
        await finishAnimation(); // Run finish animation
    }
}

async function merge(left, mid, right) {
    if (!isSorting) return;

    let bars = document.querySelectorAll(".bar");
    let leftArray = array.slice(left, mid + 1);
    let rightArray = array.slice(mid + 1, right + 1);
    let i = 0, j = 0, k = left;
    let ascending = document.getElementById("sortOrder").value === "asc";

    while (i < leftArray.length && j < rightArray.length) {
        if (!isSorting) return;

        bars[k].style.backgroundColor = "red";
        await delay(100 - speedSlider.value);

        let condition = ascending ? leftArray[i] <= rightArray[j] : leftArray[i] >= rightArray[j];
        array[k] = condition ? leftArray[i++] : rightArray[j++];

        bars[k].style.height = `${array[k]}px`;
        bars[k].style.backgroundColor = getColor(array[k], minValue, maxValue);
        k++;
    }

    while (i < leftArray.length) {
        if (!isSorting) return;

        bars[k].style.backgroundColor = "red";
        await delay(100 - speedSlider.value);
        array[k] = leftArray[i];
        bars[k].style.height = `${array[k]}px`;
        bars[k].style.backgroundColor = getColor(array[k], minValue, maxValue);
        i++;
        k++;
    }

    while (j < rightArray.length) {
        if (!isSorting) return;

        bars[k].style.backgroundColor = "red";
        await delay(100 - speedSlider.value);
        array[k] = rightArray[j];
        bars[k].style.height = `${array[k]}px`;
        bars[k].style.backgroundColor = getColor(array[k], minValue, maxValue);
        j++;
        k++;
    }
}

function startMergeSort() {
    if (isSorting) return;
    isSorting = true;
    mergeSort().then(resetSortingState).then(finishAnimation());
}

// Quick Sort
async function quickSort(low = 0, high = array.length - 1) {
    if (!isSorting) return;
    if (low < high) {
        let pivotIndex = await partition(low, high);
        await quickSort(low, pivotIndex - 1);
        await quickSort(pivotIndex + 1, high);
    }

    // If sorting is completed (when the function is called at the root level)
    if (low === 0 && high === array.length - 1) {
        resetSortingState();
        await finishAnimation(); // Run finish animation
    }
}

async function partition(low, high) {
    if (!isSorting) return;

    let bars = document.querySelectorAll(".bar");
    let pivot = array[high];
    let i = low - 1;
    let ascending = document.getElementById("sortOrder").value === "asc";
    bars[high].style.backgroundColor = "yellow";

    for (let j = low; j < high; j++) {
        if (!isSorting) return;

        bars[j].style.backgroundColor = "red";
        await delay(100 - speedSlider.value);

        let condition = ascending ? array[j] < pivot : array[j] > pivot;
        if (condition) {
            i++;
            swap(array, i, j);
            updateBars();
            await delay(100 - speedSlider.value);
        }
        bars[j].style.backgroundColor = getColor(array[j], minValue, maxValue);
    }

    swap(array, i + 1, high);
    updateBars();
    await delay(100 - speedSlider.value);

    bars[high].style.backgroundColor = getColor(array[high], minValue, maxValue);
    bars[i + 1].style.backgroundColor = "green";
    return i + 1;
}

function startQuickSort() {
    if (isSorting) return;
    isSorting = true;
    quickSort().then(resetSortingState);
}

// Finish Animation
async function finishAnimation() {
    let bars = document.querySelectorAll(".bar");

    for (let i = 0; i < bars.length; i++) {
        bars[i].style.transition = "height 0.1s ease, background-color 0.1s ease";
        bars[i].style.height = `${parseInt(bars[i].style.height) + 10}px`; // Increase height
        bars[i].style.backgroundColor = "white"; // Temporary highlight color
        await delay(50); // Small delay for sequential effect
        bars[i].style.height = `${parseInt(bars[i].style.height) - 10}px`; // Shrink back
        bars[i].style.backgroundColor = getColor(array[i], minValue, maxValue); // Final sorted color
    }
}

// Event Listeners
sizeSlider.addEventListener("input", () => generateArray(sizeSlider.value));
shuffleButton.addEventListener("click", () => { 
    if(!isSorting) generateArray(sizeSlider.value);
});
startButton.addEventListener("click", () => {
    if (isSorting) return;
    let selectedAlgorithm = algorithmSelect.value;

    if (selectedAlgorithm === "bubble") bubbleSort();
    else if (selectedAlgorithm === "selection") selectionSort();
    else if (selectedAlgorithm === "insertion") insertionSort();
    else if (selectedAlgorithm === "merge") startMergeSort();
    else if (selectedAlgorithm === "quick") startQuickSort();
});
stopButton.addEventListener("click", () => isSorting = false);

// Color Selection Handlers
colorModeSelect.addEventListener("change", function() {
    colorMode = this.value;
    generateArray(sizeSlider.value);
});
colorPicker.addEventListener("input", function() {
    monochromeColor = this.value;
    generateArray(sizeSlider.value);
});
gradientStartPicker.addEventListener("input", function() {
    gradientStartColor = this.value;
    generateArray(sizeSlider.value);
});
gradientEndPicker.addEventListener("input", function() {
    gradientEndColor = this.value;
    generateArray(sizeSlider.value);
});

// Initialize default array on page load
generateArray(sizeSlider.value);
