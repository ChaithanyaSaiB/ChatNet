/**
 * @file Defines functions for drawing the tree and its nodes on the canvas.
 */

import { wrapText } from '../utils/helpers.js';
import { selection } from '../main.js'; // Added import

/**
 * Calculates the position of each node level by level.
 *
 * @function
 * @param {TreeNode} root - The root node of the tree.
 * @param {number} levelHeight - The height between each level.
 * @param {number} nodeSpacing - The horizontal spacing between nodes.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {HTMLCanvasElement} canvas - The canvas element.
 */
export function calculateLevelPositions(root, levelHeight, nodeSpacing, ctx, canvas) {
    const levels = {};

    function traverse(node, level) {
        if (!node) return;

        if (!levels[level]) {
            levels[level] = [];
        }
        levels[level].push(node);

        node.children.forEach(child => traverse(child, level + 1));
    }

    traverse(root, 0);

    for (const level in levels) {
        const nodes = levels[level];
        const totalWidth = (nodes.length - 1) * nodeSpacing;
        let startX = canvas.width / 2 - totalWidth / 2;

        nodes.forEach((node, index) => {
            node.x = startX + index * nodeSpacing;
            node.y = parseInt(level) * levelHeight + 50;
            adjustPositionForCollisions(node);
        });
    }
}

/**
 * Adjusts the position of a node to avoid collisions with other nodes.
 *
 * @function
 * @param {TreeNode} node - The node to adjust.
 */
export function adjustPositionForCollisions(node) {
    for (let i = 0; i < window.tree.nodes.length; i++) {
        const otherNode = window.tree.nodes[i];
        if (node !== otherNode) {
            const dx = node.x - otherNode.x;
            const dy = node.y - otherNode.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < (node.radius + otherNode.radius) * 1.3) {
                node.x += (node.x > otherNode.x) ? 20 : -20;
            }
        }
    }
}

/**
 * Draws the tree on the canvas, including connection lines and nodes.
 *
 * @function
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {HTMLCanvasElement} canvas - The canvas element.
 */
export function drawTree(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const levelHeight = 100;
    const nodeSpacing = 120;

    calculateLevelPositions(window.tree.root, levelHeight, nodeSpacing, ctx, canvas);

    drawNode(window.tree.root, levelHeight, nodeSpacing, ctx, canvas);
}

/**
 * Draws a node on the canvas, including connection lines and text.
 *
 * @function
 * @param {TreeNode} node - The node to draw.
 * @param {number} levelHeight - The height between each level.
 * @param {number} nodeSpacing - The horizontal spacing between nodes.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {HTMLCanvasElement} canvas - The canvas element.
 */
export function drawNode(node, levelHeight, nodeSpacing, ctx, canvas) {
    if (!node) return;

    node.children.forEach(child => {
        ctx.beginPath();
        ctx.moveTo(node.x, node.y + node.radius);

        if (child.merged) {
            ctx.setLineDash([5, 5]);
        } else {
            ctx.setLineDash([]);
        }

        ctx.lineTo(child.x, child.y - child.radius);
        ctx.stroke();
    });

    ctx.beginPath();
    ctx.roundRect(node.x - node.width / 2, node.y - node.height / 2, node.width, node.height, node.width / 8);
    ctx.setLineDash([]);
    ctx.fillStyle = node.selected ? (selection.indexOf(node) === 0 ? '#6495ed' : '#9bb7e8') : '#d6dde3';
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const maxWidth = node.width - 5;
    const lineHeight = 20;
    const x = node.x - node.width / 2 + 5;
    let y = node.y - node.height / 2 + 5;

    const lines = wrapText(ctx, node.queryText, maxWidth - 4);

    for (let i = 0; i < lines.length; i++) {
        if (y + lineHeight > node.y + node.height / 2) {
            if (i < lines.length - 1 || ctx.measureText(lines[i]).width > maxWidth) {
                let truncatedLine = lines[i];
                while (ctx.measureText(truncatedLine + '...').width > maxWidth && truncatedLine.length > 0) {
                    truncatedLine = truncatedLine.slice(0, -1);
                }
                ctx.fillText(truncatedLine + '...', x, y);
            } else {
                ctx.fillText(lines[i], x, y);
            }
            break;
        }
        ctx.fillText(lines[i], x, y);
        y += lineHeight;
    }

    node.children.forEach(child => drawNode(child, levelHeight, nodeSpacing, ctx, canvas));
}
