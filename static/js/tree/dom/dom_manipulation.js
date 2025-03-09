/**
 * @file Handles DOM manipulation and canvas setup.
 */
import { drawTree } from '../drawing/draw.js';

/**
  * Adjusts the canvas size based on the size of the tree and the container.
  *
  * @function
  * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
  * @param {HTMLCanvasElement} canvas - The canvas element.
  */
 export function adjustCanvasSize(ctx, canvas) {
     const container = document.getElementById('tree-container');
     
     // Set initial size to container's rendered size
     canvas.width = container.clientWidth || window.innerWidth * 0.3;
     canvas.height = container.clientHeight || window.innerHeight * 0.3;
 
     // Now calculate tree dimensions
     const treeWidth = window.tree.getWidth();
     const treeHeight = window.tree.getHeight();
 
     // Expand canvas if needed
     canvas.width = Math.max(treeWidth, canvas.width);
     canvas.height = Math.max(treeHeight, canvas.height);

     drawTree(ctx, canvas);
 }
