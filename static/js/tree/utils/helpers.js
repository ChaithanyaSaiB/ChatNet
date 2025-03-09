/**
 * @file Defines helper functions used throughout the application.
 */

/**
 * Truncates a string to a specified maximum length, adding an ellipsis if truncated.
 *
 * @function
 * @param {string} str - The string to truncate.
 * @param {number} [maxLength=15] - The maximum length of the string.
 * @returns {string} The truncated string.
 */
export function truncateString(str, maxLength = 15) {
    if (str.length > maxLength) {
        return str.slice(0, maxLength) + '...';
    }
    return str;
}

/**
 * Wraps text to fit within a specified maximum width.
 *
 * @function
 * @param {CanvasRenderingContext2D} context - The canvas rendering context.
 * @param {string} text - The text to wrap.
 * @param {number} maxWidth - The maximum width for the text.
 * @returns {Array<string>} An array of lines of text that fit within the maximum width.
 */
export function wrapText(context, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth) {
            if (currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                let partialWord = '';
                for (let j = 0; j < word.length; j++) {
                    const testChar = partialWord + word[j];
                    if (context.measureText(testChar).width <= maxWidth) {
                        partialWord = testChar;
                    } else {
                        lines.push(partialWord);
                        partialWord = word[j];
                    }
                }
                currentLine = partialWord;
            }
        } else {
            currentLine = testLine;
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
}
