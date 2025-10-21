const grid = document.querySelector(".calculator-grid");
const displayHistory = document.querySelector(".contentMath");
const displayResult = document.querySelector(".result");
const displayContainer = document.querySelector(".display");
const listExpression = document.querySelector(".listExpression");
const clearHistoryBtn = document.querySelector(".icon i");

clearHistoryBtn.addEventListener("click", () => {
    listExpression.innerHTML = `<span class="historyClean">There's no history yet</span>`;
});

let previousOperand = "";
let currentOperation = null;
let shouldResetScreen = false;
let lastOperation = null;
let lastOperand = null;

grid.addEventListener("click", (e) => {
    if (!e.target.value) return;

    const value = e.target.value;

    if (value >= "0" && value <= "9") {
        appendNumber(value);
    } else if (value === "decimal") {
        appendDecimal();
    } else if (
        value === "add" ||
        value === "subtract" ||
        value === "multiply" ||
        value === "divide"
    ) {
        chooseOperation(value, e.target.innerText);
    } else if (value === "equals") {
        compute();
    } else if (value === "C") {
        clearAll();
    } else if (value === "CE") {
        clearEntry();
    } else if (value === "backspace") {
        backspace();
    } else if (
        value === "negate" ||
        value === "percent" ||
        value === "reciprocal" ||
        value === "square" ||
        value === "sqrt"
    ) {
        handleUnaryOperation(value);
    }
});

function formatDisplay(numberString) {
    const unformattedString = numberString.replace(/,/g, '');
    const parts = unformattedString.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];
    if (integerPart === '' || integerPart === '-') {
        return numberString;
    }
    const formattedInteger = new Intl.NumberFormat('en-US').format(
        parseFloat(integerPart)
    );
    if (decimalPart !== undefined) {
        return `${formattedInteger}.${decimalPart}`;
    } else if (numberString.endsWith('.')) {
        return `${formattedInteger}.`;
    } else {
        return formattedInteger;
    }
}

function unformatDisplay(formattedString) {
    return formattedString.replace(/,/g, '');
}

function roundResult(number) {
    if (isNaN(number) || !isFinite(number)) {
        return number;
    }
    return Math.round(number * 100000) / 100000;
}

function updateDisplay(value) {
    displayResult.innerText = value;
    const defaultFontSize = 3; 
    displayResult.style.fontSize = `${defaultFontSize}rem`;
    const maxWidth = displayContainer.clientWidth - 20; 
    let currentFontSize = defaultFontSize;
    while (displayResult.scrollWidth > maxWidth && currentFontSize > 1) {
            currentFontSize -= 0.1;
            displayResult.style.fontSize = `${currentFontSize}rem`;
    }
}

function appendNumber(number) {
    let currentText;
    if (displayResult.innerText === "0" || shouldResetScreen) {
        currentText = number;
        shouldResetScreen = false;
    } 
    else {
        currentText = unformatDisplay(displayResult.innerText) + number;
    }
    updateDisplay(formatDisplay(currentText));
}

function appendDecimal() {
    if (shouldResetScreen) clearEntry();
    
    const unformatted = unformatDisplay(displayResult.innerText);
    if (unformatted.includes(".")) return;
    
    updateDisplay(displayResult.innerText + ".");
}

function chooseOperation(operation, operatorSymbol) {
    if (displayResult.innerText === "" && previousOperand === "") return;

    if (currentOperation !== null && !shouldResetScreen) {
        compute();
    }

    previousOperand = unformatDisplay(displayResult.innerText);
    currentOperation = operation;
    displayHistory.innerText = `${formatNumber(previousOperand)} ${operatorSymbol}`;
    shouldResetScreen = true;

    lastOperation = null;
    lastOperand = null;
}

function compute() {
    let computation;
    let prev, current;
    let operationToUse;

    if (currentOperation !== null) {
        prev = parseFloat(previousOperand); 
        current = parseFloat(unformatDisplay(displayResult.innerText));
        operationToUse = currentOperation;

        lastOperation = currentOperation;
        lastOperand = current;
    } else if (lastOperation !== null) {
        prev = parseFloat(unformatDisplay(displayResult.innerText));
        current = lastOperand;
        operationToUse = lastOperation;
    } else {
        return;
    }

    if (isNaN(prev) || isNaN(current)) return;

    switch (operationToUse) {
        case "add":
            computation = prev + current;
            break;
        case "subtract":
            computation = prev - current;
            break;
        case "multiply":
            computation = prev * current;
            break;
        case "divide":
            if (current === 0) {
                updateDisplay("Lỗi"); 
                displayHistory.innerText = "Không thể chia cho 0";
                previousOperand = "";
                currentOperation = null;
                shouldResetScreen = true;
                return;
            }
            computation = prev / current;
            break;
        default:
            return;
    }

    computation = roundResult(computation);

    displayHistory.innerText = `${formatNumber(prev)} ${getOperatorSymbol(
        operationToUse
    )} ${formatNumber(current)} =`;

    updateDisplay(formatDisplay(computation.toString()));

    addEntryToHistory(displayHistory.innerText, displayResult.innerText);

    currentOperation = null;
    previousOperand = "";
    shouldResetScreen = true;
}

function handleUnaryOperation(operation) {
    let current = parseFloat(unformatDisplay(displayResult.innerText));
    if (isNaN(current)) return;
    let result;
    let historyExpression = "";

    switch (operation) {
        case "negate":
            result = current * -1;
            updateDisplay(formatDisplay(result.toString())); 
            return;

        case "percent": {
            const currentValue = parseFloat(unformatDisplay(displayResult.innerText));
            const percentageValue = roundResult(currentValue / 100);
            
            currentOperand = percentageValue.toString();
            
            updateDisplay(formatDisplay(currentOperand)); 
            if (previousOperand !== "" && currentOperation !== null) {
                const prev = parseFloat(previousOperand);
                displayHistory.innerText = `${formatNumber(
                    prev
                )} ${getOperatorSymbol(currentOperation)} ${currentOperand}`;
            } else {
                displayHistory.innerText = currentOperand;
            }

            return;
        }

        case "reciprocal":
            if (current === 0) {
                result = "Lỗi";
                historyExpression = "Không thể chia cho 0";
            } else {
                result = roundResult(1 / current);
                historyExpression = `1/(${formatNumber(current)})`;
            }
            break;

        case "square":
            result = roundResult(current * current);
            historyExpression = `sqr(${formatNumber(current)})`;
            break;

        case "sqrt":
            if (current < 0) {
                result = "Lỗi";
                historyExpression = "Input không hợp lệ căn không thể âm";
            } else {
                result = roundResult(Math.sqrt(current));
                historyExpression = `sqrt(${formatNumber(current)})`;
            }
            break;
        default:
            return;
    }

    displayHistory.innerText = historyExpression;
    
    updateDisplay(
        (result === "Lỗi" || result === "Input không hợp lệ căn không thể âm") 
            ? result 
            : formatDisplay(result.toString())
    );

    if (result !== "Lỗi" && result !== "Input không hợp lệ căn không thể âm") {
        addEntryToHistory(displayHistory.innerText, displayResult.innerText);
    }

    shouldResetScreen = true;
}

function addEntryToHistory(expression, result) {
    const historyCleanSpan = listExpression.querySelector(".historyClean");
    if (historyCleanSpan) {
        historyCleanSpan.remove();
    }

    let div = document.createElement("div");
    div.innerHTML = `
                        <p class="historyMath">${expression}</p>
                        <p class="historyResult">${result}</p>
                        `;
    listExpression.appendChild(div);

    listExpression.scrollTop = listExpression.scrollHeight;
}

function clearAll() {
    updateDisplay("0"); 
    displayHistory.innerText = "";
    previousOperand = "";
    currentOperation = null;
    shouldResetScreen = false;
    lastOperation = null;
    lastOperand = null;
}

function clearEntry() {
    updateDisplay("0"); 
    shouldResetScreen = false;
}

function backspace() {
    if (shouldResetScreen) return;

    const unformatted = unformatDisplay(displayResult.innerText);
    
    let newText;
    if (unformatted.length === 1 || (unformatted.startsWith('-') && unformatted.length === 2)) {
        newText = "0";
    } else {
        newText = unformatted.slice(0, -1);
    }
    
    updateDisplay(formatDisplay(newText)); 
}

function getOperatorSymbol(operation) {
    switch (operation) {
        case "add":
            return "+";
        case "subtract":
            return "−";
        case "multiply":
            return "×";
        case "divide":
            return "÷";
        default:
            return "";
    }
}

function formatNumber(number) {
    return formatDisplay(number.toString());
}
document.addEventListener("keydown", (e) => {
    const key = e.key;

    switch (key) {
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
            e.preventDefault();
            appendNumber(key);
            break;

        case "+":
        case "NumpadAdd":
            e.preventDefault();
            chooseOperation("add", "+");
            break;
        case "-":
        case "NumpadSubtract":
            e.preventDefault();
            chooseOperation("subtract", "−");
            break;
        case "*":
        case "NumpadMultiply":
            e.preventDefault();
            chooseOperation("multiply", "×");
            break;
        case "/":
        case "NumpadDivide":
            e.preventDefault();
            chooseOperation("divide", "÷");
            break;

        case "%":
            e.preventDefault();
            handleUnaryOperation("percent");
            break;

        case "Enter":
        case "NumpadEnter":
            e.preventDefault();
            compute();
            break;
        case ".":
        case ",":
        case "NumpadDecimal":
            e.preventDefault();
            appendDecimal();
            break;
        case "Backspace":
            e.preventDefault();
            backspace();
            break;
        case "Delete":
            e.preventDefault();
            clearEntry();
            break;
        case "Escape":
            e.preventDefault();
            clearAll();
            break;
    }
});
