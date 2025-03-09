/**
 * @file Defines the TreeNode class for the tree structure.
 */

/**
 * Represents a node in the tree.
 *
 * @class
 * @param {any} value - The data value of the node.
 * @param {number} x - The x-coordinate of the node on the canvas.
 * @param {number} y - The y-coordinate of the node on the canvas.
 * @param {boolean} merged_status - The merged status of the node.
 * @param {string} [queryText=""] - The query text associated with the node.
 * @param {string} [aiResponse=""] - The AI response associated with the node.
 */
class TreeNode {
    constructor(value, x, y, merged_status, queryText = "", aiResponse = "") {
        this.value = value;
        this.children = [];
        this.x = x;
        this.y = y;
        this.queryText = queryText;
        this.aiResponse = aiResponse;
        this.width = 100;
        this.height = 40;
        this.radius = this.height / 2;
        this.selected = false;
        this.parent = null;
        this.merged = merged_status;
    }
}

export default TreeNode;
