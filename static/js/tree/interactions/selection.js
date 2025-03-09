/**
 * @file Manages node selection and interaction functionalities.
 */

import { drawTree } from "../drawing/draw.js";
import { selection } from "../main.js";

/**
 * Checks if the mouse coordinates are within the bounds of a node.
 *
 * @function
 * @param {number} x - The x-coordinate of the mouse.
 * @param {number} y - The y-coordinate of the mouse.
 * @returns {TreeNode|undefined} The found node, or undefined if no node is found.
 */
export function within(x, y) {
    const foundNode = window.tree.nodes.find(n => {
        const dx = x - n.x;
        const dy = y - n.y;
        const halfWidth = n.width / 2;
        const halfHeight = n.height / 2;
        const isWithin = Math.abs(dx) <= halfWidth && Math.abs(dy) <= halfHeight;
        // Essential for debugging click coordinates on canvas
        // console.log("Node:", n.value, "x:", n.x, "y:", n.y, "clickX:", x, "clickY:", y, "isWithin:", isWithin);
        return isWithin;
    });
    return foundNode;
}

/**
 * Manages multiple node selections in the tree.
 *
 * @function
 * @param {any} value - The value of the node to select.
 * @param {boolean} treeInteraction - Whether the selection is due to a tree interaction.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {HTMLCanvasElement} canvas - The canvas element.
 */
export function multiSelectionNodes(value, treeInteraction, ctx, canvas) {
    const target = window.tree.findNode(parseInt(value,10));
    const index = selection.indexOf(target);
    if (index === -1) {
        selection.push(target);
        target.selected = true;
        if(treeInteraction) multipleSelectionChanged(target.value);
    }
    else if (index == 0) alert("Cannot unselected main merge node!");
    else {
        selection.splice(index, 1);
        target.selected = false;
        if(treeInteraction) multipleSelectionChanged(target.value);
    }
    drawTree(ctx, canvas);
}

/**
 * Handles the 'down' event on the canvas.
 *
 * @function
 * @param {Event} e - The event object.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
  * @param {HTMLCanvasElement} canvas - The canvas element.
 */
export function down(e, ctx, canvas) {
    const rect = canvas.getBoundingClientRect();
    const offsetX = canvas.offsetLeft;
    const offsetY = canvas.offsetTop;
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top;
    let target = within(x, y);
    if (target) {
        if(e.ctrlKey) 
        {
            multiSelectionNodes(target.value, true, ctx, canvas);         
        }
        else
        {
            window.selectNode(target.value);
            selectedNodeChanged(target.value);
            drawTree(ctx, canvas);
        }
    }
}
