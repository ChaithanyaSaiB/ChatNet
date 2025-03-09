/**
 * @file Entry point of the application. Initializes the tree, sets up event listeners,
 * and manages the overall application flow.
 */

import Tree from './core/Tree.js';
import { drawTree, adjustPositionForCollisions, calculateLevelPositions, drawNode } from './drawing/draw.js';
import { within, multiSelectionNodes, down as interactionDown } from './interactions/selection.js';
import { truncateString, wrapText } from './utils/helpers.js';
import { adjustCanvasSize } from './dom/dom_manipulation.js';
import { constructTree } from './drawing/construct_tree.js';

// Global Variables (Ensure these are accessible throughout your application)
const canvas = document.getElementById('treeCanvas');
const ctx = canvas.getContext('2d');
window.tree = new Tree(); // Initialize the tree
export let selection = []; // Initialize the selection

//Add Node test global - for testing purposes
window.addNode = function(parentValue, newValue, merged_status, textLine1, textLine2) {
    if (!newValue) {
        alert("Please enter a valid node value.");
        return;
    }
    const parentNum = (parentValue && parentValue !== "None") ? parseInt(parentValue) : null;
    const newNum = parseInt(newValue);

    if (window.tree.insert(parentNum, newNum, merged_status, textLine1, textLine2, ctx, canvas)) {
        adjustCanvasSize(ctx, canvas);
        window.selectNode(newNum);
        drawTree(ctx, canvas);
    }
}

window.selectNode = function(value) {
    const foundNode = window.tree.findNode(parseInt(value,10));
    selection.forEach(node => {
        node.selected = false;
    });
    selection = [foundNode];
    foundNode.selected = true;
}

window.buildTreeAndSelectNode = function(conversation, queryId) {
    if (conversation.length !== 0) {
        conversation.forEach(conversation_unit => {
            const queryText = conversation_unit.query_text || "";
            const aiResponse = conversation_unit.ai_response || "";
            if (conversation_unit.parent_query_ids.length == 1) {
                window.addNode(conversation_unit.parent_query_ids[0], conversation_unit.child_query_id, false, queryText, aiResponse);
            } else {
                window.addNode(conversation_unit.parent_query_ids[0], conversation_unit.child_query_id, true, queryText, aiResponse);
            }
        });
        if (queryId.length === 1) {
            window.selectNode(queryId[0]);
        } else if (queryId.length > 1) {
            window.selectNode(queryId[0]);
            
            const restOfIds = queryId.slice(1);
            restOfIds.forEach(id => {
                multiSelectionNodes(id, false, ctx, canvas);
            });
        } else console.log("No query ID provided.");
        
        // Pass ctx and canvas
        window.tree.adjustPositions();
        setTimeout(drawTree(ctx, canvas), 100);
    }
};

//Set Event Listeners
canvas.addEventListener('mousedown', (e) => interactionDown(e, ctx, canvas));
window.addEventListener('resize', () => adjustCanvasSize(ctx, canvas));

/**
 * Initializes the application by setting up event listeners and drawing the initial tree.
 *
 * @function
 */
document.addEventListener('DOMContentLoaded', function() {
    adjustCanvasSize(ctx, canvas);
    constructTree();
});
