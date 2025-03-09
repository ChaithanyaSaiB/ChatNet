/**
 * @file Defines the Tree class and its core functionalities.
 */

import TreeNode from './TreeNode.js';
import { adjustCanvasSize } from '../dom/dom_manipulation.js';
import { drawTree } from '../drawing/draw.js';

/**
 * Represents a tree data structure for visualizing conversation threads.
 *
 * @class
 */
class Tree {
    constructor() {
        this.root = null;
        this.nodes = [];
    }

    /**
     * Inserts a new node into the tree as a child of the specified parent node.
     *
     * @param {any} parentValue - The value of the parent node.
     * @param {any} newValue - The value of the new node.
     * @param {boolean} merged_status - The merged status of the new node.
     * @param {string} queryText - The query text associated with the new node.
     * @param {string} aiResponse - The AI response associated with the new node.
     * @returns {boolean} True if the node was successfully inserted, false otherwise.
     */
    insert(parentValue, newValue, merged_status, queryText, aiResponse, ctx, canvas) {
        const newNode = new TreeNode(newValue, 0, 0, merged_status, queryText, aiResponse);

        if (parentValue === null) {
            if (!this.root) {
                this.root = newNode;
                this.nodes.push(newNode);
                console.log(`Root node ${newValue} added.`);
                return true;
            } else {
                console.warn("Root node already exists!");
                return false;
            }
        }

        const parent = this.findNode(parentValue);
        if (!parent) {
            console.error(`Parent node ${parentValue} not found.`);
            return false;
        }

        newNode.parent = parent;
        parent.children.push(newNode);
        this.nodes.push(newNode);
        console.log(`Node ${newValue} added as child of ${parentValue}`);

        adjustCanvasSize(ctx, canvas);
        drawTree(ctx, canvas);
        return true;
    }

    /**
     * Finds a node in the tree by its value.
     *
     * @param {any} value - The value to search for.
     * @returns {TreeNode|undefined} The found node, or undefined if not found.
     */
    findNode(value) {
        return this.nodes.find(node => node.value === value);
    }

    /**
     * Gets the width of the tree, calculated as the distance between the leftmost and rightmost nodes.
     *
     * @returns {number} The width of the tree.
     */
    getWidth() {
        let minX = Infinity, maxX = -Infinity;
        this.nodes.forEach(node => {
            if (node.x < minX) minX = node.x;
            if (node.x > maxX) maxX = node.x;
        });
        return (maxX - minX) + 100;
    }

    /**
     * Gets the height of the tree, calculated as the distance from the top to the bottom node.
     *
     * @returns {number} The height of the tree.
     */
    getHeight() {
        let maxY = -Infinity;
        this.nodes.forEach(node => {
            if (node.y > maxY) maxY = node.y;
        });
        return maxY + 100;
    }

    /**
     * Detects collisions between nodes in the tree.
     *
     * @returns {Array<Object>} An array of collision objects, each containing two nodes that collide.
     */
    detectCollisions() {
        const collisions = [];
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const a = this.nodes[i];
                const b = this.nodes[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
    
                const collisionBuffer = 25;
                if (Math.abs(dx) < (a.width/2 + b.width/2 + collisionBuffer) && 
                    Math.abs(dy) < (a.height/2 + b.height/2 + collisionBuffer)) {
                    collisions.push({ node1: a, node2: b });
                }
            }
        }
        return collisions;
    }

    /**
     * Resolves collisions between nodes by adjusting their positions.
     *
     * @param {Array<Object>} collisions - An array of collision objects.
     */
    resolveCollisions(collisions) {
        collisions.forEach(collision => {
            const node1 = collision.node1;
            const node2 = collision.node2;
            const shift = node1.radius * 2;

            let dx = node2.x - node1.x;
            let dy = node2.y - node1.y;

            const distance = Math.sqrt(dx * dx + dy * dy);
            dx /= distance;
            dy /= distance;

            node2.x += dx * shift;
            node2.y += dy * shift;
            node1.x -= dx * shift;
            node1.y -= dx * shift;

            this.repositionParent(node1, dx * -shift * 0.2);
            this.repositionParent(node2, dx * shift * 0.2);
        });
    }

    /**
     * Recursively repositions the parent node to resolve collisions.
     *
     * @param {TreeNode} node - The node whose parent needs repositioning.
     * @param {number} shiftX - The amount to shift the parent node horizontally.
     */
    repositionParent(node, shiftX) {
        if (!node.parent) return;

        node.parent.x += shiftX;

        this.repositionParent(node.parent, shiftX * 0.1);
    }

    /**
     * Adjusts positions of all nodes in the tree to avoid collisions.
     */
    adjustPositions() {
        if (this.root) {
            let collisions = this.detectCollisions();
            this.resolveCollisions(collisions);
        }
    }
}

export default Tree;
